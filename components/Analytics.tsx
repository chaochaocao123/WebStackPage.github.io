'use client';

// 优化6：页面访问埋点组件
// 挂载到 layout 中自动追踪用户行为
import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// 生成或获取 sessionId
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('kjgjs_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('kjgjs_session_id', sessionId);
  }
  return sessionId;
}

// 获取 referrer
function getReferrer(): string | null {
  if (typeof document === 'undefined') return null;
  return document.referrer || null;
}

// 获取 userAgent
function getUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

// 单个页面的追踪逻辑
function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enterTimeRef = useRef<Date>(new Date());
  const sessionIdRef = useRef<string>('');
  const sentRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    
    // 构建完整路径（包含 query string）
    const fullPath = searchParams.toString() 
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // 记录进入时间
    enterTimeRef.current = new Date();
    sentRef.current = false;

    // 上报页面访问
    const reportPageView = async () => {
      if (sentRef.current || !sessionIdRef.current) return;
      sentRef.current = true;

      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            path: fullPath,
            referrer: getReferrer(),
            userAgent: getUserAgent(),
            enteredAt: enterTimeRef.current.toISOString(),
          }),
        });
      } catch (error) {
        console.warn('埋点上报失败:', error);
      }
    };

    // 使用 requestIdleCallback 延迟上报，避免阻塞页面渲染
    if ('requestIdleCallback' in window) {
      requestIdleCallback(reportPageView, { timeout: 1000 });
    } else {
      setTimeout(reportPageView, 100);
    }

    // 监听页面可见性变化，记录停留时长
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && !sentRef.current) {
        sentRef.current = true;
        const duration = Math.round((Date.now() - enterTimeRef.current.getTime()) / 1000);
        
        try {
          await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              path: fullPath,
              referrer: getReferrer(),
              userAgent: getUserAgent(),
              enteredAt: enterTimeRef.current.toISOString(),
              leftAt: new Date().toISOString(),
              duration,
            }),
          });
        } catch (error) {
          console.warn('埋点上报失败:', error);
        }
      }
    };

    // 监听 beforeunload 事件
    const handleBeforeUnload = async () => {
      if (!sentRef.current && sessionIdRef.current) {
        sentRef.current = true;
        const duration = Math.round((Date.now() - enterTimeRef.current.getTime()) / 1000);
        
        // 使用 sendBeacon 确保页面卸载前发送
        const data = JSON.stringify({
          sessionId: sessionIdRef.current,
          path: fullPath,
          referrer: getReferrer(),
          userAgent: getUserAgent(),
          enteredAt: enterTimeRef.current.toISOString(),
          leftAt: new Date().toISOString(),
          duration,
        });
        
        navigator.sendBeacon('/api/track', new Blob([data], { type: 'application/json' }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, searchParams]);

  return null;
}

// 包装组件，处理 Suspense
export function Analytics() {
  return (
    <Suspense fallback={null}>
      <PageTracker />
    </Suspense>
  );
}
