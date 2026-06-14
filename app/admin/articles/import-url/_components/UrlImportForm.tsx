'use client';
import { useState, useTransition } from 'react';
import {
  Zap,
  Loader2,
  Check,
  AlertTriangle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { importWechatUrl } from '../actions';

type FetchedData = {
  title: string;
  desc: string;
  content: string;
  nickName: string;
  roundHeadImg: string;
  sourceUrl: string;
  publishedAt: string | null;
};

export function UrlImportForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FetchedData | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFetch = async () => {
    setError(null);
    setData(null);
    const u = url.trim();
    if (!u) {
      setError('请输入公众号文章链接');
      return;
    }
    if (!/^https?:\/\/mp\.weixin\.qq\.com\//.test(u)) {
      setError('只支持 mp.weixin.qq.com 域链接（形如 https://mp.weixin.qq.com/s/...）');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/wechat-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      });
      const result = await resp.json();
      if (!resp.ok || !result.ok) {
        setError(result.error || `请求失败 (HTTP ${resp.status})`);
        return;
      }
      setData(result);
    } catch (e) {
      setError(`网络错误: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!data) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('url', data.sourceUrl);
        const result = await importWechatUrl(fd);
        if (result && !result.ok) {
          setError(result.error);
        }
        // 成功的话被 redirect 到编辑页，不需处理
      } catch (e) {
        // redirect 会抛 NEXT_REDIRECT，这是 Next.js 内部行为，吞掉它
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('NEXT_REDIRECT')) {
          setError(`保存失败: ${msg}`);
        }
      }
    });
  };

  const handleReset = () => {
    setData(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://mp.weixin.qq.com/s/..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          disabled={loading || isPending}
        />
        <button
          onClick={handleFetch}
          disabled={loading || isPending}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {loading ? '抓取中...' : '开始抓取'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-2">{data.title}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>👤 {data.nickName || '未知公众号'}</span>
              {data.publishedAt && (
                <span>
                  📅{' '}
                  {new Date(data.publishedAt).toLocaleString('zh-CN', {
                    hour12: false,
                  })}
                </span>
              )}
              <span>📝 {data.content.length} 字符</span>
            </div>
            {data.desc && (
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{data.desc}</p>
            )}
            <div className="mt-2 text-xs text-slate-400 truncate">
              🔗 {data.sourceUrl}
            </div>
          </div>

          <div
            className="p-4 max-h-96 overflow-y-auto prose prose-sm prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />

          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="text-sm text-slate-600 flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              抓取成功，确认内容无误后保存
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={isPending}
                className="inline-flex items-center gap-1 bg-white text-slate-700 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重新抓
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isPending ? '保存中...' : '保存到草稿'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
