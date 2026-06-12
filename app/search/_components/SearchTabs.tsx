'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { SearchTab } from '@/lib/data/search';

const TABS: { key: SearchTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'news', label: '资讯' },
  { key: 'tools', label: '工具' },
  { key: 'articles', label: '文章' },
  { key: 'deals', label: '优惠' },
];

export interface SearchTabsProps {
  active: SearchTab;
  counts: { all: number; news: number; tools: number; articles: number; deals: number };
  q: string;
}

/**
 * 搜索结果页 Tab 切换 — URL ?tab= 状态可分享 / 可后退
 * （继承曹总"分享带状态链接"偏好）
 */
export function SearchTabs({ active, counts, q }: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (key: SearchTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', key);
    }
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  return (
    <div className="border-b border-slate-200 mb-6 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {TABS.map((t) => {
          const count = counts[t.key];
          const isActive = active === t.key;
          const tabClass = isActive
            ? 'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 border-brand-500 text-brand-600'
            : 'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300';
          const badgeClass = isActive
            ? 'px-1.5 py-0.5 rounded text-xs bg-brand-100 text-brand-700'
            : 'px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500';
          return (
            <button
              key={t.key}
              onClick={() => handleClick(t.key)}
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
  );
}
