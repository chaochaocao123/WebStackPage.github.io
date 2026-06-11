import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateTool, deleteTool } from '../../actions';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default async function EditToolPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  const tool = await prisma.tool.findUnique({ where: { id } });

  if (!tool) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold text-slate-900">编辑工具</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={updateTool.bind(null, id)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                工具名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={tool.name}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
                defaultValue={tool.url}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
                defaultValue={tool.categoryKey}
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
                defaultValue={tool.business}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
              defaultValue={tool.affiliateUrl}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              优惠信息
            </label>
            <input
              type="text"
              name="discount"
              defaultValue={tool.discount}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              name="logo"
              defaultValue={tool.logo || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              id="featured"
              defaultChecked={tool.featured}
              className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="featured" className="text-sm text-slate-700">
              首页推荐
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              保存修改
            </button>
            <Link
              href="/admin/tools"
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              取消
            </Link>
          </div>
        </form>

        {/* 删除按钮 */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <form action={deleteTool.bind(null, id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              onClick={(e) => {
                if (!confirm('确定要删除这个工具吗？')) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              删除工具
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
