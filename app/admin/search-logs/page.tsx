// 搜索日志监控 — 帮曹总看用户搜什么、哪些词无结果
// 自动建表（首次访问时建，后续幂等）

import { prisma } from '@/lib/db';
import {
  getTopKeywords,
  getNoResultKeywords,
  getRecentSearches,
  getDailyTrend,
} from '@/lib/data/search-log';
import { Search, AlertCircle, Hash, TrendingUp, Clock } from 'lucide-react';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 兜底建表：prisma 找不到 SearchLog 时跑 DDL。
 * CREATE TABLE IF NOT EXISTS 幂等，多次跑安全。
 */
async function ensureSearchLogTable() {
  try {
    await prisma.searchLog.count();
  } catch (err: any) {
    // P2021 = 表不存在（Prisma 错误码），42P01 = PostgreSQL undefined_table
    const code = err?.code;
    if (code === 'P2021' || code === 'P2010' || /does not exist/i.test(err?.message || '')) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "SearchLog" (
            "id" SERIAL NOT NULL,
            "keyword" TEXT NOT NULL,
            "resultCount" INTEGER NOT NULL,
            "tab" TEXT NOT NULL DEFAULT 'all',
            "sessionId" TEXT,
            "noResult" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
          )
        `);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SearchLog_keyword_idx" ON "SearchLog"("keyword")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SearchLog_createdAt_idx" ON "SearchLog"("createdAt")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SearchLog_noResult_idx" ON "SearchLog"("noResult")`);
        console.log('[search-logs] SearchLog table created');
      } catch (createErr) {
        console.error('[search-logs] failed to create table:', createErr);
      }
    }
  }
}

const TAB_LABELS: Record<string, string> = {
  all: '全部',
  news: '资讯',
  tools: '工具',
  articles: '文章',
  deals: '优惠',
};

const TAB_COLORS: Record<string, string> = {
  all: 'bg-slate-100 text-slate-700',
  news: 'bg-blue-100 text-blue-700',
  tools: 'bg-brand-100 text-brand-700',
  articles: 'bg-amber-100 text-amber-700',
  deals: 'bg-green-100 text-green-700',
};

export default async function SearchLogsPage() {
  await ensureSearchLogTable();

  // 并行查 5 个数据源
  const [totalAll, topKeywords, noResultKeywords, recent, dailyTrend] = await Promise.all([
    prisma.searchLog.count(),
    getTopKeywords({ days: 7, limit: 20 }),
    getNoResultKeywords({ days: 7, limit: 20 }),
    getRecentSearches({ limit: 30 }),
    getDailyTrend({ days: 14 }),
  ]);

  // 统计派生
  const total7d = dailyTrend.reduce((s, d) => s + d.total, 0);
  const noResult7d = dailyTrend.reduce((s, d) => s + d.noResult, 0);
  const uniqueKeywords7d = topKeywords.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = dailyTrend.find((d) => d.day.toISOString().slice(0, 10) === todayStr)?.total ?? 0;

  // 趋势图最大高度参考值
  const maxTotal = Math.max(1, ...dailyTrend.map((d) => d.total));

  return (
    <div>
      {/* 标题 + 时间范围 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">搜索日志</h1>
          <p className="text-sm text-slate-500 mt-1">
            用户在站内搜索了什么、哪些词搜不到 — 帮曹总找内容缺口
          </p>
        </div>
        <div className="text-xs text-slate-500">最近 7 天 / 14 天趋势</div>
      </div>

      {/* 4 个统计卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Search} label="7 天搜索量" value={total7d} accent="bg-brand-500" />
        <StatCard icon={Hash} label="独立关键词" value={uniqueKeywords7d} accent="bg-blue-500" />
        <StatCard icon={AlertCircle} label="无结果次数" value={noResult7d} accent="bg-amber-500" />
        <StatCard icon={Clock} label="今日搜索" value={todayCount} accent="bg-green-500" />
      </div>

      {/* 14 天趋势图 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-600" />
          <h2 className="text-base font-bold text-slate-900">14 天搜索趋势</h2>
        </div>
        {dailyTrend.length === 0 ? (
          <EmptyHint text="还没有搜索数据 — 用户首次搜索后这里会出图" />
        ) : (
          <TrendChart data={dailyTrend} maxTotal={maxTotal} />
        )}
      </div>

      {/* 热门关键词 + 无结果关键词（并排） */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <KeywordListCard
          title="热门关键词（7 天）"
          subtitle="用户搜得最多的词"
          items={topKeywords}
          emptyText="暂无数据"
          valueColor="text-brand-600"
        />
        <KeywordListCard
          title="无结果关键词（7 天）"
          subtitle="用户搜不到东西 = 内容缺口 / SEO 漏点"
          items={noResultKeywords}
          emptyText="太好了，没有无结果搜索"
          valueColor="text-amber-600"
          highlightNoResult
        />
      </div>

      {/* 最近 30 条搜索 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-slate-600" />
          <h2 className="text-base font-bold text-slate-900">最近 30 条搜索</h2>
        </div>
        {recent.length === 0 ? (
          <EmptyHint text="还没有任何搜索记录" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">关键词</th>
                  <th className="py-2 pr-4 font-medium">Tab</th>
                  <th className="py-2 pr-4 font-medium">结果数</th>
                  <th className="py-2 pr-4 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 pr-4">
                      <span className={r.noResult ? 'text-amber-700 font-medium' : 'text-slate-900'}>
                        {r.keyword}
                      </span>
                      {r.noResult && (
                        <span className="ml-2 text-xs text-amber-600">无结果</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${TAB_COLORS[r.tab] || TAB_COLORS.all}`}>
                        {TAB_LABELS[r.tab] || r.tab}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{r.resultCount}</td>
                    <td className="py-2 pr-4 text-slate-500 text-xs">
                      {formatRelativeTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 子组件 ============

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${accent} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{value.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data, maxTotal }: { data: Array<{ day: Date; total: number; noResult: number }>; maxTotal: number }) {
  const W = 800;
  const H = 200;
  const padding = { top: 20, right: 16, bottom: 32, left: 32 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const barW = Math.max(8, chartW / data.length - 4);
  const gap = (chartW - barW * data.length) / Math.max(1, data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Y 轴基线 + 横向网格 */}
      <line
        x1={padding.left}
        y1={padding.top + chartH}
        x2={padding.left + chartW}
        y2={padding.top + chartH}
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      <text x={padding.left - 6} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
        {maxTotal}
      </text>
      <text x={padding.left - 6} y={padding.top + chartH} textAnchor="end" fontSize="10" fill="#94a3b8">
        0
      </text>

      {/* 柱状图 */}
      {data.map((d, i) => {
        const totalH = (d.total / maxTotal) * chartH;
        const noResH = (d.noResult / maxTotal) * chartH;
        const x = padding.left + i * (barW + gap);
        const totalY = padding.top + chartH - totalH;
        const noResY = padding.top + chartH - noResH;
        const dateLabel = d.day.toISOString().slice(5, 10); // MM-DD
        return (
          <g key={d.day.toISOString()}>
            {/* 总搜索柱（brand 色） */}
            <rect
              x={x}
              y={totalY}
              width={barW}
              height={totalH}
              rx="2"
              fill="#0ea5e9"
              opacity="0.85"
            >
              <title>{`${dateLabel} · ${d.total} 次（${d.noResult} 无结果）`}</title>
            </rect>
            {/* 无结果柱（amber 色，叠加在顶部） */}
            {d.noResult > 0 && (
              <rect
                x={x}
                y={noResY}
                width={barW}
                height={noResH}
                rx="2"
                fill="#f59e0b"
              />
            )}
            {/* X 轴日期（每隔 2 天显示） */}
            {i % 2 === 0 && (
              <text
                x={x + barW / 2}
                y={padding.top + chartH + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {dateLabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function KeywordListCard({
  title,
  subtitle,
  items,
  emptyText,
  valueColor,
  highlightNoResult,
}: {
  title: string;
  subtitle: string;
  items: Array<{ keyword: string; count: number }>;
  emptyText: string;
  valueColor: string;
  highlightNoResult?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500 mt-1 mb-4">{subtitle}</p>
      {items.length === 0 ? (
        <EmptyHint text={emptyText} />
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li
              key={item.keyword}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`text-xs tabular-nums w-6 text-right ${i < 3 ? 'text-brand-600 font-bold' : 'text-slate-400'}`}>
                  {i + 1}
                </span>
                <a
                  href={`/search?q=${encodeURIComponent(item.keyword)}`}
                  target="_blank"
                  rel="noopener"
                  className={`text-sm truncate hover:underline ${highlightNoResult ? 'text-amber-700' : 'text-slate-900'}`}
                  title={item.keyword}
                >
                  {item.keyword}
                </a>
              </div>
              <span className={`text-sm font-medium tabular-nums ${valueColor}`}>
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-lg">
      {text}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return date.toISOString().slice(0, 10);
}
