import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { deleteFriendLink, toggleFriendLinkActive } from '../actions';
import { DeleteRowButton } from '../_components/DeleteWithConfirm';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FriendsPage() {
  const friends = await prisma.friendLink.findMany({
    orderBy: [{ category: 'asc' }, { sort: 'asc' }, { id: 'asc' }],
  });

  const total = friends.length;
  const activeCount = friends.filter(f => f.isActive).length;
  const categoryCount = new Set(friends.map(f => f.category)).size;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">友情链接</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {total} 个 · 启用 {activeCount} 个 · {categoryCount} 个分组
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/links"
            target="_blank"
            className="inline-flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:border-brand-400 transition"
          >
            <ExternalLink className="w-4 h-4" />
            查看前台
          </a>
          <Link
            href="/admin/friends/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" />
            添加友链
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">友链名</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">分组</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">URL</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">排序</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {friends.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  暂无友链，<Link href="/admin/friends/new" className="text-brand-600 hover:underline">去添加</Link>
                </td>
              </tr>
            ) : (
              friends.map((friend) => (
                <tr key={friend.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {friend.logo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={friend.logo} alt={friend.name} className="w-6 h-6 object-contain" />
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{friend.name}</div>
                        {friend.description && (
                          <div className="text-xs text-slate-500 max-w-xs truncate">{friend.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {friend.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={friend.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-sm text-brand-600 hover:underline max-w-xs truncate inline-block"
                      title={friend.url}
                    >
                      {friend.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm tabular-nums">
                    {friend.sort}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleFriendLinkActive.bind(null, friend.id)}>
                      <button
                        type="submit"
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          friend.isActive
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title={friend.isActive ? '点击禁用' : '点击启用'}
                      >
                        {friend.isActive ? (
                          <>
                            <Eye className="w-3 h-3" />
                            启用
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            禁用
                          </>
                        )}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={friend.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="p-1.5 text-slate-400 hover:text-brand-600"
                        title="访问外链"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/admin/friends/${friend.id}`}
                        className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                      >
                        编辑
                      </Link>
                      <DeleteRowButton
                        formAction={deleteFriendLink.bind(null, friend.id)}
                        message={`确定要删除友链「${friend.name}」吗？`}
                      />
                    </div>
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
