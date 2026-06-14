'use client';
import { useState, useTransition } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import type { ImportJsonResult } from '../actions';

type Props = {
  action: (formData: FormData) => Promise<ImportJsonResult>;
};

export function JsonImportForm({ action }: Props) {
  const [json, setJson] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [kbSize, setKbSize] = useState(0);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      setError(`文件太大（${(file.size / 1024).toFixed(0)}KB），请确保是油猴脚本导出的 JSON`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setJson(text);
      setCharCount(text.length);
      setKbSize(file.size / 1024);
      setError(null);
    };
    reader.readAsText(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setJson(text);
    setCharCount(text.length);
    setKbSize(new Blob([text]).size / 1024);
    setError(null);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">
            JSON 内容
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {charCount > 0 && (
              <>
                <span>{charCount.toLocaleString()} 字符</span>
                <span>·</span>
                <span>{kbSize.toFixed(1)} KB</span>
              </>
            )}
            {json && (
              <button
                type="button"
                onClick={() => {
                  setJson('');
                  setCharCount(0);
                  setKbSize(0);
                }}
                className="text-slate-400 hover:text-red-600 inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> 清空
              </button>
            )}
          </div>
        </div>

        <textarea
          name="json"
          value={json}
          onChange={handleChange}
          required
          rows={14}
          placeholder='把油猴脚本下载的 .json 文件内容粘到这里（{ "title": "...", "blocks": [...] }）'
          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y"
        />

        <div className="mt-2 flex items-center gap-3">
          <label className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            或上传 .json 文件
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          原文链接 <span className="text-slate-400 font-normal">（可选，用于「查看原文」按钮）</span>
        </label>
        <input
          type="url"
          name="sourceUrl"
          placeholder="https://mp.weixin.qq.com/s/xxx（如果 JSON 里没带的话）"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ⚠️ 导入后会跳到编辑页，<strong>请人工审一遍标题、分类、标签</strong>再发布
        </p>
        <button
          type="submit"
          disabled={pending || !json.trim()}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> 解析中...
            </>
          ) : (
            <>📥 导入并跳到编辑页</>
          )}
        </button>
      </div>
    </form>
  );
}
