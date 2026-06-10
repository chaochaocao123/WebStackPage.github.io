'use client';
import { useState } from 'react';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import { Header, Footer } from '@/components/layout';

export default function FBACalculatorPage() {
  const [price, setPrice] = useState('29.99');
  const [cost, setCost] = useState('8');
  const [shipping, setShipping] = useState('3');
  const [category, setCategory] = useState('default');
  const [weight, setWeight] = useState('0.5');  // 磅
  const [isAmazon, setIsAmazon] = useState(true);

  // FBA 费用估算（简化版 - 标准尺寸）
  const calculateFBA = () => {
    const p = parseFloat(price) || 0;
    const c = parseFloat(cost) || 0;
    const s = parseFloat(shipping) || 0;
    const w = parseFloat(weight) || 0;
    
    // FBA 履约费（标准尺寸，2024 美西仓）
    let fbaFee = 0;
    if (w <= 0.5) fbaFee = 3.86;
    else if (w <= 1) fbaFee = 4.75;
    else if (w <= 1.5) fbaFee = 5.40;
    else if (w <= 2) fbaFee = 6.08;
    else fbaFee = 6.08 + (w - 2) * 0.42;
    
    // 大件附加费
    if (w > 2) fbaFee += 0.5;
    
    // 佣金（15%）
    const referralFee = p * 0.15;
    
    // 平台月费（$39.99，按月销 1000 单摊销）
    const platformFee = 39.99 / 1000;
    
    // 头程物流（按 0.3 元/件估算 7天物流）
    const freightFee = 1.5;
    
    // 推广费估算（按 15% ACOS）
    const adsFee = p * 0.15;
    
    const total = c + s + fbaFee + referralFee + platformFee + freightFee + adsFee;
    const profit = p - total;
    const margin = (profit / p) * 100;
    const roi = (profit / (c + s + freightFee)) * 100;
    
    return { fbaFee, referralFee, platformFee, freightFee, adsFee, total, profit, margin, roi };
  };

  const r = calculateFBA();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">FBA 利润计算器</h1>
        </div>
        <p className="text-slate-500 mb-8">输入产品信息和售价，自动计算 FBA 费用和利润</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 输入区 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 mb-3">产品信息</h2>
            
            <Field label="售价 (USD)" value={price} onChange={setPrice} step="0.01" />
            <Field label="采购成本 (USD)" value={cost} onChange={setCost} step="0.01" />
            <Field label="国内运费 (USD)" value={shipping} onChange={setShipping} step="0.01" />
            <Field label="产品重量 (磅)" value={weight} onChange={setWeight} step="0.1" />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">产品类目</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="default">默认类目（佣金 15%）</option>
                <option value="electronics">电子产品（佣金 8%）</option>
                <option value="clothing">服装鞋帽（佣金 17%）</option>
                <option value="beauty">美妆个护（佣金 15%）</option>
                <option value="toys">玩具游戏（佣金 15%）</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>说明：</strong> 此为简化版估算，实际 FBA 费用因尺寸、存储月份、淡旺季而异。建议结合 Seller Central 报表核对。
              </div>
            </div>
          </div>

          {/* 结果区 */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6">
            <h2 className="font-semibold mb-3 text-slate-200">计算结果</h2>
            
            <div className="space-y-2 text-sm mb-5">
              <Row label="FBA 履约费" value={r.fbaFee} />
              <Row label="平台佣金 (15%)" value={r.referralFee} />
              <Row label="平台月费摊销" value={r.platformFee} />
              <Row label="头程物流" value={r.freightFee} />
              <Row label="推广费 (ACOS 15%)" value={r.adsFee} />
              <div className="border-t border-slate-700 my-2"></div>
              <Row label="总成本" value={r.total} bold />
            </div>

            <div className="bg-white/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">净利润</span>
                <span className={`text-2xl font-bold ${r.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${r.profit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">利润率</span>
                <span className={`text-lg font-semibold ${r.margin > 20 ? 'text-green-400' : r.margin > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {r.margin.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">ROI</span>
                <span className="text-lg font-semibold text-blue-300">{r.roi.toFixed(0)}%</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              {r.margin < 0 ? '⚠️ 利润为负，需要调整售价或成本' : 
               r.margin < 10 ? '⚠️ 利润率偏低，建议优化供应链' :
               r.margin < 20 ? '✓ 健康水平' : '🎉 优秀！'}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
          <h3 className="font-semibold text-slate-900 mb-2">💡 利润率参考</h3>
          <ul className="space-y-1 leading-relaxed">
            <li>• <strong>健康水平：</strong> 利润率 20% 以上，ROI 50% 以上</li>
            <li>• <strong>合格水平：</strong> 利润率 10-20%，ROI 30-50%</li>
            <li>• <strong>危险水平：</strong> 利润率低于 10%，建议优化</li>
            <li>• 新品期建议预留 30% 推广预算（ACOS）</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, step }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        step={step}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
      />
    </div>
  );
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'text-slate-200 font-semibold' : 'text-slate-300'}>{label}</span>
      <span className={bold ? 'text-slate-100 font-semibold' : 'text-slate-200'}>
        ${value.toFixed(2)}
      </span>
    </div>
  );
}
