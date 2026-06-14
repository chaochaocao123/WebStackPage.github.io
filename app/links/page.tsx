import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { getFriendLinksGroupedByCategory } from '@/lib/data/friend-links';

export const metadata: Metadata = {
  title: '友情链接 - 跨境工具说',
  description: '跨境工具说合作伙伴与友情链接，跨境电商导航、工具、资讯、ERP、物流等优质站点互链。',
  alternates: {
    canonical: 'https://kjgjs.cn/links',
  },
};

// 强制动态渲染（友链内容由曹总手动维护，需要实时显示）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LinksPage() {
  const grouped = await getFriendLinksGroupedByCategory();
  const categories = Object.keys(grouped).sort();
  const totalCount = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 顶部标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">友情链接</h1>
          <p className="text-slate-600 text-sm">
            跨境工具说合作伙伴与友情链接，覆盖跨境电商导航、工具、资讯、ERP、物流等优质站点。
          </p>
        </div>

        {/* 顶部公告条 — 参考 amz123 风格 */}
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-8">
          <div className="text-sm text-brand-800">
            <span className="font-medium">📢 互换友链合作：</span>
            欢迎与跨境电商导航、工具、资讯、ERP、物流等优质站点互换链接。
            联系微信：<span className="font-mono font-medium">kjgjs2026</span>（备注：友情链接）
          </div>
        </div>

        {totalCount === 0 ? (
          /* 空状态 */
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <ExternalLink className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-1">暂无友情链接</p>
            <p className="text-sm text-slate-400">曹总正在对接中，敬请期待</p>
          </div>
        ) : (
          /* 分组卡片网格 */
          <div className="space-y-8">
            {categories.map((category) => (
              <section key={category}>
                {/* 分组标题 */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">{category}</h2>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">{grouped[category].length} 个</span>
                </div>

                {/* 友链卡片网格（6 列，参考 amz123） */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {grouped[category].map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={link.description || link.name}
                      className="group bg-white border border-slate-200 rounded-lg px-3 py-4 hover:border-brand-400 hover:shadow-sm hover:bg-brand-50/30 transition flex items-center justify-center min-h-[60px]"
                    >
                      {link.logo ? (
                        /* 有 logo：显示 logo + 名称 */
                        <div className="flex items-center gap-2 w-full min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={link.logo}
                            alt={link.name}
                            className="w-6 h-6 object-contain flex-shrink-0"
                            loading="lazy"
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-brand-600 truncate">
                            {link.name}
                          </span>
                        </div>
                      ) : (
                        /* 无 logo：纯文字 */
                        <span className="text-sm font-medium text-slate-700 group-hover:text-brand-600 text-center">
                          {link.name}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* 底部说明 */}
        {totalCount > 0 && (
          <div className="mt-12 text-center text-xs text-slate-400">
            友情链接共 {totalCount} 个 · 最后更新 {new Date().toLocaleDateString('zh-CN')}
          </div>
        )}
      </div>
    </div>
  );
}
