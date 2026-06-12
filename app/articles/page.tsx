import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { BookOpen, Calendar, Eye, FileText } from 'lucide-react';
import { getArticlesFromDB } from '@/lib/data/articles';

export const metadata = {
  title: '精选文章 - 跨境工具说',
  description: '跨境电商运营干货、工具评测、平台政策解读',
  alternates: { canonical: 'https://kjgjs.cn/articles' },
};

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 分钟重生 ISR

export default async function ArticlesPage() {
  const articles = await getArticlesFromDB(60);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">精选文章</h1>
        </div>
        <p className="text-slate-500 mb-8">跨境电商运营干货、工具深度评测、平台政策解读</p>

        {articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ArticleCard({ article }: { article: { slug: string; title: string; excerpt: string; cover?: string | null; category?: string | null; publishedAt: string; viewCount: number } }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden card-hover"
    >
      {article.cover && (
        <div className="aspect-video bg-slate-100 overflow-hidden">
          <img src={article.cover} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
        </div>
      )}
      <div className="p-5">
        {article.category && (
          <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium mb-2">
            {article.category}
          </span>
        )}
        <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {article.viewCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-700 mb-2">文章准备中</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        您可以在公众号「跨境工具说」查看最新文章，或在后台「文章管理」发布后将自动显示在这里。
      </p>
    </div>
  );
}
