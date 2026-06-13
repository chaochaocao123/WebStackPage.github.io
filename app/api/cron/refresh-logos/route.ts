// 工具 logo 失效自动修复 Cron Job
// 策略：HEAD 验证 → 失败用 fetchFavicon 三级 fallback 重新抓
// 频率：每周一 0:00 北京时间（UTC 周日 16:00）跑一次
// 限制：Hobby plan 10s timeout / Pro 60s，单次最多处理 30 个 HEAD + 3 个重抓
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchFavicon } from '@/lib/data/logo-fetcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEAD_TIMEOUT = 5000;       // HEAD 验证超时 5s
const MAX_BATCH_VERIFY = 30;     // 单次最多 HEAD 验证 30 个
const MAX_BATCH_REFETCH = 3;     // 单次最多重抓 3 个（防止超时）
const CONCURRENCY = 6;           // HEAD 并发数

interface BrokenLogo {
  id: number;
  name: string;
  url: string;
  oldLogo: string;
  reason: string;
}

async function headCheck(logoUrl: string): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), HEAD_TIMEOUT);
  try {
    const r = await fetch(logoUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (r.ok) {
      const cl = parseInt(r.headers.get('content-length') || '0', 10);
      if (cl > 0 && cl > 500 * 1024) return { ok: false, status: r.status, reason: `too-large(${cl}B)` };
      return { ok: true, status: r.status };
    }
    return { ok: false, status: r.status, reason: `http-${r.status}` };
  } catch (e: any) {
    return { ok: false, reason: e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network') };
  } finally {
    clearTimeout(tid);
  }
}

export async function GET() {
  const startTime = Date.now();
  const stamp = new Date().toISOString();
  console.log(`[Cron refresh-logos] 启动 ${stamp}`);

  try {
    // 1) 拉所有有 logo 的 tool（只取必要字段，省内存）
    const tools = await prisma.tool.findMany({
      where: { logo: { not: null } },
      select: { id: true, name: true, url: true, logo: true },
      take: MAX_BATCH_VERIFY,
    });

    console.log(`[Cron refresh-logos] 候选 tool: ${tools.length} 个`);

    // 2) 并发 HEAD 验证
    const results: { id: number; name: string; oldLogo: string; status: 'ok' | 'broken'; reason?: string }[] = [];
    let cursor = 0;
    async function worker() {
      while (cursor < tools.length) {
        const i = cursor++;
        const t = tools[i];
        if (!t.logo) continue;
        const r = await headCheck(t.logo);
        results.push({
          id: t.id,
          name: t.name,
          oldLogo: t.logo,
          status: r.ok ? 'ok' : 'broken',
          reason: r.reason,
        });
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    const broken = results.filter(r => r.status === 'broken');
    const ok = results.filter(r => r.status === 'ok');
    console.log(`[Cron refresh-logos] HEAD 验证完成: ok=${ok.length}, broken=${broken.length}`);

    // 3) 对失效的 logo 重新抓（限制数量防超时）
    const refetchTargets = broken.slice(0, MAX_BATCH_REFETCH).map(b => {
      const t = tools.find(x => x.id === b.id)!;
      return { id: b.id, name: b.name, url: t.url, oldLogo: b.oldLogo, reason: b.reason };
    });

    const refetchResults: { id: number; name: string; success: boolean; newLogo: string | null; source?: string; error?: string }[] = [];
    for (const t of refetchTargets) {
      try {
        const r = await fetchFavicon(t.url);
        if (r.url) {
          await prisma.tool.update({ where: { id: t.id }, data: { logo: r.url } });
          refetchResults.push({ id: t.id, name: t.name, success: true, newLogo: r.url, source: r.source });
          console.log(`[Cron refresh-logos] ✅ ${t.name}: ${t.oldLogo} → ${r.url} (${r.source})`);
        } else {
          refetchResults.push({ id: t.id, name: t.name, success: false, newLogo: null, source: r.source, error: r.error });
          console.warn(`[Cron refresh-logos] ❌ ${t.name}: 重抓失败 (${r.source}, ${r.error})`);
        }
      } catch (e: any) {
        refetchResults.push({ id: t.id, name: t.name, success: false, newLogo: null, error: e?.message });
        console.error(`[Cron refresh-logos] ❌ ${t.name}: 异常 ${e?.message}`);
      }
    }

    const fixed = refetchResults.filter(r => r.success).length;
    const unfixed = refetchResults.filter(r => !r.success).length;
    const remainBroken = broken.length - refetchTargets.length; // 本次没处理的失效（下次 cron 再处理）

    const elapsed = Date.now() - startTime;
    const summary = {
      success: true,
      ts: stamp,
      elapsedMs: elapsed,
      scanned: tools.length,
      ok: ok.length,
      broken: broken.length,
      refetched: refetchResults.length,
      fixed,
      unfixed,
      remainBroken,
      nextRun: remainBroken > 0 ? '下次 cron 继续处理' : '全部完成',
    };
    console.log(`[Cron refresh-logos] 总结`, summary);

    return NextResponse.json({
      ...summary,
      refetchDetails: refetchResults,
      brokenList: broken.map(b => ({ id: b.id, name: b.name, oldLogo: b.oldLogo, reason: b.reason })),
    });
  } catch (e: any) {
    console.error(`[Cron refresh-logos] 异常:`, e);
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}
