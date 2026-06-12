import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, ExternalLink, Pin } from 'lucide-react';
import { deleteNews, togglePinNews } from '../actions';
import { DeleteRowButton } from '../_components/DeleteWithConfirm';
import { Pagination, ADMIN_PAGE_SIZE } from '../_components/Pagination';

const SOURCE_LABEL: Record<string, string> = {
  manual: '跨境工具说',
  amz123: 'AMZ123',
  mjzj: '卖家之家',
  wearesellers: 'WeAreSellers',
  cifnews: '雨果网',
};

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
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * ADMIN_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * ADMIN_PAGE_SIZE, total);

  const crawlCount = news.filter((n) => n.sourceType === 'crawl').length;
  const manualCount = news.filter((n) => n.sourceType === 'manual').length;

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
                      <Link
                        href={`/news/${item.id}`}
                        target="_blank"
                        className="p-1.5 text-slate-400 hover:text-brand-600"
                        title="查看公开详情页"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
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

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        total={total}
        startIdx={startIdx}
        endIdx={endIdx}
        basePath="/admin/news"
      />
    </div>
  );
}
