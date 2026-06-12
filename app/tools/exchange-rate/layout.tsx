// 汇率转换 — server component layout
// 解决 client page.tsx 不能 export metadata 的问题
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '汇率转换',
  description: '美元、欧元、英镑、日元、加元、澳元、墨西哥比索等实时汇率双向换算，跨境电商定价参考',
  keywords: '汇率转换,实时汇率,美元人民币,欧元美元,跨境汇率换算',
  alternates: { canonical: 'https://kjgjs.cn/tools/exchange-rate' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/tools/exchange-rate',
    siteName: '跨境工具说',
    title: '汇率转换 - 跨境工具说',
    description: '主流货币实时汇率双向换算',
  },
};

export default function ExchangeRateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
