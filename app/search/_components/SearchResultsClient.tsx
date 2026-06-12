'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { Search as SearchIcon, Newspaper, Wrench, FileText, Tag, AlertCircle } from 'lucide-react';
import { type SearchTab } from '@/lib/data/search';

const TABS: { key: SearchTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'news', label: '资讯' },
  { key: 'tools', label: '工具' },
  { key: 'articles', label: '文章' },
  { key: 'deals', label: '优惠' },
];

interface Counts {
  all: number;
  news: number;
  tools: number;
  articles: number;
  deals: number;
}

type Props = {
  initialTab: SearchTab;
  initialCounts: Counts;
  q: string;
  /** 5 个 panel 的 server-rendered 内容（key = tab） */
  panels: Record<SearchTab, ReactNode>;
};

/**
 * 搜索结果展示 + Tab 切换（client 包装）
 *
 * v11 修复：原版在 server 端用 if/else 渲染对应 tab + 客户端 SearchTabs 用
 * useRouter.push 切 tab，导致 1) 切换 tab 触发整个 search page SSR
 * 2) router.push + useSearchParams 在某些情况下有竞态
 *
 * 新版：
 * - 5 个 panel 在 server 端**全部渲染好**，传到 client
 * - client 用 useState 切 tab，CSS 控制显隐（display: none / block）
 * - URL ?tab= 同步用 window.history.pushState（不触发 Next 软导航）
 * - 不依赖 useSearchParams / useRouter
 *
 * 性能影响：5 个 panel DOM 同时存在，但 display: none 不占渲染成本；
 *  比触发整页 SSR 快得多
 */
export function SearchResultsClient({ initialTab, initialCounts, q, panels }: Props) {
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const mountedRef = useRef(false);

  // 挂载后：从 URL 读真实 tab（处理分享链接 / 浏览器后退）
  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab') as SearchTab | null;
    if (urlTab && TABS.some(t => t.key === urlTab)) {
      setTab(urlTab);
    }

    // 监听浏览器后退 / 前进（popstate）
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab') as SearchTab | null;
      setTab(t && TABS.some(x => x.key === t) ? t : 'all');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleTabChange = (key: SearchTab) => {
    if (key === tab) return;
    setTab(key);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (key === 'all') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', key);
    }
    window.history.pushState(null, '', url.toString());
  };

  const counts = initialCounts;

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map((t) => {
            const count = counts[t.key];
            const isActive = tab === t.key;
            const tabClass = isActive
              ? 'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 border-brand-500 text-brand-600'
              : 'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300';
            const badgeClass = isActive
              ? 'px-1.5 py-0.5 rounded text-xs bg-brand-100 text-brand-700'
              : 'px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500';
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={tabClass}
              >
                {t.label}
                <span className={badgeClass}>{count}</span>
              </button>
            );
          })}
          {q && (
            <span className="ml-auto text-xs text-slate-500 hidden sm:inline">
              关键词：<span className="font-medium text-slate-700">「{q}」</span>
            </span>
          )}
        </div>
      </div>

      {/* 5 个 panel 同时渲染，CSS 切显隐 */}
      {TABS.map((t) => (
        <div key={t.key} hidden={tab !== t.key}>
          {panels[t.key]}
        </div>
      ))}
    </>
  );
}
