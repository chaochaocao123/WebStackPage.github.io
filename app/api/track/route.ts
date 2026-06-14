// v11.10 优化6：页面访问埋点 API
// v11.27 扩展：GET 支持 ?range=today|7d|30d，返回完整统计（PV/UV/Top 页面/Top 来源/时段分布/设备分布/趋势）
import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyStats,
  getHourlyDistribution,
  getDeviceDistribution,
  getDailyTrend,
  beijingDateStr,
} from '@/lib/data/page-view';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, path, referrer, userAgent, enteredAt, leftAt, duration } = body;

    // 验证必要参数
    if (!sessionId || !path) {
      return NextResponse.json(
        { error: '缺少必要参数 sessionId 或 path' },
        { status: 400 }
      );
    }

    // 动态导入 prisma（POST 路径避免冷启动拉起分析代码）
    const { prisma } = await import('@/lib/db');
    await prisma.pageView.create({
      data: {
        sessionId: String(sessionId),
        path: String(path),
        referrer: referrer ? String(referrer) : null,
        userAgent: userAgent ? String(userAgent) : null,
        enteredAt: enteredAt ? new Date(enteredAt) : new Date(),
        leftAt: leftAt ? new Date(leftAt) : null,
        duration: duration ? parseInt(duration, 10) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('埋点记录失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// v11.27 GET：支持单日查询 ?date=YYYY-MM-DD 或范围聚合 ?range=today|7d|30d
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const date = sp.get('date');
    const range = sp.get('range') as 'today' | '7d' | '30d' | null;

    // 模式 1：单日查询（兼容旧调用）
    if (date) {
      const daily = await getDailyStats(date);
      const hourly = await getHourlyDistribution(date);
      const devices = await getDeviceDistribution(date);
      return NextResponse.json({
        mode: 'daily',
        ...daily,
        hourly,
        devices,
      });
    }

    // 模式 2：范围聚合
    if (range && ['today', '7d', '30d'].includes(range)) {
      const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
      if (days === 1) {
        const today = await getDailyStats(beijingDateStr());
        const hourly = await getHourlyDistribution(beijingDateStr());
        const devices = await getDeviceDistribution(beijingDateStr());
        return NextResponse.json({
          mode: 'range',
          range,
          date: today.date,
          uv: today.uv,
          pv: today.pv,
          avgDuration: today.avgDuration,
          pageStats: today.pageStats,
          referrers: today.referrers,
          hourly,
          devices,
        });
      }
      const trend = await getDailyTrend(days);
      const totalPv = trend.reduce((s, d) => s + d.pv, 0);
      const totalUv = trend.reduce((s, d) => s + d.uv, 0);
      return NextResponse.json({
        mode: 'range',
        range,
        days,
        totalPv,
        totalUv,
        trend,
      });
    }

    return NextResponse.json(
      { error: '缺少必要参数 date (YYYY-MM-DD) 或 range (today|7d|30d)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
