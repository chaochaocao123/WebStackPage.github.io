/**
 * 文章内容渲染层兜底
 * 用途：详情页渲染 / 列表页预览时，统一处理微信图床 URL 走代理
 * 兜底对象：万一 parser 漏转 mmbiz 图床，渲染时再过一道
 */
import * as cheerio from 'cheerio';

/** 公众号图床域名（必须走 /api/img-proxy 才能在 kjgjs.cn 显示） */
const WECHAT_IMG_HOST_RE = /\bmmbiz\.qpic\.cn|mmbiz\.qlogo\.cn|wx\.qpic\.cn/i;

/** 单个图 URL 转代理（已代理过的跳过；非图床保留） */
export function proxifyImgUrl(src: string | null | undefined): string | null {
  if (!src) return src || null;
  if (src.startsWith('/api/img-proxy')) return src;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    if (WECHAT_IMG_HOST_RE.test(src)) {
      return `/api/img-proxy?url=${encodeURIComponent(src)}`;
    }
  }
  return src;
}

/**
 * 把 HTML 字符串内所有微信图床 URL 转成 /api/img-proxy
 * 作用：详情页 / 列表预览 / RSS 输出前过一遍
 * 不会改非微信图床 URL
 */
export function proxifyWechatImagesInHtml(html: string): string {
  if (!html) return html;
  // cheerio 解析 + 输出
  const $ = cheerio.load(`<div id="__root">${html}</div>`, { xml: false });
  $('#__root').find('img').each((_, el) => {
    const $img = $(el);
    // 1. src / data-src
    ['src', 'data-src'].forEach((attr) => {
      const v = $img.attr(attr);
      if (v) {
        const proxied = proxifyImgUrl(v);
        if (proxied && proxied !== v) $img.attr(attr, proxied);
      }
    });
    // 2. srcset
    const srcset = $img.attr('srcset');
    if (srcset) {
      const newSrcset = srcset
        .split(',')
        .map((part) => {
          const [u, ...rest] = part.trim().split(/\s+/);
          const proxied = proxifyImgUrl(u);
          return proxied ? [proxied, ...rest].join(' ') : part;
        })
        .join(', ');
      $img.attr('srcset', newSrcset);
    }
  });
  // 3. inline style 里的 background-image:url(...)
  $('#__root').find('[style*="background-image"]').each((_, el) => {
    const $el = $(el);
    const style = $el.attr('style') || '';
    const newStyle = style.replace(
      /url\((['"]?)([^'")]+)\1\)/gi,
      (full, q, u) => {
        const proxied = proxifyImgUrl(u);
        return proxied ? `url(${q}${proxied}${q})` : full;
      },
    );
    if (newStyle !== style) $el.attr('style', newStyle);
  });
  return $('#__root').html() || html;
}
