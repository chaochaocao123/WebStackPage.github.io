import Link from 'next/link';
import { createDeal } from '../../actions';
import { ArrowLeft } from 'lucide-react';

export default async function NewDealPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/deals" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">添加优惠</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={createDeal} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                优惠标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：新年大促 8 折优惠"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：赛狐ERP"
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://..."
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：8折"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                品牌 Logo URL
              </label>
              <input
                type="url"
                name="brandLogo"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://..."
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              placeholder="优惠活动详细描述..."
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              保存
            </button>
            <Link
              href="/admin/deals"
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
