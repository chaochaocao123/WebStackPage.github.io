'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  FileText,
  Link2,
  Image as ImageIcon,
} from 'lucide-react';

const SITE_URL = 'https://kjgjs.cn';

type InitialData = {
  id?: number;
  title: string;
  url: string;
  source: string;
  category: string;
  summary: string;
  cover: string;
  publishedAt: string;
  pinned: boolean;
};

type Props = {
  initialData: InitialData | null;
  formAction: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  /** 编辑模式：在表单前插入额外内容（如抓取的正文展示） */
  preFormContent?: React.ReactNode;
  /** 编辑模式：在标题旁插入额外标签（如"抓取于 xxx"） */
  headerExtra?: React.ReactNode;
};

const SOURCE_LABEL: Record<string, string> = {
  manual: '跨境工具说',
  mjzj: '跨境资讯通',
  cifnews: '雨果网',
};

export function NewsFormClient({ initialData, formAction, deleteAction, preFormContent, headerExtra }: Props) {
  const isEdit = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [source, setSource] = useState(initialData?.source || 'manual');
  const [category, setCategory] = useState(initialData?.category || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [cover, setCover] = useState(initialData?.cover || '');
  const [publishedAt, setPublishedAt] = useState(initialData?.publishedAt || '');
  const [pinned, setPinned] = useState(initialData?.pinned || false);

  const titleLen = title.length;
  const summaryLen = summary.length;

  const titleColor =
    titleLen === 0 ? 'text-slate-400' :
    titleLen < 20 ? 'text-orange-500' :
    titleLen > 60 ? 'text-red-500' :
    'text-green-600';

  const summaryColor =
    summaryLen === 0 ? 'text-slate-400' :
    summaryLen < 50 ? 'text-orange-500' :
    summaryLen > 160 ? 'text-red-500' :
    'text-green-600';

  const urlWarn = url && !/^https?:\/\//.test(url) ? 'URL 必须以 http:// 或 https:// 开头' : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/news" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? '编辑资讯' : '发布资讯'}
        </h1>
        {isEdit && initialData?.id && (
          <span className="text-sm text-slate-500">ID: {initialData.id}</span>
        )}
        {headerExtra}
      </div>

      {preFormContent}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：表单 */}
        <div className="lg:col-span-2">
          <form action={formAction} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {/* 标题 */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                <span>标题 <span className="text-red-500">*</span></span>
                <span className={`text-xs font-normal ${titleColor}`}>
                  {titleLen} 字符（推荐 20-60）
                </span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="例如：亚马逊新规 7 月生效，FBA 卖家必看"
              />
            </div>

            {/* 原文链接 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                原文链接 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://..."
              />
              {urlWarn ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {urlWarn}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">链接重复时自动覆盖更新</p>
              )}
            </div>

            {/* 来源 + 分类 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">来源</label>
                <select
                  name="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                >
                  <option value="manual">跨境工具说（默认）</option>
                  <option value="mjzj">跨境资讯通</option>
                  <option value="cifnews">雨果网</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                <input
                  type="text"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="例如：亚马逊、平台政策"
                />
              </div>
            </div>

            {/* 摘要 */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                <span>摘要</span>
                <span className={`text-xs font-normal ${summaryColor}`}>
                  {summaryLen} 字符（推荐 50-160）
                </span>
              </label>
              <textarea
                name="summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                placeholder="一句话描述资讯核心内容（留空将从正文自动提取）"
              />
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
                placeholder="https://... (可选)"
              />
            </div>

            {/* 发布时间 + 置顶 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">发布时间</label>
                <input
                  type="datetime-local"
                  name="publishedAt"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">留空则为当前时间</p>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition">
                  <input
                    type="checkbox"
                    name="pinned"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-amber-700">置顶显示</span>
                </label>
              </div>
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
                href="/admin/news"
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
                取消
              </Link>
            </div>
          </form>
        </div>

        {/* 右侧：SEO 预览 */}
        <div className="space-y-4">
          {/* Google 搜索结果模拟 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Google 搜索结果预览
            </div>
            <div className="space-y-1">
              <div className="text-xs text-green-700 truncate">
                {SITE_URL}/news/{isEdit && initialData?.id ? initialData.id : 'xx'}
              </div>
              <h3 className="text-lg text-blue-600 leading-snug line-clamp-2 hover:underline cursor-pointer">
                {title || '资讯标题将显示在这里'}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                {summary || '资讯摘要将显示在这里，建议 50-160 字，包含焦点关键词。'}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                  {SOURCE_LABEL[source] || source}
                </span>
                {category && (
                  <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded">
                    {category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SEO 检查清单 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Check className="w-3.5 h-3.5" />
              SEO 检查清单
            </div>
            <Checklist
              ok={titleLen >= 20 && titleLen <= 60}
              label={`标题长度（${titleLen}/60）`}
              warn={titleLen < 20 ? '建议 20-60 字' : titleLen > 60 ? '会被截断' : ''}
            />
            <Checklist
              ok={summaryLen >= 50 && summaryLen <= 160}
              label={`摘要长度（${summaryLen}/160）`}
              warn={summaryLen < 50 ? '建议 50-160 字' : summaryLen > 160 ? '会被截断' : ''}
            />
            <Checklist
              ok={!urlWarn}
              label="原文 URL 合法"
              warn={urlWarn || (url ? '优秀' : '未填')}
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
              ok={pinned ? true : !!publishedAt}
              label={pinned ? '已置顶' : '发布时间已设置'}
              warn={pinned ? '置顶将优先展示' : (publishedAt ? '优秀' : '留空=当前时间')}
            />
          </div>

          {/* 自动生成的 SEO 提示 */}
          <div className="bg-gradient-to-br from-brand-50 to-orange-50 rounded-xl border border-brand-200 p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-brand-700 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              发布后自动生成
            </div>
            <div className="text-xs text-slate-700 space-y-1.5">
              <div>✓ NewsArticle JSON-LD（headline/datePublished/author）</div>
              <div>✓ BreadcrumbList JSON-LD（首页 / 行业资讯 / 标题）</div>
              <div>✓ 动态 OG image（标题 + 来源 + 描述）</div>
              <div>✓ canonical URL + sitemap 自动收录</div>
            </div>
            <p className="text-xs text-slate-500 pt-2 border-t border-brand-200">
              以上 SEO 元数据无需手动填写，发布时系统自动注入。
            </p>
          </div>
        </div>
      </div>

      {isEdit && deleteAction && initialData?.id && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="bg-white rounded-xl border border-red-200 p-5">
            <h3 className="text-sm font-semibold text-red-700 mb-2">危险操作</h3>
            <p className="text-xs text-slate-600 mb-3">删除后无法恢复，包括 sitemap、JSON-LD、og:image 全部失效。</p>
            <form action={deleteAction}>
              <button
                type="submit"
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
              >
                删除资讯
              </button>
            </form>
          </div>
        </div>
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
