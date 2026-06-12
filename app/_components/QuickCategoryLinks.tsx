'use client';

interface QuickCategory {
  key: string;
  label: string;
  count: number;
}

/**
 * 首页 Hero 快捷分类入口
 * - 点击 → 滚动到 #tools + 通知 ToolGrid 切到该分类（自定义事件 'kjgjs:change-cat'）
 * - 同步 URL ?cat=xxx（保持分享能力）
 *
 * v11 修复：原版用 href="#cat-xxx" 锚点跳转，但全项目无 id="cat-xxx" 元素，
 * 导致 9 个分类菜单点了 0 响应（页面没任何变化）
 */
export function QuickCategoryLinks({ categories }: { categories: QuickCategory[] }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, catKey: string) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;

    // 1. 滚动到"全部工具"section
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 2. 通知 ToolGrid 切换分类（自定义事件，立即响应）
    window.dispatchEvent(new CustomEvent('kjgjs:change-cat', { detail: { cat: catKey } }));

    // 3. 同步 URL（保持分享能力）
    const url = new URL(window.location.href);
    url.searchParams.set('cat', catKey);
    window.history.pushState(null, '', url.toString());
  };

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      {categories.map((cat) => (
        <a
          key={cat.key}
          href={`?cat=${encodeURIComponent(cat.key)}#tools`}
          onClick={(e) => handleClick(e, cat.key)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-brand-400 hover:text-brand-600 transition cursor-pointer"
        >
          {cat.label} <span className="text-xs text-slate-400">({cat.count})</span>
        </a>
      ))}
    </div>
  );
}
