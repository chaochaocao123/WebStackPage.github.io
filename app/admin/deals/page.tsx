import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, ExternalLink } from 'lucide-react';
import { deleteDeal } from '../actions';
import { DeleteRowButton } from '../_components/DeleteWithConfirm';
import { Pagination, ADMIN_PAGE_SIZE } from '../_components/Pagination';

// 强制动态渲染，避免 Router Cache 导致翻页时统计过时
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [total, deals] = await Promise.all([
    prisma.deal.count(),
    prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * ADMIN_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * ADMIN_PAGE_SIZE, total);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">优惠管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {total} 条 · 本页 {startIdx}-{endIdx}
          </p>
        </div>
        <Link
          href="/admin/deals/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" />
          添加优惠
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">优惠标题</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">品牌</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">折扣</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">有效期</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无优惠活动，<Link href="/admin/deals/new" className="text-brand-600 hover:underline">去添加</Link>
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{deal.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">{deal.description}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{deal.brand}</td>
                  <td className="px-4 py-3">
                    {deal.discount ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                        {deal.discount}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">无</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {deal.startDate && deal.endDate ? (
                      <>
                        {new Date(deal.startDate).toLocaleDateString('zh-CN')} ~
                        {new Date(deal.endDate).toLocaleDateString('zh-CN')}
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs">长期有效</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={deal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-brand-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/admin/deals/${deal.id}`}
                        className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        编辑
                      </Link>
                      <DeleteRowButton
                        formAction={deleteDeal.bind(null, deal.id)}
                        message="确定要删除这个优惠吗？"
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
        basePath="/admin/deals"
      />
    </div>
  );
}
