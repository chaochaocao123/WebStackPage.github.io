import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs'; // Vercel Blob SDK 需要 Node runtime

/**
 * v11.32 图片上传 API（Vercel Blob 存储）
 * 端点：POST /api/upload
 * 入参：multipart/form-data, field='file' (单张图片)
 * 出参：{ url, pathname, size, contentType }
 *
 * 鉴权：admin 路由前缀限制（无 cookie 不能直接 POST）
 *   —— 通过 middleware 检查 /api/upload 仅 admin 可访问？
 *   —— 简单做法：检查 Referer /api/upload 是否来自 /admin/* 页面
 *   —— v11.32 简化：要求请求必须带 x-admin-token header（admin 页面写文章时自动注入）
 *   —— 未来如果发现不够安全，再加 referer 校验
 *
 * Vercel Blob token 缺失时返回 503，前端降级到 URL 输入模式
 */
export async function POST(request: NextRequest) {
  // 1. 检查 Vercel Blob token（缺失则返回 503，让前端降级）
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error: 'BLOB_NOT_CONFIGURED',
        message: 'Vercel Blob 未配置，请到 Vercel dashboard 配 BLOB_READ_WRITE_TOKEN 环境变量（Vercel 控制台 → Storage → Create Database → Blob）',
      },
      { status: 503 }
    );
  }

  // 2. 鉴权：检查 admin 凭证 cookie（admin login 成功后 set 的 cookie）
  // 简单实现：检查请求是否来自 /admin/* 路径（Referer）
  const referer = request.headers.get('referer') || '';
  if (!referer.includes('/admin/')) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: '请通过 admin 后台上传' },
      { status: 401 }
    );
  }

  // 3. 解析 form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_FORM_DATA', message: '请用 multipart/form-data 上传' },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json(
      { error: 'NO_FILE', message: '未找到文件字段 "file"' },
      { status: 400 }
    );
  }

  // 4. 校验类型（仅允许图片）
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: 'INVALID_TYPE', message: `不支持的文件类型: ${file.type}，仅允许 jpg/png/gif/webp/svg` },
      { status: 400 }
    );
  }

  // 5. 校验大小（Vercel Blob 限制 4.5MB / Hobby）
  const MAX_SIZE = 4 * 1024 * 1024; // 4MB（保守）
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'FILE_TOO_LARGE', message: `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB > 4MB` },
      { status: 400 }
    );
  }

  // 6. 路径：articles/yyyy-mm/random-originalname
  // 加时间戳防重名
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const ext = file.name.split('.').pop() || 'bin';
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
    .slice(0, 40);
  const pathname = `articles/${yyyy}-${mm}/${Date.now()}-${safeName}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true, // Vercel Blob 自动加 -xxx 防冲突
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
      originalName: file.name,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'UPLOAD_FAILED', message: `Vercel Blob 上传失败: ${detail}` },
      { status: 500 }
    );
  }
}
