// 颜色取色器 — server component layout
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '颜色取色器 - 跨境工具说',
  description: 'HEX/RGB/HSL 颜色互转，调色板建议，复制 CSS 变量',
  keywords: '颜色取色器,HEX转RGB,RGB转HSL,调色板,CSS颜色,品牌色',
  alternates: { canonical: 'https://kjgjs.cn/tools/color-picker' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/tools/color-picker',
    siteName: '跨境工具说',
    title: '颜色取色器 - 跨境工具说',
    description: 'HEX/RGB/HSL 颜色互转，调色板建议',
  },
};

export default function ColorPickerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
