import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { beijingDateStr } from '@/lib/data/page-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 百度主动推送 quota 查询
 *
 * - 百度普通收录 API 配额 = 10 次/天（v11.25 实测，全局限制，明天 0 点重置）
 * - 本接口返回的是「kjgjs 自有推送日志」统计的今日已推次数
 * - 注意：v11.25 一次性 test endpoint 推过 1 次但未持久化，所以从今天起
 *   本接口的 used 计数可能比百度实际剩余多 1（边界 case）
 *
 * GET /api/baidu/quota
 * 返回：
 * {
 *   date: "2026-06-14",
 *   used: 0,            // 今日已推次数
 *   limit: 10,          // 百度全局配额
 *   remaining: 10,      // 本地统计剩余（与百度实时剩余可能有 ±1 误差）
 *   resetAt: "2026-06-15T00:00:00+08:00",  // 下次重置时间
 *   hasBaiduToken: true,  // Vercel env 是否配了 BAIDU_PUSH_TOKEN
 * }
 */
export async function GET(_req: NextRequest) {
  const today = beijingDateStr(); // YYYY-MM-DD 北京
  // 今日 0 点（北京时间）= UTC 16:00 昨天
  const startOfTodayBeijing = new Date();
  startOfTodayBeijing.setUTCHours(16, 0, 0, 0); // 北京 00:00 = UTC 16:00
  // 如果当前 UTC 时间 < 16:00，说明北京还在昨天，需要回退一天
  if (Date.now() < startOfTodayBeijing.getTime()) {
    startOfTodayBeijing.setUTCDate(startOfTodayBeijing.getUTCDate() - 1);
  }
  // 下次重置 = 明天 0 点
  const resetAt = new Date(startOfTodayBeijing.getTime() + 24 * 60 * 60 * 1000);

  const used = await prisma.baiduPushLog.count({
    where: {
      pushedAt: { gte: startOfTodayBeijing },
      success: true,  // 只算成功的（失败的没扣百度 quota）
    },
  });

  return NextResponse.json({
    date: today,
    used,
    limit: 10,
    remaining: Math.max(0, 10 - used),
    resetAt: resetAt.toISOString(),
    hasBaiduToken: !!process.env.BAIDU_PUSH_TOKEN,
  });
}
