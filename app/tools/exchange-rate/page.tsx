'use client';
import { useState, useEffect } from 'react';
import { Package, ArrowRightLeft, RefreshCw, TrendingUp } from 'lucide-react';
import { Header, Footer } from '@/components/layout';

const CURRENCIES = [
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' },
  { code: 'CAD', name: '加元', flag: '🇨🇦' },
  { code: 'AUD', name: '澳元', flag: '🇦🇺' },
  { code: 'MXN', name: '墨西哥比索', flag: '🇲🇽' },
];

// 固定参考汇率（当 API 失败时使用，2026-06 数据）
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  CNY: 7.18,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 152.5,
  CAD: 1.36,
  AUD: 1.52,
  MXN: 17.2,
};

export default function ExchangeRatePage() {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('CNY');
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [isLive, setIsLive] = useState(false);
  const [updateTime, setUpdateTime] = useState('参考汇率');

  useEffect(() => {
    // 尝试拉取实时汇率
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success' && data.rates) {
          setRates(data.rates);
          setIsLive(true);
          setUpdateTime(data.time_last_update_utc || '刚刚');
        }
      })
      .catch(() => {
        // 静默失败，使用 fallback
        setIsLive(false);
      });
  }, []);

  const num = parseFloat(amount) || 0;
  // USD -> to 汇率
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  const result = (num / fromRate * toRate).toFixed(4).replace(/\.?0+$/, '');
  const rate = (toRate / fromRate).toFixed(4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">实时汇率</h1>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            {isLive ? <span className="text-green-600">● 实时</span> : <span className="text-slate-400">○ 离线</span>}
            <RefreshCw className="w-3 h-3 ml-1" />
            {updateTime}
          </div>
        </div>
        <p className="text-slate-500 mb-8">支持主要货币实时汇率转换</p>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">从</label>
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-brand-500"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg focus:outline-none focus:border-brand-500"
                placeholder="金额"
              />
            </div>

            <button
              onClick={() => { const t = from; setFrom(to); setTo(t); }}
              className="p-2 mb-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            </button>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">到</label>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-brand-500"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                ))}
              </select>
              <div className="w-full px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-lg font-semibold text-green-700">
                {result} {to}
              </div>
            </div>
          </div>

          <div className="mt-4 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            1 {from} = {rate} {to}
          </div>
        </div>

        {/* 主要汇率表 */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-3">USD 主要汇率</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCIES.filter(c => c.code !== 'USD').map(c => (
              <div key={c.code} className="px-3 py-2 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">{c.flag} {c.name}</div>
                <div className="font-semibold text-slate-900">
                  {rates[c.code] ? rates[c.code].toFixed(4) : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-400 text-center">
          汇率来源：exchangerate-api.com (开放数据) · 仅供跨境结算参考，实际汇率以银行牌价为准
        </div>
      </main>
      <Footer />
    </div>
  );
}
