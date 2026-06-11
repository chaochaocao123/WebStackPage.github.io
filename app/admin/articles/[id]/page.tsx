import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateArticle, deleteArticle } from '../../actions';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) {
    notFound();
  }

  const tags = JSON.parse(article.tags || '[]').join(', ');

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/articles" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">编辑文章</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={updateArticle.bind(null, id)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={article.title}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
                defaultValue={article.slug}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
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
              defaultValue={article.excerpt}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              内容
            </label>
            <textarea
              name="content"
              rows={15}
              defaultValue={article.content}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none font-mono text-sm"
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
                defaultValue={article.category || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                作者
              </label>
              <input
                type="text"
                name="author"
                defaultValue={article.author}
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
                defaultValue={tags}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="亚马逊, 选品 (逗号分隔)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                浏览量
              </label>
              <input
                type="number"
                name="viewCount"
                defaultValue={article.viewCount}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              封面图 URL
            </label>
            <input
              type="url"
              name="cover"
              defaultValue={article.cover || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              保存修改
            </button>
            <Link
              href="/admin/articles"
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              取消
            </Link>
          </div>
        </form>

        {/* 删除按钮 */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <form action={deleteArticle.bind(null, id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              onClick={(e) => {
                if (!confirm('确定要删除这篇文章吗？')) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              删除文章
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
