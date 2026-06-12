import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db';

export const runtime = 'edge';
export const alt = '跨境工具说资讯';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SOURCE_LABEL: Record<string, string> = {
  manual: '跨境工具说',
  mjzj: '卖家之家',
  cifnews: '雨果网',
};

/** 从 HTML content 提取纯文本前 N 字（用于 OG 描述） */
function extractText(html: string, maxLen = 80): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/[，。！？、：；]?\s*$/, '') + '…';
}

export default async function NewsOpengraphImage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return new ImageResponse(<DefaultOG title="资讯不存在" />, size);
  }

  const item = await prisma.news.findUnique({ where: { id } });
  if (!item) {
    return new ImageResponse(<DefaultOG title="资讯不存在" />, size);
  }

  const sourceLabel = SOURCE_LABEL[item.source] || item.source || '跨境工具说';
  const desc = (item.summary && item.summary.trim()) || extractText(item.content || '', 80);

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

        {/* 资讯分类标签 */}
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
            行业资讯
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            来源 · {sourceLabel}
          </div>
        </div>

        {/* 标题（核心内容） */}
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.25,
            marginTop: 24,
            color: 'white',
            maxHeight: 280,
            overflow: 'hidden',
          }}
        >
          {item.title}
        </div>

        {/* 描述 */}
        {desc && (
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              lineHeight: 1.5,
              marginTop: 32,
              color: '#cbd5e1',
              maxHeight: 90,
              overflow: 'hidden',
            }}
          >
            {desc}
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
