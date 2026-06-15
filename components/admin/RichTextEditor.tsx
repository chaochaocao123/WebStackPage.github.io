'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Blockquote from '@tiptap/extension-blockquote';
import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link2,
  Image as ImageIcon,
  X,
  Upload,
  Loader2,
  Lightbulb,
  BookMarked,
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

// v11.46 阶段八 GEO 站内优化 · 自定义 Blockquote 扩展
// 继承默认 Blockquote，加 data-type 属性（区分普通引用 vs GEO 答案块）
// v11.46 适配：Tiptap 5.x schema 允许的 data-type attribute
const GeoBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      'data-type': {
        default: 'quote',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-type') || 'quote',
        renderHTML: (attrs) => {
          const t = attrs['data-type'];
          return t && t !== 'quote' ? { 'data-type': t } : {};
        },
      },
    };
  },
});

/**
 * v11.32 富文本编辑器（Tiptap 5.x）
 * - StarterKit：粗体/斜体/删除线/行内代码/H1-H3/列表/引用/撤销重做
 * - Image 扩展：图片插入 + alt + 宽高
 * - Link 扩展：链接 + 自动探测 URL
 * - v11.46 GEO：自定义 Blockquote 扩展（data-type=answer/quote）
 * - 图片上传：调用 /api/upload（Vercel Blob），token 缺失时降级到 URL 输入对话框
 *
 * 必加 immediatelyRender: false 避免 Next.js SSR hydration mismatch
 */
export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);
  // v11.46 GEO：引用对话框状态
  const [showCitationDialog, setShowCitationDialog] = useState(false);
  const [citationName, setCitationName] = useState('');
  const [citationUrl, setCitationUrl] = useState('');
  const [citationError, setCitationError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Heading 默认 H1-H6 全开；常用 H2/H3，关掉 H4-H6
        heading: { levels: [1, 2, 3] },
        // v11.46 阶段八：禁用 StarterKit 默认 Blockquote，用自定义 GeoBlockquote
        blockquote: false,
      }),
      GeoBlockquote,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-3',
        },
        // 允许 base64 失败时 inline 展示
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-600 underline hover:text-brand-700',
        },
      }),
    ],
    content: value || '',
    immediatelyRender: false, // 关键：避免 SSR hydration mismatch
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[400px] p-4 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-b-lg',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 同步外部 value 变化（仅当外部 value 与 editor 内容不一致时——比如从 API 重新加载）
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-slate-300 rounded-lg bg-slate-50 p-8 text-center text-slate-400 text-sm">
        加载编辑器中…
      </div>
    );
  }

  // 插入图片 URL
  const insertImageByUrl = () => {
    if (!imageUrl.trim()) {
      setUploadError('请输入图片 URL');
      return;
    }
    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(false);
    setUploadError(null);
  };

  // 上传图片文件
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setTokenMissing(false);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      if (res.status === 503) {
        // Vercel Blob token 未配置，降级到 URL 输入
        setTokenMissing(true);
        setUploadError('Vercel Blob 未配置（需 Vercel dashboard 配 BLOB_READ_WRITE_TOKEN），请改用 URL 输入');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '上传失败' }));
        setUploadError(err.message || `HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      setShowImageDialog(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Toolbar
        editor={editor}
        onUploadClick={() => fileInputRef.current?.click()}
        onImageDialogOpen={() => {
          setShowImageDialog(true);
          setUploadError(null);
          setTokenMissing(false);
        }}
        onOpenCitationDialog={() => {
          setShowCitationDialog(true);
          setCitationError(null);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = ''; // 重置以便下次选同一文件
        }}
      />

      <EditorContent editor={editor} />

      {placeholder && !editor.getText() && (
        <p className="text-xs text-slate-400 mt-1 px-1">{placeholder}</p>
      )}

      <p className="text-xs text-slate-500 mt-1">
        支持 HTML 标签（h2/h3/p/ul/ol/li/strong/em/a/img/blockquote）— 工具栏所见即所得编辑
      </p>

      {/* 图片对话框（URL 输入 / 上传文件） */}
      {showImageDialog && (
        <ImageDialog
          onClose={() => setShowImageDialog(false)}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          imageAlt={imageAlt}
          setImageAlt={setImageAlt}
          onInsert={insertImageByUrl}
          onUploadClick={() => fileInputRef.current?.click()}
          uploading={uploading}
          uploadError={uploadError}
          tokenMissing={tokenMissing}
        />
      )}

      {/* v11.46 GEO：引用对话框（来源名 + URL） */}
      {showCitationDialog && (
        <CitationDialog
          onClose={() => setShowCitationDialog(false)}
          citationName={citationName}
          setCitationName={setCitationName}
          citationUrl={citationUrl}
          setCitationUrl={setCitationUrl}
          citationError={citationError}
          onInsert={() => {
            if (!citationName.trim()) {
              setCitationError('请输入来源名称');
              return;
            }
            // 自动计算下一个编号（基于当前 content 已有 citation-ref 数量）
            const html = editor.getHTML();
            const existingCount = (html.match(/class="citation-ref"/g) || []).length;
            const nextNum = existingCount + 1;
            // 插入带 data-source-name + data-source-url 的 Link
            editor
              .chain()
              .focus()
              .insertContent(
                `<a class="citation-ref" data-source-name="${citationName.replace(/"/g, '&quot;')}" data-source-url="${(citationUrl || '').replace(/"/g, '&quot;')}" href="#ref-${nextNum}"><sup>[${nextNum}]</sup></a>`,
              )
              .run();
            setCitationName('');
            setCitationUrl('');
            setCitationError(null);
            setShowCitationDialog(false);
          }}
        />
      )}
    </div>
  );
}

// ============ 工具栏 ============

function Toolbar({
  editor,
  onUploadClick,
  onImageDialogOpen,
  onOpenCitationDialog, // v11.46 GEO：引用按钮回调
}: {
  editor: Editor;
  onUploadClick: () => void;
  onImageDialogOpen: () => void;
  onOpenCitationDialog: () => void;
}) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const setLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  return (
    <div className="border border-slate-300 border-b-0 rounded-t-lg bg-slate-50 p-2 flex items-center flex-wrap gap-1 sticky top-0 z-10">
      <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗体 (Ctrl+B)">
        <Bold className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体 (Ctrl+I)">
        <Italic className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线">
        <Strikethrough className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="行内代码">
        <CodeIcon className="w-4 h-4" />
      </ToolButton>
      <Divider />
      <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1 标题">
        <Heading1 className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2 标题">
        <Heading2 className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3 标题">
        <Heading3 className="w-4 h-4" />
      </ToolButton>
      <Divider />
      <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
        <List className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
        <ListOrdered className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => {
          if (editor.isActive('blockquote')) {
            // 已有 blockquote：切到 answer 类型
            editor.chain().focus().updateAttributes('blockquote', { 'data-type': 'answer' }).run();
          } else {
            // 没 blockquote：新建一个 answer 类型的 blockquote
            editor.chain().focus().setBlockquote().updateAttributes('blockquote', { 'data-type': 'answer' }).run();
            // 自动填入提示文本
            const { state, dispatch } = editor.view;
            const { from } = state.selection;
            // 在 blockquote 末尾插入提示文字
            editor
              .chain()
              .focus()
              .insertContent('<p data-placeholder="true">请输入 40-75 字答案（AI 引用关键字段）…</p>')
              .run();
          }
        }}
        active={editor.isActive('blockquote', { 'data-type': 'answer' })}
        title="答案块（v11.46 GEO：40-75 字直答让 AI 引用率 +20%）"
      >
        <Lightbulb className="w-4 h-4 text-blue-500" />
      </ToolButton>
      <ToolButton
        onClick={() => {
          if (editor.isActive('blockquote', { 'data-type': 'answer' })) {
            // 当前在答案块：切到普通引用
            editor.chain().focus().updateAttributes('blockquote', { 'data-type': 'quote' }).run();
          } else {
            editor.chain().focus().toggleBlockquote().run();
          }
        }}
        active={editor.isActive('blockquote', { 'data-type': 'quote' })}
        title="普通引用"
      >
        <Quote className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={onOpenCitationDialog}
        active={false}
        title="引用来源（v11.46 GEO：学术风格 + 文末自动聚合）"
      >
        <BookMarked className="w-4 h-4 text-blue-500" />
      </ToolButton>
      <Divider />
      <div className="relative">
        <ToolButton
          onClick={() => {
            const previous = editor.getAttributes('link').href;
            if (previous) {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }
            setShowLinkInput((v) => !v);
          }}
          active={editor.isActive('link')}
          title="链接"
        >
          <Link2 className="w-4 h-4" />
        </ToolButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-20 flex gap-1 min-w-[300px]">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none focus:ring-1 focus:ring-brand-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setLink();
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={setLink}
              className="px-3 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700"
            >
              确定
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
              }}
              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <ToolButton onClick={onImageDialogOpen} title="插入图片">
        <ImageIcon className="w-4 h-4" />
      </ToolButton>
      <Divider />
      <ToolButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销 (Ctrl+Z)">
        <Undo className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做 (Ctrl+Y)">
        <Redo className="w-4 h-4" />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition ${
        active
          ? 'bg-brand-100 text-brand-700'
          : disabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-300 mx-1" />;
}

// ============ 图片对话框（URL 输入 / 文件上传 二选一） ============

function ImageDialog({
  onClose,
  imageUrl,
  setImageUrl,
  imageAlt,
  setImageAlt,
  onInsert,
  onUploadClick,
  uploading,
  uploadError,
  tokenMissing,
}: {
  onClose: () => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  imageAlt: string;
  setImageAlt: (v: string) => void;
  onInsert: () => void;
  onUploadClick: () => void;
  uploading: boolean;
  uploadError: string | null;
  tokenMissing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">插入图片</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 上传文件 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            上传图片到 Vercel Blob
          </label>
          <button
            type="button"
            onClick={onUploadClick}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition text-sm text-slate-600 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                上传中…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                点击选择图片（jpg/png/gif/webp/svg，≤4MB）
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-slate-400">或</span>
          </div>
        </div>

        {/* URL 输入 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">输入图片 URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="alt 描述（可选，但建议填，对 SEO 友好）"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mt-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <button
            type="button"
            onClick={onInsert}
            disabled={!imageUrl.trim()}
            className="w-full mt-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            插入
          </button>
        </div>

        {uploadError && (
          <div className={`text-xs p-3 rounded-lg ${
            tokenMissing ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {tokenMissing && <strong>⚠️ Vercel Blob 未配置：</strong>}
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
}
// v11.46 阶段八 GEO 站内优化 · 引用来源对话框
// 输入：来源名称（必填）+ 来源 URL（可选）
// 输出：插入 <a class="citation-ref" data-source-name="..." data-source-url="..."><sup>[N]</sup></a>
// 文末自动聚合「参考资料」区块（由 Article 详情页渲染时提取）
function CitationDialog({
  onClose,
  citationName,
  setCitationName,
  citationUrl,
  setCitationUrl,
  citationError,
  onInsert,
}: {
  onClose: () => void;
  citationName: string;
  setCitationName: (v: string) => void;
  citationUrl: string;
  setCitationUrl: (v: string) => void;
  citationError: string | null;
  onInsert: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
            <BookMarked className="w-4 h-4 text-blue-500" />
            插入引用来源
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
            title="关闭"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          引用会自动编号并在文末聚合「参考资料」区块。建议每篇文章 ≥3 个具体数字 + ≥1 个权威来源。
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              来源名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={citationName}
              onChange={(e) => setCitationName(e.target.value)}
              placeholder="如：艾媒咨询 2026 Q1 AI 应用洞察报告"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onInsert();
                }
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              来源 URL <span className="text-slate-400">（可选）</span>
            </label>
            <input
              type="url"
              value={citationUrl}
              onChange={(e) => setCitationUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded outline-none focus:ring-1 focus:ring-brand-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onInsert();
                }
              }}
            />
          </div>
          {citationError && (
            <p className="text-xs text-red-600">{citationError}</p>
          )}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onInsert}
            className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded hover:bg-brand-700"
          >
            插入引用
          </button>
        </div>
      </div>
    </div>
  );
}
