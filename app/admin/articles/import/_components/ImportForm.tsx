'use client';

import { useState, useTransition } from 'react';
import { Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { importWechatArticle } from '../actions';

export function ImportForm() {
  const [html, setHtml] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const charCount = html.length;
  const sizeMB = (charCount / 1024 / 1024).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!html.trim()) {
      setError('请粘贴公众号文章 HTML 源码');
      return;
    }
    if (charCount > 5_000_000) {
      setError(`HTML 太大（${sizeMB} MB > 5MB），请确认复制的是文章页而不是整站`);
      return;
    }

    const formData = new FormData();
    formData.set('html', html);
    formData.set('sourceUrl', sourceUrl);

    startTransition(async () => {
      const result = await importWechatArticle(formData);
      if (result && !result.ok) {
        setError(result.error);
      }
      // 成功时 server action 已经 redirect 了，不会到这一步
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      {/* 原文链接（可选） */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
          <span>
            <ExternalLink className="w-4 h-4 inline mr-1" />
            原文链接（可选）
          </span>
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://mp.weixin.qq.com/s/xxx（仅用于 source 字段记录）"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          填了会写入 source 字段；不填默认「微信公众号」
        </p>
      </div>

      {/* HTML 源码 */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
          <span>
            <Sparkles className="w-4 h-4 inline mr-1" />
            公众号文章 HTML 源码 <span className="text-red-500">*</span>
          </span>
          <span className={`text-xs font-normal ${charCount > 5_000_000 ? 'text-red-500' : 'text-slate-400'}`}>
            {charCount.toLocaleString()} 字符 / {sizeMB} MB
          </span>
        </label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={16}
          placeholder={`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta property="og:title" content="..." />
  ...
</head>
<body>
  <div id="js_content">
    <!-- 公众号正文 HTML -->
  </div>
</body>
</html>`}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-xs font-mono resize-y"
        />
        <p className="text-xs text-slate-500 mt-1">
          💡 复制技巧：在公众号文章页按 F12 → Elements 标签 → 在 <code className="px-1 bg-slate-100 rounded">&lt;html&gt;</code> 节点上
          <strong>右键 → Copy → Copy outerHTML</strong>
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {/* 提交按钮 */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">
          ⚠️ 解析后会自动创建草稿，跳转到编辑页让你人工审核
        </p>
        <button
          type="submit"
          disabled={isPending || !html.trim()}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              解析中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              解析并预览
            </>
          )}
        </button>
      </div>
    </form>
  );
}
