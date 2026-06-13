import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '2026-06-13';

export const metadata: Metadata = {
  title: '服务条款',
  description: '跨境工具说服务条款 - 用户使用本站服务的权利和义务',
  alternates: { canonical: 'https://kjgjs.cn/terms' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/terms',
    siteName: '跨境工具说',
    title: '服务条款 - 跨境工具说',
    description: '用户使用本站服务的权利和义务',
  },
};

export const revalidate = 3600;

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <Breadcrumb items={[{ name: '首页', href: '/' }, { name: '服务条款', href: '/terms' }]} />

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6 mt-4">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <article className="prose prose-slate max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">服务条款</h1>
            <p className="text-sm text-slate-500">最后更新：{LAST_UPDATED}</p>
          </header>

          <p className="text-slate-700 leading-relaxed">
            欢迎使用跨境工具说（以下简称"本站"）。请仔细阅读以下服务条款，
            使用本站服务即表示您同意接受以下条款约束。如您不同意任何条款，请立即停止使用本站。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">1. 服务说明</h2>
          <p className="text-slate-700 leading-relaxed">
            跨境工具说（kjgjs.cn）是一个<strong>信息聚合与导航平台</strong>，为跨境电商卖家提供：
          </p>
          <ul className="text-slate-700 space-y-1">
            <li>· 跨境工具导航（收录、分类、跳转）</li>
            <li>· 行业资讯整合（来自第三方来源，附原文链接）</li>
            <li>· 工具优惠信息整理（限时优惠、折扣码）</li>
            <li>· 原创运营文章（评测、教程、案例拆解）</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-3">
            本站本身<strong>不提供</strong>工具的注册、订阅、付费等服务，所有交易通过跳转至工具厂商官网完成。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">2. 联盟营销说明</h2>
          <p className="text-slate-700 leading-relaxed">
            本站部分工具链接为<strong>联盟营销链接</strong>（Affiliate Link）。当您通过这些链接访问工具厂商网站并完成注册或购买时，
            我们会获得一定佣金（不影响您支付的价格）。这是本站的主要收入来源，支持我们持续提供免费内容。
          </p>
          <p className="text-slate-700 leading-relaxed">
            我们的<strong>工具排序基于功能、口碑、性价比</strong>，不因联盟佣金高低影响推荐顺序。
            如某个工具有联盟链接且您介意，可在官网手动访问而不通过我们的链接。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">3. 知识产权</h2>
          <p className="text-slate-700 leading-relaxed">
            本站原创内容（文章、评测、图表）版权归跨境工具说所有。第三方内容（资讯摘要）来源于公开渠道，
            我们已尽量标注来源；如您是版权方且希望移除相关内容，请通过 <Link href="/contact" className="text-brand-600 hover:text-brand-700">联系我们</Link>。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">4. 用户行为规范</h2>
          <p className="text-slate-700 leading-relaxed">使用本站时，您同意不会：</p>
          <ul className="text-slate-700 space-y-1">
            <li>· 以任何方式干扰或试图干扰本站正常运行</li>
            <li>· 未经授权访问本站系统或数据</li>
            <li>· 传播恶意代码、病毒、广告或其他有害内容</li>
            <li>· 滥用本站联系渠道发送垃圾信息</li>
            <li>· 冒充本站工作人员、合作伙伴或他人</li>
            <li>· 从事违反中国法律法规的活动</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">5. 信息准确性</h2>
          <p className="text-slate-700 leading-relaxed">
            我们尽最大努力确保工具信息、价格、优惠等内容的准确性和时效性，但<strong>不保证</strong>所有信息完全无误。
            工具厂商可能随时调整价格、政策、优惠活动。建议您在做出购买决策前，以<strong>工具厂商官网</strong>信息为准。
          </p>
          <p className="text-slate-700 leading-relaxed">
            如发现本站信息与官网不一致，欢迎反馈给我们核实修正。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">6. 第三方网站</h2>
          <p className="text-slate-700 leading-relaxed">
            本站包含大量跳转至第三方网站的链接。您访问第三方网站时，<strong>将受对方服务条款和隐私政策约束</strong>。
            我们不对第三方网站的内容、政策、行为承担责任。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">7. 免责声明</h2>
          <p className="text-slate-700 leading-relaxed">
            在法律允许的最大范围内，本站及运营团队不对以下情况承担责任：
          </p>
          <ul className="text-slate-700 space-y-1">
            <li>· 因不可抗力（自然灾害、网络攻击、运营商故障等）导致服务中断</li>
            <li>· 因第三方网站/服务变更导致本站链接失效或信息过时</li>
            <li>· 因用户自身原因（设备故障、操作失误）造成的损失</li>
            <li>· 因使用本站推荐工具而产生的任何商业损失</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">8. 服务变更与终止</h2>
          <p className="text-slate-700 leading-relaxed">
            我们保留随时修改、暂停、终止本站服务（或其中任何部分）的权利，无需事先通知。
            对于付费服务（如未来提供），会按已支付的服务期限继续履行。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">9. 条款修改</h2>
          <p className="text-slate-700 leading-relaxed">
            我们可能根据法律法规变化、业务调整等情况更新本条款。更新后会标注"最后更新"日期。
            重大变更会通过页面公告或邮件通知。继续使用本站即视为接受修改后的条款。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">10. 法律适用与争议解决</h2>
          <p className="text-slate-700 leading-relaxed">
            本条款的解释、效力及争议解决均适用中华人民共和国法律。因本条款产生的争议，
            双方应友好协商；协商不成的，提交运营方所在地有管辖权的人民法院诉讼解决。
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">11. 联系我们</h2>
          <p className="text-slate-700 leading-relaxed">
            如对本条款有任何疑问，请通过 <Link href="/contact" className="text-brand-600 hover:text-brand-700">联系我们</Link> 页面与我们沟通。
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
