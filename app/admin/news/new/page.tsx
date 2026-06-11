import Link from 'next/link';
import { createNews } from '../../actions';
import { ArrowLeft } from 'lucide-react';

export default async function NewNewsPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/news" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">发布资讯</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={createNews} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="资讯标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              原文链接 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="url"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://..."
            />
            <p className="text-xs text-slate-500 mt-1">链接重复时自动覆盖更新</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                来源
              </label>
              <select
                name="source"
                defaultValue="manual"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="manual">跨境工具说（默认）</option>
                <option value="amz123">AMZ123</option>
                <option value="mjzj">卖家之家</option>
                <option value="cifnews">雨果网</option>
                <option value="wearesellers">WeAreSellers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                分类
              </label>
              <input
                type="text"
                name="category"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：亚马逊、平台政策"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              摘要
            </label>
            <textarea
              name="summary"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              placeholder="一句话描述资讯核心内容"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              封面图 URL
            </label>
            <input
              type="url"
              name="cover"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://... (可选)"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                发布时间
              </label>
              <input
                type="datetime-local"
                name="publishedAt"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">留空则为当前时间</p>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition">
                <input
                  type="checkbox"
                  name="pinned"
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-amber-700">置顶显示</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              发布
            </button>
            <Link
              href="/admin/news"
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
