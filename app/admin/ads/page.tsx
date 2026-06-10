import Link from 'next/link';
import { prisma } from '@/lib/db';
import { updateAdSpot } from '../actions';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export default async function AdsPage() {
  const adSpots = await prisma.adSpot.findMany({
    orderBy: { sort: 'asc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">广告位管理</h1>

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
                        <img src={spot.imageUrl} alt="" className="h-8 inline-block mr-2" />
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
