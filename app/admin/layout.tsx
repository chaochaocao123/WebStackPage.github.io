import Link from 'next/link';
import { logoutAction } from './actions';
import {
  LayoutDashboard,
  Wrench,
  FolderOpen,
  FileText,
  Gift,
  Image,
  ExternalLink,
  LogOut,
  Sparkles,
  Newspaper,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/tools', label: '工具管理', icon: Wrench },
  { href: '/admin/categories', label: '分类管理', icon: FolderOpen },
  { href: '/admin/news', label: '资讯管理', icon: Newspaper },
  { href: '/admin/articles', label: '文章管理', icon: FileText },
  { href: '/admin/deals', label: '优惠管理', icon: Gift },
  { href: '/admin/ads', label: '广告位', icon: Image },
];

// 强制动态渲染：避免侧边栏菜单软导航时的 ISR 缓存竞态
// （v11 修复：菜单点击不灵敏，要点几次才有反应）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* 侧边栏：按内容自适应高度，去掉 min-h-screen 避免底部留白 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col self-start">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900">跨境工具说</div>
              <div className="text-xs text-slate-500">后台管理</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition"
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-1">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
          >
            <ExternalLink className="w-5 h-5" />
            访问主站
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
              退出登录
            </button>
          </form>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              欢迎回来，<span className="font-medium text-slate-900">曹总</span>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
