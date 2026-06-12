'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Search, ExternalLink, Gift, Sparkles } from 'lucide-react';
import { Tool } from '@/lib/data/tools-db';

interface ToolCardProps {
  tool: Tool;
  showCategory?: boolean;
}

function ToolCard({ tool, showCategory = false }: ToolCardProps) {
  // 优先跳推广链接，否则跳官网
  const targetUrl = tool.affiliateUrl || tool.url;
  const hasDiscount = !!tool.discount;
  // logo 优先：DB logo 字段 → 首字母（去掉外链 Google Favicon，国内访问慢）
  const hasLogo = !!tool.logo;
  // next/image 加载失败时回退到首字母（替代 innerHTML hack）
  const [logoError, setLogoError] = useState(false);
  const showLogo = hasLogo && !logoError;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group block bg-white border border-slate-200 rounded-xl p-4 card-hover relative overflow-hidden"
    >
      {hasDiscount && (
        <div className="absolute top-0 right-0 discount-badge">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
            <Gift className="w-3 h-3" />
            优惠
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
          {showLogo ? (
            <Image
              src={tool.logo!}
              alt={tool.name}
              width={32}
              height={32}
              className="object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-base font-bold text-brand-600">{tool.name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
              {tool.name}
            </h3>
            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {showCategory && (
            <div className="text-xs text-slate-500 mt-0.5">{tool.category}</div>
          )}
          {tool.business && (
            <div className="text-xs text-slate-500 mt-0.5 truncate" title={tool.business}>
              {tool.business}
            </div>
          )}
        </div>
      </div>

      {hasDiscount && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            <span className="text-orange-600 font-medium">🎁 </span>
            {tool.discount}
          </div>
        </div>
      )}
    </a>
  );
}

export interface ToolGridProps {
  tools: Tool[];
  categories: { key: string; label: string; count: number }[];
}

// 包装组件，支持 URL query 参数搜索 + 分类
function ToolGridInner({ tools, categories }: ToolGridProps) {
  // 用 window.location 读 URL 参数（不依赖 useSearchParams）
  // — 原因：ISR 缓存页面 + useSearchParams + router.replace 三件套有竞态，
  //   会导致 Tab 点击响应延迟/卡顿
  // — 替代方案：setState 立即更新（0 延迟）+ window.history.replaceState 异步同步 URL
  // — SSR 时 window 不存在，所以用 'all' 兜底，挂载后用 useEffect 从 URL 读真实值
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  // 挂载时从 URL 读初始值（分享链接 / 直接打开 cat=xxx）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if (cat && categories.some(c => c.key === cat)) {
      setActiveCat(cat);
    }
    const q = params.get('q');
    if (q) setSearch(q);
  }, [categories]);

  // 切换分类：立即更新 state + 同步 URL（不依赖 Next 路由）
  const handleCatChange = (cat: string) => {
    setActiveCat(cat); // 立即（核心）
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (cat === 'all') {
      url.searchParams.delete('cat');
    } else {
      url.searchParams.set('cat', cat);
    }
    window.history.replaceState(null, '', url.toString());
  };

  // 搜索框变化：也同步到 URL（保持分享能力）
  const handleSearchChange = (v: string) => {
    setSearch(v);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (v.trim()) {
      url.searchParams.set('q', v);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState(null, '', url.toString());
  };

  const filteredTools = useMemo(() => {
    let result = tools;
    if (activeCat !== 'all') {
      result = result.filter(t => t.category === activeCat);
    }
    if (search.trim()) {
      const kw = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(kw) ||
        t.business.toLowerCase().includes(kw) ||
        t.category.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [tools, activeCat, search]);

  return (
    <div>
      {/* 搜索框 */}
      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="搜索工具名称、功能、分类..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            清除
          </button>
        )}
      </div>

      {/* 分类 Tab */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => handleCatChange(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeCat === cat.key
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {cat.label}
              <span className={`ml-1.5 text-xs ${activeCat === cat.key ? 'text-brand-100' : 'text-slate-400'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 工具数量 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-500">
          {search ? (
            <>找到 <span className="font-semibold text-slate-900">{filteredTools.length}</span> 个匹配的工具</>
          ) : (
            <>共 <span className="font-semibold text-slate-900">{filteredTools.length}</span> 个工具</>
          )}
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          点击图标直达官网
        </div>
      </div>

      {/* 工具卡片网格 */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredTools.map(tool => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的工具</p>
          <p className="text-sm mt-1">试试其他关键词</p>
        </div>
      )}
    </div>
  );
}

// 导出包装组件，处理 Suspense
import { Suspense } from 'react';

export function ToolGrid(props: ToolGridProps) {
  return (
    <Suspense fallback={
      <div className="animate-pulse">
        <div className="h-12 bg-slate-200 rounded-xl mb-4"></div>
        <div className="flex gap-2 mb-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-9 w-20 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    }>
      <ToolGridInner {...props} />
    </Suspense>
  );
}
