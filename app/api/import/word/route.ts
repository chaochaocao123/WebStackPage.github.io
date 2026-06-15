import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import mammoth from 'mammoth';

export const runtime = 'nodejs';

/** 最大 50MB（与上传端 maximumSizeInBytes 一致） */
const MAX_SIZE = 50 * 1024 * 1024;

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

  // 2. v11.33.2 解析请求体：支持两种模式
  //   模式 A：JSON { blobUrl, filename }（v11.33.2+，客户端直传 Blob）
  //   模式 B：multipart/form-data file（v11.33 旧版，小文件仍可用）
  let blobUrl: string | null = null;
  let filename = 'document.docx';
  let fileSize = 0;
  let fileBuffer: Buffer | null = null;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    // 模式 A：从 Blob URL 拉取 docx
    try {
      const body = (await request.json()) as { blobUrl?: string; filename?: string };
      blobUrl = body.blobUrl || null;
      filename = body.filename || filename;
    } catch {
      return NextResponse.json(
        { ok: false, error: 'INVALID_JSON', message: 'JSON body 解析失败' },
        { status: 400 }
      );
    }
    if (!blobUrl) {
      return NextResponse.json(
        { ok: false, error: 'NO_BLOB_URL', message: 'JSON 必须包含 blobUrl 字段' },
        { status: 400 }
      );
    }
    // 必须来自 kjgjs-blob store（防 SSRF）
    if (!blobUrl.includes('public.blob.vercel-storage.com')) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_BLOB_URL', message: 'blobUrl 必须来自 Vercel Blob' },
        { status: 400 }
      );
    }
    // 下载 docx
    try {
      const dlRes = await fetch(blobUrl);
      if (!dlRes.ok) {
        return NextResponse.json(
          { ok: false, error: 'BLOB_FETCH_FAILED', message: `下载 Blob 失败: ${dlRes.status}` },
          { status: 502 }
        );
      }
      const arrBuf = await dlRes.arrayBuffer();
      fileBuffer = Buffer.from(arrBuf);
      fileSize = fileBuffer.length;
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: 'BLOB_FETCH_ERROR', message: `下载 Blob 出错: ${(e as Error).message}` },
        { status: 502 }
      );
    }
  } else {
    // 模式 B：multipart/form-data（兼容 v11.33 旧调用，仅支持 ≤4MB 文件）
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'INVALID_FORM_DATA', message: '请用 multipart/form-data 上传或 JSON { blobUrl }' },
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
    filename = file.name;
    fileBuffer = Buffer.from(await file.arrayBuffer());
    fileSize = fileBuffer.length;
  }

  // 3. 类型校验
  const ext = filename.toLowerCase().endsWith(ALLOWED_EXT) ? ALLOWED_EXT : '';
  if (ext !== ALLOWED_EXT) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_FILE_TYPE', message: `仅支持 .docx 文件，当前: ${filename || '未知'}` },
      { status: 400 }
    );
  }

  // 4. 大小校验
  if (fileSize > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: 'FILE_TOO_LARGE', message: `文件过大: ${(fileSize / 1024 / 1024).toFixed(2)}MB，最大 ${MAX_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // 5. mammoth 解析
  try {
    // fileBuffer 已在前面模式 A/B 拿到，直接用
    const buffer = fileBuffer!;

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
      { buffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1",
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2",
          "p[style-name='Heading 3'] => h3",
          "p[style-name='List Paragraph'] => li",
          "p[style-name='Quote'] => blockquote",
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

    // v11.33.2 清理：临时 docx blob 解析完就删，避免占用 Vercel Blob 存储
    if (blobUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
      } catch (e) {
        console.warn('[import/word] 临时 docx blob 清理失败（不影响主流程）', e);
      }
    }

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
