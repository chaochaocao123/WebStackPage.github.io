'use client';
import { useState } from 'react';
import { Ruler, ArrowRightLeft } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
// metadata 在同目录 layout.tsx 里 export

interface Unit {
  name: string;
  symbol: string;
  toBase: (v: number) => number;  // 转为基准单位
  fromBase: (v: number) => number;  // 从基准单位转换
}

const UNITS: Record<string, Unit[]> = {
  length: [
    { name: '毫米', symbol: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
    { name: '厘米', symbol: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
    { name: '米', symbol: 'm', toBase: v => v, fromBase: v => v },
    { name: '英寸', symbol: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    { name: '英尺', symbol: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
    { name: '码', symbol: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
  ],
  weight: [
    { name: '克', symbol: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
    { name: '千克', symbol: 'kg', toBase: v => v, fromBase: v => v },
    { name: '磅', symbol: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
    { name: '盎司', symbol: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
  ],
  volume: [
    { name: '毫升', symbol: 'ml', toBase: v => v / 1000, fromBase: v => v * 1000 },
    { name: '升', symbol: 'L', toBase: v => v, fromBase: v => v },
    { name: '美制加仑', symbol: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
    { name: '英制加仑', symbol: 'gal_uk', toBase: v => v * 4.54609, fromBase: v => v / 4.54609 },
  ],
  area: [
    { name: '平方厘米', symbol: 'cm²', toBase: v => v / 10000, fromBase: v => v * 10000 },
    { name: '平方米', symbol: 'm²', toBase: v => v, fromBase: v => v },
    { name: '平方英寸', symbol: 'in²', toBase: v => v * 0.00064516, fromBase: v => v / 0.00064516 },
    { name: '平方英尺', symbol: 'ft²', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
  ],
};

const CATEGORIES: Record<string, string> = {
  length: '长度',
  weight: '重量',
  volume: '体积',
  area: '面积',
};

export default function UnitConverterPage() {
  const [category, setCategory] = useState<keyof typeof UNITS>('length');
  const [fromUnit, setFromUnit] = useState(UNITS.length[2].symbol); // 米
  const [toUnit, setToUnit] = useState(UNITS.length[3].symbol); // 英寸
  const [value, setValue] = useState('1');

  const units = UNITS[category];
  const from = units.find(u => u.symbol === fromUnit) || units[0];
  const to = units.find(u => u.symbol === toUnit) || units[1];
  
  const num = parseFloat(value) || 0;
  const result = (to.fromBase(from.toBase(num))).toFixed(6).replace(/\.?0+$/, '');

  const onCategoryChange = (cat: keyof typeof UNITS) => {
    setCategory(cat);
    setFromUnit(UNITS[cat][0].symbol);
    setToUnit(UNITS[cat][1].symbol);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Ruler className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-slate-900">单位换算</h1>
        </div>
        <p className="text-slate-500 mb-8">长度、重量、体积、面积常用单位转换</p>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {/* 分类选择 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {Object.keys(UNITS).map(cat => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat as keyof typeof UNITS)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  category === cat
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {CATEGORIES[cat]}
              </button>
            ))}
          </div>

          {/* 转换区 */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">从</label>
              <select
                value={fromUnit}
                onChange={e => setFromUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-brand-500"
              >
                {units.map(u => (
                  <option key={u.symbol} value={u.symbol}>{u.name} ({u.symbol})</option>
                ))}
              </select>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg focus:outline-none focus:border-brand-500"
                placeholder="输入数值"
              />
            </div>

            <button
              onClick={() => { const t = fromUnit; setFromUnit(toUnit); setToUnit(t); }}
              className="p-2 mb-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            </button>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">到</label>
              <select
                value={toUnit}
                onChange={e => setToUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-brand-500"
              >
                {units.map(u => (
                  <option key={u.symbol} value={u.symbol}>{u.name} ({u.symbol})</option>
                ))}
              </select>
              <div className="w-full px-3 py-2 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-lg text-lg font-semibold text-brand-700">
                {result} {to.symbol}
              </div>
            </div>
          </div>

          {/* 速查表 */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">常用速查</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {units.slice(0, 6).map((u, i) => {
                const sample = u.fromBase(1);  // 1 基准单位 = X 该单位
                return (
                  <div key={i} className="px-3 py-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500">1 基准</div>
                    <div className="font-medium text-slate-900">{sample.toFixed(4)} {u.symbol}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
