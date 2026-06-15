// 物流轨迹查询 — server component layout
// 解决 client page.tsx 不能 export metadata 的问题
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '物流轨迹查询 - 跨境工具说',
  description: '基于 17track 官方查询接口，支持 2800+ 国际国内快递公司（DHL、UPS、FedEx、顺丰、中通、圆通等）自动识别单号归属，免费使用无需登录',
  keywords: '物流轨迹查询,17track,快递单号查询,国际物流查询,DHL查询,UPS查询,FedEx查询,顺丰查询,中通查询,跨境物流追踪',
  alternates: { canonical: 'https://kjgjs.cn/tools/tracking' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/tools/tracking',
    siteName: '跨境工具说',
    title: '物流轨迹查询 - 跨境工具说',
    description: '17track 官方查询工具，支持 2800+ 快递公司',
  },
};

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
