import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, ExternalLink, Pin, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteNews, togglePinNews } from '../actions';
import { DeleteRowButton } from '../_components/DeleteWithConfirm';

const SOURCE_LABEL: Record<string, string> = {
  manual: '跨境工具说',
  amz123: 'AMZ123',
  mjzj: '卖家之家',
  wearesellers: 'WeAreSellers',
  cifnews: '雨果网',
};

const PAGE_SIZE = 20;

// 强制动态渲染，避免 Router Cache 导致翻页时统计过时
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [total, news] = await Promise.all([
    prisma.news.count(),
    prisma.news.findMany({
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, total);

  const crawlCount = news.filter((n) => n.sourceType === 'crawl').length;
  const manualCount = news.filter((n) => n.sourceType === 'manual').length;

  // 当前页前后 2 范围的页码列表
  const pageNumbers: number[] = [];
  for (let i = Math.max(1, safePage - 2); i <= Math.min(totalPages, safePage + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">资讯管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {total} 条 · 本页 {startIdx}-{endIdx} · 手动 {manualCount} · 抓取 {crawlCount}
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" />
          发布资讯
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 w-10"></th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">标题</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">来源</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">分类</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">发布时间</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {news.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  暂无资讯，<Link href="/admin/news/new" className="text-brand-600 hover:underline">去发布一条</Link>
                </td>
              </tr>
            ) : (
              news.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <form action={togglePinNews.bind(null, item.id)}>
                      <button
                        type="submit"
                        className={`p-1 rounded hover:bg-slate-200 ${item.pinned ? 'text-amber-500' : 'text-slate-300'}`}
                        title={item.pinned ? '取消置顶' : '置顶'}
                      >
                        <Pin className="w-4 h-4" fill={item.pinned ? 'currentColor' : 'none'} />
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-medium text-slate-900 ${item.pinned ? 'text-amber-700' : ''}`}>
                      {item.pinned && <span className="text-amber-500 mr-1">📌</span>}
                      {item.title}
                    </div>
                    {item.summary && (
                      <div className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                        {item.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        item.sourceType === 'manual'
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {SOURCE_LABEL[item.source] || item.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {item.category || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {new Date(item.publishedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-brand-600"
                        title="查看原文"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/admin/news/${item.id}`}
                        className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        编辑
                      </Link>
                      <DeleteRowButton
                        formAction={deleteNews.bind(null, item.id)}
                        message={`确定要删除「${item.title}」吗？`}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-slate-500">
            第 {startIdx}-{endIdx} 条 / 共 {total} 条 · 第 {safePage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            {/* 上一页 */}
            {safePage > 1 ? (
              <Link
                href={`/admin/news?page=${safePage - 1}`}
                className="px-2.5 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一页</span>
              </Link>
            ) : (
              <span className="px-2.5 py-1.5 border border-slate-200 rounded text-sm text-slate-300 flex items-center gap-1 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                <span>上一页</span>
              </span>
            )}

            {/* 首页 + 省略号 */}
            {safePage > 3 && (
              <>
                <Link
                  href="/admin/news?page=1"
                  className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100"
                >
                  1
                </Link>
                {safePage > 4 && <span className="px-1 text-slate-400">…</span>}
              </>
            )}

            {/* 当前页前后 2 页 */}
            {pageNumbers.map((p) => (
              <Link
                key={p}
                href={`/admin/news?page=${p}`}
                className={`px-3 py-1.5 rounded text-sm ${
                  p === safePage
                    ? 'bg-brand-600 text-white border border-brand-600'
                    : 'border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p}
              </Link>
            ))}

            {/* 末页 + 省略号 */}
            {safePage < totalPages - 2 && (
              <>
                {safePage < totalPages - 3 && <span className="px-1 text-slate-400">…</span>}
                <Link
                  href={`/admin/news?page=${totalPages}`}
                  className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100"
                >
                  {totalPages}
                </Link>
              </>
            )}

            {/* 下一页 */}
            {safePage < totalPages ? (
              <Link
                href={`/admin/news?page=${safePage + 1}`}
                className="px-2.5 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100 flex items-center gap-1"
              >
                <span>下一页</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="px-2.5 py-1.5 border border-slate-200 rounded text-sm text-slate-300 flex items-center gap-1 cursor-not-allowed">
                <span>下一页</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
