// 条形码/二维码生成器 — server component layout
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '条形码/二维码生成器 - 跨境工具说',
  description: '在线生成 EAN-13 / UPC-A / Code 128 / QR Code 条形码和二维码，支持下载 PNG/SVG，亚马逊贴标必备',
  keywords: '条形码生成器,二维码生成器,EAN-13,UPC-A,Code 128,QR Code,亚马逊贴标',
  alternates: { canonical: 'https://kjgjs.cn/tools/barcode' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/tools/barcode',
    siteName: '跨境工具说',
    title: '条形码/二维码生成器 - 跨境工具说',
    description: '亚马逊贴标必备，支持 EAN-13 / UPC-A / Code 128 / QR Code',
  },
};

export default function BarcodeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
