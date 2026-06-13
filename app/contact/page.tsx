import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Mail, Phone, MessageCircle, ArrowLeft, Clock } from 'lucide-react';

const LAST_UPDATED = '2026-06-13';
const CONTACT_EMAIL = '1324723217@qq.com'; // 公开联系邮箱
const CONTACT_PHONE = '18971469839';

export const metadata: Metadata = {
  title: '联系我们',
  description: '联系跨境工具说 - 工具厂商合作、优惠活动申报、内容反馈、用户支持',
  alternates: { canonical: 'https://kjgjs.cn/contact' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/contact',
    siteName: '跨境工具说',
    title: '联系我们 - 跨境工具说',
    description: '工具厂商合作、优惠活动申报、内容反馈、用户支持',
  },
};

export const revalidate = 3600;

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <Breadcrumb items={[{ name: '首页', href: '/' }, { name: '联系我们', href: '/contact' }]} />

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6 mt-4">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <article className="prose prose-slate max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">联系我们</h1>
            <p className="text-sm text-slate-500">最后更新：{LAST_UPDATED}</p>
          </header>

          <p className="text-slate-700 leading-relaxed">
            感谢您访问跨境工具说。我们重视每一位用户的反馈、合作意向和问题咨询。
            请根据您的需求选择合适的联系方式，我们会在 <strong>24 小时内</strong>回复。
          </p>

          <div className="grid md:grid-cols-2 gap-4 not-prose my-8">
            {/* 邮箱 */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-brand-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 m-0 mb-2">电子邮件</h2>
              <p className="text-sm text-slate-600 m-0 mb-2">用于商务合作、工具收录、内容转载授权等正式沟通：</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-brand-600 hover:text-brand-700 font-medium break-all"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* 电话 */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5 text-brand-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 m-0 mb-2">商务电话</h2>
              <p className="text-sm text-slate-600 m-0 mb-2">仅限商务合作（工具厂商、媒体、机构）：</p>
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                {CONTACT_PHONE}
              </a>
            </div>

            {/* 公众号 */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 m-0 mb-2">公众号留言</h2>
              <p className="text-sm text-slate-600 m-0 mb-2">用户咨询、运营问题、内容反馈可在公众号后台留言，团队每日处理：</p>
              <p className="text-slate-900 font-medium m-0">跨境工具说</p>
            </div>

            {/* 响应时间 */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 m-0 mb-2">响应时间</h2>
              <ul className="text-sm text-slate-600 m-0 space-y-1">
                <li>· 工作日邮件：12 小时内</li>
                <li>· 公众号留言：24 小时内</li>
                <li>· 商务电话：工作日 9:00-18:00</li>
              </ul>
            </div>
          </div>

          {/* 常见联系场景 */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">常见联系场景</h2>
            <div className="space-y-3 text-slate-700 text-sm">
              <div className="border-l-4 border-brand-500 bg-brand-50/50 rounded-r-lg p-4">
                <strong className="text-slate-900">工具厂商合作推广：</strong> 请发邮件，附上工具名称、官网、目标用户群、优惠方案。
                我们会在 3 个工作日内评估回复。
              </div>
              <div className="border-l-4 border-brand-500 bg-brand-50/50 rounded-r-lg p-4">
                <strong className="text-slate-900">优惠活动申报：</strong> 请发邮件，附上活动名称、链接、有效期、优惠码（如有）。
                我们会收录到 <Link href="/deals" className="text-brand-600 hover:text-brand-700">/deals</Link> 频道。
              </div>
              <div className="border-l-4 border-brand-500 bg-brand-50/50 rounded-r-lg p-4">
                <strong className="text-slate-900">内容勘误/反馈：</strong> 请通过公众号留言，注明页面 URL + 错误描述。我们核实后会立即修正。
              </div>
              <div className="border-l-4 border-brand-500 bg-brand-50/50 rounded-r-lg p-4">
                <strong className="text-slate-900">用户运营咨询：</strong> 公众号后台留言最及时，团队每日处理。
              </div>
              <div className="border-l-4 border-brand-500 bg-brand-50/50 rounded-r-lg p-4">
                <strong className="text-slate-900">媒体转载：</strong> 请发邮件获取白名单授权。注明您的媒体名称、转载内容、发布渠道。
              </div>
            </div>
          </section>

          <div className="border-t border-slate-200 pt-6 mt-8 text-sm text-slate-500">
            <p>本页内容最后更新于 {LAST_UPDATED}。邮箱 {CONTACT_EMAIL} 是我们唯一公开联系渠道，请注意识别仿冒账号。</p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
