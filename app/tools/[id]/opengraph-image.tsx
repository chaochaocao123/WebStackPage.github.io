import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db';

// nodejs runtime：Prisma ORM 不支持 edge runtime
export const runtime = 'nodejs';
export const alt = '跨境工具说工具详情';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ToolOpengraphImage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return new ImageResponse(<DefaultOG title="工具不存在" />, size);
  }

  const tool = await prisma.tool.findUnique({
    where: { id },
    select: { name: true, business: true, categoryKey: true, discount: true },
  });
  if (!tool) {
    return new ImageResponse(<DefaultOG title="工具不存在" />, size);
  }

  const hasDiscount = !!tool.discount;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
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
            <div style={{ fontSize: 18, color: '#cbd5e1', marginTop: 2 }}>kjgjs.cn · 跨境电商卖家导航</div>
          </div>
        </div>

        {/* 工具分类标签 + 优惠标签 */}
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
              background: 'rgba(249, 115, 22, 0.2)',
              border: '1.5px solid #f97316',
              borderRadius: 8,
              fontSize: 22,
              fontWeight: 600,
              color: '#fdba74',
            }}
          >
            工具
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {tool.categoryKey}
          </div>
          {hasDiscount && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                borderRadius: 8,
                fontSize: 22,
                fontWeight: 700,
                color: 'white',
              }}
            >
              🎁 专属优惠
            </div>
          )}
        </div>

        {/* 工具名称（核心） */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.2,
            marginTop: 24,
            color: 'white',
            maxHeight: 160,
            overflow: 'hidden',
          }}
        >
          {tool.name}
        </div>

        {/* 业务描述 */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            lineHeight: 1.4,
            marginTop: 24,
            color: '#cbd5e1',
            maxHeight: 90,
            overflow: 'hidden',
          }}
        >
          {tool.business}
        </div>

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
            color: '#94a3b8',
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '80px 70px',
        fontFamily: '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        color: 'white',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#f97316' }}>跨境工具说</div>
      <div style={{ display: 'flex', fontSize: 32, color: '#cbd5e1', marginTop: 24 }}>{title}</div>
    </div>
  );
}
