// Vercel Cron: 抓取行业资讯
// 触发：每天北京时间 9:00 和 18:00（UTC 1:00 和 10:00）
// 安全：用 Vercel 的 CRON_SECRET 验证请求

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s 超时

export async function GET(request: NextRequest) {
  // 验证 Vercel Cron 密钥
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'crawl-news.ts');
    const { stdout, stderr } = await execAsync(
      `npx tsx "${scriptPath}"`,
      { timeout: 55000, cwd: process.cwd() }
    );

    return NextResponse.json({
      success: true,
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-1000),
    });
  } catch (err: any) {
    console.error('crawl-news 失败:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        stdout: err.stdout?.slice(-1000),
        stderr: err.stderr?.slice(-1000),
      },
      { status: 500 }
    );
  }
}

// 也支持 POST（手动触发用）
export async function POST(request: NextRequest) {
  return GET(request);
}
