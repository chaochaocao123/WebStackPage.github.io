import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateFriendLink, deleteFriendLink } from '../../actions';
import { ArrowLeft } from 'lucide-react';
import { DeletePageButton } from '../../_components/DeleteWithConfirm';
import { ImageUploader } from '../../_components/ImageUploader';

export default async function EditFriendPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  const friend = await prisma.friendLink.findUnique({ where: { id } });

  if (!friend || Number.isNaN(id)) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/friends" className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">编辑友情链接</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action={updateFriendLink.bind(null, id)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                友链名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={friend.name}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="url"
                required
                defaultValue={friend.url}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              描述（可选）
            </label>
            <input
              type="text"
              name="description"
              defaultValue={friend.description || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                分组 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="category"
                required
                defaultValue={friend.category}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">前台按分组聚合展示</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                排序（数字越小越靠前）
              </label>
              <input
                type="number"
                name="sort"
                defaultValue={friend.sort}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <ImageUploader
            name="logo"
            label="Logo URL（可选）"
            defaultValue={friend.logo}
            placeholder="https://..."
            hint="支持直接上传或粘 URL"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={friend.isActive}
              className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              启用（取消勾选则前台不展示）
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              保存修改
            </button>
            <Link
              href="/admin/friends"
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              取消
            </Link>
          </div>
        </form>

        {/* 删除按钮 */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <DeletePageButton
            formAction={deleteFriendLink.bind(null, id)}
            message={`确定要删除友链「${friend.name}」吗？`}
            label="删除友链"
          />
        </div>
      </div>
    </div>
  );
}
