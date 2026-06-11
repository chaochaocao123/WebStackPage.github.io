import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateNews, deleteNews } from '../../actions';
import { ArrowLeft, Trash2 } from 'lucide-react';

const SOURCE_LABEL: Record<string, string> = {
  manual: '跨境工具说',
  amz123: 'AMZ123',
  mjzj: '卖家之家',
  wearesellers: 'WeAreSellers',
  cifnews: '雨果网',
};

export default async function EditNewsPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  const item = await prisma.news.findUnique({ where: { id } });

  if (!item) {
    notFound();
  }

  // datetime-local 要 yyyy-MM-ddTHH:mm 格式
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = new Date(item.publishedAt);
  const publishedAtLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/news" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">编辑资讯</h1>
        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
          来源：{SOURCE_LABEL[item.source] || item.source}
        </span>
        {item.sourceType === 'crawl' && (
          <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
            抓取于 {new Date(item.crawledAt).toLocaleString('zh-CN')}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={updateNews.bind(null, id)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={item.title}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
              defaultValue={item.url}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                来源
              </label>
              <select
                name="source"
                defaultValue={item.source}
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
                defaultValue={item.category || ''}
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
              defaultValue={item.summary || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              封面图 URL
            </label>
            <input
              type="url"
              name="cover"
              defaultValue={item.cover || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
                defaultValue={publishedAtLocal}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition">
                <input
                  type="checkbox"
                  name="pinned"
                  defaultChecked={item.pinned}
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
              保存修改
            </button>
            <Link
              href="/admin/news"
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              取消
            </Link>
          </div>
        </form>

        {/* 删除按钮 */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <form action={deleteNews.bind(null, id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              onClick={(e) => {
                if (!confirm(`确定要删除「${item.title}」吗？`)) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              删除资讯
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
