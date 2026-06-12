import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, ExternalLink } from 'lucide-react';
import { deleteArticle } from '../actions';
import { DeleteRowButton } from '../_components/DeleteWithConfirm';
import { Pagination } from '../_components/Pagination';

const PAGE_SIZE = 20;

// 强制动态渲染，避免 Router Cache 导致翻页时统计过时
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [total, articles] = await Promise.all([
    prisma.article.count(),
    prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, total);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">文章管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {total} 条 · 本页 {startIdx}-{endIdx}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" />
          写文章
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">标题</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">分类</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">浏览</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">发布时间</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无文章，<Link href="/admin/articles/new" className="text-brand-600 hover:underline">去写一篇</Link>
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{article.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-md">{article.excerpt}</div>
                  </td>
                  <td className="px-4 py-3">
                    {article.category ? (
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                        {article.category}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">无</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{article.viewCount}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="p-1.5 text-slate-400 hover:text-brand-600"
                        title="查看"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        编辑
                      </Link>
                      <DeleteRowButton
                        formAction={deleteArticle.bind(null, article.id)}
                        message="确定要删除这篇文章吗？"
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
        basePath="/admin/articles"
      />
    </div>
  );
}
