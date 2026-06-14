import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Wrench, FolderOpen, FileText, Gift, ArrowRight, Zap, Newspaper, Eye, Users, TrendingUp } from 'lucide-react';
import { getOverviewStats } from '@/lib/data/page-view';

// 强制动态渲染，避免 Router Cache 导致统计数据过时
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  // 获取统计数据
  const [toolCount, toolWithDiscount, categoryCount, articleCount, dealCount, newsCount, overview] = await Promise.all([
    prisma.tool.count(),
    prisma.tool.count({ where: { discount: { not: '' } } }),
    prisma.category.count(),
    prisma.article.count(),
    prisma.deal.count(),
    prisma.news.count(),
    // v11.27 加 PV/UV 概览
    getOverviewStats(),
  ]);

  // v11.27 访问统计卡（3 个）— 放最前，让曹总登录后台一眼看到流量
  const trafficStats = [
    { label: '今日 PV', value: overview.todayPv, icon: Eye, color: 'bg-brand-500', href: '/admin/analytics' },
    { label: '今日 UV', value: overview.todayUv, icon: Users, color: 'bg-blue-500', href: '/admin/analytics' },
    { label: '7 日 PV', value: overview.pv7d, icon: TrendingUp, color: 'bg-emerald-500', href: '/admin/analytics' },
  ];

  const stats = [
    { label: '工具总数', value: toolCount, icon: Wrench, color: 'bg-brand-500' },
    { label: '带优惠工具', value: toolWithDiscount, icon: Zap, color: 'bg-orange-500' },
    { label: '资讯数', value: newsCount, icon: Newspaper, color: 'bg-accent-500' },
    { label: '文章数', value: articleCount, icon: FileText, color: 'bg-blue-500' },
    { label: '优惠数', value: dealCount, icon: Gift, color: 'bg-green-500' },
  ];

  const quickActions = [
    { href: '/admin/tools/new', label: '添加工具', desc: '新增一个跨境工具' },
    { href: '/admin/news/new', label: '发布资讯', desc: '手动发布行业资讯' },
    { href: '/admin/articles/new', label: '写文章', desc: '发布新文章' },
    { href: '/admin/deals/new', label: '添加优惠', desc: '录入优惠活动' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">数据概览</h1>

      {/* v11.27 访问流量卡（3 个）— 独立一行，蓝色系突出 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {trafficStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-brand-400 hover:shadow-sm transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{stat.value.toLocaleString()}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </Link>
          );
        })}
      </div>

      {/* 内容统计卡片（5 个） */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-200">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* 快捷操作 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition"
            >
              <div className="flex-1">
                <div className="font-medium text-slate-900">{action.label}</div>
                <div className="text-xs text-slate-500">{action.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 mt-0.5">💡</div>
          <div>
            <div className="font-medium text-amber-800">使用提示</div>
            <div className="text-sm text-amber-700 mt-1">
              后台修改数据后，首页会自动更新。如需修改生产环境数据，请在 Vercel 环境变量中配置 Neon Postgres 连接串。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
