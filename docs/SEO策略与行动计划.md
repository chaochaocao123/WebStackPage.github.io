# kjgjs.cn SEO 现状与行动计划（2026-06-12）

> 目的：帮曹总把 kjgjs.cn 的自然流量跑起来，下面分"已做 / 待我做的 / 待你做的 / 紧急程度"四块。

---

## ✅ 已经做的（地基 OK）

| 类别 | 内容 |
|---|---|
| **全局 metadata** | `app/layout.tsx` 配置完整：title template / description / keywords / authors / publisher / formatDetection / alternates.canonical / robots / googleBot（含 max-snippet/image-preview/video-preview 全开）|
| **OG / Twitter** | 站点级 OG 全套（type/locale/url/siteName/title/desc/images/1200x630）+ Twitter summary_large_image |
| **JSON-LD 结构化** | layout 注入 WebSite + Organization + SearchAction（同站搜索） + contactPoint |
| **robots.txt** | 公开 + Disallow /admin 和 /api/ + Sitemap 引用 |
| **sitemap.xml** | 站点级 sitemap（9 个核心 URL：/, /articles, /news, /deals, /tools, 3 个工具子页） |
| **canonical** | 根级 alternates.canonical = https://kjgjs.cn |
| **中文 lang** | `<html lang="zh-CN">` |
| **HTML 语义** | 主页 H1 明确"跨境卖家必备 + 工具导航大全"，关键词覆盖到位 |
| **图片 alt** | 新闻列表图已 `alt={NEWS[0].title}` |
| **站内链接** | 首页 159 个链接（去重后），导航结构清晰 |
| **资讯正文内嵌**（v3 新）| /news/[id] 已抓 mjzj 全文内嵌渲染（不外跳），40 条都有 1-4.5KB 清理后 HTML |

---

## ❌ 还没做的（关键 SEO 漏洞）

### 🔴 紧急（直接影响搜索可见度）

1. **所有详情页没有 `generateMetadata`**
   - `/news/[id]`、`/articles/[slug]`、`/tools/[slug]`、`/deals/[id]` 全部继承自 layout 默认 title "跨境工具说 - 跨境电商卖家工具导航与资讯平台"
   - 每条资讯/文章/工具都是不同的关键词，**但搜索引擎看到的 title 全站一样**
   - 修复后预期：长尾搜索（"亚马逊标题新规 75 字符"）能从直接命中变成首页被收录

2. **资讯详情页 content 不参与 SEO**
   - mjzj 抓的 1-4KB 清理后 HTML 已经存在 DB，但 OG description / meta description 没用
   - 应该从 content 抽前 160 字做 description

3. **没有 JSON-LD Article / NewsArticle / Product / SoftwareApplication / BreadcrumbList**
   - Google 搜索结果能展示富媒体卡片（星级、价格、面包屑、发布日期），全靠结构化数据
   - **现在有：WebSite + Organization（站点级）**
   - **缺：每个详情页的 Article/Product/BreadcrumbList**

4. **sitemap.xml 只 9 条 URL**
   - build-time 静态生成，**News / Articles / Tools / Deals 全部动态内容都没进 sitemap**
   - 搜索引擎收录不到 41 条资讯、所有文章、所有工具详情页
   - **修复后预期**：Google/Bing 能发现所有动态页面，长尾流量指数级提升

### 🟡 中期（流量放大器）

5. **公开页全部 `force-dynamic + revalidate=0`**
   - 每次爬虫访问都重新跑 Prisma，TTFB 慢
   - **新闻/资讯**：应该用 ISR（每 10 分钟重生）或 revalidate=600
   - **首页 / articles / tools / deals**：应该用 revalidate=3600 静态化
   - **修复后预期**：Core Web Vitals 提升，爬虫抓取频率提高

6. **没有面包屑导航 + BreadcrumbList 结构化**
   - 详情页"首页 > 资讯 > 标题"是 SEO 标准动作

7. **OG image 单一固定图**
   - 现在所有页面 share 都是 /og-image.png 一张图
   - 理想：详情页动态 OG（标题 + 封面）

8. **图片 alt 覆盖不全**
   - 首页大图、tools logo 列表图可能没 alt
   - 缺失 alt = 搜索引擎不知道图片主题

9. **next/image 没全用**
   - 远程图片（mjzj 封面、tool logo）走的是普通 `<img>`
   - next/image 自动 WebP/AVIF 转换 + lazy load + srcset

10. **没有站内搜索结果页**
    - SearchAction 已声明但没实现 `/search` 页

### 🟢 长期（品牌 + 信任信号）

11. **没有 Bing / Baidu 站长验证文件**
12. **没有 Search Console / Bing Webmaster 绑定**（GA4 你说不管，Search Console 一定要）
13. **hreflang 没做**（港台 / 海外华人没覆盖）
14. **没有外链策略**（这是你要做的）
15. **没有内容营销闭环**（公众号 → 网站 → 留资 → 联盟营销）
16. **没有 sitemap_index.xml**（等 sitemap 多了要分片）

---

## 🛠️ 主 Agent 能做的（技术活，一次性或 cron 跑）

### 第一波（本周内，2-3 个 commit）
- [ ] **给所有详情页加 `generateMetadata`**（news/articles/tools/deals）
  - title 用详情标题 + " | 跨境工具说" 模板
  - description 从 content 抽前 160 字
  - OG title/desc/image 动态化
- [ ] **详情页加 JSON-LD Article / SoftwareApplication / BreadcrumbList**
- [ ] **sitemap.xml 改成动态生成**（`app/sitemap.ts` 用 Next 14 原生 sitemap 生成器）
  - 加入所有 News / Article / Tool / Deal 详情页 URL
  - 拆 sitemap_index.xml（如果 > 5000 条）
- [ ] **公开页改 ISR**
  - 首页 revalidate=600
  - /tools /articles /deals revalidate=3600
  - /news 列表 revalidate=600
  - /news/[id] 详情 revalidate=3600

### 第二波（下周，1-2 个 commit）
- [ ] **面包屑导航组件 + BreadcrumbList 结构化**
- [ ] **动态 OG image（`app/[slug]/opengraph-image.tsx` 走 @vercel/og）**
- [ ] **远程图片统一 next/image 改造**
- [ ] **图片 alt 全量补全**
- [ ] **404 页面 SEO 化**（HTTP 404 + meta robots noindex + 引导返回）
- [ ] **/search 搜索结果页**（吃 SearchAction）
- [ ] **robots.txt 加百度 / Bing 特殊规则**

### 第三波（持续）
- [ ] **写 SEO 友好的批量文章模板**（admin/articles 改用富文本 + 自动 slug + 自动 excerpt + 自动 JSON-LD 注入）
- [ ] **关键词监控**（用 GA4 拒绝授权后，改用 Vercel Analytics + 自己 prisma 写搜索词统计）
- [ ] **每篇文章发布时自动 ping 百度 / Bing**（sitemap 提交）

---

## 🙋 曹总要做的（你才是 SEO 的核心）

### 一次性（30 分钟内搞定）
1. **绑定 Google Search Console** — 登录 https://search.google.com/search-console/ 添加 kjgjs.cn（DNS 验证或 HTML 文件验证）
2. **绑定 Bing Webmaster** — https://www.bing.com/webmasters
3. **绑定百度站长平台** — https://ziyuan.baidu.com（百度流量比 Google 大，对中文站必须）
4. **绑定 360 搜索 / 搜狗** — 国内流量大头

### 日常（每天 30 分钟）
5. **公众号内容同步到网站** — 公众号发一篇长文，网站也发一遍（互相反链）
6. **小红书内容反链到网站** — 笔记正文或评论区塞网站链接
7. **知乎答题留网站** — 跨境相关问题答 1-2 个，签名/正文带网站
8. **B 站 / 抖音视频描述放网站**

### 中期（每周 1-2 小时）
9. **每周 2-3 篇原创长文**（1500 字以上，覆盖"亚马逊 XXX 怎么办"等长尾词）
10. **行业报告 / 白皮书**（让其他站引用、产生外链）
11. **找 5-10 个友链**（跨境类网站、工具厂商互换友链）
12. **主动提交 sitemap 给百度**（百度收录慢，sitemap ping 是关键）

### 数据监控（每周看一次）
13. **Google Search Console 查收录 + 关键词排名**（每周记录变化）
14. **百度站长查收录 + 关键词**
15. **Vercel Analytics 看访问来源**（自然搜索占比）

---

## 🎯 我的推荐优先级

如果只能做 3 件事：

1. **【主 Agent 这周】详情页 `generateMetadata` + sitemap 动态化 + 详情页 JSON-LD**
   - 效果：所有长尾内容能被搜索引擎正确理解，预期 1-2 周内 Google 收录翻倍
2. **【曹总今天】绑 Google Search Console + 百度站长**
   - 效果：开始看数据，知道下一步优化方向
3. **【曹总这周】写 5 篇原创长文并发布到网站**
   - 效果：内容是 SEO 之王，5 篇精心写的文章比 100 个技术优化都有用

---

## 📊 SEO 成功指标（给曹总看）

| 时间 | 指标 | 目标 |
|---|---|---|
| 第 1 周 | Google 收录量 | 0 → 20+ |
| 第 1 月 | Google 收录量 | 20+ → 100+ |
| 第 1 月 | 自然搜索访问 | 0 → 50 UV/日 |
| 第 3 月 | 自然搜索访问 | 50 → 300 UV/日 |
| 第 6 月 | 自然搜索访问 | 300 → 1000 UV/日 |
| 第 6 月 | 关键词排名 | 20+ 词进 Google 首页 |

前提：每 2 天 1 篇原创 + 上面技术优化全做。

---

要不要我**这周先把第一波（详情页 metadata + 动态 sitemap + 详情页 JSON-LD）3 个 commit 做了**？改完推上线等 1-2 周就能从 Search Console 看到效果。
