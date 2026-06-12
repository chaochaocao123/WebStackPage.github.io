'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { refreshToolLogoAction, refreshAllLogosAction } from '@/app/admin/actions';

export function ToolRowRefreshButton({ toolId, toolName }: { toolId: number; toolName: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const r = await refreshToolLogoAction(toolId);
      if (r.success) {
        setResult({ ok: true, msg: `✓ ${r.source}` });
        setTimeout(() => setResult(null), 3000);
      } else {
        setResult({ ok: false, msg: r.error || '失败' });
        setTimeout(() => setResult(null), 5000);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={`刷新 ${toolName} 的 logo`}
      className="p-1.5 text-slate-400 hover:text-brand-600 disabled:opacity-50 relative"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
      {result && (
        <span className={`absolute left-full ml-1 whitespace-nowrap text-[10px] ${result.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
          {result.msg}
        </span>
      )}
    </button>
  );
}

export function BatchRefreshButton() {
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<{ done: number; total: number; success: number; failed: number } | null>(null);
  const [done, setDone] = useState<{ ok: boolean; msg: string; details?: string[] } | null>(null);

  const handleClick = () => {
    if (!confirm('批量刷新所有工具的 logo（Vercel 10s timeout 限制，每批最多 8 个）？')) return;
    setDone(null);
    setProgress({ done: 0, total: 0, success: 0, failed: 0 });

    startTransition(async () => {
      let totalSuccess = 0, totalFailed = 0, batches = 0;
      const allResults: string[] = [];

      // 多次跑直到完成（或 12 批 = 96 个上限）
      for (let i = 0; i < 12; i++) {
        const r = await refreshAllLogosAction(8);
        batches++;
        totalSuccess += r.success;
        totalFailed += r.failed;
        r.results.forEach(item => {
          if (item.success) allResults.push(`✓ [${item.id}] ${item.name} (${item.source})`);
          else allResults.push(`✗ [${item.id}] ${item.name}: ${item.error || item.source}`);
        });
        setProgress({ done: i + 1, total: r.total, success: totalSuccess, failed: totalFailed });

        if (r.total < 8) break; // 不到 1 批就完成
      }

      setDone({
        ok: totalFailed === 0,
        msg: `完成 ${batches} 批：成功 ${totalSuccess} 个，失败 ${totalFailed} 个`,
        details: allResults.length > 0 ? allResults : undefined,
      });
    });
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        批量刷新 logo
      </button>
      {progress && pending && (
        <div className="mt-2 text-xs text-slate-500">
          已跑 {progress.done} 批 · 累计成功 {progress.success} · 失败 {progress.failed}
        </div>
      )}
      {done && (
        <div className={`mt-2 text-xs flex items-start gap-1 ${done.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
          {done.ok ? <CheckCircle2 className="w-3 h-3 mt-0.5" /> : <XCircle className="w-3 h-3 mt-0.5" />}
          <div>
            <div>{done.msg}</div>
            {done.details && (
              <details className="mt-1 max-w-2xl">
                <summary className="cursor-pointer text-slate-500">查看详情</summary>
                <pre className="mt-1 text-[10px] bg-slate-50 p-2 rounded max-h-48 overflow-auto whitespace-pre-wrap">{done.details.join('\n')}</pre>
              </details>
            )}
          </div>
        </div>
      )}
    </>
  );
}
