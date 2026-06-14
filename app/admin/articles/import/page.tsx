import Link from 'next/link';
import { ArrowLeft, FileCode2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ImportForm } from './_components/ImportForm';

export const dynamic = 'force-dynamic';

export default function ImportArticlePage() {
  return (
    <div className="max-w-4xl">
      {/* 顶栏 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/articles" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">从公众号导入文章</h1>
          <p className="text-sm text-slate-500 mt-1">
            粘贴公众号文章 HTML 源码 → 自动解析成 kjgjs 标准格式 → 编辑页审核 → 发布
          </p>
        </div>
      </div>

      {/* 步骤说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FileCode2 className="w-4 h-4" />
          操作步骤（5 步搞定）
        </h2>
        <ol className="space-y-2 text-sm text-blue-900 list-decimal list-inside">
          <li>用 Chrome / Edge 打开公众号文章页（如 <code className="px-1.5 py-0.5 bg-blue-100 rounded">mp.weixin.qq.com/s/xxx</code>）</li>
          <li>按 <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">F12</kbd> 打开 DevTools，切到 <strong>Elements</strong> 标签</li>
          <li>在 HTML 节点上 <strong>右键 → Copy → Copy outerHTML</strong></li>
          <li>把复制的内容粘贴到下方文本框（<strong>不限制大小，最多 5MB</strong>）</li>
          <li>点「解析并预览」→ 自动跳到编辑页 → 人工审核 → 发布</li>
        </ol>
      </div>

      {/* 数据真实性提醒 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <strong>合规提醒</strong>：只能导入<strong>自己的公众号</strong>文章。转载他人公众号需事先获得授权，
          且建议在文章底部标注「原文链接」和「作者」。导入后请人工核对内容真实性，kjgjs 不对 AI 解析错误负责。
        </div>
      </div>

      {/* 解析能力说明 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">自动提取字段</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />标题
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />作者
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />发布时间
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />封面图
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />正文 HTML（懒加载图自动转换）
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />摘要（自动生成前 160 字）
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />标签（按词频自动抽 5 个）
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />图片走代理（绕过防盗链）
          </div>
        </div>
      </div>

      {/* 导入表单 */}
      <ImportForm />
    </div>
  );
}
