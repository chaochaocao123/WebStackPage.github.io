import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { BookOpen, Calendar, Eye, ArrowRight, FileText } from 'lucide-react';
import { ARTICLES } from '@/lib/data/articles';

export const metadata = {
  title: '精选文章 - 跨境工具说',
  description: '跨境电商运营干货、工具评测、平台政策解读',
};

export default function ArticlesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">精选文章</h1>
        </div>
        <p className="text-slate-500 mb-8">跨境电商运营干货、工具深度评测、平台政策解读</p>

        {ARTICLES.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="文章准备中"
            desc="您可以在公众号「跨境工具说」查看最新文章，或将文章内容发给我处理后会显示在这里。"
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARTICLES.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden card-hover"
    >
      {article.cover && (
        <div className="aspect-video bg-slate-100 overflow-hidden">
          <img src={article.cover} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
          {article.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
            </span>
          )}
          {article.viewCount !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
      <div className="text-slate-300 mx-auto mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto">{desc}</p>
    </div>
  );
}
