import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Home, Search, FileText, Wrench, Newspaper, Gift } from 'lucide-react';
import type { Metadata } from 'next';

// 404 页面 SEO 化：
// - HTTP 状态码 404（Next.js 自动）
// - meta robots: noindex, nofollow（避免被收录成"软 404"拖累权重）
// - 引导用户回到核心页面（首页/资讯/工具/优惠）
export const metadata: Metadata = {
  title: '页面未找到',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

const QUICK_LINKS = [
  { href: '/', icon: Home, title: '返回首页', desc: '工具导航总览' },
  { href: '/news', icon: Newspaper, title: '行业资讯', desc: '最新跨境动态' },
  { href: '/articles', icon: FileText, title: '精选文章', desc: '运营干货评测' },
  { href: '/tools', icon: Wrench, title: '实用工具', desc: 'FBA/汇率/换算' },
  { href: '/deals', icon: Gift, title: '优惠活动', desc: '限时折扣码' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-50 text-orange-500 mb-6">
            <Search className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">404</h1>
          <p className="text-lg text-slate-700 mb-2">页面找不到了</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            你访问的链接可能已被删除、移动或从未存在过。可以试试下面的入口，或
            <Link href="/" className="text-brand-600 hover:text-brand-700 mx-1 font-medium">
              返回首页
            </Link>
            看看。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 card-hover"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition">
                    {l.title}
                  </div>
                  <div className="text-xs text-slate-500">{l.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          如果你确信这是网站错误，请联系站长修复。
        </div>
      </main>
      <Footer />
    </div>
  );
}
