import Link from 'next/link';
import { createArticle } from '../../actions';
import { ArrowLeft } from 'lucide-react';

export default async function NewArticlePage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/articles" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">写文章</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={createArticle} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="文章标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="url-slug"
              />
              <p className="text-xs text-slate-500 mt-1">用于 URL，如 my-first-article</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              摘要 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="excerpt"
              required
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              placeholder="文章摘要，用于列表页展示"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              内容
            </label>
            <textarea
              name="content"
              rows={15}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none font-mono text-sm"
              placeholder="文章正文内容..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                分类
              </label>
              <input
                type="text"
                name="category"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：亚马逊运营"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                作者
              </label>
              <input
                type="text"
                name="author"
                defaultValue="跨境工具说"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                标签
              </label>
              <input
                type="text"
                name="tags"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="亚马逊, 选品 (逗号分隔)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                来源类型
              </label>
              <select
                name="sourceType"
                defaultValue="manual"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="manual">手动创建</option>
                <option value="werss">RSS 抓取</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              封面图 URL
            </label>
            <input
              type="url"
              name="cover"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              发布
            </button>
            <Link
              href="/admin/articles"
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
