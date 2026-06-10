'use client';

import { useState } from 'react';
import { updateCategorySort, createCategory, deleteCategory } from '../actions';
import { Plus, Trash2 } from 'lucide-react';

export default function CategoriesClient({
  categories,
}: {
  categories: Array<{
    id: number;
    key: string;
    label: string;
    sort: number;
    _count?: { tools: number };
  }>;
}) {
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleSortChange = async (id: number, newSort: number) => {
    await updateCategorySort(id, newSort);
    window.location.reload();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('key', newKey);
    formData.append('label', newLabel);
    await createCategory(formData);
    window.location.reload();
  };

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`确定要删除分类 "${label}" 吗？`)) return;
    await deleteCategory(id);
    window.location.reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">分类管理</h1>

      {/* 添加新分类 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">添加新分类</h2>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              分类 Key
            </label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              required
              className="w-48 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="例如：ERP管理系统"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              显示名称
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              required
              className="w-48 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="例如：ERP管理系统"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" />
            添加
          </button>
        </form>
      </div>

      {/* 分类列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">排序</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">分类 Key</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">显示名称</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">工具数</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无分类
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={cat.sort}
                      onChange={(e) => handleSortChange(cat.id, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm bg-slate-100 px-2 py-1 rounded">{cat.key}</code>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{cat.label}</td>
                  <td className="px-4 py-3 text-slate-500">{cat._count?.tools || 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(cat.id, cat.label)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
