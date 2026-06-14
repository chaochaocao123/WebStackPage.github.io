import Link from 'next/link';
import { Zap, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { UrlImportForm } from './_components/UrlImportForm';

// nodejs runtime：actions.ts 调 prisma 需要
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function ImportUrlPage() {
  // 读取 fetcher 配置状态（前端看不到，但 page 渲染时能读到环境变量）
  // 注：NEXT_PUBLIC_ 前缀的变量会暴露给客户端，普通 env 变量只在服务端
  const hasNewrankKey = !!process.env.NEWRANK_API_KEY;
  const hasLocalProxy = !!process.env.LOCAL_PROXY_URL;
  const explicit = process.env.WECHAT_FETCHER || '';
  const activeFetcher: 'newrank' | 'local' | 'gsone' | null = explicit
    ? (explicit as 'newrank' | 'local' | 'gsone')
    : hasNewrankKey
    ? 'newrank'
    : hasLocalProxy
    ? 'local'
    : null;

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

      {/* v11.20 新增：当前 fetcher 状态 + 配置引导 */}
      <div className="mb-6">
        {activeFetcher === 'newrank' && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm text-green-900">
              <strong>当前抓取通道：新榜 API</strong>（已配置 NEWRANK_API_KEY，6u/次，约 0.01 元/次）
            </div>
          </div>
        )}
        {activeFetcher === 'local' && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <strong>当前抓取通道：本地代理</strong>（已配置 LOCAL_PROXY_URL，需曹总电脑跑 proxy.js）
            </div>
          </div>
        )}
        {activeFetcher === 'gsone' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <strong>当前抓取通道：gs-one 公开 API</strong>（0 元兜底，Vercel 出口常调不通，可能失败）
            </div>
          </div>
        )}
        {activeFetcher === null && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm text-red-900">
              <strong>当前未配置任何抓取通道</strong>，粘链接后会报错。
              请在 <code className="bg-red-100 px-1 rounded">Vercel → Settings → Environment Variables</code> 添加
              <code className="bg-red-100 px-1 rounded ml-1">NEWRANK_API_KEY</code>
              （推荐）或
              <code className="bg-red-100 px-1 rounded ml-1">LOCAL_PROXY_URL</code>。
            </div>
          </div>
        )}
      </div>

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
          <li>等待 3-10 秒，会显示抓取结果预览</li>
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
          💡 <strong>抓取原理</strong>：服务端调新榜 /sync/weixin/data/sourceurl_content 接口（按 URL 实时抓全文），规范化 + 图片走代理。
        </p>
        <p>
          🔒 <strong>数据安全</strong>：链接只用来一次性调新榜 API，不存储到日志；API Key 只在 Vercel
          Environment Variables 配置，不暴露给客户端。
        </p>
        <p className="text-slate-400">
          📖 <strong>获取新榜 API Key</strong>：去{' '}
          <a
            href="https://newrank.cn/user/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline"
          >
            newrank.cn
          </a>{' '}
          微信扫码注册 → 数据服务 → 数据API → 申请开通 → 复制 Key → 充少量费用（试用送 2000u 约 333 次）。
        </p>
      </div>
    </div>
  );
}
