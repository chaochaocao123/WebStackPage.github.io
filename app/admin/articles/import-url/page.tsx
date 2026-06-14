import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';
import { UrlImportForm } from './_components/UrlImportForm';

// nodejs runtime：暂不需要 fs，保留显式声明以防后续扩展
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function ImportUrlPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文章列表
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
        <Zap className="w-6 h-6 text-green-600" />
        粘链接导入公众号文章
      </h1>
      <p className="text-slate-600 mb-6">
        把公众号文章链接丢进来，自动抓取并入库。最简操作：粘链接 → 点按钮 → 跳编辑页人工审核。
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-amber-900 mb-2">📌 使用流程</h2>
        <ol className="text-sm text-amber-800 space-y-1 list-decimal pl-5">
          <li>
            复制公众号文章链接（形如{' '}
            <code className="bg-amber-100 px-1 rounded text-xs">
              https://mp.weixin.qq.com/s/...
            </code>
            ）
          </li>
          <li>粘到下面输入框，点"开始抓取"</li>
          <li>等待 5-30 秒，会显示抓取结果预览</li>
          <li>确认内容 OK，点"保存到草稿"入库</li>
          <li>跳到编辑页调整标题/标签/分类后发布</li>
        </ol>
        <div className="mt-3 text-xs text-amber-700">
          ⚖️ <strong>合规提醒</strong>：仅支持导入你自己有版权的公众号文章，不要抓取他人原创内容。
        </div>
      </div>

      <UrlImportForm />

      <div className="mt-8 text-xs text-slate-500 space-y-2">
        <p>
          💡 <strong>抓取原理</strong>：通过 gs-one.cn 公开 API（无需注册）抓取后服务端规范化 + 图片走代理。
        </p>
        <p>
          ⚠️ <strong>稳定性</strong>：gs-one 是志愿者维护的公共服务，可能偶尔抽风。
          如果失败可多试几次，或改用{' '}
          <Link
            href="/admin/articles/import-json"
            className="text-brand-600 underline"
          >
            油猴脚本 JSON 导入
          </Link>{' '}
          备胎路线。
        </p>
        <p>
          🔒 <strong>数据安全</strong>：链接只用来调用 gs-one 一次性抓取，不存储到日志。
        </p>
      </div>
    </div>
  );
}
