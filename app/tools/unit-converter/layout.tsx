// 单位换算 — server component layout
// 解决 client page.tsx 不能 export metadata 的问题
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '单位换算',
  description: '英寸/厘米、磅/千克、加仑/升、华氏/摄氏等跨境常用单位双向换算，亚马逊选品必备',
  keywords: '单位换算,英寸厘米换算,磅千克换算,加仑升换算,跨境单位换算',
  alternates: { canonical: 'https://kjgjs.cn/tools/unit-converter' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/tools/unit-converter',
    siteName: '跨境工具说',
    title: '单位换算 - 跨境工具说',
    description: '跨境常用单位双向换算工具',
  },
};

export default function UnitConverterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
