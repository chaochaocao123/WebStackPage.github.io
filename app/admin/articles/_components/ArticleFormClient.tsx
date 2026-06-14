'use client';

import { useState, useMemo, useEffect, useRef, useTransition } from 'react';
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
  Send,
  Eye,
  Upload,
  Loader2,
  Calendar,
  User,
  Tag as TagLg,
  PencilLine,
  FileEdit,
  ExternalLink,
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { proxifyImgUrl, proxifyWechatImagesInHtml } from '@/lib/article-content-render';

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
  // v11.21 SEO 分批管理
  isReposted?: boolean;
  sourceUrl?: string | null;
  baiduPushedAt?: string | null;
  // v11.32 草稿状态
  status?: 'draft' | 'published' | string;
};

type Props = {
  /** 编辑模式 = article object；新建模式 = null */
  initialData: InitialData | null;
  formAction: (formData: FormData) => Promise<void>;
  /** v11.32 草稿按钮专用 action：新建模式传 saveAsDraft，编辑已发布传 revertToDraft */
  draftAction?: (formData: FormData) => Promise<void>;
  /** 编辑模式才传 */
  deleteAction?: (formData: FormData) => Promise<void>;
  /** v11.21 编辑模式才传：百度主动推送 action */
  pushToBaiduAction?: (articleId: number) => Promise<{
    ok: boolean;
    message: string;
    pushedAt?: string;
    detail?: string;
    baiduRemain?: number;
    remainingToday?: number;
  }>;
  /** v11.28 百度推送 quota 初始值（编辑页进入时由 server 拉一次） */
  baiduQuotaInitial?: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
    hasBaiduToken: boolean;
  };
};

export function ArticleFormClient({ initialData, formAction, draftAction, deleteAction, pushToBaiduAction, baiduQuotaInitial }: Props) {
  const isEdit = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugAuto, setSlugAuto] = useState(!isEdit); // 新建：自动；编辑：保留原始
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [excerptAuto, setExcerptAuto] = useState(!isEdit); // 新建：自动
  const [content, setContent] = useState(initialData?.content || '');
  const [cover, setCover] = useState(initialData?.cover || '');
  // v11.32 封面图上传
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(initialData?.category || '');
  const [author, setAuthor] = useState(initialData?.author || '跨境工具说');
  const [tags, setTags] = useState(initialData?.tags || '');
  const [focusKeyword, setFocusKeyword] = useState('');
  // v11.32 草稿状态：编辑模式从 initialData 读，新建模式默认 'published'
  const [status, setStatus] = useState<'draft' | 'published'>(
    (initialData?.status === 'draft' ? 'draft' : 'published') as 'draft' | 'published'
  );
  // v11.21 SEO 分批管理 state
  // 默认 false = kjgjs 首发（self-canonical）；勾选 = 转载
  const [isReposted, setIsReposted] = useState(initialData?.isReposted || false);
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '');
  // 百度推送状态
  const [baiduPushedAt, setBaiduPushedAt] = useState<string | null>(initialData?.baiduPushedAt || null);
  const [pushPending, startPushTransition] = useTransition();
  const [pushResult, setPushResult] = useState<{
    ok: boolean;
    message: string;
    detail?: string;
    baiduRemain?: number;
    remainingToday?: number;
  } | null>(null);
  // v11.28 百度 quota 状态
  const [baiduQuota, setBaiduQuota] = useState(baiduQuotaInitial);
  const [quotaTick, setQuotaTick] = useState(0);  // 距重置倒计时刷新用

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

  // v11.28 百度 quota：每 30 秒刷新一次 + 每分钟刷倒计时
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    const fetchQuota = async () => {
      try {
        const res = await fetch('/api/baidu/quota', { cache: 'no-store' });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setBaiduQuota(data);
        }
      } catch { /* 静默失败，不打扰用户 */ }
    };
    fetchQuota();
    const id = setInterval(fetchQuota, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isEdit, pushPending]); // pushPending 变化时（推送完成）立即刷新

  useEffect(() => {
    if (!baiduQuota?.resetAt) return;
    const id = setInterval(() => setQuotaTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, [baiduQuota?.resetAt]);

  // 距重置剩余时间（HH:MM 格式）
  const resetIn = useMemo(() => {
    if (!baiduQuota?.resetAt) return null;
    const ms = new Date(baiduQuota.resetAt).getTime() - Date.now();
    if (ms <= 0) return '即将重置';
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m}m`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baiduQuota?.resetAt, quotaTick]);

  // 推百度 handler（v11.28 写完整：之前 v11.21 只声明了 state 但忘了渲染按钮）
  const handlePushToBaidu = () => {
    if (!pushToBaiduAction || !initialData?.id) return;
    if (isReposted) {
      setPushResult({ ok: false, message: '转载文章不推百度（已 noindex）' });
      return;
    }
    if (baiduQuota && baiduQuota.remaining <= 0) {
      setPushResult({ ok: false, message: '今日 quota 已用完，明天 0 点重置' });
      return;
    }
    startPushTransition(async () => {
      const result = await pushToBaiduAction(initialData.id!);
      setPushResult(result);
      if (result.ok && result.pushedAt) {
        setBaiduPushedAt(result.pushedAt);
      }
      // 推送完成后 quota 自动刷新（依赖 pushPending 变化触发的 useEffect）
    });
  };

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

            {/* 内容（v11.32 富文本编辑器） */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                <span>
                  正文
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    v11.32 富文本编辑（v11.31 之前是 HTML 字面量）
                  </span>
                </span>
                <span className="text-xs font-normal text-slate-400">
                  纯文本 {contentLen} 字符
                </span>
              </label>
              {/* 隐藏 input：保存时把富文本 HTML 字符串塞到这里（form submit 抓 value） */}
              <input type="hidden" name="content" value={content} />
              <div className="border border-slate-300 rounded-lg bg-white">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="开始写文章：可用工具栏加粗/H2/H3/列表/引用/链接/图片…"
                />
              </div>
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

            {/* 封面图（v11.32 支持本地上传到 Vercel Blob + 保留 URL 输入 fallback） */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                封面图
                <span className="text-xs text-slate-500 font-normal ml-2">
                  可上传到 Vercel Blob 或直接粘 URL（公众号图床会自动走 /api/img-proxy）
                </span>
              </label>
              <div className="flex items-start gap-2">
                <input
                  type="url"
                  name="cover"
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="https://..."
                />
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setCoverUploading(true);
                    setCoverUploadError(null);
                    try {
                      const fd = new FormData();
                      fd.append('file', f);
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      if (res.status === 503) {
                        setCoverUploadError('Vercel Blob 未配置，请直接粘 URL（明天去 Vercel dashboard 配 BLOB_READ_WRITE_TOKEN 后即可上传）');
                        return;
                      }
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({ message: '上传失败' }));
                        setCoverUploadError(err.message || `HTTP ${res.status}`);
                        return;
                      }
                      const data = await res.json();
                      setCover(data.url);
                    } catch (err) {
                      setCoverUploadError(err instanceof Error ? err.message : '网络错误');
                    } finally {
                      setCoverUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={coverUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm disabled:opacity-50 whitespace-nowrap"
                  title="上传图片到 Vercel Blob（需先配 BLOB_READ_WRITE_TOKEN）"
                >
                  {coverUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      上传中
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      上传
                    </>
                  )}
                </button>
              </div>
              {coverUploadError && (
                <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  ⚠️ {coverUploadError}
                </p>
              )}
              {cover && (
                <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={proxifyImgUrl(cover) || cover}
                    alt="封面预览"
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}
            </div>

            {/* v11.21 SEO 分批管理：首发 / 转载选择 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="isReposted"
                  name="isReposted"
                  checked={isReposted}
                  onChange={(e) => setIsReposted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
                <div className="flex-1">
                  <label htmlFor="isReposted" className="text-sm font-medium text-slate-700 cursor-pointer">
                    这篇文章已在其他网站/平台发布过（标记为转载）
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    {isReposted
                      ? '⚠️ 标记为转载后：canonical 将指向外站原文、详情页加 noindex、sitemap 跳过推百度'
                      : '✅ 标记为 kjgjs 首发：self-canonical、sitemap 主动推百度、详情页完整索引'}
                  </p>
                </div>
              </div>

              {isReposted && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <span className="text-red-500">*</span> 外站原文链接
                  </label>
                  <input
                    type="url"
                    name="sourceUrl"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono text-sm"
                    placeholder="https://zhuanlan.zhihu.com/p/xxx 或 https://mp.weixin.qq.com/s/xxx"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    必须填写。这是 canonical 指向的目标，也是详情页"转载声明"展示的链接。
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
              {/* 隐藏 input：用于明确提交时的 status 意图（与按钮 formAction 配合） */}
              <input type="hidden" name="status" value="published" />
              {/* 主按钮：发布（新建模式）/保存修改（编辑已发布）/再次发布（编辑草稿） */}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                <Send className="w-4 h-4" />
                {!isEdit ? '发布' : status === 'draft' ? '发布草稿' : '保存修改'}
              </button>
              {/* 次按钮：保存草稿（新建模式 + 编辑草稿） / 转为草稿（编辑已发布） */}
              {draftAction && (
                <button
                  type="submit"
                  formAction={draftAction}
                  className={`inline-flex items-center gap-1.5 px-6 py-2 rounded-lg transition ${
                    status === 'published'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status === 'published' ? (
                    <>
                      <PencilLine className="w-4 h-4" />
                      转为草稿
                    </>
                  ) : (
                    <>
                      <FileEdit className="w-4 h-4" />
                      保存草稿
                    </>
                  )}
                </button>
              )}
              {/* 草稿状态徽标（仅编辑模式显示） */}
              {isEdit && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    status === 'draft'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {status === 'draft' ? '📝 草稿' : '✓ 已发布'}
                </span>
              )}
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
          {/* v11.32 详情页最终效果预览：复用 proxify 走图床代理，1:1 还原用户将看到的页面 */}
          <div className="bg-white rounded-xl border-2 border-brand-300 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <Eye className="w-3.5 h-3.5" />
                详情页最终效果预览
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  （v11.32 1:1 模拟）
                </span>
              </div>
              {isEdit && initialData?.id && (
                <a
                  href={`/articles/${slug || initialData.slug}?preview=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  title="新窗口打开实际详情页（未鉴权，但能看到真实渲染）"
                >
                  <ExternalLink className="w-3 h-3" />
                  新窗口打开
                </a>
              )}
            </div>

            <div className="space-y-2.5 text-sm">
              {/* 分类 + 标题（h1） */}
              {category && (
                <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium">
                  {category}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {title || '文章标题将显示在这里'}
              </h2>
              {/* meta 行：作者/时间 */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {author}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </span>
                {isEdit && initialData?.viewCount !== undefined && (
                  <span className="text-xs text-slate-400">
                    · {initialData.viewCount} 浏览
                  </span>
                )}
              </div>
              {/* 摘要 + 左侧色块 */}
              {excerpt && (
                <p className="text-slate-600 leading-relaxed text-sm border-l-4 border-brand-200 pl-3 bg-brand-50/30 py-2">
                  {excerpt}
                </p>
              )}
              {/* 封面图 */}
              {cover && (
                <div className="rounded overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={proxifyImgUrl(cover) || cover}
                    alt="封面预览"
                    className="w-full max-h-40 object-contain"
                  />
                </div>
              )}
              {/* 正文（真实渲染：复用 proxifyWechatImagesInHtml + prose 样式） */}
              {content && (
                <div className="pt-2 border-t border-slate-100">
                  <div
                    className="news-content prose prose-slate prose-sm max-w-none line-clamp-[20]"
                    dangerouslySetInnerHTML={{ __html: proxifyWechatImagesInHtml(content) }}
                  />
                  <p className="text-xs text-slate-400 mt-2 italic">
                    ↑ 截断显示前 ~20 行，<a
                      href={`/articles/${slug || 'preview'}${isEdit ? `?preview=1` : ''}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >新窗口打开看完整</a>
                  </p>
                </div>
              )}
              {/* 标签 */}
              {tags && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                  <TagLg className="w-3 h-3 text-slate-400" />
                  {tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {/* 空状态 */}
              {!title && !content && (
                <p className="text-slate-400 text-xs text-center py-6 italic">
                  开始填写左侧表单，本卡片实时展示最终详情页效果
                </p>
              )}
            </div>
          </div>

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

      {/* v11.28 编辑模式才有百度主动推送（蓝色框，v11.21 规划位置） */}
      {isEdit && pushToBaiduAction && initialData?.id && (
        <BaiduPushSection
          articleId={initialData.id}
          slug={initialData.slug}
          isReposted={isReposted}
          baiduPushedAt={baiduPushedAt}
          pushPending={pushPending}
          pushResult={pushResult}
          baiduQuota={baiduQuota}
          resetIn={resetIn}
          onPush={handlePushToBaidu}
        />
      )}

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

/** v11.28 百度主动推送 UI（v11.21 规划的"底部蓝色框"位置） */
function BaiduPushSection({
  articleId,
  slug,
  isReposted,
  baiduPushedAt,
  pushPending,
  pushResult,
  baiduQuota,
  resetIn,
  onPush,
}: {
  articleId: number;
  slug: string;
  isReposted: boolean;
  baiduPushedAt: string | null;
  pushPending: boolean;
  pushResult: {
    ok: boolean;
    message: string;
    detail?: string;
    baiduRemain?: number;
    remainingToday?: number;
  } | null;
  baiduQuota?: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
    hasBaiduToken: boolean;
  };
  resetIn: string | null;
  onPush: () => void;
}) {
  const url = `https://kjgjs.cn/articles/${slug}`;
  const used = baiduQuota?.used ?? 0;
  const limit = baiduQuota?.limit ?? 10;
  const remaining = baiduQuota?.remaining ?? limit;
  const usedPct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const quotaColor =
    remaining === 0 ? 'bg-red-500' :
    remaining <= 3 ? 'bg-orange-500' :
    'bg-blue-500';
  const noToken = baiduQuota && !baiduQuota.hasBaiduToken;
  const disabled = pushPending || isReposted || remaining <= 0 || !!noToken;

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-900">百度主动推送</h3>
            <span className="text-xs text-blue-600">v11.28 quota 提示</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline font-mono truncate max-w-[300px]"
            title={url}
          >
            {url} ↗
          </a>
        </div>

        {/* Quota 进度条 */}
        {baiduQuota ? (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                今日已推 <span className="font-mono font-semibold text-slate-900">{used}</span> / {limit} 次
              </span>
              <span className="text-slate-500">
                剩余 <span className={`font-mono font-semibold ${remaining === 0 ? 'text-red-600' : 'text-blue-700'}`}>{remaining}</span> 次
                {resetIn && remaining > 0 && (
                  <span className="text-slate-400 ml-2">· {resetIn} 后重置</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${quotaColor} transition-all duration-500`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 text-xs text-slate-400">quota 加载中...</div>
        )}

        {/* 已推过的时间戳 */}
        {baiduPushedAt && (
          <div className="text-xs text-slate-600 mb-3 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-600" />
            上次推送：{new Date(baiduPushedAt).toLocaleString('zh-CN', { hour12: false })}
          </div>
        )}

        {/* 按钮 + 状态 */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onPush}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg transition text-sm font-medium ${
              disabled
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {pushPending ? '推送中…' :
             isReposted ? '转载文章不推' :
             remaining <= 0 ? '今日 quota 已用完' :
             noToken ? '未配置 BAIDU_PUSH_TOKEN' :
             baiduPushedAt ? '再次推百度' : '立即推百度'}
          </button>

          {isReposted && (
            <span className="text-xs text-orange-600">⚠️ 标记为转载，canonical 指外站，详情页已 noindex</span>
          )}
          {noToken && !isReposted && (
            <span className="text-xs text-red-600">需先在 Vercel dashboard 配 BAIDU_PUSH_TOKEN 环境变量</span>
          )}
          {remaining <= 0 && !isReposted && !noToken && (
            <span className="text-xs text-slate-600">明天 0 点自动重置为 {limit}/{limit}</span>
          )}
        </div>

        {/* 推送结果反馈 */}
        {pushResult && (
          <div className={`mt-3 p-3 rounded-lg text-xs ${
            pushResult.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="font-medium">
              {pushResult.ok ? '✓ ' : '✗ '}{pushResult.message}
            </div>
            {pushResult.ok && typeof pushResult.baiduRemain === 'number' && (
              <div className="mt-1 text-green-700">
                百度实时剩余：<span className="font-mono font-semibold">{pushResult.baiduRemain}</span> 次
                {typeof pushResult.remainingToday === 'number' && (
                  <span className="ml-2 text-slate-500">（本地统计剩余 {pushResult.remainingToday} 次）</span>
                )}
              </div>
            )}
            {pushResult.detail && (
              <div className="mt-1 text-slate-600 break-all">详情：{pushResult.detail}</div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-blue-200">
          💡 百度普通收录 API 配额 = {limit} 次/天，跨 UTC+8 0 点自动重置。
          同一天重复推同一 URL 也会扣 quota，建议发布当天推一次即可。
        </p>
      </div>
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
