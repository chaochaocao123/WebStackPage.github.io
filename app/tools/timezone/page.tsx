'use client';
import { useState, useEffect, useCallback } from 'react';
import { Globe, Clock, Calendar, Copy, Check, Download } from 'lucide-react';
import { Header, Footer } from '@/components/layout';

// 时区数据：城市名、IANA 时区、所属地区
const TIMEZONES = [
  // 中国
  { city: '中国', timezone: 'Asia/Shanghai', abbr: 'CST', flag: '🇨🇳' },
  // 美国
  { city: '纽约', timezone: 'America/New_York', abbr: 'EST/EDT', flag: '🇺🇸' },
  { city: '洛杉矶', timezone: 'America/Los_Angeles', abbr: 'PST/PDT', flag: '🇺🇸' },
  { city: '温哥华', timezone: 'America/Vancouver', abbr: 'PST', flag: '🇨🇦' },
  // 欧洲
  { city: '伦敦', timezone: 'Europe/London', abbr: 'GMT/BST', flag: '🇬🇧' },
  { city: '柏林', timezone: 'Europe/Berlin', abbr: 'CET/CEST', flag: '🇩🇪' },
  { city: '巴黎', timezone: 'Europe/Paris', abbr: 'CET/CEST', flag: '🇫🇷' },
  { city: '马德里', timezone: 'Europe/Madrid', abbr: 'CET/CEST', flag: '🇪🇸' },
  { city: '罗马', timezone: 'Europe/Rome', abbr: 'CET/CEST', flag: '🇮🇹' },
  { city: '莫斯科', timezone: 'Europe/Moscow', abbr: 'MSK', flag: '🇷🇺' },
  // 亚洲
  { city: '东京', timezone: 'Asia/Tokyo', abbr: 'JST', flag: '🇯🇵' },
  { city: '首尔', timezone: 'Asia/Seoul', abbr: 'KST', flag: '🇰🇷' },
  { city: '新德里', timezone: 'Asia/Kolkata', abbr: 'IST', flag: '🇮🇳' },
  { city: '雅加达', timezone: 'Asia/Jakarta', abbr: 'WIB', flag: '🇮🇩' },
  { city: '新加坡', timezone: 'Asia/Singapore', abbr: 'SGT', flag: '🇸🇬' },
  { city: '曼谷', timezone: 'Asia/Bangkok', abbr: 'ICT', flag: '🇹🇭' },
  { city: '迪拜', timezone: 'Asia/Dubai', abbr: 'GST', flag: '🇦🇪' },
  // 大洋洲
  { city: '悉尼', timezone: 'Australia/Sydney', abbr: 'AEST/AEDT', flag: '🇦🇺' },
  // 南美
  { city: '圣保罗', timezone: 'America/Sao_Paulo', abbr: 'BRT', flag: '🇧🇷' },
];

// 获取时区偏移量（小时）
function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const target = new Date(utc);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(target);
  const offsetPart = parts.find(p => p.type === 'timeZoneName');
  const offsetStr = offsetPart?.value || 'GMT+0';
  const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours + minutes / 60);
}

// 格式化时间显示
function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// 获取时区缩写
function getTimezoneAbbr(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  });
  const parts = formatter.formatToParts(now);
  return parts.find(p => p.type === 'timeZoneName')?.value || timezone;
}

// 生成 ICS 日历文件
function generateICS(date: Date, timezone: string, city: string): string {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  
  const dateStr = `${year}${month}${day}`;
  const timeStr = `${hours}${minutes}00`;
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//跨境工具说//NONSGML Event//EN
BEGIN:VEVENT
UID:${Date.now()}@kjgjs.cn
DTSTAMP:${dateStr}T${timeStr}Z
DTSTART:${dateStr}T${timeStr}Z
SUMMARY:跨境时区提醒 - ${city}
DESCRIPTION:跨境工具说时区转换提醒
END:VEVENT
END:VCALENDAR`;
  
  return ics;
}

export default function TimezonePage() {
  const [baseDate, setBaseDate] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now;
  });
  const [inputDate, setInputDate] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [copied, setCopied] = useState<string | null>(null);
  
  // 每分钟自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      setBaseDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 处理日期输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputDate(e.target.value);
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setBaseDate(newDate);
    }
  }, []);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  // 下载 ICS 文件
  const downloadICS = useCallback((city: string, timezone: string) => {
    const ics = generateICS(baseDate, timezone, city);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timezone-${city}-${Date.now()}.ics`;
    link.click();
  }, [baseDate]);

  // 导出所有时区
  const exportAllTimezones = useCallback(() => {
    const lines = TIMEZONES.map(tz => {
      const time = formatTime(baseDate, tz.timezone);
      const abbr = getTimezoneAbbr(tz.timezone);
      const offset = getTimezoneOffset(tz.timezone);
      const sign = offset >= 0 ? '+' : '';
      return `${tz.flag} ${tz.city} (${abbr}, UTC${sign}${offset.toFixed(2)})：${time}`;
    }).join('\n');
    
    const header = `时区转换结果 - ${new Date().toLocaleDateString('zh-CN')}\n基准时间：${baseDate.toLocaleString('zh-CN')}\n\n`;
    copyToClipboard(header + lines, 'all');
  }, [baseDate, copyToClipboard]);

  const localOffset = getTimezoneOffset('Asia/Shanghai');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">时区转换器</h1>
        </div>
        <p className="text-slate-500 mb-8">全球 20+ 主要城市时区实时转换，跨境电商必备</p>

        {/* 时间输入区 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <label className="text-sm font-medium text-slate-700">基准时间</label>
            </div>
            <input
              type="datetime-local"
              value={inputDate}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => {
                const now = new Date();
                now.setSeconds(0, 0);
                setBaseDate(now);
                setInputDate(now.toISOString().slice(0, 16));
              }}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition"
            >
              重置为当前时间
            </button>
          </div>
        </div>

        {/* 时区网格 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIMEZONES.map(tz => {
            const time = formatTime(baseDate, tz.timezone);
            const abbr = getTimezoneAbbr(tz.timezone);
            const offset = getTimezoneOffset(tz.timezone);
            const sign = offset >= 0 ? '+' : '';
            const diff = offset - localOffset;
            const diffStr = diff === 0 ? '=0' : diff > 0 ? `+${diff}` : `${diff}`;
            
            return (
              <div
                key={tz.city}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tz.flag}</span>
                    <div>
                      <div className="font-medium text-slate-900">{tz.city}</div>
                      <div className="text-xs text-slate-500">{tz.abbr}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => downloadICS(tz.city, tz.timezone)}
                      className="p-1.5 rounded hover:bg-indigo-50 transition"
                      title="添加到日历"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(time, tz.city)}
                      className="p-1.5 rounded hover:bg-indigo-50 transition"
                      title="复制时间"
                    >
                      {copied === tz.city ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-lg font-semibold text-slate-900">{time}</div>
                <div className="text-xs text-slate-500 mt-1">
                  UTC{sign}{offset.toFixed(2)} · 与北京差 {diffStr}h
                </div>
              </div>
            );
          })}
        </div>

        {/* 导出按钮 */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={exportAllTimezones}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition"
          >
            <Copy className="w-4 h-4" />
            {copied === 'all' ? '已复制全部时区' : '复制全部时区'}
          </button>
        </div>

        {/* 使用提示 */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            使用技巧
          </h3>
          <ul className="text-sm text-indigo-800 space-y-1.5">
            <li>• 点击时间卡片右上角的图标可复制该时区时间或添加到日历</li>
            <li>• "添加到日历"会下载 .ics 文件，双击即可添加到系统日历（Outlook/日历等）</li>
            <li>• 夏令时期间时区偏移可能自动调整，显示的是当前实际时间</li>
            <li>• 时区数据基于 IANA 时区数据库，支持历史和未来的正确转换</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
