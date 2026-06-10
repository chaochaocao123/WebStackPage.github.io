import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateAdSpot } from '../actions';
import { ArrowLeft } from 'lucide-react';

export default async function EditAdSpotPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  const adSpot = await prisma.adSpot.findUnique({ where: { id } });

  if (!adSpot) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/ads" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">编辑广告位</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={updateAdSpot.bind(null, id)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              广告位名称
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={adSpot.name}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Key
            </label>
            <input
              type="text"
              disabled
              defaultValue={adSpot.key}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">Key 用于代码中引用，不可修改</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              图片 URL
            </label>
            <input
              type="url"
              name="imageUrl"
              defaultValue={adSpot.imageUrl}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://..."
            />
            {adSpot.imageUrl && (
              <div className="mt-2">
                <img src={adSpot.imageUrl} alt="预览" className="h-20 rounded border border-slate-200" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              跳转链接
            </label>
            <input
              type="url"
              name="linkUrl"
              defaultValue={adSpot.linkUrl}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                id="active"
                defaultChecked={adSpot.active}
                className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="active" className="text-sm text-slate-700">
                启用广告位
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                排序
              </label>
              <input
                type="number"
                name="sort"
                defaultValue={adSpot.sort}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              保存修改
            </button>
            <Link
              href="/admin/ads"
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
