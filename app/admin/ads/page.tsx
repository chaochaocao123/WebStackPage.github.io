import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { Pagination, ADMIN_PAGE_SIZE } from '../_components/Pagination';

// 强制动态渲染，避免 Router Cache 导致翻页时统计过时
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [total, adSpots] = await Promise.all([
    prisma.adSpot.count(),
    prisma.adSpot.findMany({
      orderBy: { sort: 'asc' },
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
          <h1 className="text-2xl font-bold text-slate-900">广告位管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {total} 条 · 本页 {startIdx}-{endIdx}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">广告位</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Key</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {adSpots.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  暂无广告位
                </td>
              </tr>
            ) : (
              adSpots.map((spot) => (
                <tr key={spot.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{spot.name}</div>
                    {spot.imageUrl && (
                      <div className="text-xs text-slate-500 mt-1">
                        <img src={spot.imageUrl} alt={spot.name} className="h-8 inline-block mr-2" />
                        {spot.linkUrl && (
                          <a href={spot.linkUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm bg-slate-100 px-2 py-1 rounded">{spot.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    {spot.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        <CheckCircle className="w-3 h-3" />
                        启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                        <XCircle className="w-3 h-3" />
                        停用
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/ads/${spot.id}`}
                      className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                    >
                      编辑
                    </Link>
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
        basePath="/admin/ads"
      />

      {/* 提示 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-0.5">💡</div>
          <div>
            <div className="font-medium text-blue-800">广告位使用说明</div>
            <div className="text-sm text-blue-700 mt-1">
              广告位可在首页指定位置展示图片广告。配置图片 URL 和跳转链接后启用即可。
              目前首页侧边栏和 Hero 区已预留广告位。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
