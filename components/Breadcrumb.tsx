import Link from 'next/link';

const SITE_URL = 'https://kjgjs.cn';

export type BreadcrumbItem = {
  /** 显示文本 + JSON-LD name */
  name: string;
  /** 链接 URL（绝对 URL 用于 JSON-LD，相对路径用于视觉） */
  href?: string;
  /** 视觉显示的 title（用于 line-clamp tooltip），默认 = name */
  title?: string;
};

type Props = {
  items: BreadcrumbItem[];
  /** 末项是否截断（line-clamp-1 + max-w-[200px]），详情页默认 true */
  truncateLast?: boolean;
  /** 自定义 className */
  className?: string;
};

/**
 * 面包屑导航 + BreadcrumbList JSON-LD 一体化组件
 *
 * @example
 *   <Breadcrumb items={[
 *     { name: '首页', href: '/' },
 *     { name: '行业资讯', href: '/news' },
 *     { name: '亚马逊新规…' },
 *   ]} />
 */
export function Breadcrumb({ items, truncateLast = false, className = 'text-xs text-slate-500 mb-4' }: Props) {
  if (items.length === 0) return null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.href
        ? (item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href.startsWith('/') ? '' : '/'}${item.href}`)
        : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={`${className} flex flex-wrap items-center max-w-full`}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const showTruncate = truncateLast && isLast;
          return (
            <span key={idx} className="inline-flex items-center min-w-0">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-brand-600">
                  {item.name}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? 'text-slate-700'
                      : ''
                  }
                  title={item.title || item.name}
                >
                  {showTruncate ? (
                    <span className="inline-block max-w-[260px] truncate align-middle">
                      {item.name}
                    </span>
                  ) : (
                    item.name
                  )}
                </span>
              )}
              {!isLast && <span className="mx-2 shrink-0">/</span>}
            </span>
          );
        })}
      </nav>
    </>
  );
}
