'use client';

import { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ImportWordPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setSelectedFile(f || null);
    setStatus('idle');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    startTransition(async () => {
      setStatus('idle');
      setErrorMsg('');
      setWarnings([]);

      const fd = new FormData();
      fd.append('file', selectedFile);

      try {
        const res = await fetch('/api/import/word', {
          method: 'POST',
          body: fd,
          // 带 Referer 满足 admin 鉴权
          headers: {
            'Referer': window.location.origin + '/admin/',
          },
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          setStatus('error');
          setErrorMsg(data.message || `服务器错误 (${res.status})`);
          return;
        }

        setWarnings(data.warnings || []);
        setStatus('success');

        // 预填 query string 跳转到新建页
        const params = new URLSearchParams();
        params.set('title', data.title || '');
        params.set('slug', data.slug || '');
        params.set('excerpt', data.excerpt || '');
        params.set('cover', data.cover || '');
        // content 很长，用 encodeURIComponent
        if (data.content) {
          params.set('content', encodeURIComponent(data.content));
        }

        // 提示曹总图片模式
        if (data.imageMode === 'base64') {
          setTimeout(() => {
            alert('ℹ️ 提示：Vercel Blob 未配置，文档中的图片目前以内嵌 base64 存储。\n配好 BLOB_READ_WRITE_TOKEN 后可重新导入或手动上传封面图。');
          }, 300);
        }

        // 短暂展示成功状态，然后跳转
        setTimeout(() => {
          router.push(`/admin/articles/new?${params.toString()}`);
        }, 1200);

      } catch (err) {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : '网络错误，请重试');
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* 顶栏 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/articles" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">导入 Word 文档</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* 说明 */}
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
            <FileText className="w-4 h-4" />
            支持的文档格式
          </div>
          <ul className="text-xs text-slate-700 space-y-1">
            <li>✓ <strong>.docx</strong> 文件（Microsoft Word 2007+）</li>
            <li>✓ 自动识别标题（H1/H2/H3）</li>
            <li>✓ 自动提取第一张图片作为封面图</li>
            <li>✓ 自动生成 slug 和摘要</li>
            <li>✓ 保留正文格式和内嵌图片</li>
            <li>⚠️ 分类、标签、转载属性需手动填写</li>
          </ul>
          <p className="text-xs text-slate-500 pt-2 border-t border-brand-100">
            💡 如果 Vercel Blob 未配置，图片将以内嵌 base64 存储（曹总明早配好 token 后可重新导入）
          </p>
        </div>

        {/* 上传表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择 .docx 文件 <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:transition file:cursor-pointer file:border file:border-brand-200"
            />
            {selectedFile && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                已选择：{selectedFile.name}（{(selectedFile.size / 1024).toFixed(1)} KB）
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!selectedFile || isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在解析文档…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  解析并导入
                </>
              )}
            </button>

            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-slate-600 hover:text-slate-800 transition text-sm"
            >
              取消
            </Link>
          </div>
        </form>

        {/* 成功状态 */}
        {status === 'success' && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <div className="font-semibold">解析成功！正在跳转到编辑页…</div>
              <div className="text-xs text-green-700 mt-1">
                标题 / slug / 摘要 / 正文 / 封面图已自动填充，请在表单中检查并完善分类和标签。
              </div>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {status === 'error' && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <div className="font-semibold">解析失败</div>
              <div className="text-xs text-red-700 mt-1">{errorMsg}</div>
            </div>
          </div>
        )}

        {/* mammoth 警告 */}
        {warnings.length > 0 && status === 'success' && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 space-y-1">
            <div className="font-medium">解析提示：</div>
            {warnings.map((w, i) => (
              <div key={i}>• {w}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
