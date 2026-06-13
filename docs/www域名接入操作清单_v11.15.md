# kjgjs.cn www 子域名接入操作清单（v11.15）

## 目标
让 `www.kjgjs.cn` 能访问，并 301/308 永久重定向到主域 `kjgjs.cn`，避免搜索引擎把 www 与裸域视为两个不同站点（重复内容 + 权重分散）。

## 状态
- ✅ **代码侧兜底已就位**：v11.15 commit `f50851c` 已 push，next.config.js 加了 `redirects()` 兜底
- ⏳ **DNS 接入**：需曹总在 Cloudflare 操作
- ⏳ **Vercel 域名绑定**：需曹总在 Vercel Dashboard 操作
- ⏳ **部署验证**：待 Vercel 部署后跑 curl 验证

---

## 第一步：Cloudflare DNS 操作

1. 登录 https://dash.cloudflare.com/
2. 选中 `kjgjs.cn` 域名
3. 左侧菜单 → **DNS** → **Records**
4. 添加一条 **CNAME 记录**：
   - **Type**: CNAME
   - **Name**: `www`
   - **Target**: `cname.vercel-dns.com.` （注意末尾有点）
   - **Proxy status**: 🟠 Proxied（橙色云朵，走 Cloudflare CDN；如要 Vercel 直连改灰色 DNS only）
   - **TTL**: Auto
5. 保存

> **关键**：不要用 A 记录指向 Vercel IP（Vercel IP 会变），必须用 CNAME `cname.vercel-dns.com`

---

## 第二步：Vercel Dashboard 域名绑定

1. 登录 https://vercel.com/chaochaocao123/kjgjs-site
2. 顶部 → **Settings** → 左侧 **Domains**
3. 输入 `www.kjgjs.cn` → 点击 **Add**
4. Vercel 会校验 DNS（自动检测 Cloudflare 刚加的 CNAME）
5. **配置方式选择**：
   - 选项 A：**Set as redirect to kjgjs.cn**（推荐，Vercel 自带 308 重定向，代码层兜底作为后备）
   - 选项 B：**Use as primary domain**（不推荐，会让两个 URL 同时作为主站，违背 SEO 集中权重原则）
6. 选 A 后 Vercel 自动配置好，等待 1-2 分钟

---

## 第三步：验证 308 重定向（代码 + Vercel 双重）

等 Vercel 部署完成（约 2-3 分钟）后，跑下面 4 个验证：

```bash
# 1. 根路径
curl -sI https://www.kjgjs.cn/ -L --max-redirs 0
# 预期：HTTP/2 308 + Location: https://kjgjs.cn/

# 2. 详情页路径
curl -sI https://www.kjgjs.cn/tools/10 -L --max-redirs 0
# 预期：HTTP/2 308 + Location: https://kjgjs.cn/tools/10

# 3. 带 query 参数
curl -sI "https://www.kjgjs.cn/search?q=erp" -L --max-redirs 0
# 预期：HTTP/2 308 + Location: https://kjgjs.cn/search?q=erp

# 4. sitemap / robots
curl -sI https://www.kjgjs.cn/sitemap.xml -L --max-redirs 0
curl -sI https://www.kjgjs.cn/robots.txt -L --max-redirs 0
# 预期：都跳到 https://kjgjs.cn/...
```

**返回值说明**：
- `HTTP/2 308` ✅ 正确（永久重定向 + 保留方法）
- `HTTP/2 301` ✅ 也可以（部分老旧 Vercel 设置可能用 301）
- `HTTP/2 302` ❌ 不对（临时重定向，搜索引擎不传递权重）
- `200 OK` ❌ 错误（双版本同时在线，会被搜索引擎降权）

---

## 第四步：Google Search Console 提交域名变更

1. 登录 https://search.google.com/search-console/
2. 顶部 → **设置**（齿轮）→ **地址变更**
3. 选择新地址：保留 `https://kjgjs.cn/` 作为主域
4. 提交后 Google 会把 www 版本的索引合并到 kjgjs.cn，**通常 2-4 周生效**

---

## 第五步：Bing Webmaster + IndexNow 配置

Bing 不需要"地址变更"工具，但需要在 https://www.bing.com/webmasters 注册 www 子域并验证所有权，然后用 IndexNow API key 推送 https://www.kjgjs.cn/sitemap.xml 给 Bing 重新索引。

（**注**：项目内已有 indexnow-kjgjsindexnow2026a8f3e2b7c1d9.txt 文件，Bing 那边应该已经认主域了，www 接入后会自动覆盖。）

---

## 常见问题

**Q1: Cloudflare 代理开着（橙色云朵）会影响 Vercel 部署吗？**
不会，Vercel 的 `cname.vercel-dns.com` 兼容 Cloudflare 代理；Cloudflare 边缘会和 Vercel 边缘协作，HTTPS 证书自动签发（Cloudflare Universal SSL + Vercel SSL）。

**Q2: 重定向后现有外链会失效吗？**
不会。308/301 重定向对外链完全透明，从 www 进来的用户/爬虫会被无缝转到 kjgjs.cn，**链接权重 100% 传递**。

**Q3: 多久生效？**
- DNS 全球生效：1-30 分钟（Cloudflare 几秒生效，但 ISP DNS 缓存可能久一点）
- Vercel 自动签 SSL：1-2 分钟
- 重定向即时生效
- Google 索引合并：2-4 周

**Q4: 如果 Vercel 那边没生效，会不会有问题？**
不会。v11.15 next.config.js 已经写了 `redirects()` 兜底：即使 Vercel domain 设置没生效、Cloudflare DNS 解析还没传到某些 ISP，Next.js SSR 层也会做 308 重定向。

**Q5: 撤销怎么操作？**
- Cloudflare 删 www CNAME
- Vercel 删 www 域名
- 撤销 next.config.js 的 redirects() 块并 commit（Vercel 会自动 redeploy）

---

## 涉及文件 / 提交

- `/app/data/所有对话/主对话/kjgjs-site/next.config.js`（v11.15 commit `f50851c`，已 push）
- 涉及 commit：`f50851c` v11.15 www.kjgjs.cn 接入：next.config.js 308 重定向兜底
- 涉及 Vercel commit 链：`6b3be51` (P1-7) → `b043047` (P1-8) → `a9248f7` (v11.12) → `953a746` (v11.13) → `31be020` (v11.13.1) → `fe66179` (v11.14) → **`f50851c` (v11.15)**
