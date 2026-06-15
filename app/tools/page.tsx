import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Wrench, Calculator, Ruler, Package, MapPin, Barcode, Globe, Palette, ArrowRight, Sparkles, Clock } from 'lucide-react';

export const metadata = {
  title: '实用工具 - 跨境工具说',
  description: 'FBA 利润计算器、单位换算、汇率转换、物流轨迹查询等跨境卖家常用工具',
};

const TOOLS_LIST = [
  {
    icon: Calculator,
    name: 'FBA 利润计算器',
    desc: '计算产品售价、成本、利润、FBA 费用',
    status: 'ready',
    color: 'from-blue-500 to-cyan-500',
    href: '/tools/fba-calculator',
  },
  {
    icon: Ruler,
    name: '单位换算',
    desc: '英寸/厘米、磅/千克、加仑/升等',
    status: 'ready',
    color: 'from-purple-500 to-pink-500',
    href: '/tools/unit-converter',
  },
  {
    icon: Package,
    name: '汇率转换',
    desc: '美元、欧元、英镑、日元等实时汇率',
    status: 'ready',
    color: 'from-green-500 to-emerald-500',
    href: '/tools/exchange-rate',
  },
  {
    icon: MapPin,
    name: '物流轨迹查询',
    desc: '基于 17track 官方接口，支持 2800+ 快递公司',
    status: 'ready',
    color: 'from-orange-500 to-red-500',
    href: '/tools/tracking',
  },
  {
    icon: Barcode,
    name: '条形码/二维码生成器',
    desc: 'EAN-13/UPC-A/Code 128/QR Code 在线生成',
    status: 'ready',
    color: 'from-pink-500 to-rose-500',
    href: '/tools/barcode',
  },
  {
    icon: Globe,
    name: '时区转换器',
    desc: '全球 20+ 主要城市时区实时转换',
    status: 'ready',
    color: 'from-indigo-500 to-blue-500',
    href: '/tools/timezone',
  },
  {
    icon: Palette,
    name: '颜色取色器',
    desc: 'HEX/RGB/HSL 互转 + 调色板建议',
    status: 'ready',
    color: 'from-amber-500 to-orange-500',
    href: '/tools/color-picker',
  },
  {
    icon: Calculator,
    name: '关键词搜索量估算',
    desc: '基于工具数据估算关键词热度',
    status: 'plan',
    color: 'from-slate-500 to-slate-700',
  },
  {
    icon: Wrench,
    name: '更多工具',
    desc: '持续上线更多跨境卖家实用工具',
    status: 'plan',
    color: 'from-slate-400 to-slate-600',
  },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ready: { label: '已上线', color: 'bg-green-100 text-green-700' },
  soon: { label: '即将上线', color: 'bg-orange-100 text-orange-700' },
  plan: { label: '规划中', color: 'bg-slate-100 text-slate-500' },
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">实用工具</h1>
        </div>
        <p className="text-slate-500 mb-8">跨境卖家常用的小工具，无需登录直接使用</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS_LIST.map((tool, i) => {
            const Icon = tool.icon;
            const status = STATUS_MAP[tool.status];
            return (
              <div
                key={i}
                className={`group bg-white border border-slate-200 rounded-xl p-5 card-hover relative ${
                  tool.status === 'ready' ? 'cursor-pointer' : ''
                }`}
              >
                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium ${status.color}`}>
                  {status.label}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition">{tool.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{tool.desc}</p>
                {tool.status === 'ready' && tool.href ? (
                  <Link
                    href={tool.href}
                    className="inline-flex items-center gap-1 mt-4 text-sm text-brand-600 font-medium"
                  >
                    立即使用 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-1 mt-4 text-sm text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {tool.status === 'soon' ? '即将上线' : '敬请期待'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 待开发工具说明 */}
        <div className="mt-12 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-brand-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">需要其他工具？</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                您可以在公众号「跨境工具说」后台留言，告诉我们最需要的小工具，我们会优先开发。
                也可以集成第三方工具（如 17track API 等）。
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
