import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import mammoth from 'mammoth';

export const runtime = 'nodejs';

/** 最大 10MB */
const MAX_SIZE = 10 * 1024 * 1024;

/** 允许的 MIME 类型 */
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXT = '.docx';

/** 从 HTML 字符串中 strip 所有标签，返回纯文本 */
function stripTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** 从 HTML 中提取第一个 H1 文本作为标题，没有则从 fallbackText 取前 50 字 */
function extractTitle(html: string, fallbackText: string): string {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const t = stripTags(h1Match[1]).trim();
    if (t) return t;
  }
  return fallbackText.slice(0, 50);
}

/** 从 HTML 中提取第一段非空文本前 N 字作为摘要 */
function extractExcerpt(html: string, maxLen = 160): string {
  const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const m of pMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 10) {
      return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '');
    }
  }
  // fallback: 取整个 HTML 的纯文本前 N 字
  const raw = stripTags(html);
  if (raw) return raw.slice(0, maxLen) + (raw.length > maxLen ? '…' : '');
  return '';
}

/** 从 HTML 中提取第一张图片的 src 作为封面图 */
function extractCover(html: string): string {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : '';
}

export async function POST(request: NextRequest) {
  // 1. Referer 鉴权（与 /api/upload 保持一致）
  const referer = request.headers.get('referer') || '';
  if (!referer.includes('/admin/')) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED', message: '请通过 admin 后台上传' },
      { status: 401 }
    );
  }

  // 2. 解析 FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'INVALID_FORM_DATA', message: '请用 multipart/form-data 上传' },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json(
      { ok: false, error: 'NO_FILE', message: '未找到文件字段 "file"' },
      { status: 400 }
    );
  }

  // 3. 类型校验
  const ext = file.name.toLowerCase().endsWith(ALLOWED_EXT) ? ALLOWED_EXT : '';
  if (!ALLOWED_TYPES.includes(file.type) && ext !== ALLOWED_EXT) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_FILE_TYPE', message: `仅支持 .docx 文件，当前: ${file.type || '未知'}` },
      { status: 400 }
    );
  }

  // 4. 大小校验
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: 'FILE_TOO_LARGE', message: `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB，最大 ${MAX_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // 5. mammoth 解析
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 图片处理：双模式降级（使用 mammoth.images.imgElement 工厂，符合 ImageConverter branded type）
    const imageConverter = mammoth.images.imgElement(async (image) => {
      const base64Data = await image.read('base64');
      const mimeType = image.contentType;
      const base64DataUrl = `data:${mimeType};base64,${base64Data}`;

      // 尝试上传 Vercel Blob（token 已配则替换为 Blob URL）
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const ext = mimeType.split('/')[1]?.split('+')[0] || 'png';
          const blob = await put(
            `articles/imported/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
            Buffer.from(base64Data, 'base64'),
            {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN,
              contentType: mimeType,
            }
          );
          return { src: blob.url };
        } catch (e) {
          console.error('[import/word] Blob 上传失败，降级用 base64', e);
        }
      }
      // 降级：保持 base64 内嵌
      return { src: base64DataUrl };
    });

    const result = await mammoth.convertToHtml(
      { buffer: fileBuffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "h1 => h1:fresh",
          "h2 => h2:fresh",
          "h3 => h3:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='List Paragraph'] => li:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
        ],
        convertImage: imageConverter,
      }
    );

    const html = result.value;
    const warnings = result.messages.map((m) => m.message);

    // 6. 字段抽取
    const fallbackText = stripTags(html);
    const title = extractTitle(html, fallbackText);
    const excerpt = extractExcerpt(html, 160);
    const cover = extractCover(html);

    // autoSlug（复用 lib，与 ArticleFormClient 逻辑一致）
    const { autoSlug } = await import('@/lib/article-utils');
    const slug = autoSlug(title);

    // 判断图片模式（决定封面图是否需要曹总重新上传）
    const imageMode: 'blob' | 'base64' = process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'base64';

    return NextResponse.json({
      ok: true,
      title,
      slug,
      excerpt,
      content: html,
      cover,
      warnings: warnings.length > 0 ? warnings : undefined,
      imageMode,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[import/word] 解析失败:', detail);
    return NextResponse.json(
      { ok: false, error: 'PARSE_FAILED', message: `Word 文档解析失败: ${detail}` },
      { status: 422 }
    );
  }
}
