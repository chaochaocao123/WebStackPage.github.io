'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Header, Footer } from '@/components/layout';
import { MapPin, ArrowRight, Info, Loader2, ExternalLink, Package } from 'lucide-react';

declare global {
  interface Window {
    YQV5?: {
      trackMulti: (opts: {
        YQ_ContainerId: string;
        YQ_Height?: number;
        YQ_Fc?: string;
        YQ_Lang?: string;
      }) => void;
    };
  }
}

export default function TrackingPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* 面包屑 */}
        <nav className="text-sm text-slate-500 mb-4 flex items-center flex-wrap">
          <a href="/" className="hover:text-brand-600 transition">首页</a>
          <span className="mx-2">/</span>
          <a href="/tools" className="hover:text-brand-600 transition">实用工具</a>
          <span className="mx-2">/</span>
          <span className="text-slate-700">物流轨迹查询</span>
        </nav>

        {/* 标题 + 简介 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">物流轨迹查询</h1>
          </div>
          <p className="text-slate-600">
            基于 17track 官方查询接口，支持 <strong className="text-slate-900">2800+</strong> 国际国内快递公司，自动识别单号归属，免费使用无需登录
          </p>
        </div>

        {/* 17track widget 容器 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
          <div id="YQContainer" className="min-h-[400px]">
            {!ready && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>正在加载 17track 查询工具...</p>
                <p className="text-xs text-slate-400 mt-2">首次加载需要 2-5 秒</p>
              </div>
            )}
            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <Package className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-amber-900 mb-2">查询工具加载失败</h3>
                <p className="text-sm text-amber-800 mb-4">
                  可能是网络问题导致 17track 官方 widget 加载失败，请点击下方按钮直接访问 17track 官网查询
                </p>
                <a
                  href="https://www.17track.net/zh-cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                >
                  前往 17track.net 查询
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 使用提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700 flex-1">
              <p className="font-semibold text-slate-900 mb-2">使用提示</p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                <li>支持多单号查询，<strong className="text-slate-800">最多 40 个单号</strong>同时查询，用回车或换行分隔</li>
                <li>自动识别快递公司（DHL / UPS / FedEx / 顺丰 / 中通 / 圆通 / 京东等 2800+ 家）</li>
                <li>查询结果由 17track 提供，<strong className="text-slate-800">轨迹更新可能有 1-24 小时延迟</strong></li>
                <li>支持国际段 + 国内段完整轨迹（部分小众快递商仅显示主段）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 常见快递商示例 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">常用国际快递商</h2>
          <div className="flex flex-wrap gap-2">
            {['DHL', 'UPS', 'FedEx', 'TNT', 'USPS', 'YunExpress', '云途', '燕文', '递四方', '顺丰国际', 'EMS', 'Aramex'].map(c => (
              <span key={c} className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* 相关工具 */}
        <div className="bg-slate-50 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">相关工具</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="/tools/fba-calculator"
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-brand-400 hover:shadow-sm transition"
            >
              <span className="text-sm text-slate-700">FBA 利润计算器</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
            <a
              href="/tools/exchange-rate"
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-brand-400 hover:shadow-sm transition"
            >
              <span className="text-sm text-slate-700">汇率转换</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>
      </main>
      <Footer />

      {/* 17track 官方 widget 脚本（来源：https://www.17track.net/zh-hk/widget） */}
      <Script
        src="//www.17track.net/externalcall.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if (typeof window !== 'undefined' && window.YQV5) {
              window.YQV5.trackMulti({
                YQ_ContainerId: 'YQContainer',
                YQ_Height: 700,
                YQ_Fc: '0', // 0 = 自动识别快递公司
              });
              setReady(true);
            } else {
              setError(true);
            }
          } catch (e) {
            console.error('17track widget init error:', e);
            setError(true);
          }
        }}
        onError={() => setError(true)}
      />
    </div>
  );
}
