'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X, Video, MessageCircle } from 'lucide-react';

const NAV = [
  { href: '/', label: '首页' },
  { href: '/articles', label: '文章' },
  { href: '/news', label: '资讯' },
  { href: '/deals', label: '优惠活动' },
  { href: '/tools', label: '实用工具' },
];

// 二维码数据（只保留公众号和视频号）
const QR_CODES = [
  { key: 'gongzhonghao', name: '公众号', src: '/images/qrcode/gongzhonghao.jpeg', desc: '扫码关注公众号' },
  { key: 'shipinhao', name: '视频号', src: '/images/qrcode/shipinhao.jpeg', desc: '扫码关注视频号' },
];

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (typeof window === 'undefined') return;
    // 用 window.location 跳转（硬导航到 /search 页面）— 避免 router.push 软导航竞态
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                跨
              </div>
              <div>
                <div className="font-bold text-slate-900 leading-tight">跨境工具说</div>
                <div className="text-[10px] text-slate-500 leading-tight">kjgjs.cn</div>
              </div>
            </Link>

            {/* 主导航 */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 搜索框 - 优化2：实现搜索功能 */}
            <form 
              onSubmit={handleSearch}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg w-64"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索工具、文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent flex-1 text-sm outline-none placeholder:text-slate-400"
              />
            </form>

            {/* 移动端菜单按钮 - 优化4：绑定点击事件 */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="菜单"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* 移动端搜索框 - 优化4：移动端搜索入口 */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索工具、文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </form>
          </div>
        </div>

        {/* 移动端导航抽屉 - 优化4：导航菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

// 右下角悬浮：公众号 + 视频号 两个独立按钮，点开各自弹窗
export function QrCodeFloat() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenKey(prev => (prev === key ? null : key));
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {QR_CODES.map(({ key, name, src, desc }) => {
        const Icon = key === 'shipinhao' ? Video : MessageCircle;
        const isOpen = openKey === key;
        return (
          <div key={key} className="relative flex items-center gap-2">
            {/* 二维码弹窗（在按钮左侧） */}
            {isOpen && (
              <div className="absolute right-14 bottom-0 bg-white rounded-xl shadow-2xl p-3 border border-slate-200 w-44 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-900">{name}</div>
                  <button
                    onClick={() => setOpenKey(null)}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <img
                  src={src}
                  alt={name}
                  className="w-full h-auto rounded-lg bg-white"
                />
                <div className="text-[11px] text-slate-500 mt-2 text-center">{desc}</div>
              </div>
            )}

            {/* 文字标签（hover 显示，或者打开时一直显示） */}
            {isOpen && (
              <span className="text-xs font-medium text-slate-700 bg-white/90 border border-slate-200 rounded-full px-2 py-1 shadow-sm">
                {name}
              </span>
            )}

            {/* 悬浮按钮 */}
            <button
              onClick={() => toggle(key)}
              className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
                isOpen
                  ? 'bg-brand-600 text-white scale-105'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-600'
              }`}
              aria-label={name}
              title={name}
            >
              <Icon className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">跨</div>
              <div className="font-bold text-white">跨境工具说</div>
            </div>
            <p className="text-sm leading-relaxed">
              为跨境卖家精选的工具导航、热门资讯、优惠活动。
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-3 text-sm">工具分类</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools?cat=ERP" className="hover:text-white">ERP管理</Link></li>
              <li><Link href="/tools?cat=选品" className="hover:text-white">选品工具</Link></li>
              <li><Link href="/tools?cat=关键词" className="hover:text-white">关键词</Link></li>
              <li><Link href="/tools?cat=物流" className="hover:text-white">物流跟踪</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-3 text-sm">内容</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/articles" className="hover:text-white">精选文章</Link></li>
              <li><Link href="/news" className="hover:text-white">行业资讯</Link></li>
              <li><Link href="/deals" className="hover:text-white">优惠活动</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-3 text-sm">关注我们</h4>
            <ul className="space-y-2 text-sm">
              <li>公众号：跨境工具说</li>
              <li>小红书：跨境工具说</li>
              <li>知乎：跨境工具说</li>
              <li>抖音：跨境工具说</li>
            </ul>
          </div>
          {/* 优化8：商务联系方式 */}
          <div>
            <h4 className="font-medium text-white mb-3 text-sm">商务合作</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-brand-400">18971469839</li>
              <li><Link href="/deals" className="hover:text-white">加入优惠活动</Link></li>
              <li><Link href="/tools" className="hover:text-white">工具合作</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-center">
          <p>© 2026 kjgjs.cn 跨境工具说 · 用心服务每一位跨境卖家</p>
        </div>
      </div>
    </footer>
  );
}
