import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@/components/Analytics';
import { QrCodeFloat } from '@/components/layout';
import './globals.css';

// v11.29 百度统计代码（曹总 2026-06-14 22:13 提供）
// 对应百度统计后台 https://tongji.baidu.com/ 站点 kjgjs.cn
// 站点 ID: e5cd64af6680d0dfee994511746d4eee
// 用 next/script beforeInteractive 策略 + <head>，SSR 阶段直接把 <script> 标签渲染到 HTML 头部
// （afterInteractive 策略在 RSC 序列化里注册，要等客户端 hydration 后才插入，偶发被浏览器扩展拦截或 chunk 加载失败时不触发）
// beforeInteractive 是百度统计官方推荐方式：浏览器收到 HTML 立即执行，不依赖 hydration
// 与 v11.27 自建埋点（Analytics）双轨制：自建保数据全，百度统计补搜索词关联分析
const BAIDU_TONGJI_ID = 'e5cd64af6680d0dfee994511746d4eee';
const BAIDU_TONGJI_SNIPPET = `var _hmt = _hmt || []; (function() { var hm = document.createElement("script"); hm.src = "https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}"; var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(hm, s); })();`;

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
  // v11.10.3 站长平台验证（Google Search Console）
  // 渲染为 <meta name="google-site-verification" content="..." />
  // 多家平台可同时加（next.js 会自动渲染多个 meta 标签）：
  //   verification: { google: '...', yahoo: '...', yandex: '...', other: { 'baidu-site-verification': '...' } }
  // v11.24 百度站长平台 HTML 标签验证：站点归属验证 + 解锁普通收录 API token
  // 渲染为 <meta name="baidu-site-verification" content="codeva-KsBLJ4iHZH" />
  // 对应百度站长平台 https://ziyuan.baidu.com/ 站点管理 → kjgjs.cn → HTML 标签验证
  // 配完后续需要在 Vercel 配 BAIDU_PUSH_TOKEN 启用 pushToBaiduAction 主动推送
  verification: {
    google: 'XokonAI1YD5F8nY_sxWnDczpLp0hS0Bf2j2J0C6yr7o',
    other: {
      'baidu-site-verification': 'codeva-KsBLJ4iHZH',
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
          urlTemplate: 'https://kjgjs.cn/search?q={search_term_string}',
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
        {/* v11.29 百度统计：用 beforeInteractive + <head>，SSR 阶段就把 <script> 标签渲染到 HTML 头部
            （afterInteractive 策略在 RSC 序列化里注册，要等客户端 hydration 后才插入，偶发被浏览器扩展拦截或 chunk 加载失败时不触发）
            beforeInteractive 是百度统计官方推荐方式：浏览器收到 HTML 立即执行，不依赖 hydration */}
        <Script
          id="baidu-tongji"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: BAIDU_TONGJI_SNIPPET }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Analytics />
        {children}
        <QrCodeFloat />
      </body>
    </html>
  );
}
