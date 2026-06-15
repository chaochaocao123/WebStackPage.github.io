import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

/**
 * v11.33.2 Word 导入客户端直传 endpoint
 *
 * 背景：Vercel Serverless Function body 4.5MB 硬限制（不可配置）
 * 4.4MB docx + multipart 边界就超过 → 413 FUNCTION_PAYLOAD_TOO_LARGE
 * 解决：客户端先 upload docx 到 Vercel Blob，再把 Blob URL 传给 /api/import/word
 * 这里用 handleUpload() 给客户端发短期 token
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          // 只允许 .docx
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          // 50MB 上限（Vercel Blob 实际单文件 5MB Hobby / 500MB Pro，docx 通常 < 20MB）
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
          // 回调时拿到 clientPayload 识别是哪个上传
          tokenPayload: JSON.stringify({
            kind: 'word-import',
            uploadedAt: Date.now(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // docx 解析后由 /api/import/word 拉 Blob URL 处理
        // 不在这里解析（避免 Vercel Blob callback 限制）
        try {
          const payload = tokenPayload ? JSON.parse(tokenPayload) : {};
          console.log('[word-import/upload] docx 上传完成', {
            url: blob.url,
            pathname: blob.pathname,
            kind: payload.kind,
          });
        } catch (e) {
          console.warn('[word-import/upload] tokenPayload 解析失败', e);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
