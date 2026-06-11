// 优化6：每日统计数据邮件报告 Cron Job
// Vercel Cron 会每天 20:00 触发
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Vercel Cron 配置：每天 20:00 (UTC+8) 执行
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby 最大 10s，这里用 maxDuration 允许更长

// Resend API 发送邮件
async function sendDailyReport(
  date: string,
  uv: number,
  pv: number,
  pageStats: { path: string; pv: number; avgDuration: number }[]
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('[Cron] RESEND_API_KEY 未设置，跳过邮件发送');
    return { success: false, error: 'RESEND_API_KEY 未设置' };
  }

  // 生成 HTML 邮件内容
  const topPages = pageStats.slice(0, 10);
  const pageRows = topPages
    .map(
      (p, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${i + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${p.path}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${p.pv}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${formatDuration(p.avgDuration)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af; margin-bottom: 20px;">📊 跨境工具说 - ${date} 数据报告</h2>
      
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; background: #eff6ff; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${uv}</div>
          <div style="color: #64748b; font-size: 14px;">独立访客 (UV)</div>
        </div>
        <div style="flex: 1; background: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${pv}</div>
          <div style="color: #64748b; font-size: 14px;">页面浏览 (PV)</div>
        </div>
        <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #16a34a;">${pv > 0 ? (pv / uv).toFixed(1) : 0}</div>
          <div style="color: #64748b; font-size: 14px;">人均浏览</div>
        </div>
      </div>

      <h3 style="color: #374151; margin-bottom: 12px;">📄 页面排行 (Top 10)</h3>
      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px 12px; text-align: left; color: #64748b; font-weight: 500;">#</th>
            <th style="padding: 10px 12px; text-align: left; color: #64748b; font-weight: 500;">页面</th>
            <th style="padding: 10px 12px; text-align: center; color: #64748b; font-weight: 500;">PV</th>
            <th style="padding: 10px 12px; text-align: center; color: #64748b; font-weight: 500;">平均停留</th>
          </tr>
        </thead>
        <tbody>
          ${pageRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #999;">暂无数据</td></tr>'}
        </tbody>
      </table>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">
        本报告由 跨境工具说 自动生成 · kjgjs.cn
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '跨境工具说 <noreply@kjgjs.cn>',
        to: ['1324723217@qq.com'],
        subject: `📊 跨境工具说 - ${date} 数据报告 (UV:${uv} PV:${pv})`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Cron] 邮件发送失败:', error);
      return { success: false, error: `API 错误: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('[Cron] 邮件发送异常:', error);
    return { success: false, error: String(error) };
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}

export async function GET() {
  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  
  const startOfDay = new Date(`${dateStr}T00:00:00+08:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59+08:00`);

  try {
    // 获取昨天所有访问记录
    const records = await prisma.pageView.findMany({
      where: {
        enteredAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { enteredAt: 'asc' },
    });

    // 计算 UV 和 PV
    const uniqueSessions = new Set(records.map((r) => r.sessionId));
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

    // 发送邮件
    const emailResult = await sendDailyReport(dateStr, uv, pv, pageStats);

    if (emailResult.success) {
      console.log(`[Cron] ${dateStr} 数据报告已发送: UV=${uv}, PV=${pv}`);
    } else {
      console.warn(`[Cron] 邮件发送失败: ${emailResult.error}`);
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      uv,
      pv,
      pageStatsCount: pageStats.length,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });
  } catch (error) {
    console.error('[Cron] 生成报告失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
