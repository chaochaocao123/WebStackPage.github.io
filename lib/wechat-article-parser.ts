/**
 * 微信公众号文章 HTML 解析器
 * 来源：用户从浏览器复制公众号文章页 HTML 源码（mp.weixin.qq.com）
 * 提取：title / author / publishedAt / cover / content(html) / excerpt / tags
 *
 * 公众号 HTML 特征：
 *  - 懒加载图：<img data-src="真实图" src="data:image/...">  → 取 data-src
 *  - 正懒加载 style 里的 background-image:url(...)   → 转 <img>
 *  - 内联样式 background-size:contain 不动
 *  - 微信会把外链换成 <a href="#"> → 改回原始 href
 *  - 正文里带 data-src 的 video 标签保留
 */
import * as cheerio from 'cheerio';

export type ParsedWechatArticle = {
  title: string;
  author: string;
  publishedAt: Date | null;
  cover: string | null;
  content: string;        // HTML 字符串（已清理，图片走代理）
  excerpt: string;        // 纯文本前 160 字
  tags: string[];         // 从正文/标题/分类推断
};

/** 公众号图床域名（这些图必须走 /api/img-proxy 才能在 kjgjs.cn 显示） */
const WECHAT_IMG_HOST_RE = /\bmmbiz\.qpic\.cn|mmbiz\.qlogo\.cn|wx\.qpic\.cn/i;

/** 图片 URL 改成走代理（让 Referer 变成 kjgjs.cn 也能加载） */
function proxifyImg(src: string): string {
  if (!src) return src;
  // 已经是代理 URL 不动
  if (src.startsWith('/api/img-proxy')) return src;
  // 非图床 URL（http(s)://开头的外链）保留原样
  return `/api/img-proxy?url=${encodeURIComponent(src)}`;
}

/** HTML 文本剥离：去所有标签，合并空白 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** 从 JS 变量定义中抓值（用于兼容老版本公众号把数据塞在 <script>） */
function extractJsVar(html: string, varName: string): string | null {
  const re = new RegExp(`var\\s+${varName}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

export function parseWechatArticle(rawHtml: string): ParsedWechatArticle {
  const $ = cheerio.load(rawHtml);

  // ---- 1. 标题：meta og:title > rich_media_title > title 标签 ----
  let title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('.rich_media_title').text().trim() ||
    $('title').text().trim() ||
    extractJsVar(rawHtml, 'title') ||
    '';
  // 去掉 "_xxx_跨境工具说" 这种公众号名后缀
  title = title.replace(/[-_—–]\s*[^-\s]+$/, '').trim();

  // ---- 2. 作者 ----
  const author =
    $('meta[property="og:article:author"]').attr('content')?.trim() ||
    $('#js_author_name').text().trim() ||
    $('.rich_media_meta_nickname').text().trim() ||
    $('#profileBt a').text().trim() ||
    extractJsVar(rawHtml, 'nickname') ||
    '跨境工具说';

  // ---- 3. 发布时间 ----
  let publishedAt: Date | null = null;
  const publishTime =
    $('meta[property="og:article:published_time"]').attr('content') ||
    $('#publish_time').text().trim() ||
    extractJsVar(rawHtml, 'ori_create_time') ||
    '';
  if (publishTime) {
    const d = new Date(publishTime);
    if (!isNaN(d.getTime())) publishedAt = d;
  }

  // ---- 4. 封面图 ----
  const cover =
    $('meta[property="og:image"]').attr('content')?.trim() ||
    $('#js_cover').attr('src')?.trim() ||
    $('#js_cover').attr('data-src')?.trim() ||
    extractJsVar(rawHtml, 'msg_cdn_url') ||
    extractJsVar(rawHtml, 'cdn_url') ||
    null;

  // ---- 5. 正文 HTML（#js_content 优先，rich_media_content fallback） ----
  const contentEl = $('#js_content').length
    ? $('#js_content')
    : $('.rich_media_content');

  if (contentEl.length === 0) {
    throw new Error('未找到公众号正文节点（#js_content / .rich_media_content），HTML 格式可能不对');
  }

  // 5a. 删除无用节点
  contentEl.find('script, style, noscript, iframe[src*="ad"]').remove();
  contentEl.find('mpvoice, mp-common-profile, script').remove();
  // 删除"赞赏/点赞/留言"模块（通常带 .rich_media_tool 或 .function_btn）
  contentEl.find('.rich_media_tool, .function_btn, .share_notice').remove();

  // 5b. 图片懒加载处理：<img data-src="..."> → <img src="代理URL">
  contentEl.find('img').each((_, el) => {
    const $img = $(el);
    const dataSrc = $img.attr('data-src');
    const realSrc = dataSrc || $img.attr('src') || '';
    if (realSrc && !realSrc.startsWith('data:')) {
      $img.attr('src', proxifyImg(realSrc));
      $img.removeAttr('data-src');
    }
    // 删掉公众号自带的宽高限制（响应式更好）
    $img.removeAttr('style');
    $img.addClass('wechat-img max-w-full h-auto my-3 rounded-lg');
  });

  // 5c. 段落的 style background-image:url(...) 提取出来转 <img>
  contentEl.find('[style*="background-image"]').each((_, el) => {
    const $el = $(el);
    const style = $el.attr('style') || '';
    const m = style.match(/url\((['"]?)([^'")]+)\1\)/i);
    if (m && m[2] && WECHAT_IMG_HOST_RE.test(m[2])) {
      const $newImg = $('<img>')
        .attr('src', proxifyImg(m[2]))
        .addClass('wechat-img max-w-full h-auto my-3 rounded-lg');
      $el.replaceWith($newImg);
    }
  });

  // 5d. 视频标签保留（去掉微信水印链接）
  contentEl.find('iframe, video').each((_, el) => {
    const $el = $(el);
    $el.removeAttr('width').removeAttr('height').addClass('w-full aspect-video my-3 rounded-lg');
  });

  // 5e. <a> 链接：原始 href 为 "#" 或 "javascript:;" 的移除
  contentEl.find('a').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    if (href === '#' || href.startsWith('javascript:') || !href) {
      $a.replaceWith($a.text());
    } else if (!href.startsWith('http') && !href.startsWith('/')) {
      // 相对链接 → 补 mp.weixin.qq.com 前缀
      $a.attr('href', `https://mp.weixin.qq.com${href.startsWith('/') ? '' : '/'}${href}`);
    }
    $a.addClass('text-brand-600 hover:underline');
  });

  // 5f. 段落样式清理（去行内 style）
  contentEl.find('p, section, span, div').removeAttr('style');

  const contentHtml = contentEl.html()?.trim() || '';

  // ---- 6. excerpt：从正文纯文本抽 160 字 ----
  const plainText = stripHtml(contentHtml);
  const excerpt = plainText.slice(0, 160).replace(/[，。！？、：；]?\s*$/, '') + (plainText.length > 160 ? '…' : '');

  // ---- 7. tags：从正文/标题抽高频词（简化版，去掉 100+ 停用词） ----
  const STOP = new Set([
    '的', '了', '和', '是', '在', '我', '有', '不', '这', '也', '就', '都', '你', '对', '我们', '他们',
    '一个', '可以', '没有', '什么', '这样', '还是', '但是', '因为', '所以', '如果', '现在', '已经',
    '一些', '这里', '那里', '这些', '那些', '这个', '那个', '时候', '怎么', '为什么', '如何', '怎样',
    '那么', '其实', '应该', '可能', '需要', '可能', '通过', '进行', '以及', '其中', '一些', '一直',
    'app', 'com', 'cn', 'http', 'https', 'www', 'php', 'asp', 'jsp', 'html', 'css', 'js', 'json', 'xml',
  ]);
  const wordCount: Record<string, number> = {};
  const wordRe = /[\u4e00-\u9fa5]{2,6}/g; // 2-6 字中文词
  const corpus = (title + ' ' + plainText.slice(0, 1000)).toLowerCase();
  for (const w of corpus.match(wordRe) || []) {
    if (STOP.has(w)) continue;
    wordCount[w] = (wordCount[w] || 0) + 1;
  }
  const tags = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([w]) => w);

  return {
    title,
    author: author || '跨境工具说',
    publishedAt,
    cover: cover ? proxifyImg(cover) : null,
    content: contentHtml,
    excerpt,
    tags,
  };
}
