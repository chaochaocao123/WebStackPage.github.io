# 公众号文章导入 kjgjs 后台 — 使用指南

> v11.18 新功能：粘 JSON → 自动入库 → 跳编辑页人工审
> **不**再需要 F12 复制 HTML 源码 + 看不带格式的 HTML 标签

---

## 一、为什么不用之前的 HTML 模式了

| 旧模式（v11.16，已废弃但保留按钮） | 新模式（v11.18） |
|------|------|
| F12 → Elements → 复制 outerHTML → 粘到文本框 | 油猴脚本一键导出 JSON → 粘到文本框 |
| 解析后是**带公众号嵌套结构**的 HTML（`<p><span leaf=""><br></span></p>` 这种，看不懂） | 解析后是**结构化 JSON**（标题/作者/正文段落/图片，干净清爽） |
| 详情页要靠我后写的 CSS 接管才勉强能看 | 解析时**自动规范化**为标准 HTML，详情页直接就有排版 |
| 图片偶尔有 mmbiz URL 没走代理 | **100% 走代理**，不会出现防盗链 403 |

---

## 二、5 步使用流程

### Step 1：装 Tampermonkey 扩展
- Chrome / Edge / Firefox：访问 <https://www.tampermonkey.net/> → 点「安装」
- 安装后浏览器右上角会出现一个黑色图标

### Step 2：装油猴脚本
1. 打开 <https://kjgjs.cn/admin/articles/import-json>（已登录后台）
2. 找到页面上方的 **「📋 复制油猴脚本」** 按钮 → 点击复制
3. 点浏览器右上角 Tampermonkey 图标 → 「添加新脚本」
4. 把复制的内容**全部粘进去** → Ctrl+S 保存
5. 看到「✅ 已导出 N 块」就成功了

> 备选：从项目 `scripts/wechat-export-tampermonkey.js` 直接拿脚本

### Step 3：打开公众号文章
浏览器打开任意公众号文章页：
```
https://mp.weixin.qq.com/s/xxxxxxxxxxxxx
```
右下角会出现一个**蓝色「📦 导出 JSON」** 按钮。

### Step 4：点按钮导出
点 **📦 导出 JSON** → 自动下载 `xxx-2026-06-14.json` 文件

按钮会变成 `✅ 已导出 N 块` 提示成功。

### Step 5：粘到后台导入
1. 打开 kjgjs 后台 → 文章管理 → **📦 导入公众号 JSON**
2. 把下载的 .json 文件**用记事本打开**，Ctrl+A 复制全部内容
3. 粘到文本框（或直接拖 .json 文件到文本框）
4. 选填「原文链接」（让详情页能跳回公众号）
5. 点 **📥 导入并跳到编辑页**

---

## 三、导入后会发生什么

1. **自动入库**到 Article 表（草稿状态，未发布）
2. 跳到**编辑页**，你可以：
   - 改标题、分类、标签
   - 在「封面 URL」里**改/换** 封面图
   - 在「正文」里**微调**段落、图片顺序、加粗等
3. 改完点 **保存** → 点 **发布**
4. 详情页路径：`https://kjgjs.cn/articles/<自动生成-slug>`

> ⚠️ 建议**人工审一遍再发布**，特别是分类和标签。

---

## 四、JSON 数据结构（高级用户）

如果你想自己写脚本生成 JSON 喂给后台，这是格式：

```json
{
  "title": "文章标题（必填）",
  "author": "作者名",
  "publishedAt": "2026-06-14T10:00:00+08:00",
  "cover": "https://mmbiz.qpic.cn/...",
  "excerpt": "摘要前 160 字（可省）",
  "tags": ["标签1", "标签2"],
  "source": "原文链接（可省，详情页用）",
  "sourceType": "wechat-tampermonkey（可省）",
  "blocks": [
    { "type": "text", "content": "段落文字" },
    { "type": "image", "url": "https://mmbiz.qpic.cn/...", "alt": "图说明" },
    { "type": "heading", "level": 2, "content": "小标题" },
    { "type": "list", "ordered": false, "items": ["项1", "项2"] },
    { "type": "quote", "content": "引用" },
    { "type": "code", "content": "代码块" }
  ]
}
```

支持的 block.type：`text` / `image` / `heading`（1-6）/ `list`（ordered: bool）/ `quote` / `code`

---

## 五、常见问题

**Q：油猴脚本按钮没出来？**
A：刷新一下页面。如果还没出，看 Tampermonkey 仪表盘里脚本是否启用。

**Q：导出的 JSON 粘到后台报「JSON 格式错误」？**
A：检查是否复制了完整内容（含开头 `{` 和结尾 `}`）。如果用了**带 BOM 的 UTF-8 编码**保存的 JSON，会报「Unexpected token」。解决：记事本 → 另存为 → 编码选 UTF-8 无 BOM。

**Q：图片还是不显示？**
A：检查图片 URL 是否是 mmbiz.qpic.cn 域名。如果是其他图床（如 hexo 图床），会自动保留原 URL，不会走代理。

**Q：标签怎么自动生成的？**
A：油猴脚本默认**不生成标签**（无 jieba 分词，分词不准）。你可以在编辑页手动加标签，或者用其他工具先抽。

**Q：能批量导入吗？**
A：当前只支持单篇。批量要做：把多个 JSON 合并成一个数组，然后改一下 Server Action 即可（v11.19 候选）。

---

## 六、技术说明

- **油猴脚本**：`scripts/wechat-export-tampermonkey.js`（浏览器内 DOM 解析）
- **blocks 转 HTML**：`lib/wechat-blocks-to-html.ts`（Node 端）
- **Server Action**：`app/admin/articles/import-json/actions.ts`
- **导入页**：`app/admin/articles/import-json/page.tsx`
- **前端表单**：`app/admin/articles/import-json/_components/JsonImportForm.tsx`

数据流：
```
公众号文章页 (DOM)
   ↓ 油猴脚本
JSON 文件
   ↓ 粘到 admin
Server Action 解析
   ↓ blocksToHtml
简化 HTML
   ↓ prisma.create
Article 表 (草稿)
   ↓ 曹总编辑 + 发布
详情页 (kjgjs.cn/articles/xxx)
```
