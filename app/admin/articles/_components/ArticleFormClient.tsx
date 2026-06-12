'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Tag as TagIcon,
  Hash,
  FileText,
  Link2,
  Image as ImageIcon,
} from 'lucide-react';

const SITE_URL = 'https://kjgjs.cn';

/** 从标题生成 URL slug（保留 ASCII + 数字，空格转 -） */
function autoSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]+/g, '')   // 去非 ASCII 字母数字
    .replace(/\s+/g, '-')              // 空格转 -
    .replace(/-+/g, '-')               // 合并连续 -
    .replace(/^-+|-+$/g, '')           // 去首尾 -
    .slice(0, 60);
}

/** 从 HTML content 抽取纯文本前 N 字（用于自动 excerpt） */
function autoExcerpt(html: string, maxLen = 160): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .replace(/[，。！？、：；]?\s*$/, '') + (html.length > maxLen ? '…' : '');
}

/** 统计关键词密度（焦点关键词在 title/excerpt/content 中总出现次数） */
function keywordDensity(keyword: string, fields: string[]): { count: number; density: string } {
  if (!keyword.trim()) return { count: 0, density: '0%' };
  const kw = keyword.trim().toLowerCase();
  const total = fields.join(' ').toLowerCase();
  const count = (total.match(new RegExp(escapeRegExp(kw), 'g')) || []).length;
  const totalLen = total.replace(/\s/g, '').length || 1;
  const density = ((count * kw.length) / totalLen * 100).toFixed(1);
  return { count, density: density + '%' };
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type InitialData = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  category: string;
  author: string;
  tags: string;
  viewCount?: number;
};

type Props = {
  /** 编辑模式 = article object；新建模式 = null */
  initialData: InitialData | null;
  formAction: (formData: FormData) => Promise<void>;
  /** 编辑模式才传 */
  deleteAction?: (formData: FormData) => Promise<void>;
};

export function ArticleFormClient({ initialData, formAction, deleteAction }: Props) {
  const isEdit = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugAuto, setSlugAuto] = useState(!isEdit); // 新建：自动；编辑：保留原始
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [excerptAuto, setExcerptAuto] = useState(!isEdit); // 新建：自动
  const [content, setContent] = useState(initialData?.content || '');
  const [cover, setCover] = useState(initialData?.cover || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [author, setAuthor] = useState(initialData?.author || '跨境工具说');
  const [tags, setTags] = useState(initialData?.tags || '');
  const [focusKeyword, setFocusKeyword] = useState('');

  // 标题变化时，自动更新 slug（如果 slugAuto 开启）
  useEffect(() => {
    if (slugAuto && !isEdit) {
      setSlug(autoSlug(title));
    }
  }, [title, slugAuto, isEdit]);

  // content 变化时，自动更新 excerpt（如果 excerptAuto 开启）
  useEffect(() => {
    if (excerptAuto && !isEdit) {
      setExcerpt(autoExcerpt(content, 160));
    }
  }, [content, excerptAuto, isEdit]);

  // 标题变化时，自动推断 focus keyword（取 tags 第一个或 title 前几个非停用词）
  useEffect(() => {
    if (!focusKeyword && tags) {
      const firstTag = tags.split(',')[0]?.trim();
      if (firstTag) setFocusKeyword(firstTag);
    }
  }, [tags, focusKeyword]);

  // SEO 计算
  const titleLen = title.length;
  const excerptLen = excerpt.length;
  const contentLen = content.replace(/<[^>]+>/g, '').replace(/\s/g, '').length;
  const density = useMemo(
    () => keywordDensity(focusKeyword, [title, excerpt, content]),
    [focusKeyword, title, excerpt, content]
  );

  // 颜色指示
  const titleColor =
    titleLen === 0 ? 'text-slate-400' :
    titleLen < 30 ? 'text-orange-500' :     // 太短
    titleLen > 60 ? 'text-red-500' :        // 会被截断
    'text-green-600';                        // 黄金区间

  const excerptColor =
    excerptLen === 0 ? 'text-slate-400' :
    excerptLen < 80 ? 'text-orange-500' :    // 太短
    excerptLen > 160 ? 'text-red-500' :      // 会被截断
    'text-green-600';

  const slugWarn =
    !slug ? 'slug 不能为空' :
    /[^\x00-\x7F]+/.test(slug) ? 'slug 含中文，URL 不优雅（建议用英文）' :
    slug.length > 60 ? 'slug 过长' :
    null;

  return (
    <div>
      {/* 顶栏 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/articles" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? '编辑文章' : '写文章'}
        </h1>
        {isEdit && initialData?.id && (
          <span className="text-sm text-slate-500">ID: {initialData.id}</span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：表单（占 2/3） */}
        <div className="lg:col-span-2">
          <form action={formAction} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {/* 标题 + 自动 slug */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                <span>标题 <span className="text-red-500">*</span></span>
                <span className={`text-xs font-normal ${titleColor}`}>
                  {titleLen} 字符（推荐 30-60）
                </span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：亚马逊 FBA 费用 2026 最新计算公式"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                <span>
                  Slug <span className="text-red-500">*</span>
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlugAuto(v => !v);
                        if (!slugAuto) setSlug(autoSlug(title));
                      }}
                      className="ml-2 text-xs text-brand-600 hover:underline font-normal"
                    >
                      {slugAuto ? '✓ 自动' : '手动'}
                    </button>
                  )}
                </span>
                <span className={`text-xs font-normal ${slugWarn ? 'text-orange-500' : 'text-slate-400'}`}>
                  {slug.length} 字符
                </span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 font-mono whitespace-nowrap">
                  {SITE_URL}/articles/
                </span>
                <input
                  type="text"
                  name="slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugAuto(false);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono text-sm"
                  placeholder="url-slug"
                />
              </div>
              {slugWarn && (
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {slugWarn}
                </p>
              )}
            </div>

            {/* 摘要 + 自动 excerpt */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                <span>
                  摘要 <span className="text-red-500">*</span>
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setExcerptAuto(v => !v);
                        if (!excerptAuto) setExcerpt(autoExcerpt(content, 160));
                      }}
                      className="ml-2 text-xs text-brand-600 hover:underline font-normal"
                    >
                      {excerptAuto ? '✓ 自动' : '手动'}
                    </button>
                  )}
                </span>
                <span className={`text-xs font-normal ${excerptColor}`}>
                  {excerptLen} 字符（推荐 80-160）
                </span>
              </label>
              <textarea
                name="excerpt"
                required
                rows={3}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  setExcerptAuto(false);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                placeholder="文章摘要，用于列表页卡片和 meta description（留空将从内容自动提取）"
              />
            </div>

            {/* 内容（HTML） */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                <span>正文（支持 HTML）</span>
                <span className="text-xs font-normal text-slate-400">
                  纯文本 {contentLen} 字符
                </span>
              </label>
              <textarea
                name="content"
                rows={18}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none font-mono text-sm"
                placeholder="<h2>一、亚马逊新规要点</h2>&#10;<p>正文内容...</p>&#10;<h2>二、卖家应对方案</h2>&#10;<p>...</p>"
              />
              <p className="text-xs text-slate-500 mt-1">
                支持 HTML 标签（h2/h3/p/ul/ol/li/strong/em/a/img/blockquote）
              </p>
            </div>

            {/* 分类 + 作者 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                <input
                  type="text"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="例如：亚马逊运营"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">作者</label>
                <input
                  type="text"
                  name="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* 标签 + 浏览量（仅编辑） */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  标签 <span className="text-xs text-slate-500 font-normal">（逗号分隔）</span>
                </label>
                <input
                  type="text"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="亚马逊, FBA, 费用"
                />
              </div>
              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">浏览量</label>
                  <input
                    type="number"
                    name="viewCount"
                    defaultValue={initialData?.viewCount || 0}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* 封面图 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">封面图 URL</label>
              <input
                type="url"
                name="cover"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                <Save className="w-4 h-4" />
                {isEdit ? '保存修改' : '发布'}
              </button>
              <Link
                href="/admin/articles"
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
                取消
              </Link>
            </div>
          </form>
        </div>

        {/* 右侧：SEO 实时预览（占 1/3） */}
        <div className="space-y-4">
          {/* Google 搜索结果模拟 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Google 搜索结果预览
            </div>
            <div className="space-y-1">
              <div className="text-xs text-green-700 truncate">
                {SITE_URL}/articles/{slug || 'url-slug'}
              </div>
              <h3 className="text-lg text-blue-600 leading-snug line-clamp-2 hover:underline cursor-pointer">
                {title || '文章标题将显示在这里'}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                {excerpt || '文章摘要将显示在这里，建议 80-160 字，包含焦点关键词。'}
              </p>
            </div>
          </div>

          {/* SEO 检查清单 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Check className="w-3.5 h-3.5" />
              SEO 检查清单
            </div>

            <Checklist
              ok={titleLen >= 30 && titleLen <= 60}
              label={`标题长度（${titleLen}/60）`}
              warn={titleLen < 30 ? '建议 30-60 字' : titleLen > 60 ? '会被截断' : ''}
            />
            <Checklist
              ok={excerptLen >= 80 && excerptLen <= 160}
              label={`摘要长度（${excerptLen}/160）`}
              warn={excerptLen < 80 ? '建议 80-160 字' : excerptLen > 160 ? '会被截断' : ''}
            />
            <Checklist
              ok={contentLen >= 600}
              label={`正文长度（${contentLen} 字符）`}
              warn={contentLen < 600 ? '建议 ≥ 600 字利于 SEO' : '优秀'}
            />
            <Checklist
              ok={!!slug && !slugWarn}
              label="URL slug 合法"
              warn={slugWarn || '优秀'}
            />
            <Checklist
              ok={!!category}
              label="分类已设置"
              warn={category ? '优秀' : '建议填写'}
            />
            <Checklist
              ok={!!cover}
              label="封面图已设置"
              warn={cover ? '优秀（影响 OG image）' : '建议填写，社交分享更好看'}
            />
            <Checklist
              ok={!!tags}
              label="标签已设置"
              warn={tags ? '优秀' : '建议 3-5 个关键词'}
            />
          </div>

          {/* 关键词密度 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              焦点关键词
            </div>
            <input
              type="text"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="留空用 tags 第一个"
            />
            {focusKeyword && (
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">出现次数</span>
                  <span className="font-mono font-semibold">{density.count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">密度</span>
                  <span className={`font-mono font-semibold ${
                    parseFloat(density.density) < 0.5 ? 'text-orange-500' :
                    parseFloat(density.density) > 3 ? 'text-red-500' :
                    'text-green-600'
                  }`}>
                    {density.density}（推荐 1-2%）
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 自动生成的 JSON-LD 提示 */}
          <div className="bg-gradient-to-br from-brand-50 to-orange-50 rounded-xl border border-brand-200 p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-brand-700 mb-1">
              <Hash className="w-3.5 h-3.5" />
              发布后自动生成
            </div>
            <div className="text-xs text-slate-700 space-y-1.5">
              <div>✓ Article JSON-LD（headline/datePublished/author/publisher）</div>
              <div>✓ BreadcrumbList JSON-LD（首页 / 精选文章 / 标题）</div>
              <div>✓ 动态 OG image（标题 + 分类 + 作者 + 描述）</div>
              <div>✓ canonical URL（避免重复内容）</div>
            </div>
            <p className="text-xs text-slate-500 pt-2 border-t border-brand-200">
              以上 SEO 元数据无需手动填写，发布时系统自动注入。
            </p>
          </div>
        </div>
      </div>

      {/* 编辑模式才有删除按钮（在新表单外） */}
      {isEdit && deleteAction && initialData?.id && (
        <DeleteSection
          formAction={deleteAction}
          id={initialData.id}
        />
      )}
    </div>
  );
}

function Checklist({ ok, label, warn }: { ok: boolean; label: string; warn: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`mt-0.5 flex-shrink-0 ${ok ? 'text-green-600' : 'text-slate-300'}`}>
        {ok ? <Check className="w-3.5 h-3.5" /> : <span className="block w-3.5 h-3.5 rounded-full border-2 border-slate-300" />}
      </span>
      <div className="flex-1">
        <div className={`font-medium ${ok ? 'text-slate-700' : 'text-slate-500'}`}>{label}</div>
        {warn && <div className="text-slate-400 text-[11px] mt-0.5">{warn}</div>}
      </div>
    </div>
  );
}

function DeleteSection({ formAction, id }: { formAction: (formData: FormData) => Promise<void>; id: number }) {
  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <h3 className="text-sm font-semibold text-red-700 mb-2">危险操作</h3>
        <p className="text-xs text-slate-600 mb-3">删除后无法恢复，包括 sitemap、JSON-LD、og:image 全部失效。</p>
        <form action={formAction}>
          <button
            type="submit"
            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
          >
            删除文章
          </button>
        </form>
      </div>
    </div>
  );
}
