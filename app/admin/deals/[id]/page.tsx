import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateDeal, deleteDeal } from '../../actions';
import { ArrowLeft } from 'lucide-react';
import { DeletePageButton } from '../../_components/DeleteWithConfirm';

export default async function EditDealPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  const deal = await prisma.deal.findUnique({ where: { id } });

  if (!deal) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/deals" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">编辑优惠</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={updateDeal.bind(null, id)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                优惠标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={deal.title}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                品牌名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brand"
                required
                defaultValue={deal.brand}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              优惠链接 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="url"
              required
              defaultValue={deal.url}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                折扣信息
              </label>
              <input
                type="text"
                name="discount"
                defaultValue={deal.discount || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                品牌 Logo URL
              </label>
              <input
                type="url"
                name="brandLogo"
                defaultValue={deal.brandLogo || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              描述
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={deal.description}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                开始日期
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={formatDate(deal.startDate)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                结束日期
              </label>
              <input
                type="date"
                name="endDate"
                defaultValue={formatDate(deal.endDate)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
              href="/admin/deals"
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              取消
            </Link>
          </div>
        </form>

        {/* 删除按钮 */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <DeletePageButton
            formAction={deleteDeal.bind(null, id)}
            message="确定要删除这个优惠吗？"
            label="删除优惠"
          />
        </div>
      </div>
    </div>
  );
}
