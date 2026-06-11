# kjgjs.cn 跨境工具说

> 跨境电商卖家工具导航 + 资讯 + 优惠平台
> Next.js 14 + Tailwind CSS + Prisma + Neon Postgres
> 部署：Vercel

## 快速开始

```bash
# 安装依赖（自动 prisma generate）
npm install

# 复制 .env.example 为 .env 并填入 DATABASE_URL
cp .env.example .env
# 然后编辑 .env，把 DATABASE_URL 改成 Neon 连接串

# 初始化数据库表结构
npm run db:push

# 导入种子数据（69 工具 + 20 分类，幂等）
npm run db:seed

# 开发
npm run dev

# 生产构建（自动跑 prisma db push + seed + next build）
npm run build
npm start
```

访问 http://localhost:3000

## 后台管理

访问 http://localhost:3000/admin

- 默认密码：`kjgjs2026`（生产环境请修改为强密码）
- 可管理：工具、分类、文章、优惠、广告位

## 数据库

统一使用 **Neon Postgres**（免费层即可）。
- 申请：https://neon.tech （用 GitHub 账号登录）
- 连接串格式：`postgresql://user:pass@host/db?sslmode=require&channel_binding=require`
- 把连接串填到 `.env` 的 `DATABASE_URL`

```bash
# 浏览器查看数据库内容
npm run db:studio
```

## Vercel 部署

### 必须配置的环境变量

在 Vercel 项目 → Settings → Environment Variables 添加：

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | Neon 连接串 | `postgresql://neondb_owner:xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `ADMIN_PASSWORD` | 后台登录密码（**必须改**） | 一个强密码 |
| `SESSION_SECRET` | Session 签名密钥（**32位+随机**） | 用 `openssl rand -hex 32` 生成 |

### 部署流程

1. 代码 push 到 `main` 分支 → Vercel 自动触发 Production 部署
2. 部署命令会自动执行：`prisma db push`（建表）→ `tsx scripts/seed.ts`（导入 69 工具）→ `next build`（构建）
3. 部署成功后会台数据生效，访问 https://kjgjs.cn 即可

### 关键设计

- **首页是动态渲染** (`dynamic = 'force-dynamic'`)：后台修改工具后，用户访问首页立即看到新数据，**无需重新部署**
- **seed 是幂等** (upsert by name)：每次部署只会"补全/更新"lib/data/tools.ts 里有的工具，不会删除后台手工添加的工具
- **后台鉴权** (HMAC 签名 + httpOnly cookie)：SESSION_SECRET 必须设为 32 位以上的强随机串

## 目录结构

```
kjgjs-site/
├── app/
│   ├── page.tsx           # 首页（动态从数据库读取）
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
│       ├── tools.ts       # 原始工具数据（参考，build 时会同步到数据库）
│       └── tools-db.ts    # 数据库读取层
├── prisma/
│   └── schema.prisma     # 数据模型
├── scripts/
│   └── seed.ts           # 种子数据导入（幂等 upsert）
├── middleware.ts          # 后台鉴权中间件
└── .env.example          # 环境变量模板
```

## 数据模型

- **Category**：分类（key, label, sort）
- **Tool**：工具（name, url, business, affiliateUrl, discount, featured, sort, logo）
- **Article**：文章（slug, title, content, excerpt, author, viewCount, tags, cover）
- **Deal**：优惠（title, url, brand, discount, startDate, endDate, source）
- **AdSpot**：广告位（key, name, imageUrl, linkUrl, active, sort）

## 后续加新工具的两种方式

### 方式一：后台管理（推荐，实时生效）

1. 访问 https://kjgjs.cn/admin
2. 登录后进入「工具管理」
3. 点击「添加工具」，填写表单
4. 保存后**首页立即更新**（无需重新部署）

### 方式二：改代码 + 部署

1. 编辑 `lib/data/tools.ts`，在 TOOLS 数组追加新工具
2. git commit + push to main
3. Vercel 自动部署，build 时 seed 会自动 upsert 新工具

最后更新：2026-06-11
