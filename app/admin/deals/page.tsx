import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { deleteDeal } from '../actions';

export default async function DealsPage() {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">优惠管理</h1>
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
                      <form action={deleteDeal.bind(null, deal.id)}>
                        <button
                          type="submit"
                          className="p-1.5 text-slate-400 hover:text-red-600"
                          onClick={(e) => {
                            if (!confirm('确定要删除这个优惠吗？')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
