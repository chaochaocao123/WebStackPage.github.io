// 时区转换器 — server component layout
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '时区转换器 - 跨境工具说',
  description: '全球主要城市时区实时转换，跨境电商客服和选品时机必备',
  keywords: '时区转换器,世界时区,跨境时区,UTC时间,北京时间,纽约时间,伦敦时间,东京时间',
  alternates: { canonical: 'https://kjgjs.cn/tools/timezone' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/tools/timezone',
    siteName: '跨境工具说',
    title: '时区转换器 - 跨境工具说',
    description: '全球主要城市时区实时转换，跨境电商必备',
  },
};

export default function TimezoneLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
