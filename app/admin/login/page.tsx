import { loginAction } from '../actions';
import { Wrench } from 'lucide-react';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
            <Wrench className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">跨境工具说后台</h1>
          <p className="text-slate-500 mt-2">请输入管理员密码登录</p>
        </div>

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="请输入管理员密码"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition"
          >
            登录
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          <a href="/" className="hover:text-brand-600">返回首页</a>
        </div>
      </div>
    </div>
  );
}
