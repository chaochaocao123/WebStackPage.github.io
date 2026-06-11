'use client';

import { Trash2 } from 'lucide-react';

type ServerAction = (formData: FormData) => void | Promise<void>;

/**
 * 列表行内用的紧凑删除按钮（带 confirm 弹窗）
 * @example <DeleteRowButton formAction={deleteArticle.bind(null, id)} message="确定要删除这篇文章吗？" />
 */
export function DeleteRowButton({
  formAction,
  message,
}: {
  formAction: ServerAction;
  message: string;
}) {
  return (
    <form action={formAction}>
      <button
        type="submit"
        className="p-1.5 text-slate-400 hover:text-red-600"
        onClick={(e) => {
          if (!confirm(message)) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  );
}

/**
 * 编辑页底部用的大删除按钮（带 confirm 弹窗 + 文字标签）
 * @example <DeletePageButton formAction={deleteArticle.bind(null, id)} message="..." label="删除文章" />
 */
export function DeletePageButton({
  formAction,
  message,
  label,
}: {
  formAction: ServerAction;
  message: string;
  label: string;
}) {
  return (
    <form action={formAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
        onClick={(e) => {
          if (!confirm(message)) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="w-4 h-4" />
        {label}
      </button>
    </form>
  );
}
