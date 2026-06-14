import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { ArrowLeft, FileJson, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { importWechatJson, type ImportJsonResult } from './actions';
import { JsonImportForm } from './_components/JsonImportForm';
import { ScriptCopyBlock } from './_components/ScriptCopyBlock';

// 强制 Node.js runtime（必须用 node:fs 读油猴脚本）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 读油猴脚本原文（点复制按钮时用）
const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'wechat-export-tampermonkey.js');
const SCRIPT_CONTENT = (() => {
  try {
    return fs.readFileSync(SCRIPT_PATH, 'utf-8');
  } catch {
    return '// 读取失败，请到 scripts/wechat-export-tampermonkey.js 手动复制';
  }
})();

export default function ImportJsonPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/admin/articles"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回文章列表
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">从公众号导入 JSON</h1>
            <p className="text-sm text-slate-500 mt-1">
              配合油猴脚本，浏览器一键导出文章结构化 JSON，粘到下方直接入库
            </p>
          </div>
        </div>

        {/* 5 步使用指引 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            使用流程（5 步）
          </h2>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">1</span>
              <span>
                浏览器装{' '}
                <a
                  href="https://www.tampermonkey.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline inline-flex items-center gap-1"
                >
                  Tampermonkey 扩展 <ExternalLink className="w-3 h-3" />
                </a>
                （Chrome / Edge / Firefox 都有）
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">2</span>
              <span>复制下方油猴脚本 → Tampermonkey「添加新脚本」粘进去 → Ctrl+S 保存</span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">3</span>
              <span>
                打开任意公众号文章页（
                <code className="px-1 py-0.5 bg-slate-200 rounded text-xs">https://mp.weixin.qq.com/s/xxx</code>
                ），右下角会出现 <strong>📦 导出 JSON</strong> 按钮
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">4</span>
              <span>
                点按钮 → 自动下载{' '}
                <code className="px-1 py-0.5 bg-slate-200 rounded text-xs">xxx.json</code>，用记事本打开复制全部内容
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">5</span>
              <span>把 JSON 粘到下方文本框 → 点「导入」→ 跳到编辑页人工审核发布</span>
            </li>
          </ol>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 油猴脚本复制块 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">📋 油猴脚本（点右上角「复制脚本」）</h3>
          <ScriptCopyBlock scriptContent={SCRIPT_CONTENT} />
        </div>

        <JsonImportForm action={importWechatJson} />

        {/* 数据合规提醒 */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>合规提醒：</strong>本功能仅支持导入<strong>自己公众号</strong>的文章。转载他人公众号需先获得授权 + 在编辑页标注来源。kjgjs.cn 不对侵权内容负责。
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
