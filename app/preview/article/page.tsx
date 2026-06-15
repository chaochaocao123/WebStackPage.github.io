/**
 * v11.32.1 文章预览页（实时）
 * v11.32.2 修复：用 localStorage 跨标签共享（sessionStorage 是每个标签页独立 session）
 *
 * 目的：解决 v11.32 "新窗口打开看完整"链接跳 /articles/{slug} 在新建/草稿状态 404 的问题
 *
 * 设计：
 * - 放根路由 /preview/article（不在 admin 下），复用前台 Header/Footer 布局
 * - 数据从 localStorage 读（'kjgjs_article_preview'），跨标签同源可读
 * - 编辑页 onClick 时把当前所有字段写 localStorage，新窗口可读
 * - 不写 JSON-LD（避免假页面被百度收录）
 * - 不更新 viewCount
 * - 不显示推荐工具（避免与当前内容不匹配）
 * - 顶部加醒目"预览模式"提示条 + "返回编辑"链接
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag as TagIcon,
  Eye,
  AlertTriangle,
  PencilLine,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { proxifyImgUrl, proxifyWechatImagesInHtml } from '@/lib/article-content-render';

type PreviewData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  category: string;
  author: string;
  tags: string; // 逗号分隔字符串
  publishedAt: string; // ISO
  status: string;
  isReposted: boolean;
  sourceUrl: string;
};

const SESSION_KEY = 'kjgjs_article_preview';

function parseTags(s: string): string[] {
  if (!s) return [];
  return s.split(',').map((t) => t.trim()).filter(Boolean);
}

export default function ArticlePreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          setData(JSON.parse(raw));
        }
      } catch (e) {
        console.error('[preview] parse localStorage failed', e);
      }
      setLoaded(true);
    };
    load();
    // v11.32.2 实时：编辑页改字段后再点预览时，新窗口能拿到最新数据
    // 加 storage 事件监听，编辑页 setItem 时本窗口也能响应（如果编辑和预览都在新窗口打开的场景）
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === SESSION_KEY || ev.key === null) load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 初始加载中：避免 hydration mismatch
  if (!loaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
          <p className="text-slate-400 text-center py-20">加载中…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // 没有数据：让用户回到编辑页
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
            <div className="font-medium mb-2">⚠️ 没有可预览的内容</div>
            <p className="mb-4">
              请先在文章编辑页填写内容，然后点击右侧预览卡片中的"新窗口打开看完整"链接。
            </p>
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-900 underline"
            >
              <ArrowLeft className="w-4 h-4" />
              返回文章管理
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tags = parseTags(data.tags);
  const coverProxy = proxifyImgUrl(data.cover);

  // 发布时间（v11.32 草稿未发布时 publishedAt 可能空）
  const publishedAtStr = data.publishedAt
    ? new Date(data.publishedAt).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* v11.32.1 预览模式提示条（醒目位置，新窗口打开第一眼看到） */}
      <div className="bg-amber-100 border-b-2 border-amber-300 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-amber-900">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">
              预览模式 · {data.status === 'draft' ? '草稿（前台不可见）' : '已发布（前台可见）'}
            </span>
            {!data.title && (
              <span className="text-xs text-amber-700">· 标题为空</span>
            )}
            {!data.slug && (
              <span className="text-xs text-amber-700">· slug 为空</span>
            )}
          </div>
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-1.5 text-sm text-amber-800 hover:text-amber-900 underline"
          >
            <PencilLine className="w-3.5 h-3.5" />
            返回编辑
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* 面包屑（与真实详情页一致） */}
        <Breadcrumb
          truncateLast
          items={[
            { name: '首页', href: '/' },
            { name: '精选文章', href: '/articles' },
            { name: data.title || '（未命名）' },
          ]}
        />

        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回编辑
        </Link>

        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            {data.category && (
              <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium mb-3">
                {data.category}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {data.title || '（未命名文章）'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-4">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {data.author || '匿名'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {publishedAtStr}
              </span>
              {data.status === 'draft' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                  草稿
                </span>
              )}
              {data.isReposted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                  转载
                </span>
              )}
            </div>
            {data.excerpt && (
              <p className="mt-5 text-slate-600 leading-relaxed text-base border-l-4 border-brand-200 pl-4 bg-brand-50/30 py-3">
                {data.excerpt}
              </p>
            )}
          </div>

          {coverProxy && (
            <div className="bg-slate-50">
              <img
                src={coverProxy}
                alt={data.title || '封面图'}
                className="w-full max-h-[480px] object-contain mx-auto"
                loading="lazy"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {data.content ? (
              <div
                className="news-content prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: proxifyWechatImagesInHtml(data.content) }}
              />
            ) : (
              <p className="text-slate-400 italic text-center py-8">（正文为空）</p>
            )}

            {tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <TagIcon className="w-4 h-4 text-slate-400" />
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm">
            <Link href="/admin/articles" className="text-slate-500 hover:text-brand-600">
              ← 返回编辑
            </Link>
            {data.sourceUrl && (
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-brand-600"
              >
                查看原文 →
              </a>
            )}
          </div>
        </article>

        {/* 转载声明（与真实详情页一致） */}
        {data.isReposted && data.sourceUrl && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <div className="font-medium mb-1">转载声明</div>
                <p>
                  本文为转载文章，原文著作权归原作者所有。
                  原文链接：
                  <a
                    href={data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 underline hover:text-amber-900 break-all"
                  >
                    {data.sourceUrl}
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* v11.32.1 预览页底部说明：避免曹总误以为是发布后效果 */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>这是 v11.32.1 实时预览（基于当前编辑页内容，不影响数据库）</p>
          <p className="mt-1">
            slug 预览：<code className="bg-slate-100 px-1.5 py-0.5 rounded">/articles/{data.slug || '（未填）'}</code>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
