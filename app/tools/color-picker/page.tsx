'use client';
import { useState, useCallback, useEffect } from 'react';
import { Palette, Copy, Check, Download, RotateCcw } from 'lucide-react';
import { Header, Footer } from '@/components/layout';

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

// HEX 转 RGB
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// RGB 转 HEX
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// RGB 转 HSL
function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// HSL 转 RGB
function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// 计算调色板
function generatePalette(baseRgb: RGB): { name: string; hex: string }[] {
  const hsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
  const palette: { name: string; hex: string }[] = [];

  // 主色
  palette.push({ name: '主色', hex: rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b) });

  // 互补色 (+180°)
  const compHsl = { ...hsl, h: (hsl.h + 180) % 360 };
  const compRgb = hslToRgb(compHsl.h, compHsl.s, compHsl.l);
  palette.push({ name: '互补色', hex: rgbToHex(compRgb.r, compRgb.g, compRgb.b) });

  // 类比色 (±30°)
  const ana1Hsl = { ...hsl, h: (hsl.h + 30) % 360 };
  const ana1Rgb = hslToRgb(ana1Hsl.h, ana1Hsl.s, ana1Hsl.l);
  palette.push({ name: '类比色+30°', hex: rgbToHex(ana1Rgb.r, ana1Rgb.g, ana1Rgb.b) });

  const ana2Hsl = { ...hsl, h: (hsl.h - 30 + 360) % 360 };
  const ana2Rgb = hslToRgb(ana2Hsl.h, ana2Hsl.s, ana2Hsl.l);
  palette.push({ name: '类比色-30°', hex: rgbToHex(ana2Rgb.r, ana2Rgb.g, ana2Rgb.b) });

  // 三等分色 (+120°)
  const tri1Hsl = { ...hsl, h: (hsl.h + 120) % 360 };
  const tri1Rgb = hslToRgb(tri1Hsl.h, tri1Hsl.s, tri1Hsl.l);
  palette.push({ name: '三等分+120°', hex: rgbToHex(tri1Rgb.r, tri1Rgb.g, tri1Rgb.b) });

  const tri2Hsl = { ...hsl, h: (hsl.h - 120 + 360) % 360 };
  const tri2Rgb = hslToRgb(tri2Hsl.h, tri2Hsl.s, tri2Hsl.l);
  palette.push({ name: '三等分-120°', hex: rgbToHex(tri2Rgb.r, tri2Rgb.g, tri2Rgb.b) });

  // 浅色 (L + 15)
  const lightHsl = { ...hsl, l: Math.min(100, hsl.l + 15) };
  const lightRgb = hslToRgb(lightHsl.h, lightHsl.s, lightHsl.l);
  palette.push({ name: '浅色', hex: rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b) });

  // 深色 (L - 15)
  const darkHsl = { ...hsl, l: Math.max(0, hsl.l - 15) };
  const darkRgb = hslToRgb(darkHsl.h, darkHsl.s, darkHsl.l);
  palette.push({ name: '深色', hex: rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b) });

  return palette;
}

// 预设品牌色
const PRESET_COLORS = [
  { name: '亚马逊橙', hex: '#FF9900' },
  { name: '苹果灰', hex: '#555555' },
  { name: 'Facebook 蓝', hex: '#1877F2' },
  { name: 'Twitter 蓝', hex: '#1DA1F2' },
  { name: 'Google 红', hex: '#EA4335' },
  { name: 'Shopify 绿', hex: '#96BF48' },
];

export default function ColorPickerPage() {
  const [hex, setHex] = useState('#6366F1');
  const [rgb, setRgb] = useState<RGB>({ r: 99, g: 102, b: 241 });
  const [hsl, setHsl] = useState<HSL>({ h: 239, s: 84, l: 67 });
  const [copied, setCopied] = useState<string | null>(null);
  const [activeInput, setActiveInput] = useState<'hex' | 'rgb' | 'hsl'>('hex');

  const updateFromHex = useCallback((newHex: string) => {
    setActiveInput('hex');
    const cleanHex = newHex.startsWith('#') ? newHex : '#' + newHex;
    const rgbVal = hexToRgb(cleanHex);
    setRgb(rgbVal);
    setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
  }, []);

  const updateFromRgb = useCallback((newRgb: RGB) => {
    setActiveInput('rgb');
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  }, []);

  const updateFromHsl = useCallback((newHsl: HSL) => {
    setActiveInput('hsl');
    setHsl(newHsl);
    const rgbVal = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(rgbVal);
    setHex(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b));
  }, []);

  const handleColorPicker = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFromHex(e.target.value);
  }, [updateFromHex]);

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  const exportCSS = useCallback(() => {
    const css = `:root {\n  --color-primary: ${hex};\n  --color-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};\n  --color-primary-hsl: ${hsl.h}, ${hsl.s}%, ${hsl.l}%;\n}`;
    copyToClipboard(css, 'css');
  }, [hex, rgb, hsl, copyToClipboard]);

  const exportJSON = useCallback(() => {
    const json = JSON.stringify({
      hex: hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
    }, null, 2);
    copyToClipboard(json, 'json');
  }, [hex, rgb, hsl, copyToClipboard]);

  const exportSCSS = useCallback(() => {
    const scss = `$color-primary: ${hex};\n$color-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};\n$color-primary-hsl: ${hsl.h}, ${hsl.s}%, ${hsl.l}%;`;
    copyToClipboard(scss, 'scss');
  }, [hex, rgb, hsl, copyToClipboard]);

  const palette = generatePalette(rgb);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900">颜色取色器</h1>
        </div>
        <p className="text-slate-500 mb-8">HEX/RGB/HSL 颜色互转，调色板建议，复制 CSS 变量</p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：颜色输入 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">颜色输入</h3>
            
            {/* 取色器 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">取色器</label>
              <input
                type="color"
                value={hex}
                onChange={handleColorPicker}
                className="w-full h-20 rounded-lg cursor-pointer border border-slate-200"
              />
            </div>

            {/* HEX */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">HEX</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hex}
                  onChange={e => updateFromHex(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="#000000"
                />
                <button
                  onClick={() => copyToClipboard(hex, 'hex')}
                  className="p-2 rounded-lg hover:bg-slate-100 transition"
                >
                  {copied === 'hex' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* RGB */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">RGB</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.r}
                  onChange={e => updateFromRgb({ ...rgb, r: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 text-center"
                  placeholder="R"
                />
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.g}
                  onChange={e => updateFromRgb({ ...rgb, g: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 text-center"
                  placeholder="G"
                />
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.b}
                  onChange={e => updateFromRgb({ ...rgb, b: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 text-center"
                  placeholder="B"
                />
                <button
                  onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb-str')}
                  className="p-2 rounded-lg hover:bg-slate-100 transition"
                >
                  {copied === 'rgb-str' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* HSL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">HSL</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={hsl.h}
                    onChange={e => updateFromHsl({ ...hsl, h: parseInt(e.target.value) })}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), 
                        hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`,
                    }}
                  />
                  <div className="text-xs text-slate-500 text-center mt-1">H: {hsl.h}°</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={hsl.s}
                    onChange={e => updateFromHsl({ ...hsl, s: parseInt(e.target.value) })}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`,
                    }}
                  />
                  <div className="text-xs text-slate-500 text-center mt-1">S: {hsl.s}%</div>
                </div>
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={hsl.l}
                    onChange={e => updateFromHsl({ ...hsl, l: parseInt(e.target.value) })}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`,
                    }}
                  />
                  <div className="text-xs text-slate-500 text-center mt-1">L: {hsl.l}%</div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl-str')}
                className="mt-2 w-full p-2 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-2"
              >
                {copied === 'hsl-str' ? (
                  <><Check className="w-4 h-4 text-green-600" /> <span className="text-sm">已复制</span></>
                ) : (
                  <><Copy className="w-4 h-4 text-slate-400" /> <span className="text-sm">复制 HSL</span></>
                )}
              </button>
            </div>

            {/* 预设颜色 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">预设品牌色</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_COLORS.map(preset => (
                  <button
                    key={preset.hex}
                    onClick={() => updateFromHex(preset.hex)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 hover:border-amber-400 transition"
                  >
                    <div
                      className="w-8 h-8 rounded"
                      style={{ background: preset.hex }}
                    />
                    <span className="text-[10px] text-slate-500">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 中间：预览 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">实时预览</h3>
            
            {/* 大色块 */}
            <div
              className="w-full aspect-square rounded-xl shadow-inner mb-4"
              style={{ background: hex }}
            />

            {/* 16:9 Banner 预览 */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">16:9 Banner 预览</label>
              <div
                className="w-full aspect-video rounded-lg flex items-center justify-center shadow-inner"
                style={{ background: hex }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: hsl.l > 50 ? '#000' : '#fff' }}
                >
                  Banner 标题
                </span>
              </div>
            </div>

            {/* 渐变预览 */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">渐变背景</label>
              <div
                className="w-full h-12 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${hex}, ${rgbToHsl(rgb.r, rgb.g, rgb.b).l > 50 ? '#1a1a1a' : '#ffffff'})`,
                }}
              />
            </div>

            {/* 按钮预览 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">按钮预览</label>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                  style={{ background: hex }}
                >
                  主按钮
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: hex, color: hex }}
                >
                  次按钮
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：调色板 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">调色板建议</h3>
            
            <div className="space-y-3">
              {palette.map(color => (
                <div
                  key={color.name}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                  onClick={() => copyToClipboard(color.hex, color.name)}
                >
                  <div
                    className="w-10 h-10 rounded-lg shadow-sm"
                    style={{ background: color.hex }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{color.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{color.hex}</div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    {copied === color.name ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 导出按钮 */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={exportCSS}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition"
              >
                <Download className="w-4 h-4" />
                {copied === 'css' ? '已复制 CSS 变量' : '导出 CSS 变量'}
              </button>
              <button
                onClick={exportJSON}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
              >
                <Download className="w-4 h-4" />
                {copied === 'json' ? '已复制 JSON' : '导出 JSON'}
              </button>
              <button
                onClick={exportSCSS}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
              >
                <Download className="w-4 h-4" />
                {copied === 'scss' ? '已复制 SCSS' : '导出 SCSS'}
              </button>
            </div>
          </div>
        </div>

        {/* 使用提示 */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            使用技巧
          </h3>
          <ul className="text-sm text-amber-800 space-y-1.5">
            <li>• 使用取色器或直接输入 HEX 值选择颜色</li>
            <li>• RGB 和 HSL 值实时联动修改</li>
            <li>• 点击调色板中的颜色可复制 HEX 值</li>
            <li>• 导出功能可一键复制为 CSS 变量、JSON 或 SCSS 变量</li>
            <li>• 预设品牌色包含亚马逊、苹果、Facebook、Twitter、Google、Shopify 等</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
