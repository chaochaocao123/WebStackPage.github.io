// 清洗 News 表中残留的"卖家之家"字眼
// 背景：v11.8 清理了 UI 层的"卖家之家"来源标签，但漏掉了 mjzj 抓取的原始 title 前缀
//       以及代码层 mjzj 硬编码 → 全部要清洗
// 规则：
//   - 去掉 title 前缀："卖家之家早讯 | " / "卖家之家晚讯 | " / "卖家之家午讯 | " / "卖家之家 | " / "[卖家之家] "
//   - 只处理 sourceType='crawl' AND source='mjzj' 的记录（不动手动发布）
//   - 不动 content（正文中可能引用了，不动）
//   - 不动 source 字段（保持 mjzj）
//   - 支持 --dry-run 预览（不写 DB）
// 用法：npx tsx scripts/news-clean-warejia.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

// 清洗规则：按"长前缀优先"顺序排列，避免短规则吃掉长前缀
const TITLE_PREFIX_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: '早讯', pattern: /^卖家之家早讯\s*[|｜]\s*/ },
  { name: '晚讯', pattern: /^卖家之家晚讯\s*[|｜]\s*/ },
  { name: '午讯', pattern: /^卖家之家午讯\s*[|｜]\s*/ },
  { name: '通用 | ', pattern: /^卖家之家\s*[|｜]\s*/ },
  { name: '[卖家之家]', pattern: /^\[\s*卖家之家\s*\][\s:：]*/ },
  { name: '（卖家之家）', pattern: /^[（(]\s*卖家之家\s*[)）][\s:：]*/ },
];

interface CleanChange {
  id: number;
  url: string;
  from: string;
  to: string;
  pattern: string;
}

function cleanTitle(original: string): { cleaned: string; matchedName: string } | null {
  for (const { name, pattern } of TITLE_PREFIX_PATTERNS) {
    if (pattern.test(original)) {
      const cleaned = original.replace(pattern, '').trim();
      if (cleaned && cleaned !== original) {
        return { cleaned, matchedName: name };
      }
    }
  }
  return null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`\n========== [news-clean-warejia] ==========`);
  console.log(`模式: ${dryRun ? '🟡 DRY-RUN（不写 DB）' : '🔴 正式执行（写 DB）'}`);
  console.log(`时间: ${new Date().toISOString()}\n`);

  // 1. 扫描
  const all = await p.news.findMany({
    where: { sourceType: 'crawl', source: 'mjzj' },
    select: { id: true, title: true, url: true, publishedAt: true },
  });
  console.log(`📊 扫描 mjzj 来源资讯: ${all.length} 条`);

  // 2. 分析
  const changes: CleanChange[] = [];
  const skipped: { id: number; title: string }[] = [];
  for (const row of all) {
    const r = cleanTitle(row.title);
    if (r) {
      changes.push({
        id: row.id,
        url: row.url,
        from: row.title,
        to: r.cleaned,
        pattern: r.matchedName,
      });
    } else {
      skipped.push({ id: row.id, title: row.title });
    }
  }

  console.log(`✏️  待清洗: ${changes.length} 条`);
  console.log(`✅ 无需清洗: ${skipped.length} 条\n`);

  if (changes.length === 0) {
    console.log('🎉 无残留，DB 已干净');
    return;
  }

  // 3. 按 pattern 统计
  const patternStats: Record<string, number> = {};
  for (const c of changes) {
    patternStats[c.pattern] = (patternStats[c.pattern] || 0) + 1;
  }
  console.log('📈 清洗分布:');
  for (const [k, v] of Object.entries(patternStats)) {
    console.log(`   - ${k}: ${v} 条`);
  }
  console.log('');

  // 4. 打印前 10 条预览
  console.log('🔍 前 10 条预览:');
  for (const c of changes.slice(0, 10)) {
    console.log(`   [${c.id}]`);
    console.log(`     旧: ${c.from}`);
    console.log(`     新: ${c.to}  (去前缀: ${c.pattern})`);
  }
  if (changes.length > 10) {
    console.log(`   ... 还有 ${changes.length - 10} 条\n`);
  } else {
    console.log('');
  }

  // 5. dry-run 直接退出
  if (dryRun) {
    console.log('🟡 DRY-RUN 完成。正式执行去掉 --dry-run 参数。');
    return;
  }

  // 6. 备份（写入 .json 文件，方便回滚）
  const backup = {
    ts: new Date().toISOString(),
    count: changes.length,
    items: changes.map((c) => ({
      id: c.id,
      url: c.url,
      oldTitle: c.from,
      newTitle: c.to,
    })),
  };
  const backupFile = `scripts/news-clean-warejia-backup-${Date.now()}.json`;
  const fs = await import('fs');
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`💾 备份: ${backupFile}\n`);

  // 7. 正式更新
  console.log('🚀 开始更新 DB...');
  let success = 0;
  let failed = 0;
  for (const c of changes) {
    try {
      await p.news.update({ where: { id: c.id }, data: { title: c.to } });
      success++;
    } catch (e: any) {
      console.error(`   [${c.id}] 失败: ${e.message}`);
      failed++;
    }
  }
  console.log(`\n✅ 完成: 成功 ${success}，失败 ${failed}`);

  // 8. 复检
  const remain = await p.news.count({
    where: {
      sourceType: 'crawl',
      source: 'mjzj',
      title: { contains: '卖家之家' },
    },
  });
  console.log(`🔎 复检残留: ${remain} 条${remain === 0 ? ' 🎉' : ' ⚠️ 仍有残留'}`);
}

main()
  .catch((e) => {
    console.error('❌ 异常:', e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
