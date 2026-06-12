import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateNews, deleteNews } from '../../actions';
import { NewsFormClient } from '../_components/NewsFormClient';

const SOURCE_LABEL: Record<string, string> = {
  manual: '跨境工具说',
  mjzj: '卖家之家',
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

  const initialData = {
    id: item.id,
    title: item.title,
    url: item.url,
    source: item.source,
    category: item.category || '',
    summary: item.summary || '',
    cover: item.cover || '',
    publishedAt: publishedAtLocal,
    pinned: item.pinned,
  };

  // 编辑页头部额外标签（来源 + 抓取时间）
  const headerExtra = (
    <>
      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
        来源：{SOURCE_LABEL[item.source] || item.source}
      </span>
      {item.sourceType === 'crawl' && (
        <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
          抓取于 {new Date(item.crawledAt).toLocaleString('zh-CN')}
        </span>
      )}
    </>
  );

  // 编辑页前置内容（抓取的正文只读展示）
  const preFormContent = (
    <div className="mb-6 bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">
        正文内容
        <span className="ml-2 text-xs text-slate-400 font-normal">
          {item.content
            ? `已抓取（${(item.content.length / 1024).toFixed(1)} KB，自动抓取）`
            : '尚未抓取（下次 cron 自动抓取）'}
        </span>
      </h2>
      {item.content ? (
        <details className="border border-slate-200 rounded-lg overflow-hidden">
          <summary className="px-4 py-2.5 bg-slate-50 cursor-pointer text-sm text-slate-600 hover:bg-slate-100">
            点击展开 / 折叠抓取的 HTML 正文
          </summary>
          <div className="p-4 max-h-96 overflow-auto bg-white">
            <div
              className="news-content prose prose-sm prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        </details>
      ) : (
        <div className="px-4 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-sm text-slate-500">
          暂无内容。正文由 Vercel Cron 自动从卖家之家抓取并内嵌到本详情页，无需外跳。
        </div>
      )}
    </div>
  );

  return (
    <NewsFormClient
      initialData={initialData}
      formAction={updateNews.bind(null, id)}
      deleteAction={deleteNews.bind(null, id)}
      preFormContent={preFormContent}
      headerExtra={headerExtra}
    />
  );
}
