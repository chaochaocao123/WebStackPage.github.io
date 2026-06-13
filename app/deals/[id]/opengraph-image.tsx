import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db';

// nodejs runtime：Prisma ORM 不支持 edge runtime
export const runtime = 'nodejs';
export const alt = '跨境工具说优惠活动';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** 计算优惠状态 */
function getDealStatus(endDate: Date | null | undefined): {
  expired: boolean;
  limitedTime: boolean;
  daysLeft: number | null;
} {
  if (!endDate) return { expired: false, limitedTime: false, daysLeft: null };
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return {
    expired: daysLeft < 0,
    limitedTime: daysLeft >= 0 && daysLeft <= 7,
    daysLeft,
  };
}

export default async function DealOpengraphImage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return new ImageResponse(<DefaultOG title="优惠不存在" />, size);
  }

  const deal = await prisma.deal.findUnique({
    where: { id },
    select: { title: true, brand: true, category: true, discount: true, endDate: true },
  });
  if (!deal) {
    return new ImageResponse(<DefaultOG title="优惠不存在" />, size);
  }

  const status = getDealStatus(deal.endDate);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)',
          padding: '60px 70px',
          fontFamily: '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* 顶部品牌条 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              fontSize: 28,
              fontWeight: 800,
              color: 'white',
            }}
          >
            跨
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>跨境工具说</div>
            <div style={{ fontSize: 18, color: '#fed7aa', marginTop: 2 }}>kjgjs.cn · 跨境电商卖家导航</div>
          </div>
        </div>

        {/* 状态徽章 + Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 50,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1.5px solid #fed7aa',
              borderRadius: 8,
              fontSize: 22,
              fontWeight: 600,
              color: '#ffedd5',
            }}
          >
            🎁 优惠活动
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#fed7aa',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {deal.brand}
          </div>
          {status.limitedTime && status.daysLeft !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                borderRadius: 8,
                fontSize: 22,
                fontWeight: 700,
                color: 'white',
              }}
            >
              ⏰ 剩 {status.daysLeft} 天
            </div>
          )}
        </div>

        {/* 标题（核心） */}
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.2,
            marginTop: 24,
            color: 'white',
            maxHeight: 160,
            overflow: 'hidden',
          }}
        >
          {deal.title}
        </div>

        {/* Discount 突出显示 */}
        {deal.discount && (
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.3,
              marginTop: 24,
              color: '#fef3c7',
              maxHeight: 90,
              overflow: 'hidden',
            }}
          >
            {deal.discount}
          </div>
        )}

        {/* 底部品牌域名 */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: 70,
            right: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: '#fed7aa',
          }}
        >
          <div style={{ display: 'flex' }}>kjgjs.cn</div>
          <div style={{ display: 'flex' }}>亚马逊 · TikTok · 跨境电商</div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function DefaultOG({ title }: { title: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
        padding: '80px 70px',
        fontFamily: '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        color: 'white',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#fed7aa' }}>跨境工具说</div>
      <div style={{ display: 'flex', fontSize: 32, color: '#ffedd5', marginTop: 24 }}>{title}</div>
    </div>
  );
}
