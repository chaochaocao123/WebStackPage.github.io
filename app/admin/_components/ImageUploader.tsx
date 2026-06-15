'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, X, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  /** 表单字段名（提交时的 input name） */
  name: string;
  /** 显示标签 */
  label: string;
  /** 初始值（URL），用于服务端数据回填 */
  defaultValue?: string | null;
  /** placeholder */
  placeholder?: string;
  /** 接受的文件类型 */
  accept?: string;
  /** 提示文字（灰色小字，写在 label 后面） */
  hint?: string;
}

/**
 * v11.36 通用图片上传组件（2026-06-15）
 *
 * 用途：admin 后台所有"放图片的地方"统一升级到支持直接上传
 *   - tools/[id] / tools/new : logo
 *   - friends/[id] / friends/new : logo
 *   - news/_components/NewsFormClient : cover
 *   - ads/[id] : imageUrl
 *
 * 功能：
 *   - URL 直接输入（保留 fallback，URL 改用受控 input + 预览）
 *   - 点击"上传"按钮选文件 → POST /api/upload → 自动回填 URL
 *   - 上传中 loading + 失败错误提示（503 提示配 BLOB_TOKEN，401 提示重新登录）
 *   - URL 填了自动显示预览图（带 onError 隐藏）
 *   - 一键清除按钮（X 图标）
 *
 * 配套 API：/api/upload（Vercel Blob 存储，鉴权：Referer 必须含 /admin/）
 */
export function ImageUploader({
  name,
  label,
  defaultValue,
  placeholder = 'https://...',
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml',
  hint,
}: ImageUploaderProps) {
  const [value, setValue] = useState<string>(defaultValue || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.status === 503) {
        setError('Vercel Blob 未配置，请直接粘 URL（Vercel 控制台 → Storage → Blob 配 BLOB_READ_WRITE_TOKEN）');
        return;
      }
      if (res.status === 401) {
        setError('鉴权失败，请重新登录 admin');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '上传失败' }));
        setError(err.message || `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setValue(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setUploading(false);
      e.target.value = ''; // 允许重复上传同名文件
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {hint && (
          <span className="text-xs text-slate-500 font-normal ml-2">
            {hint}
          </span>
        )}
      </label>
      <div className="flex items-start gap-2">
        <input
          type="url"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          placeholder={placeholder}
        />
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm disabled:opacity-50 whitespace-nowrap"
          title="上传图片到 Vercel Blob"
        >
          {uploading ? (
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
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            className="inline-flex items-center gap-1 px-2 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
            title="清除"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="预览"
            className="h-20 w-auto block"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}
