// 强制刷新 ISR 缓存
// POST /api/admin/revalidate
// 用于后台手动刷新 API 缓存（插件数据同步）

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // 刷新所有需要缓存的路径
    revalidatePath('/api/coupon-data');
    revalidatePath('/api/mobile/tools');
    revalidatePath('/api/mobile/categories');
    
    // 刷新首页和工具列表页
    revalidatePath('/');
    revalidatePath('/tools');

    return NextResponse.json({
      success: true,
      message: '缓存已刷新',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[revalidate] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// 支持 GET 方法（方便浏览器直接访问测试）
export async function GET(request: NextRequest) {
  return POST(request);
}
