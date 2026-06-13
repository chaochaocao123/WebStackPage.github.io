import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '2026-06-13';

export const metadata: Metadata = {
  title: '隐私政策',
  description: '跨境工具说隐私政策 - 我们如何收集、使用、存储和保护您的个人信息',
  alternates: { canonical: 'https://kjgjs.cn/privacy' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/privacy',
    siteName: '跨境工具说',
    title: '隐私政策 - 跨境工具说',
    description: '我们如何收集、使用、存储和保护您的个人信息',
  },
};

export const revalidate = 3600;

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <Breadcrumb items={[{ name: '首页', href: '/' }, { name: '隐私政策', href: '/privacy' }]} />

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6 mt-4">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <article className="prose prose-slate max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">隐私政策</h1>
            <p className="text-sm text-slate-500">最后更新：{LAST_UPDATED}</p>
          </header>

          <p className="text-slate-700 leading-relaxed">
            跨境工具说（以下简称"我们"）尊重并保护用户隐私。本政策说明我们如何收集、使用、存储和保护您的个人信息。
            使用我们的服务即表示您同意本政策。请仔细阅读。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">1. 我们收集的信息</h2>
          <h3 className="text-base font-semibold text-slate-900 mt-4 mb-2">1.1 您主动提供的信息</h3>
          <ul className="text-slate-700 space-y-1">
            <li>· 邮箱地址（订阅、咨询、反馈时）</li>
            <li>· 电话号码（商务合作时）</li>
            <li>· 留言内容（公众号、邮件、评论时）</li>
          </ul>

          <h3 className="text-base font-semibold text-slate-900 mt-4 mb-2">1.2 自动收集的信息</h3>
          <ul className="text-slate-700 space-y-1">
            <li>· 设备信息：浏览器类型、操作系统、设备型号</li>
            <li>· 日志信息：IP 地址、访问时间、访问页面、停留时长、来源页面</li>
            <li>· Cookie 信息：用于会话保持、偏好记忆</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">2. 信息使用目的</h2>
          <ul className="text-slate-700 space-y-1">
            <li>· 提供、维护、改进、优化服务体验</li>
            <li>· 回复您的咨询、反馈、合作请求</li>
            <li>· 分析访问数据以了解用户行为，改进内容质量</li>
            <li>· 检测、预防、应对欺诈、违规、安全问题</li>
            <li>· 在您授权后，向您推送工具优惠、平台政策等有价值信息</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">3. Cookie 使用</h2>
          <p className="text-slate-700 leading-relaxed">
            我们使用 Cookie 和类似技术（如 localStorage、SessionStorage）来保持您的登录状态、记忆您的偏好、
            统计访问数据。您可以通过浏览器设置拒绝或管理 Cookie。但请注意，如拒绝 Cookie，您可能无法使用部分依赖 Cookie 的功能。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">4. 第三方服务</h2>
          <p className="text-slate-700 leading-relaxed">
            为提供完整服务，我们接入以下第三方服务，它们可能收集您的部分信息：
          </p>
          <ul className="text-slate-700 space-y-1">
            <li>· <strong>Vercel</strong>：网站托管和 CDN 加速</li>
            <li>· <strong>Prisma + PostgreSQL</strong>：数据存储（Vercel Postgres）</li>
            <li>· <strong>Edge Config / KV</strong>：缓存和配置存储</li>
            <li>· 工具厂商官网链接：点击外部链接后，您将受对方隐私政策约束</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">5. 信息共享与披露</h2>
          <p className="text-slate-700 leading-relaxed">我们<strong>不会</strong>出售您的个人信息。仅在以下情况下共享：</p>
          <ul className="text-slate-700 space-y-1">
            <li>· 获得您的明确同意后</li>
            <li>· 法律法规要求或政府主管部门要求</li>
            <li>· 为维护我们、其他用户或社会公众的合法权益</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">6. 信息存储与保护</h2>
          <p className="text-slate-700 leading-relaxed">
            您的信息存储在境内外合法合规的云服务上。我们采用业界通行的安全措施（SSL/TLS 加密、HTTPS 传输、访问权限控制）
            保护您的信息。但请理解，没有任何系统是 100% 安全的。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">7. 您的权利</h2>
          <p className="text-slate-700 leading-relaxed">您有权：</p>
          <ul className="text-slate-700 space-y-1">
            <li>· 查询、复制我们持有的关于您的信息</li>
            <li>· 更正或删除您的信息</li>
            <li>· 撤回授权（不影响此前基于授权的合法处理）</li>
            <li>· 注销账户（如适用）</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-3">
            行使以上权利请通过 <Link href="/contact" className="text-brand-600 hover:text-brand-700">联系我们</Link> 页面。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">8. 未成年人保护</h2>
          <p className="text-slate-700 leading-relaxed">
            我们的服务面向成年人。如您是未成年人，请在监护人陪同下使用本服务或获取监护人同意。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">9. 政策更新</h2>
          <p className="text-slate-700 leading-relaxed">
            我们可能根据业务调整、法律法规变化等情况更新本政策。更新后会标注"最后更新"日期，
            重大变更会通过页面公告或邮件等方式通知您。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">10. 联系我们</h2>
          <p className="text-slate-700 leading-relaxed">
            如对本政策有疑问或需行使您的权利，请通过 <Link href="/contact" className="text-brand-600 hover:text-brand-700">联系我们</Link> 页面与我们沟通。
          </p>

          <div className="border-t border-slate-200 pt-6 mt-8 text-sm text-slate-500">
            <p>本页内容最后更新于 {LAST_UPDATED}。</p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
