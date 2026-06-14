import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, ExternalLink, FileCode2, FileJson, Zap, FileEdit, CheckCircle2 } from 'lucide-react';
import { deleteArticle } from '../actions';
import { DeleteRowButton } from '../_components/DeleteWithConfirm';
import { Pagination, ADMIN_PAGE_SIZE } from '../_components/Pagination';

// 强制动态渲染，避免 Router Cache 导致翻页时统计过时
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  // v11.32 草稿 tab 筛选：默认 'all' 显示全部，可选 'draft' / 'published'
  const statusFilter = searchParams.status === 'draft' || searchParams.status === 'published'
    ? searchParams.status
    : 'all';
  const where = statusFilter === 'all' ? {} : { status: statusFilter };

  const [total, allCount, draftCount, publishedCount, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.count(),
    prisma.article.count({ where: { status: 'draft' } }),
    prisma.article.count({ where: { status: 'published' } }),
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * ADMIN_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * ADMIN_PAGE_SIZE, total);

  // v11.32 tab 链接构造：保留 tab 状态，page=1
  const tabHref = (s: 'all' | 'draft' | 'published') => {
    if (s === 'all') return '/admin/articles';
    return `/admin/articles?status=${s}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">文章管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {total} 条 · 本页 {startIdx}-{endIdx}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            写文章
          </Link>
        </div>
      </div>

      {/* v11.32 草稿 tab 筛选：全部 / 草稿 / 已发布 */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200">
        <TabLink href={tabHref('all')} active={statusFilter === 'all'} icon={<FileCode2 className="w-3.5 h-3.5" />}>
          全部 <span className="text-xs text-slate-400 ml-1">({allCount})</span>
        </TabLink>
        <TabLink href={tabHref('published')} active={statusFilter === 'published'} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          已发布 <span className="text-xs text-slate-400 ml-1">({publishedCount})</span>
        </TabLink>
        <TabLink href={tabHref('draft')} active={statusFilter === 'draft'} icon={<FileEdit className="w-3.5 h-3.5" />}>
          草稿 <span className="text-xs text-amber-600 ml-1">({draftCount})</span>
        </TabLink>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">标题</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">分类</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">属性</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">浏览</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">发布时间</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
                  {/* v11.32 草稿/已发布 + v11.21 原创/转载 + 百度推送状态 */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {/* v11.32 草稿/已发布 徽标（最显眼位置） */}
                      {article.status === 'draft' ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                          title="草稿：前台不可见，下次可继续编辑"
                        >
                          📝 草稿
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs"
                          title="已发布：前台可见、sitemap 收录、可推百度"
                        >
                          ✓ 已发布
                        </span>
                      )}
                      {article.isReposted ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs"
                          title="转载文章：canonical 指外站、noindex、不推百度"
                        >
                          转载
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                          title="kjgjs 首发：self-canonical、sitemap 推百度"
                        >
                          原创
                        </span>
                      )}
                      {!article.isReposted && article.status === 'published' && (
                        article.baiduPushedAt ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                            title={`已推百度：${new Date(article.baiduPushedAt).toLocaleString('zh-CN')}`}
                          >
                            ✓ 已推百度
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs"
                            title="首发后请到编辑页点击'主动推百度'按钮"
                          >
                            未推百度
                          </span>
                        )
                      )}
                    </div>
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
        queryString={statusFilter === 'all' ? '' : `status=${statusFilter}`}
      />
    </div>
  );
}

/** v11.32 tab 链接组件 */
function TabLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? 'border-brand-600 text-brand-700'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
