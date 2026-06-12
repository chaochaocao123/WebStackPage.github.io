import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 通用分页组件（admin 列表页统一使用）
 * @param currentPage 当前页（1-based）
 * @param totalPages 总页数
 * @param total 总条数
 * @param startIdx 当前页第一条在总数中的索引（1-based）
 * @param endIdx 当前页最后一条在总数中的索引
 * @param basePath 分页链接基础路径，如 "/admin/news"
 * @param queryString 附加 query string（不含 page 参数），如 "q=foo&category=bar"，传 "" 表示无附加参数
 *
 * @example
 * <Pagination
 *   currentPage={page} totalPages={totalPages} total={total}
 *   startIdx={startIdx} endIdx={endIdx}
 *   basePath="/admin/news" queryString=""
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  total,
  startIdx,
  endIdx,
  basePath,
  queryString = '',
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  startIdx: number;
  endIdx: number;
  basePath: string;
  queryString?: string;
}) {
  if (totalPages <= 1) return null;

  // 当前页前后 2 范围的页码列表
  const pageNumbers: number[] = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pageNumbers.push(i);
  }

  // 构造带 page 参数的链接，保留其他 query
  const buildHref = (p: number) => {
    if (!queryString) return `${basePath}?page=${p}`;
    return `${basePath}?page=${p}&${queryString}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
      <div className="text-sm text-slate-500">
        第 {startIdx}-{endIdx} 条 / 共 {total} 条 · 第 {currentPage} / {totalPages} 页
      </div>
      <div className="flex items-center gap-1">
        {/* 上一页 */}
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="px-2.5 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一页</span>
          </Link>
        ) : (
          <span className="px-2.5 py-1.5 border border-slate-200 rounded text-sm text-slate-300 flex items-center gap-1 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
            <span>上一页</span>
          </span>
        )}

        {/* 首页 + 省略号 */}
        {currentPage > 3 && (
          <>
            <Link
              href={buildHref(1)}
              className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100"
            >
              1
            </Link>
            {currentPage > 4 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}

        {/* 当前页前后 2 页 */}
        {pageNumbers.map((p) => (
          <Link
            key={p}
            href={buildHref(p)}
            className={`px-3 py-1.5 rounded text-sm ${
              p === currentPage
                ? 'bg-brand-600 text-white border border-brand-600'
                : 'border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {p}
          </Link>
        ))}

        {/* 末页 + 省略号 */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && <span className="px-1 text-slate-400">…</span>}
            <Link
              href={buildHref(totalPages)}
              className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100"
            >
              {totalPages}
            </Link>
          </>
        )}

        {/* 下一页 */}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="px-2.5 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100 flex items-center gap-1"
          >
            <span>下一页</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="px-2.5 py-1.5 border border-slate-200 rounded text-sm text-slate-300 flex items-center gap-1 cursor-not-allowed">
            <span>下一页</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
