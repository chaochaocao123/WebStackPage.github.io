import type { Metadata } from 'next';
import { Analytics } from '@/components/Analytics';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kjgjs.cn'),
  title: {
    default: '跨境工具说 - 跨境电商卖家工具导航与资讯平台',
    template: '%s | 跨境工具说',
  },
  description: '为亚马逊、TikTok、Temu、Shopee 等平台跨境卖家精选的工具导航、热门资讯、优惠活动，公众号同名「跨境工具说」',
  keywords: '跨境电商,亚马逊工具,TikTok工具,Temu选品,Shopee运营,跨境卖家工具导航,卖家精灵,Helium10',
  authors: [{ name: '跨境工具说', url: 'https://kjgjs.cn' }],
  creator: '跨境工具说',
  publisher: '跨境工具说',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://kjgjs.cn',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn',
    siteName: '跨境工具说',
    title: '跨境工具说 - 跨境卖家工具导航',
    description: '为跨境卖家精选的工具导航、热门资讯、优惠活动',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '跨境工具说',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '跨境工具说 - 跨境卖家工具导航',
    description: '为跨境卖家精选的工具导航、热门资讯、优惠活动',
    images: ['/og-image.png'],
    creator: '@跨境工具说',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// JSON-LD 结构化数据
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://kjgjs.cn/#website',
      url: 'https://kjgjs.cn',
      name: '跨境工具说',
      description: '为跨境卖家精选的工具导航、热门资讯、优惠活动',
      publisher: {
        '@type': 'Organization',
        '@id': 'https://kjgjs.cn/#organization',
        name: '跨境工具说',
        logo: {
          '@type': 'ImageObject',
          url: 'https://kjgjs.cn/images/logo/logo.png',
        },
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://kjgjs.cn/tools?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://kjgjs.cn/#organization',
      name: '跨境工具说',
      url: 'https://kjgjs.cn',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kjgjs.cn/images/logo/logo.png',
      },
      sameAs: [
        'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=跨境工具说',
        'https://www.xiaohongshu.com/user/profile/跨境工具说',
        'https://www.zhihu.com/org/跨境工具说',
        'https://www.douyin.com/跨境工具说',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+86-18971469839',
        contactType: 'customer service',
        availableLanguage: 'Chinese',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
