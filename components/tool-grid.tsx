'use client';
import { useState, useMemo } from 'react';
import { Search, Tag, ExternalLink, Gift, Sparkles } from 'lucide-react';
import { TOOLS, CATEGORIES, Tool } from '@/lib/data/tools';

interface ToolCardProps {
  tool: Tool;
  showCategory?: boolean;
}

function ToolCard({ tool, showCategory = false }: ToolCardProps) {
  // 优先跳推广链接，否则跳官网
  const targetUrl = tool.affiliateUrl || tool.url;
  const hasDiscount = !!tool.discount;
  const domain = (() => {
    try {
      const u = new URL(tool.url);
      return u.hostname.replace('www.', '');
    } catch {
      return '';
    }
  })();
  
  // 用 Google S2 获取 favicon（更稳定）
  const favicon = domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : '';

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
        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {favicon ? (
            <img
              src={favicon}
              alt={tool.name}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-base font-bold text-brand-600">${tool.name[0]}</span>`;
              }}
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

export function ToolGrid() {
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTools = useMemo(() => {
    let result = TOOLS;
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
  }, [activeCat, search]);

  return (
    <div>
      {/* 搜索框 */}
      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="搜索工具名称、功能、分类..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            清除
          </button>
        )}
      </div>

      {/* 分类 Tab */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
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
          共 <span className="font-semibold text-slate-900">{filteredTools.length}</span> 个工具
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
        </div>
      )}
    </div>
  );
}
