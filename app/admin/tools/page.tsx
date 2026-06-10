import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, Search, ExternalLink, Star } from 'lucide-react';

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const categoryKey = searchParams.category || '';
  const page = parseInt(searchParams.page || '1');
  const pageSize = 20;

  // 构建查询条件
  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { business: { contains: query } },
    ];
  }
  if (categoryKey) {
    where.categoryKey = categoryKey;
  }

  // 获取数据
  const [tools, totalCount, categories] = await Promise.all([
    prisma.tool.findMany({
      where,
      include: { category: true },
      orderBy: [{ featured: 'desc' }, { sort: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tool.count({ where }),
    prisma.category.findMany({ orderBy: { sort: 'asc' } }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">工具管理</h1>
        <Link
          href="/admin/tools/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" />
          添加工具
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <form className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="搜索工具名称或描述..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <select
            name="category"
            defaultValue={categoryKey}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            搜索
          </button>
          {(query || categoryKey) && (
            <Link
              href="/admin/tools"
              className="px-4 py-2 text-slate-500 hover:text-slate-700"
            >
              清除
            </Link>
          )}
        </div>
      </form>

      {/* 工具列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">工具</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">分类</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">优惠</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {tools.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  暂无工具，请先添加
                </td>
              </tr>
            ) : (
              tools.map((tool) => (
                <tr key={tool.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tool.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      <div>
                        <div className="font-medium text-slate-900">{tool.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{tool.business}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {tool.category?.label || tool.categoryKey}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tool.discount ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                        {tool.discount}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">无</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-brand-600"
                        title="访问官网"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/admin/tools/${tool.id}`}
                        className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        编辑
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              共 {totalCount} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/tools?page=${page - 1}${query ? `&q=${query}` : ''}${categoryKey ? `&category=${categoryKey}` : ''}`}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                >
                  上一页
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/tools?page=${page + 1}${query ? `&q=${query}` : ''}${categoryKey ? `&category=${categoryKey}` : ''}`}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                >
                  下一页
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
