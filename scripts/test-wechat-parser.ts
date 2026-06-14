// 模拟一份真实公众号文章 HTML（精简版），测试 parser 是否能正确提取字段
import { parseWechatArticle } from '../lib/wechat-article-parser';

const SAMPLE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta property="og:title" content="2026 亚马逊选品工具横评：9 款国内工具实测">
<meta property="og:article:author" content="曹总跨境圈">
<meta property="og:article:published_time" content="2026-06-10T10:30:00+08:00">
<meta property="og:image" content="https://mmbiz.qpic.cn/sz_mmbiz_jpg/abc/def/640.jpg">
<title>2026 亚马逊选品工具横评：9 款国内工具实测_跨境工具说</title>
</head>
<body>
<div id="js_content">
  <p>选品是亚马逊运营的第一道关。市面上选品工具多如牛毛，到底哪些真有用？</p>
  <p>本文实测 9 款国内选品工具，从数据源、查询速度、价格三个维度横评。</p>
  <p><img data-src="https://mmbiz.qpic.cn/mmbiz_png/aaa/bbb/640.png" src="data:image/png;base64,iVBORw0="></p>
  <p style="background-image: url(https://mmbiz.qpic.cn/mmbiz_jpg/ccc/ddd/640.jpg);background-size: contain;">背景图测试</p>
  <h3>1. 卖家精灵</h3>
  <p>卖家精灵是国内最早做亚马逊数据查询的工具之一。它的关键词反查和销量估算功能很强。</p>
  <p><a href="#">被微信屏蔽的外链</a> 这是另一段文字。</p>
  <p>视频讲解：<iframe src="https://v.qq.com/iframe/preview.html?vid=xxx"></iframe></p>
  <script type="text/javascript">console.log('公众号内嵌追踪脚本')</script>
  <p>看完以上 9 款工具，你会发现没有银弹。建议至少配 2-3 款组合使用。</p>
</div>
</body>
</html>`;

const result = parseWechatArticle(SAMPLE);

console.log('=== Parser 单元测试 ===\n');
console.log('title:', JSON.stringify(result.title));
console.log('author:', JSON.stringify(result.author));
console.log('publishedAt:', result.publishedAt?.toISOString());
console.log('cover:', result.cover);
console.log('tags:', result.tags);
console.log('excerpt:', JSON.stringify(result.excerpt));
console.log('\n--- content HTML ---');
console.log(result.content);

// 断言
const errors: string[] = [];
if (result.title !== '2026 亚马逊选品工具横评：9 款国内工具实测') errors.push(`title 错: ${result.title}`);
if (result.author !== '曹总跨境圈') errors.push(`author 错: ${result.author}`);
if (!result.publishedAt || result.publishedAt.toISOString() !== '2026-06-10T02:30:00.000Z') {
  errors.push(`publishedAt 错: ${result.publishedAt?.toISOString()}`);
}
if (result.cover !== '/api/img-proxy?url=' + encodeURIComponent('https://mmbiz.qpic.cn/sz_mmbiz_jpg/abc/def/640.jpg')) {
  errors.push(`cover 错: ${result.cover}`);
}
if (!result.content.includes('卖家精灵')) errors.push('content 缺"卖家精灵"');
if (!result.content.includes('/api/img-proxy?url=')) errors.push('content 没走图片代理');
if (result.content.includes('<script')) errors.push('content 没清掉 script 标签');
if (result.content.includes('background-image')) errors.push('content 没把 style 背景图转 <img>');
if (result.content.includes('console.log')) errors.push('content 还含 console.log');
if (!result.content.includes('href="https://mp.weixin.qq.com/#"') && !result.content.includes('卖家精灵')) {
  // # 链接应该被解包（可能变成纯文本）
}
if (!result.excerpt || result.excerpt.length < 30) errors.push(`excerpt 太短: ${result.excerpt}`);
if (result.tags.length === 0) errors.push('tags 空');

if (errors.length === 0) {
  console.log('\n✅ 全部断言通过');
} else {
  console.log('\n❌ 失败:');
  errors.forEach(e => console.log(' - ' + e));
  process.exit(1);
}
