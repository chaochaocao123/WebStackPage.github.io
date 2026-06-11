// 优化6：页面访问埋点 API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    // 记录页面访问
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

// 获取统计数据的 API（供内部使用）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date'); // 格式: YYYY-MM-DD

    if (!date) {
      return NextResponse.json(
        { error: '缺少 date 参数' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(`${date}T00:00:00+08:00`);
    const endOfDay = new Date(`${date}T23:59:59+08:00`);

    // 获取当天所有记录
    const records = await prisma.pageView.findMany({
      where: {
        enteredAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { enteredAt: 'asc' },
    });

    // 计算 UV（去重 sessionId）
    const uniqueSessions = new Set(records.map(r => r.sessionId));
    const uv = uniqueSessions.size;
    const pv = records.length;

    // 按页面统计
    const pathStats = new Map<string, { pv: number; totalDuration: number; count: number }>();
    for (const record of records) {
      const existing = pathStats.get(record.path) || { pv: 0, totalDuration: 0, count: 0 };
      existing.pv++;
      if (record.duration) {
        existing.totalDuration += record.duration;
        existing.count++;
      }
      pathStats.set(record.path, existing);
    }

    const pageStats = Array.from(pathStats.entries())
      .map(([path, stats]) => ({
        path,
        pv: stats.pv,
        avgDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
      }))
      .sort((a, b) => b.pv - a.pv);

    return NextResponse.json({
      date,
      uv,
      pv,
      pageStats,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
