// FBA 利润计算器 — server component layout
// 解决 client page.tsx 不能 export metadata 的问题
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FBA 利润计算器',
  description: '输入售价、成本、重量，自动估算亚马逊 FBA 履约费、佣金、净利润和 ROI，免费使用无需登录',
  keywords: 'FBA利润计算器,亚马逊FBA费用,FBA履约费计算,跨境电商利润,亚马逊成本核算',
  alternates: { canonical: 'https://kjgjs.cn/tools/fba-calculator' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/tools/fba-calculator',
    siteName: '跨境工具说',
    title: 'FBA 利润计算器 - 跨境工具说',
    description: '亚马逊 FBA 费用 + 佣金 + 利润 + ROI 一键估算',
  },
};

export default function FBACalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
