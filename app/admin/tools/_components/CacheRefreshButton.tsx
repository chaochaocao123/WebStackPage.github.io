'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function CacheRefreshButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefresh = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ 缓存已刷新');
      } else {
        setMessage('❌ 刷新失败: ' + (data.error || '未知错误'));
      }
    } catch (error: any) {
      setMessage('❌ 请求失败: ' + error.message);
    } finally {
      setLoading(false);
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="刷新 API 缓存（插件数据同步）"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? '刷新中...' : '刷新缓存'}
      </button>
      {message && (
        <span className="text-sm text-slate-600">{message}</span>
      )}
    </div>
  );
}
