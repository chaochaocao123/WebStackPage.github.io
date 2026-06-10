import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '跨境工具说 - 跨境电商卖家工具导航与资讯平台',
  description: '为亚马逊、TikTok、Temu、Shopee 等平台跨境卖家精选的工具导航、热门资讯、优惠活动，公众号同名「跨境工具说」',
  keywords: '跨境电商,亚马逊工具,TikTok工具,Temu选品,Shopee运营,跨境卖家工具导航,卖家精灵,Helium10',
  authors: [{ name: '跨境工具说' }],
  openGraph: {
    title: '跨境工具说 - 跨境卖家工具导航',
    description: '为跨境卖家精选的工具导航、热门资讯、优惠活动',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
