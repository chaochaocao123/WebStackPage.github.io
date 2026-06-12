'use client';

import { ExternalLink, Gift } from 'lucide-react';
import { Tool } from '@/lib/data/tools-db';

export function ToolCard({ tool, showCategory = false }: { tool: Tool; showCategory?: boolean }) {
  const targetUrl = tool.affiliateUrl || tool.url;
  const hasDiscount = !!tool.discount;
  // v5 性能：去 Google Favicon（国内访问慢且不可控），用 DB logo 字段，缺则首字母
  const hasLogo = !!tool.logo;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group block bg-white border border-slate-200 rounded-xl p-4 card-hover relative overflow-hidden"
    >
      {hasDiscount && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
            <Gift className="w-3 h-3" />
            优惠
          </div>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {hasLogo ? (
            <img
              src={tool.logo!}
              alt={tool.name}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = `<span class="text-base font-bold text-brand-600">${tool.name[0]}</span>`;
                }
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
            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
          </div>
          {showCategory && <div className="text-xs text-slate-500 mt-0.5">{tool.category}</div>}
          {tool.business && <div className="text-xs text-slate-500 mt-0.5 truncate">{tool.business}</div>}
        </div>
      </div>
      {hasDiscount && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            <span className="text-orange-600 font-medium">🎁 </span>{tool.discount}
          </div>
        </div>
      )}
    </a>
  );
}
