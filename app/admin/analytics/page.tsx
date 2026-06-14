// v11.27 访问分析看板 — 给曹总看 PV/UV/Top 页面/Top 来源/时段高峰/设备分布
// 数据源：prisma.pageView（v11.10 前后落地的自建埋点系统）
// 时区约定：所有"日"按北京时区 (UTC+8) 切分
// 设计：默认看"今天"，可改日期查历史；7 日宏观趋势 + 24 小时微观分布

import { prisma } from '@/lib/db';
import {
  getDailyStats,
  getHourlyDistribution,
  getDeviceDistribution,
  getDailyTrend,
  beijingDateStr,
} from '@/lib/data/page-view';
import {
  Eye,
  Users,
  TrendingUp,
  Clock,
  Smartphone,
  Tablet,
  Monitor,
  Bot,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 兜底建表：prisma 找不到 PageView 时跑 DDL。
 * （v11.10 优化6 落地时应该已经自动建表，但保险起见保留）
 */
async function ensurePageViewTable() {
  try {
    await prisma.pageView.count();
  } catch (err: any) {
    const code = err?.code;
    if (code === 'P2021' || code === 'P2010' || /does not exist/i.test(err?.message || '')) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "PageView" (
            "id" SERIAL NOT NULL,
            "sessionId" TEXT NOT NULL,
            "path" TEXT NOT NULL,
            "referrer" TEXT,
            "userAgent" TEXT,
            "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "leftAt" TIMESTAMP(3),
            "duration" INTEGER,
            CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
          )
        `);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_sessionId_idx" ON "PageView"("sessionId")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_path_idx" ON "PageView"("path")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_enteredAt_idx" ON "PageView"("enteredAt")`);
        console.log('[analytics] PageView table created');
      } catch (createErr) {
        console.error('[analytics] failed to create table:', createErr);
      }
    }
  }
}

interface AnalyticsPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await ensurePageViewTable();
  const sp = await searchParams;
  const dateStr = sp.date || beijingDateStr();

  // 5 个数据源并行查
  const [daily, hourly, devices, trend7, trend30, todayStr] = await Promise.all([
    getDailyStats(dateStr),
    getHourlyDistribution(dateStr),
    getDeviceDistribution(dateStr),
    getDailyTrend(7),
    getDailyTrend(30),
    Promise.resolve(beijingDateStr()),
  ]);

  // 7 日汇总
  const pv7d = trend7.reduce((s, d) => s + d.pv, 0);
  const uv7d = trend7.reduce((s, d) => s + d.uv, 0);

  // 趋势图参考值
  const maxPv7 = Math.max(1, ...trend7.map((d) => d.pv));
  const maxUv7 = Math.max(1, ...trend7.map((d) => d.uv));
  const maxPv30 = Math.max(1, ...trend30.map((d) => d.pv));
  const maxHourPv = Math.max(1, ...hourly.map((h) => h.pv));

  return (
    <div>
      {/* 标题 + 日期选择 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">访问分析</h1>
          <p className="text-sm text-slate-500 mt-1">
            曹总看 PV/UV / Top 页面 / Top 来源 / 用户访问高峰时段 / 设备分布
          </p>
        </div>
        <DateSwitcher currentDate={dateStr} todayStr={todayStr} />
      </div>

      {/* 4 个统计卡：今日 PV / 今日 UV / 7 日 PV / 7 日 UV */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Eye}
          label={`${dateStr === todayStr ? '今日' : dateStr} PV`}
          value={daily.pv}
          accent="bg-brand-500"
        />
        <StatCard
          icon={Users}
          label={`${dateStr === todayStr ? '今日' : dateStr} UV`}
          value={daily.uv}
          accent="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="7 日 PV"
          value={pv7d}
          accent="bg-emerald-500"
        />
        <StatCard
          icon={Users}
          label="7 日 UV（粗略）"
          value={uv7d}
          accent="bg-purple-500"
        />
      </div>

      {/* 7 日趋势 + 30 日趋势（并排） */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <TrendCard
          title="7 日趋势"
          subtitle="蓝色 PV / 紫色 UV 叠加柱状"
          data={trend7}
          maxPv={maxPv7}
          maxUv={maxUv7}
        />
        <TrendCard
          title="30 日趋势"
          subtitle="看长期走势，定位内容运营节奏"
          data={trend30}
          maxPv={maxPv30}
          maxUv={Math.max(1, ...trend30.map((d) => d.uv))}
        />
      </div>

      {/* 24 小时时段分布 + 设备分布（并排） */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">24 小时时段分布</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">帮曹总找用户访问高峰 — 知道几点发文章最有效</p>
          {daily.pv === 0 ? (
            <EmptyHint text="该日无访问数据" />
          ) : (
            <HourlyChart data={hourly} maxPv={maxHourPv} />
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">设备分布</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">判断用户主用设备 — 决定内容排版/广告位策略</p>
          {devices.total === 0 ? (
            <EmptyHint text="该日无设备数据" />
          ) : (
            <DeviceBars devices={devices} />
          )}
        </div>
      </div>

      {/* Top 10 页面 + Top 10 来源（并排） */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-bold text-slate-900">Top 10 页面（按 PV）</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">哪些页面被访问最多 — 内容优化方向</p>
          {daily.pageStats.length === 0 ? (
            <EmptyHint text="该日无页面访问数据" />
          ) : (
            <PageStatsTable pageStats={daily.pageStats.slice(0, 10)} />
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-bold text-slate-900">Top 10 来源（按 PV）</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">用户从哪些网站来 — 知道哪条外链有效</p>
          {daily.referrers.length === 0 ? (
            <EmptyHint text="该日无外站来源（全部直接访问 / 站内跳转）" />
          ) : (
            <ReferrerList items={daily.referrers} />
          )}
        </div>
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

function DateSwitcher({ currentDate, todayStr }: { currentDate: string; todayStr: string }) {
  // 简单上一页/今天/下一页切换（按天）
  const d = new Date(`${currentDate}T00:00:00+08:00`);
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  const prevStr = prev.toISOString().slice(0, 10);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  const nextStr = next.toISOString().slice(0, 10);
  const isToday = currentDate === todayStr;
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
      <Link
        href={`/admin/analytics?date=${prevStr}`}
        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition"
        title="前一天"
      >
        ← 前一天
      </Link>
      <div className="px-3 py-1.5 text-xs font-medium text-slate-900 flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        {currentDate}
      </div>
      {isToday ? (
        <span className="px-3 py-1.5 text-xs text-slate-400">今天 →</span>
      ) : (
        <Link
          href={`/admin/analytics?date=${nextStr}`}
          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition"
          title="后一天"
        >
          后一天 →
        </Link>
      )}
    </div>
  );
}

function TrendCard({
  title,
  subtitle,
  data,
  maxPv,
  maxUv,
}: {
  title: string;
  subtitle: string;
  data: Array<{ day: string; pv: number; uv: number }>;
  maxPv: number;
  maxUv: number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-5 h-5 text-brand-600" />
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>
      {data.every((d) => d.pv === 0) ? (
        <EmptyHint text="还没有访问数据 — 部署后用户访问会出图" />
      ) : (
        <TrendChart data={data} maxPv={maxPv} maxUv={maxUv} />
      )}
    </div>
  );
}

function TrendChart({
  data,
  maxPv,
  maxUv,
}: {
  data: Array<{ day: string; pv: number; uv: number }>;
  maxPv: number;
  maxUv: number;
}) {
  const W = 600;
  const H = 180;
  const padding = { top: 16, right: 12, bottom: 32, left: 32 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const groupW = chartW / data.length;
  const barW = Math.max(8, groupW * 0.6);
  const barGap = groupW - barW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Y 轴基线 + 网格 */}
      <line
        x1={padding.left}
        y1={padding.top + chartH}
        x2={padding.left + chartW}
        y2={padding.top + chartH}
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      <text x={padding.left - 6} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
        {maxPv}
      </text>
      <text x={padding.left - 6} y={padding.top + chartH} textAnchor="end" fontSize="10" fill="#94a3b8">
        0
      </text>

      {/* 图例 */}
      <g>
        <rect x={padding.left + chartW - 80} y={4} width="10" height="10" fill="#0ea5e9" rx="1" />
        <text x={padding.left + chartW - 66} y="13" fontSize="10" fill="#64748b">PV</text>
        <rect x={padding.left + chartW - 44} y={4} width="10" height="10" fill="#a855f7" rx="1" />
        <text x={padding.left + chartW - 30} y="13" fontSize="10" fill="#64748b">UV</text>
      </g>

      {data.map((d, i) => {
        const pvH = (d.pv / maxPv) * chartH;
        const uvH = (d.uv / maxUv) * chartH;
        const x = padding.left + i * groupW + barGap / 2;
        const pvY = padding.top + chartH - pvH;
        const uvY = padding.top + chartH - uvH;
        const dateLabel = d.day.slice(5); // MM-DD
        // X 轴标签间隔：≤7 天全显示；>7 天每隔 3 天
        const showLabel = data.length <= 7 || i % 3 === 0 || i === data.length - 1;
        return (
          <g key={d.day}>
            <rect
              x={x}
              y={pvY}
              width={barW / 2 - 1}
              height={pvH}
              rx="1"
              fill="#0ea5e9"
              opacity="0.9"
            >
              <title>{`${d.day} · PV ${d.pv} / UV ${d.uv}`}</title>
            </rect>
            <rect
              x={x + barW / 2 + 1}
              y={uvY}
              width={barW / 2 - 1}
              height={uvH}
              rx="1"
              fill="#a855f7"
              opacity="0.9"
            >
              <title>{`${d.day} · UV ${d.uv}`}</title>
            </rect>
            {showLabel && (
              <text
                x={x + barW / 2}
                y={padding.top + chartH + 14}
                textAnchor="middle"
                fontSize="9"
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

function HourlyChart({ data, maxPv }: { data: Array<{ hour: number; pv: number }>; maxPv: number }) {
  const W = 600;
  const H = 160;
  const padding = { top: 16, right: 12, bottom: 32, left: 32 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const barW = (chartW / 24) * 0.7;
  const barGap = (chartW / 24) - barW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <line
        x1={padding.left}
        y1={padding.top + chartH}
        x2={padding.left + chartW}
        y2={padding.top + chartH}
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      <text x={padding.left - 6} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
        {maxPv}
      </text>
      <text x={padding.left - 6} y={padding.top + chartH} textAnchor="end" fontSize="10" fill="#94a3b8">
        0
      </text>

      {data.map((d, i) => {
        const h = (d.pv / maxPv) * chartH;
        const x = padding.left + i * (barW + barGap) + barGap / 2;
        const y = padding.top + chartH - h;
        const showLabel = i % 3 === 0; // 每 3 小时一个标签
        return (
          <g key={d.hour}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="1"
              fill="#0ea5e9"
              opacity={d.pv === 0 ? 0.3 : 0.85}
            >
              <title>{`${d.hour}:00 · ${d.pv} PV`}</title>
            </rect>
            {showLabel && (
              <text
                x={x + barW / 2}
                y={padding.top + chartH + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {d.hour}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DeviceBars({
  devices,
}: {
  devices: { mobile: number; tablet: number; desktop: number; bot: number; total: number };
}) {
  const items = [
    { key: 'mobile', label: '手机', count: devices.mobile, icon: Smartphone, color: 'bg-brand-500' },
    { key: 'tablet', label: '平板', count: devices.tablet, icon: Tablet, color: 'bg-blue-500' },
    { key: 'desktop', label: '桌面', count: devices.desktop, icon: Monitor, color: 'bg-emerald-500' },
    { key: 'bot', label: '爬虫', count: devices.bot, icon: Bot, color: 'bg-slate-400' },
  ];
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        const pct = (item.count / max) * 100;
        const totalPct = devices.total > 0 ? ((item.count / devices.total) * 100).toFixed(1) : '0.0';
        return (
          <div key={item.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 text-slate-700">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium tabular-nums">{item.count}</span>
                <span className="text-xs text-slate-400 tabular-nums">({totalPct}%)</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PageStatsTable({ pageStats }: { pageStats: Array<{ path: string; pv: number; avgDuration: number }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-2 font-medium w-8">#</th>
            <th className="py-2 pr-4 font-medium">路径</th>
            <th className="py-2 pr-2 font-medium text-right">PV</th>
            <th className="py-2 pl-2 font-medium text-right">停留(秒)</th>
          </tr>
        </thead>
        <tbody>
          {pageStats.map((p, i) => (
            <tr key={p.path} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 pr-2 text-xs tabular-nums text-slate-400">{i + 1}</td>
              <td className="py-2 pr-4">
                <Link
                  href={p.path.startsWith('http') ? p.path : `https://kjgjs.cn${p.path}`}
                  target="_blank"
                  rel="noopener"
                  className="text-slate-900 hover:text-brand-600 hover:underline truncate block max-w-md"
                  title={p.path}
                >
                  {p.path}
                </Link>
              </td>
              <td className="py-2 pr-2 text-right tabular-nums font-medium">{p.pv}</td>
              <td className="py-2 pl-2 text-right tabular-nums text-slate-500">
                {p.avgDuration > 0 ? p.avgDuration : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReferrerList({ items }: { items: Array<{ host: string; count: number }> }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const pct = (item.count / max) * 100;
        return (
          <li key={item.host} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`text-xs tabular-nums w-6 text-right ${i < 3 ? 'text-brand-600 font-bold' : 'text-slate-400'}`}>
                  {i + 1}
                </span>
                <a
                  href={`https://${item.host}`}
                  target="_blank"
                  rel="noopener"
                  className="text-slate-900 hover:text-brand-600 hover:underline truncate"
                  title={item.host}
                >
                  {item.host}
                </a>
              </div>
              <span className="text-sm font-medium tabular-nums text-slate-700">{item.count}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-9">
              <div className="h-full bg-brand-400" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-lg">
      {text}
    </div>
  );
}
