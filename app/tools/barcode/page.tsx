'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Barcode, QrCode, Download, Copy, Check, Upload, Loader2, Info } from 'lucide-react';
import { Header, Footer } from '@/components/layout';

type BarcodeType = 'EAN13' | 'UPC' | 'CODE128' | 'CODE39';
type QRErrorLevel = 'L' | 'M' | 'Q' | 'H';

const BARCODE_TYPES: { value: BarcodeType; label: string; hint: string }[] = [
  { value: 'EAN13', label: 'EAN-13', hint: '欧洲站，13位数字' },
  { value: 'UPC', label: 'UPC-A', hint: '美国站，12位数字' },
  { value: 'CODE128', label: 'Code 128', hint: '箱唛，支持任意字符' },
  { value: 'CODE39', label: 'Code 39', hint: '支持数字和字母' },
];

const QR_ERROR_LEVELS: { value: QRErrorLevel; label: string; hint: string }[] = [
  { value: 'L', label: '低 (L)', hint: '7% 容错' },
  { value: 'M', label: '中 (M)', hint: '15% 容错' },
  { value: 'Q', label: '高 (Q)', hint: '25% 容错' },
  { value: 'H', label: '最高 (H)', hint: '30% 容错' },
];

// 计算 EAN-13 校验位
function calcEAN13CheckDigit(digits: string): string {
  const arr = digits.split('').map(Number);
  const sum = arr.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
}

// 计算 UPC-A 校验位
function calcUPCCheckDigit(digits: string): string {
  const arr = digits.split('').map(Number);
  const sum = arr.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return String((10 - (sum % 10)) % 10);
}

// 颜色选择预设
const COLOR_PRESETS = [
  { name: '黑色', fg: '#000000', bg: '#ffffff' },
  { name: '深蓝', fg: '#1a365d', bg: '#ffffff' },
  { name: '红色', fg: '#c53030', bg: '#ffffff' },
  { name: '绿色', fg: '#276749', bg: '#ffffff' },
];

export default function BarcodePage() {
  const [tab, setTab] = useState<'barcode' | 'qrcode'>('barcode');
  
  // 条形码状态
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('EAN13');
  const [barcodeValue, setBarcodeValue] = useState('590123412345');
  const [barcodeWidth, setBarcodeWidth] = useState(2);
  const [barcodeHeight, setBarcodeHeight] = useState(100);
  const [barcodeMargin, setBarcodeMargin] = useState(10);
  const [barcodeFg, setBarcodeFg] = useState('#000000');
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // 二维码状态
  const [qrValue, setQrValue] = useState('https://kjgjs.cn');
  const [qrSize, setQrSize] = useState(300);
  const [qrErrorLevel, setQrErrorLevel] = useState<QRErrorLevel>('M');
  const [qrFg, setQrFg] = useState('#000000');
  const [qrBg, setQrBg] = useState('#ffffff');
  const [qrLogo, setQrLogo] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // 通用状态
  const [copied, setCopied] = useState<string | null>(null);

  // 生成条形码
  useEffect(() => {
    if (!barcodeCanvasRef.current || !barcodeValue) return;
    try {
      const value = barcodeType === 'EAN13' 
        ? barcodeValue.padStart(12, '0').slice(0, 12)
        : barcodeType === 'UPC'
        ? barcodeValue.padStart(11, '0').slice(0, 11)
        : barcodeValue;
      
      JsBarcode(barcodeCanvasRef.current, value, {
        format: barcodeType,
        width: barcodeWidth,
        height: barcodeHeight,
        margin: barcodeMargin,
        displayValue: true,
        fontSize: 14,
        background: '#ffffff',
        lineColor: barcodeFg,
      });
    } catch {
      // 无效输入静默忽略
    }
  }, [barcodeType, barcodeValue, barcodeWidth, barcodeHeight, barcodeMargin, barcodeFg]);

  // 生成二维码
  useEffect(() => {
    if (!qrCanvasRef.current || !qrValue) return;
    QRCode.toCanvas(qrCanvasRef.current, qrValue, {
      width: qrSize,
      margin: 2,
      color: { dark: qrFg, light: qrBg },
      errorCorrectionLevel: qrErrorLevel,
    }).then(() => {
      // 如果有 logo，绘制到中间
      if (qrLogo) {
        const canvas = qrCanvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            const logoSize = qrSize * 0.2;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            // 画白色背景
            ctx.fillStyle = qrBg;
            ctx.fillRect(x, y, logoSize, logoSize);
            // 画 logo
            ctx.drawImage(img, x, y, logoSize, logoSize);
          };
          img.src = qrLogo;
        }
      }
    }).catch(() => {});
  }, [qrValue, qrSize, qrErrorLevel, qrFg, qrBg, qrLogo]);

  // 下载条形码
  const downloadBarcode = useCallback((format: 'png' | 'svg') => {
    if (!barcodeCanvasRef.current) return;
    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `barcode-${barcodeType}-${Date.now()}.png`;
      link.href = barcodeCanvasRef.current.toDataURL('image/png');
      link.click();
    } else {
      // SVG 格式：用 canvas 转 data URL 再转 SVG
      const value = barcodeType === 'EAN13' 
        ? barcodeValue.padStart(12, '0').slice(0, 12)
        : barcodeType === 'UPC'
        ? barcodeValue.padStart(11, '0').slice(0, 11)
        : barcodeValue;
      
      // 创建离屏 canvas
      const offscreen = document.createElement('canvas');
      JsBarcode(offscreen, value, {
        format: barcodeType,
        width: barcodeWidth,
        height: barcodeHeight,
        margin: barcodeMargin,
        displayValue: true,
        fontSize: 14,
        background: '#ffffff',
        lineColor: barcodeFg,
      });
      
      // canvas 转 SVG
      const dataUrl = offscreen.toDataURL('image/png');
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${offscreen.width}" height="${offscreen.height}">
  <image width="${offscreen.width}" height="${offscreen.height}" xlink:href="${dataUrl}"/>
</svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `barcode-${barcodeType}-${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
  }, [barcodeType, barcodeValue, barcodeWidth, barcodeHeight, barcodeMargin, barcodeFg]);

  // 下载二维码
  const downloadQR = useCallback((format: 'png' | 'svg') => {
    if (!qrCanvasRef.current) return;
    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = qrCanvasRef.current.toDataURL('image/png');
      link.click();
    } else {
      QRCode.toString(qrValue, {
        type: 'svg',
        width: qrSize,
        margin: 2,
        color: { dark: qrFg, light: qrBg },
        errorCorrectionLevel: qrErrorLevel,
      }).then(svg => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }).catch(() => {});
    }
  }, [qrValue, qrSize, qrFg, qrBg, qrErrorLevel]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  // 处理 logo 上传
  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // 校验提示
  const getCheckDigitHint = () => {
    if (barcodeType === 'EAN13') {
      const digits = barcodeValue.replace(/\D/g, '').padStart(12, '0').slice(0, 12);
      const check = calcEAN13CheckDigit(digits);
      return `当前 12 位: ${digits}，校验位: ${check}，共 13 位`;
    }
    if (barcodeType === 'UPC') {
      const digits = barcodeValue.replace(/\D/g, '').padStart(11, '0').slice(0, 11);
      const check = calcUPCCheckDigit(digits);
      return `当前 11 位: ${digits}，校验位: ${check}，共 12 位`;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Barcode className="w-6 h-6 text-pink-600" />
          <h1 className="text-2xl font-bold text-slate-900">条形码/二维码生成器</h1>
        </div>
        <p className="text-slate-500 mb-8">亚马逊贴标必备，支持 EAN-13 / UPC-A / Code 128 / QR Code</p>

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('barcode')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'barcode'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Barcode className="w-4 h-4" />
            条形码
          </button>
          <button
            onClick={() => setTab('qrcode')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'qrcode'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            二维码
          </button>
        </div>

        {/* 条形码 Tab */}
        {tab === 'barcode' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 设置区 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4">条形码设置</h3>
              
              {/* 类型选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {BARCODE_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setBarcodeType(type.value);
                        if (type.value === 'EAN13') setBarcodeValue('590123412345');
                        else if (type.value === 'UPC') setBarcodeValue('01234567890');
                      }}
                      className={`p-3 rounded-lg border text-left transition ${
                        barcodeType === type.value
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{type.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 内容输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  内容
                  {getCheckDigitHint() && (
                    <span className="relative inline-flex items-center justify-center w-4 h-4 ml-1.5 group cursor-help align-middle">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute z-10 left-0 top-6 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl whitespace-pre-line leading-relaxed pointer-events-none">
                        {getCheckDigitHint()}
                      </span>
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={barcodeValue}
                  onChange={e => setBarcodeValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                  placeholder={barcodeType === 'EAN13' ? '12位数字' : barcodeType === 'UPC' ? '11位数字' : '输入内容'}
                />
              </div>

              {/* 尺寸调整 */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">线条宽度</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={barcodeWidth}
                    onChange={e => setBarcodeWidth(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">高度</label>
                  <input
                    type="number"
                    min={50}
                    max={200}
                    value={barcodeHeight}
                    onChange={e => setBarcodeHeight(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">边距</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={barcodeMargin}
                    onChange={e => setBarcodeMargin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* 颜色 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">前景色</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={barcodeFg}
                    onChange={e => setBarcodeFg(e.target.value)}
                    className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={barcodeFg}
                    onChange={e => setBarcodeFg(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-pink-500"
                  />
                  <button
                    onClick={() => copyToClipboard(barcodeFg, 'barcode-fg')}
                    className="p-2 rounded hover:bg-slate-100 transition"
                    title="复制色值"
                  >
                    {copied === 'barcode-fg' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* 下载按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => downloadBarcode('png')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  下载 PNG
                </button>
                <button
                  onClick={() => downloadBarcode('svg')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                >
                  <Download className="w-4 h-4" />
                  下载 SVG
                </button>
              </div>
            </div>

            {/* 预览区 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
              <h3 className="font-semibold text-slate-900 mb-4">预览</h3>
              <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg p-6 min-h-[200px]">
                <canvas ref={barcodeCanvasRef} className="max-w-full" />
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">
                {barcodeType === 'EAN13' ? 'EAN-13 适用于欧洲站产品' : 
                 barcodeType === 'UPC' ? 'UPC-A 适用于美国站产品' : 
                 'Code 128 适用于箱唛和物流标签'}
              </p>
            </div>
          </div>
        )}

        {/* 二维码 Tab */}
        {tab === 'qrcode' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 设置区 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4">二维码设置</h3>
              
              {/* 内容输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">内容 (文本/URL)</label>
                <textarea
                  value={qrValue}
                  onChange={e => setQrValue(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 resize-none"
                  placeholder="输入文本或网址"
                />
              </div>

              {/* 容错率 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">容错率</label>
                <div className="grid grid-cols-4 gap-2">
                  {QR_ERROR_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setQrErrorLevel(level.value)}
                      className={`p-2 rounded-lg border text-center transition ${
                        qrErrorLevel === level.value
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-xs">{level.label}</div>
                      <div className="text-[10px] text-slate-500">{level.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 尺寸 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">尺寸 (px)</label>
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={50}
                  value={qrSize}
                  onChange={e => setQrSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-slate-600 text-center">{qrSize}px</div>
              </div>

              {/* 颜色 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">前景色</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="color"
                      value={qrFg}
                      onChange={e => setQrFg(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={qrFg}
                      onChange={e => setQrFg(e.target.value)}
                      className="flex-1 px-1 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">背景色</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="color"
                      value={qrBg}
                      onChange={e => setQrBg(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={qrBg}
                      onChange={e => setQrBg(e.target.value)}
                      className="flex-1 px-1 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* 颜色预设 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-2">颜色预设</label>
                <div className="flex gap-2">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => { setQrFg(preset.fg); setQrBg(preset.bg); }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 hover:border-pink-400 transition text-xs"
                    >
                      <span className="w-4 h-4 rounded" style={{ background: preset.bg, border: `1px solid ${preset.fg}` }} />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo 上传 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  中心 Logo (可选)
                  <span className="text-xs text-slate-500 font-normal ml-1.5">建议尺寸 80x80px</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="qr-logo-upload"
                  />
                  <label
                    htmlFor="qr-logo-upload"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    上传 Logo
                  </label>
                  {qrLogo && (
                    <button
                      onClick={() => setQrLogo(null)}
                      className="text-xs text-slate-500 hover:text-red-600"
                    >
                      移除
                    </button>
                  )}
                </div>
                {qrLogo && (
                  <div className="mt-2 w-12 h-12 rounded border border-slate-200 overflow-hidden">
                    <img src={qrLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* 下载按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => downloadQR('png')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  下载 PNG
                </button>
                <button
                  onClick={() => downloadQR('svg')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                >
                  <Download className="w-4 h-4" />
                  下载 SVG
                </button>
              </div>
            </div>

            {/* 预览区 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
              <h3 className="font-semibold text-slate-900 mb-4">预览</h3>
              <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg p-6 min-h-[300px]">
                <canvas ref={qrCanvasRef} className="max-w-full" />
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">
                高容错率适合 Logo 遮挡，低容错率适合长文本
              </p>
            </div>
          </div>
        )}

        {/* 使用提示 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            使用提示
          </h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li>• <strong>EAN-13</strong>：必须是 12 位数字（系统自动计算并添加第 13 位校验位）</li>
            <li>• <strong>UPC-A</strong>：必须是 11 位数字（系统自动计算并添加第 12 位校验位）</li>
            <li>• <strong>Code 128</strong>：支持任意 ASCII 字符，适合箱唛和物流标签</li>
            <li>• SVG 格式适合印刷，PNG 格式适合屏幕显示</li>
            <li>• 二维码 Logo 建议使用 PNG 透明背景图片，效果更佳</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
