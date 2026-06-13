/**
 * 站内搜索日志清理工具
 *
 * 背景：
 * - v11.5 上线时残留 8 条测试数据（24 分钟内连刷 + 「asdfgh」测试键 + 3 次重复「亚马逊」）
 * - v11.9.1 部署后用唯一测试 keyword 验证 5 秒去重，验证完产生 1 条测试痕迹
 * - 这两类都是测试/验证痕迹，按数据真实性零容忍原则需要清理工具
 *
 * 用法：
 *   npx tsx scripts/clear-searchlog.ts                 # 预览（默认不删）
 *   npx tsx scripts/clear-searchlog.ts --dry-run      # 只看不删（同默认）
 *   npx tsx scripts/clear-searchlog.ts --yes           # 跳过确认实际删除
 *   npx tsx scripts/clear-searchlog.ts --before 2026-06-13  # 只清指定日期前
 *   npx tsx scripts/clear-searchlog.ts --reason "xxx"  # 自定义备份 reason
 *
 * 设计：
 * - 默认 dry-run 模式（必须 --yes 才真删，防误操作）
 * - 自动备份到 scripts/searchlog-clear-backup-{timestamp}.json
 * - 备份文件不入仓（untracked）
 * - 记录操作原因到备份 JSON
 * - 支持按 --before 过滤，避免误删最新数据
 *
 * 关联：
 * - lib/data/search-log.ts（v11.9.1 加 5 秒去重）
 * - scripts/news-clean-warejia.ts（同类清理工具，参考风格）
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const p = new PrismaClient();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isYes = args.includes('--yes');
const reasonIdx = args.indexOf('--reason');
const reason = reasonIdx >= 0 ? args[reasonIdx + 1] : 'SearchLog 清理（手动触发）';
const beforeIdx = args.indexOf('--before');
const beforeDate = beforeIdx >= 0 ? new Date(args[beforeIdx + 1]) : null;

async function main() {
  const where: any = {};
  if (beforeDate) where.createdAt = { lt: beforeDate };

  const items = await p.searchLog.findMany({ where, orderBy: { createdAt: 'asc' } });
  const total = await p.searchLog.count();

  console.log('========== 搜索日志清理工具 ==========');
  console.log(`模式：${isDryRun ? 'DRY-RUN（不实际删除）' : isYes ? '实际删除' : '预览（需 --yes 确认）'}`);
  console.log(`备份 reason：${reason}`);
  if (beforeDate) console.log(`过滤条件：createdAt < ${beforeDate.toISOString()}`);
  console.log(`当前总数：${total} 条`);
  console.log(`将影响：${items.length} 条`);
  if (items.length > 0) {
    const preview = items.slice(0, 30);
    console.log(`--- 预览${preview.length < items.length ? `前 ${preview.length} 条（总共 ${items.length} 条）` : `全部 ${items.length} 条`} ---`);
    for (const r of preview) {
      const noRes = r.noResult ? ' [无结果]' : '';
      console.log(`  id=${r.id}  ${JSON.stringify(r.keyword)}${noRes}  (${r.createdAt.toISOString()})`);
    }
  }

  if (isDryRun) {
    console.log('\n[DRY-RUN] 跳过实际删除');
    await p.$disconnect();
    return;
  }

  if (!isYes) {
    console.log('\n⚠️  实际删除需加 --yes 参数（防误操作）');
    await p.$disconnect();
    return;
  }

  // 实际清理：先备份再删
  const ts = Date.now();
  const backup = {
    ts: new Date(ts).toISOString(),
    reason,
    filter: beforeDate ? { createdAt: { lt: beforeDate.toISOString() } } : null,
    count: items.length,
    items,
  };
  const backupPath = `scripts/searchlog-clear-backup-${ts}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\nBACKUP_WRITTEN: ${backupPath} (${items.length} 条)`);

  const del = await p.searchLog.deleteMany({ where });
  console.log(`DELETED: ${del.count} 条`);

  const after = await p.searchLog.count();
  console.log(`REMAINING: ${after} 条`);
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
