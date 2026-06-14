/**
 * v11.18 单元测试：blocks 转 HTML
 * 模拟油猴脚本导出的 JSON，验证 admin import-json 解析后的 HTML 质量
 */
import { blocksToHtml, type WechatBlock } from '../lib/wechat-blocks-to-html';

let pass = 0;
let fail = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}`);
    fail++;
  }
}

console.log('=== Test 1: 基础 text + image + heading + list ===');
{
  const blocks: WechatBlock[] = [
    { type: 'text', content: '亚马逊商品图一键生成' },
    { type: 'image', url: 'https://mmbiz.qpic.cn/mmbiz_jpg/abc/640', alt: '图1' },
    { type: 'text', content: 'AI 自动排版，无需提示词。' },
    { type: 'heading', level: 2, content: '操作步骤' },
    { type: 'list', ordered: true, items: ['上传参考图', '选平台', '生成'] },
  ];
  const html = blocksToHtml(blocks);
  assert(html.includes('<p>亚马逊商品图一键生成</p>'), 'text 块转 <p>');
  assert(html.includes('src="/api/img-proxy?url='), 'mmbiz URL 走代理');
  assert(!html.includes('src="https://mmbiz.qpic.cn'), '原 mmbiz URL 不裸露');
  assert(html.includes('alt="图1"'), 'image alt 保留');
  assert(html.includes('<h2>操作步骤</h2>'), 'h2 转 <h2>');
  assert(html.includes('<ol><li>上传参考图</li>'), 'ordered list 转 <ol>');
}

console.log('\n=== Test 2: 公众号特殊 case ===');
{
  const blocks: WechatBlock[] = [
    { type: 'image', url: 'https://mmbiz.qlogo.cn/mmbiz_png/xyz/640', alt: '头像' },
    { type: 'quote', content: '亚马逊商品图原来这么简单' },
    { type: 'code', content: 'npm install kjgjs-cli' },
  ];
  const html = blocksToHtml(blocks);
  assert(html.includes('mmbiz.qlogo.cn') && html.includes('/api/img-proxy'), 'mmbiz.qlogo.cn 也走代理');
  assert(html.includes('<blockquote>'), 'quote 转 blockquote');
  assert(html.includes('<pre><code>npm install kjgjs-cli</code></pre>'), 'code 转 pre>code');
}

console.log('\n=== Test 3: XSS 防护 ===');
{
  const blocks: WechatBlock[] = [
    { type: 'text', content: '<script>alert("xss")</script>' },
    { type: 'image', url: 'https://mmbiz.qpic.cn/abc" onerror="alert(1)', alt: '"危险"alt' },
  ];
  const html = blocksToHtml(blocks);
  assert(!html.includes('<script>'), 'text 中 <script> 被转义');
  assert(html.includes('&lt;script&gt;'), 'text 中 <script> 转成实体');
  assert(!html.includes('onerror="alert'), 'image alt 中引号被转义');
  assert(html.includes('alt="&quot;危险&quot;alt"'), 'alt 正确转义');
}

console.log('\n=== Test 4: 边界 case ===');
{
  assert(blocksToHtml([]) === '', '空数组返回空字符串');
  assert(blocksToHtml(null) === '', 'null 返回空字符串');
  assert(blocksToHtml(undefined) === '', 'undefined 返回空字符串');

  const blocks: WechatBlock[] = [
    { type: 'text', content: '' },
    { type: 'unknown_type', content: 'x' } as any,
  ];
  const html = blocksToHtml(blocks);
  assert(html === '<p></p>', '空 text 块 → 空 <p>，未知 type 跳过');
}

console.log('\n=== Test 5: 非图床 URL 保留原样 ===');
{
  const blocks: WechatBlock[] = [
    { type: 'image', url: 'https://kjgjs.cn/images/logo.png', alt: 'logo' },
  ];
  const html = blocksToHtml(blocks);
  assert(html.includes('src="https://kjgjs.cn/images/logo.png"'), '非 mmbiz URL 保留原样');
  assert(!html.includes('/api/img-proxy?url=https%3A%2F%2Fkjgjs.cn'), '不会强制走代理');
}

console.log(`\n=== 总结：${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail > 0 ? 1 : 0);
