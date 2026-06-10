import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Newspaper, ExternalLink, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { NEWS } from '@/lib/data/news';

export const metadata = {
  title: '行业资讯 - 跨境工具说',
  description: '每日更新跨境电商行业热门资讯，覆盖亚马逊、TikTok、Temu、Shopee 等平台',
};

export default function NewsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-accent-500" />
            <h1 className="text-2xl font-bold text-slate-900">行业资讯</h1>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            每日 9:00 / 18:00 自动更新
          </div>
        </div>
        <p className="text-slate-500 mb-8">每日自动抓取 amz123、mjzj、wearesellers、cifnews 等行业媒体的热门资讯</p>

        {NEWS.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">资讯抓取准备中</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              阶段二将上线自动抓取，每天 2 次更新。当前可手动添加资讯内容。
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 头条 */}
            {NEWS[0] && (
              <a
                href={NEWS[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="lg:col-span-2 group block bg-white border border-slate-200 rounded-xl overflow-hidden card-hover"
              >
                {NEWS[0].cover && (
                  <div className="aspect-[2/1] bg-slate-100 overflow-hidden">
                    <img src={NEWS[0].cover} alt={NEWS[0].title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded font-medium">头条</span>
                    <span>{NEWS[0].source}</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(NEWS[0].publishedAt)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition mb-2">
                    {NEWS[0].title}
                  </h2>
                  {NEWS[0].summary && <p className="text-slate-500 text-sm line-clamp-2">{NEWS[0].summary}</p>}
                </div>
              </a>
            )}

            {/* 列表 */}
            <div className="space-y-3">
              {NEWS.slice(1, 6).map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-white border border-slate-200 rounded-lg p-4 card-hover"
                >
                  <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{item.source}</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.publishedAt)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 group-hover:text-brand-600 line-clamp-2">
                    {item.title}
                  </h3>
                </a>
              ))}
            </div>

            {/* 其余资讯 */}
            {NEWS.length > 6 && (
              <div className="lg:col-span-3 mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> 更多资讯
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {NEWS.slice(6).map((item, i) => (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white border border-slate-200 rounded-lg p-4 card-hover"
                    >
                      <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{item.source}</span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 group-hover:text-brand-600 line-clamp-2">
                        {item.title}
                      </h4>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '刚刚';
  if (h < 24) return `${h}小时前`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString('zh-CN');
}
