# kjgjs.cn 跨境工具说

> 跨境电商卖家工具导航 + 资讯 + 优惠平台
> Next.js 14 + Tailwind CSS + Prisma (SQLite/Neon Postgres)
> 部署：Vercel

## 快速开始

```bash
# 安装依赖（会自动运行 prisma generate）
npm install

# 初始化数据库（创建表结构）
npm run db:push

# 导入种子数据（69 工具 + 20 分类）
npm run db:seed

# 开发
npm run dev

# 生产运行
npm start
```

访问 http://localhost:3000

## 后台管理

访问 http://localhost:3000/admin

- 默认密码：`kjgjs2026`（生产环境请修改）
- 可管理：工具、分类、文章、优惠、广告位

## 数据库

- **开发环境**：SQLite (`dev.db`)
- **生产环境**：Neon Postgres（需要配置环境变量）

```bash
# 查看数据库（浏览器打开）
npm run db:studio
```

## 生产环境部署

Vercel 部署时需要配置以下环境变量：

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `DATABASE_URL` | Neon Postgres 连接串 | `postgresql://user:pass@host/db` |
| `ADMIN_PASSWORD` | 后台登录密码 | `your-strong-password` |
| `SESSION_SECRET` | Session 签名密钥（32位+） | `change-me-in-production` |

### Neon Postgres 接入步骤

1. 注册 [Neon](https://neon.tech/)，创建项目
2. 获取连接串，格式：`postgresql://user:pass@host/db?sslmode=require`
3. 在 Vercel 项目设置中添加 `DATABASE_URL` 环境变量
4. 首次部署后运行 `npx prisma db push` 同步表结构

## 目录结构

```
kjgjs-site/
├── app/
│   ├── page.tsx           # 首页（从数据库读取）
│   ├── articles/          # 文章
│   ├── news/              # 资讯
│   ├── deals/             # 优惠活动
│   ├── tools/             # 实用工具
│   │   ├── fba-calculator/
│   │   ├── unit-converter/
│   │   └── exchange-rate/
│   ├── admin/             # 后台管理
│   │   ├── login/         # 登录页
│   │   ├── tools/         # 工具管理
│   │   ├── categories/    # 分类管理
│   │   ├── articles/      # 文章管理
│   │   ├── deals/         # 优惠管理
│   │   └── ads/           # 广告位管理
│   └── layout.tsx
├── components/            # UI 组件
├── lib/
│   ├── db.ts              # Prisma 单例
│   └── data/
│       ├── tools.ts       # 原始工具数据（参考）
│       └── tools-db.ts    # 数据库读取层
├── prisma/
│   └── schema.prisma     # 数据模型
├── scripts/
│   └── seed.ts           # 种子数据导入
└── middleware.ts          # 后台鉴权中间件
```

## 数据模型

- **Category**：分类（key, label, sort）
- **Tool**：工具（name, url, business, affiliateUrl, discount, featured）
- **Article**：文章（slug, title, content, excerpt, author, viewCount）
- **Deal**：优惠（title, url, brand, discount, startDate, endDate）
- **AdSpot**：广告位（key, name, imageUrl, linkUrl, active）

## 后续加新工具流程

1. 访问 `/admin`
2. 登录后进入「工具管理」
3. 点击「添加工具」，填写表单
4. 保存后首页自动更新

最后更新：2026-06-10
