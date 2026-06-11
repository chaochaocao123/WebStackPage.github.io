import Link from 'next/link';
import { prisma } from '@/lib/db';
import { createTool } from '../../actions';
import { ArrowLeft } from 'lucide-react';

export default async function NewToolPage() {
  const categories = await prisma.category.findMany({ orderBy: { sort: 'asc' } });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/tools"
          className="p-2 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">添加工具</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={createTool} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                工具名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：赛狐ERP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                官方网址 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="url"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                分类 <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryKey"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="">选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                业务描述
              </label>
              <input
                type="text"
                name="business"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：ERP管理软件"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              联盟推广链接
            </label>
            <input
              type="url"
              name="affiliateUrl"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              优惠信息
            </label>
            <input
              type="text"
              name="discount"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="例如：8折优惠"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              name="logo"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://... (可选)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              id="featured"
              className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="featured" className="text-sm text-slate-700">
              首页推荐（勾选后有优惠的工具会优先展示）
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              保存
            </button>
            <Link
              href="/admin/tools"
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
