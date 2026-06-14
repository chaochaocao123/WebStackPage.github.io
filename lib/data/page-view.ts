// v11.27 访问分析数据访问层
// 用途：给 /admin/analytics 看板 + /api/track GET 接口提供聚合查询
// 数据源：prisma.pageView（v11.10 前后落地的自建埋点系统）
// 时区约定：所有"日"按北京时区 (UTC+8) 切分

import { prisma } from '@/lib/db';

// 北京时区 YYYY-MM-DD 字符串
export function beijingDateStr(d: Date = new Date()): string {
  // 转到北京时区后取 YYYY-MM-DD
  const beijingMs = d.getTime() + 8 * 3600 * 1000;
  const bj = new Date(beijingMs);
  return bj.toISOString().slice(0, 10);
}

// 北京某一天 0 点 / 23:59:59 的 UTC Date
function beijingDayBounds(dateStr: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateStr}T00:00:00+08:00`),
    end: new Date(`${dateStr}T23:59:59.999+08:00`),
  };
}

/** 单日全量统计：UV / PV / 平均停留 / Top 页面 / Top 来源 */
export async function getDailyStats(dateStr: string) {
  const { start, end } = beijingDayBounds(dateStr);
  const records = await prisma.pageView.findMany({
    where: { enteredAt: { gte: start, lte: end } },
  });

  // UV = 独立 sessionId 数
  const uv = new Set(records.map((r) => r.sessionId)).size;
  // PV = 记录条数
  const pv = records.length;
  // 平均停留（仅含 duration 字段的记录）
  const withDur = records.filter((r) => r.duration != null);
  const avgDuration = withDur.length
    ? Math.round(withDur.reduce((s, r) => s + (r.duration || 0), 0) / withDur.length)
    : 0;

  // Top 页面
  const pathMap = new Map<string, { pv: number; totalDur: number; durCount: number }>();
  for (const r of records) {
    const e = pathMap.get(r.path) || { pv: 0, totalDur: 0, durCount: 0 };
    e.pv++;
    if (r.duration) {
      e.totalDur += r.duration;
      e.durCount++;
    }
    pathMap.set(r.path, e);
  }
  const pageStats = Array.from(pathMap.entries())
    .map(([path, s]) => ({
      path,
      pv: s.pv,
      avgDuration: s.durCount > 0 ? Math.round(s.totalDur / s.durCount) : 0,
    }))
    .sort((a, b) => b.pv - a.pv);

  // Top 来源（按 host 聚合，过滤掉 kjgjs.cn 自身）
  const refMap = new Map<string, number>();
  for (const r of records) {
    if (!r.referrer) continue;
    try {
      const host = new URL(r.referrer).host;
      if (host === 'kjgjs.cn' || host === 'www.kjgjs.cn') continue; // 自身
      refMap.set(host, (refMap.get(host) || 0) + 1);
    } catch {
      // 无效 URL 跳过
    }
  }
  const referrers = Array.from(refMap.entries())
    .map(([host, count]) => ({ host, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { date: dateStr, uv, pv, avgDuration, pageStats, referrers };
}

/** 24 小时时段分布（指定北京日） */
export async function getHourlyDistribution(dateStr: string) {
  const { start, end } = beijingDayBounds(dateStr);
  const records = await prisma.pageView.findMany({
    where: { enteredAt: { gte: start, lte: end } },
    select: { enteredAt: true },
  });
  const hours = new Array(24).fill(0);
  for (const r of records) {
    // UTC hour + 8 = 北京 hour（24 取模）
    const bjHour = (r.enteredAt.getUTCHours() + 8) % 24;
    hours[bjHour]++;
  }
  return hours.map((pv, hour) => ({ hour, pv }));
}

/** 设备分布（UA 粗略分类） */
export async function getDeviceDistribution(dateStr: string) {
  const { start, end } = beijingDayBounds(dateStr);
  const records = await prisma.pageView.findMany({
    where: { enteredAt: { gte: start, lte: end } },
    select: { userAgent: true },
  });
  let mobile = 0;
  let tablet = 0;
  let desktop = 0;
  let bot = 0;
  for (const r of records) {
    const ua = (r.userAgent || '').toLowerCase();
    if (/bot|spider|crawl|slurp|bingpreview|facebookexternalhit|baiduspider|googlebot|bingbot|yandex/.test(ua)) {
      bot++;
    } else if (/ipad|tablet|playbook|silk/.test(ua)) {
      tablet++;
    } else if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) {
      mobile++;
    } else {
      desktop++;
    }
  }
  return { mobile, tablet, desktop, bot, total: records.length };
}

/** 最近 N 天每日趋势（按北京日） */
export async function getDailyTrend(days: number) {
  // 截止 = 今天北京 23:59:59.999
  const todayStr = beijingDateStr();
  const { end } = beijingDayBounds(todayStr);
  // 起点 = N-1 天前北京 0 点
  const startDate = new Date(`${todayStr}T00:00:00+08:00`);
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = beijingDateStr(startDate);
  const { start } = beijingDayBounds(startStr);

  const records = await prisma.pageView.findMany({
    where: { enteredAt: { gte: start, lte: end } },
    select: { sessionId: true, enteredAt: true },
  });

  // 按北京日聚合（每天 pv + 独立 session 数）
  const dayMap = new Map<string, { pv: number; sessions: Set<string> }>();
  // 预填所有日期（保证连续无空缺）
  for (let i = 0; i < days; i++) {
    const d = new Date(`${startStr}T00:00:00+08:00`);
    d.setDate(d.getDate() + i);
    const key = beijingDateStr(d);
    dayMap.set(key, { pv: 0, sessions: new Set() });
  }
  for (const r of records) {
    const key = beijingDateStr(r.enteredAt);
    const e = dayMap.get(key);
    if (e) {
      e.pv++;
      e.sessions.add(r.sessionId);
    }
  }
  return Array.from(dayMap.entries()).map(([day, s]) => ({
    day,
    pv: s.pv,
    uv: s.sessions.size,
  }));
}

/** 快速获取今日 + 7 日汇总（admin 首页用） */
export async function getOverviewStats() {
  const today = await getDailyStats(beijingDateStr());
  const trend7 = await getDailyTrend(7);
  const sumPv7 = trend7.reduce((s, d) => s + d.pv, 0);
  // UV 跨天会有重复 session（sessionStorage 持久），这里 sum 是粗略值，admin 页面接受
  const sumUv7 = trend7.reduce((s, d) => s + d.uv, 0);
  return {
    todayPv: today.pv,
    todayUv: today.uv,
    pv7d: sumPv7,
    uv7d: sumUv7,
    trend7,
  };
}
