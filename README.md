# kjgjs.cn 跨境工具说

> 跨境电商卖家工具导航 + 资讯 + 优惠平台
> Next.js 14 + Tailwind CSS + Prisma
> 部署：Vercel（备案后迁国内云服务器）

## 快速开始

```bash
# 安装依赖
npm install

# 开发
npm run dev

# 构建
npm run build

# 生产运行
npm start
```

访问 http://localhost:3000

## 目录结构

```
kjgjs-site/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页（工具导航）
│   ├── articles/          # 文章
│   ├── news/              # 资讯
│   ├── deals/             # 优惠活动
│   ├── tools/             # 实用工具
│   │   ├── fba-calculator/  # FBA 利润计算器
│   │   ├── unit-converter/  # 单位换算
│   │   └── exchange-rate/   # 汇率转换
│   ├── layout.tsx         # 全局布局
│   ├── globals.css        # 全局样式
│   ├── sitemap.ts         # SEO
│   └── robots.ts
├── components/
│   ├── layout.tsx         # Header / Footer
│   └── tool-grid.tsx      # 工具卡片网格
├── lib/
│   └── data/
│       ├── tools.ts       # 工具库（69个工具）
│       ├── articles.ts    # 文章
│       ├── news.ts        # 资讯
│       └── deals.ts       # 优惠
├── prisma/                # 数据库（待接入）
├── scripts/               # 抓取脚本（待开发）
├── public/
└── package.json
```

## 阶段规划

- ✅ **阶段一 MVP**：首页工具导航 + 5 个菜单静态展示 + 3 个实用工具
- ⏳ **阶段二 动态内容**：amz123/mjzj 资讯抓取 + 工具官网优惠抓取 + 定时任务
- ⏳ **阶段三 稳定运营**：公众号文章自动同步 + 数据统计 + 迁移国内服务器

## 数据来源

- 工具列表：跨境工具说联盟营销账号表（69个）
- 资讯：amz123 / mjzj / wearesellers / cifnews（待抓取）
- 优惠：各工具厂商官网（待抓取）
- 文章：公众号「跨境工具说」（手动导入）

## 待办

- [ ] 安装依赖、跑通构建
- [ ] 部署到 Vercel
- [ ] 接入 kjgjs.cn 域名
- [ ] 抓取脚本（阶段二）
- [ ] 后台管理（阶段二）
- [ ] 迁移到国内云服务器（备案后）

最后更新：2026-06-10
