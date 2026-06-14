'use client';
import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

type Props = {
  scriptContent: string;
};

export function ScriptCopyBlock({ scriptContent }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(scriptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 兜底：选中整段让用户 Ctrl+C
      const ta = document.createElement('textarea');
      ta.value = scriptContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-300 font-mono">wechat-export-tampermonkey.js</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> 已复制，去 Tampermonkey 粘
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> 复制脚本
            </>
          )}
        </button>
      </div>
      <pre className="text-[11px] text-slate-300 p-3 overflow-x-auto max-h-48 overflow-y-auto font-mono leading-relaxed">
        {scriptContent}
      </pre>
    </div>
  );
}
