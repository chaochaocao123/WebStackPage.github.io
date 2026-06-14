// ==UserScript==
// @name         公众号文章导出为 JSON（kjgjs 后台专用）
// @namespace    kjgjs
// @version      1.0.0
// @description  在公众号文章页一键导出结构化 JSON，可粘到 kjgjs 后台发布
// @author       曹总专属 AI
// @match        https://mp.weixin.qq.com/s*
// @match        https://mp.weixin.qq.com/mp/homepage*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/**
 * 使用流程：
 * 1. 浏览器装 Tampermonkey 扩展
 * 2. 把本脚本完整粘到「添加新脚本」→ 保存
 * 3. 打开任意公众号文章页：https://mp.weixin.qq.com/s/xxxxx
 * 4. 右下角浮窗点「📦 导出 JSON」→ 自动下载 xxx.json
 * 5. 打开 kjgjs 后台 → 文章管理 → 导入公众号 JSON → 粘 JSON → 提交
 *
 * 数据格式（与 kjgjs 后台 import-json action 对齐）：
 * {
 *   title, author, publishedAt, cover, excerpt, tags, source, sourceType,
 *   blocks: [
 *     {type: 'text', content: '...'},
 *     {type: 'image', url: '...', alt: '...'},
 *     {type: 'heading', level: 2, content: '...'},
 *     {type: 'list', ordered: false, items: ['...', '...']},
 *   ]
 * }
 */

(function () {
  'use strict';

  // ==================== 1. UI：右下角浮窗按钮 ====================
  const BTN_ID = '__kjgjs_export_btn__';
  if (document.getElementById(BTN_ID)) return; // 防重复

  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.innerHTML = '📦 导出 JSON';
  btn.style.cssText = `
    position: fixed; right: 24px; bottom: 24px; z-index: 999999;
    padding: 12px 20px; background: #2563eb; color: white; border: none;
    border-radius: 10px; font-size: 14px; font-weight: 600;
    box-shadow: 0 4px 14px rgba(37, 99 235, 0.35);
    cursor: pointer; transition: all 0.2s;
  `;
  btn.onmouseenter = () => (btn.style.transform = 'translateY(-2px)');
  btn.onmouseleave = () => (btn.style.transform = 'translateY(0)');
  document.body.appendChild(btn);

  // ==================== 2. 工具函数 ====================
  function getMeta(prop) {
    const el = document.querySelector(`meta[property="${prop}"]`);
    return el ? (el.getAttribute('content') || '').trim() : '';
  }

  function cleanText(s) {
    if (!s) return '';
    return s
      .replace(/[\u00A0\u2002\u2003\u2009]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ==================== 3. 解析正文 → blocks ====================
  function parseContent() {
    const contentEl =
      document.querySelector('#js_content') ||
      document.querySelector('.rich_media_content');
    if (!contentEl) {
      throw new Error('未找到正文节点（#js_content / .rich_media_content），可能不是公众号文章页');
    }

    const blocks = [];

    // 3.1 抓所有图片（懒加载 data-src 优先）
    function getImgSrc(img) {
      return (
        img.getAttribute('data-src') ||
        img.getAttribute('src') ||
        ''
      ).trim();
    }

    // 3.2 抓 section / p / h1-h6 / ul / ol 的子节点
    function walkChildren(parent) {
      parent.childNodes.forEach((node) => {
        if (node.nodeType !== 1) return; // 跳过文本节点

        const tag = node.tagName.toLowerCase();

        if (tag === 'p') {
          // p 里的图片
          node.querySelectorAll('img').forEach((img) => {
            const src = getImgSrc(img);
            if (src && !src.startsWith('data:')) {
              blocks.push({
                type: 'image',
                url: src,
                alt: img.alt || '',
              });
            }
          });
          // p 里的纯文本
          const text = cleanText(node.textContent);
          if (text) blocks.push({ type: 'text', content: text });
        } else if (tag === 'section') {
          // section 里可能再嵌 section / img / p
          if (node.querySelector('img')) {
            node.querySelectorAll('img').forEach((img) => {
              const src = getImgSrc(img);
              if (src && !src.startsWith('data:')) {
                blocks.push({
                  type: 'image',
                  url: src,
                  alt: img.alt || '',
                });
              }
            });
          } else {
            walkChildren(node);
          }
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
          const text = cleanText(node.textContent);
          if (text) {
            blocks.push({
              type: 'heading',
              level: parseInt(tag[1], 10),
              content: text,
            });
          }
        } else if (tag === 'ul' || tag === 'ol') {
          const items = Array.from(node.querySelectorAll(':scope > li')).map((li) =>
            cleanText(li.textContent),
          );
          if (items.length) {
            blocks.push({
              type: 'list',
              ordered: tag === 'ol',
              items,
            });
          }
        } else if (tag === 'blockquote') {
          const text = cleanText(node.textContent);
          if (text) blocks.push({ type: 'quote', content: text });
        } else if (tag === 'pre' || tag === 'code') {
          const text = node.textContent;
          if (text) blocks.push({ type: 'code', content: text });
        } else if (tag === 'img') {
          const src = getImgSrc(node);
          if (src && !src.startsWith('data:')) {
            blocks.push({
              type: 'image',
              url: src,
              alt: node.alt || '',
            });
          }
        } else if (tag === 'br') {
          // 忽略（用 text 块分隔）
        } else {
          // 兜底：抓 text + img
          node.querySelectorAll && node.querySelectorAll('img').forEach((img) => {
            const src = getImgSrc(img);
            if (src && !src.startsWith('data:')) {
              blocks.push({
                type: 'image',
                url: src,
                alt: img.alt || '',
              });
            }
          });
          const text = cleanText(node.textContent);
          if (text && blocks.length > 0 && blocks[blocks.length - 1].type === 'text') {
            blocks[blocks.length - 1].content += ' ' + text;
          } else if (text) {
            blocks.push({ type: 'text', content: text });
          }
        }
      });
    }

    walkChildren(contentEl);

    // 去重：相邻重复 text 块合并
    const merged = [];
    blocks.forEach((b) => {
      if (b.type === 'text' && merged.length > 0 && merged[merged.length - 1].type === 'text') {
        merged[merged.length - 1].content += '\n' + b.content;
      } else {
        merged.push(b);
      }
    });

    return merged;
  }

  // ==================== 4. 抓取 ====================
  function extract() {
    // 1. 标题：og:title > .rich_media_title > title
    const title = cleanText(
      getMeta('og:title') ||
        document.querySelector('.rich_media_title')?.textContent ||
        document.title,
    ).replace(/[-_—–]\s*[^-\s]+$/, '');

    // 2. 作者
    const author = cleanText(
      getMeta('og:article:author') ||
        document.querySelector('#js_author_name')?.textContent ||
        document.querySelector('.rich_media_meta_nickname')?.textContent ||
        '跨境工具说',
    );

    // 3. 发布时间
    const publishedAt =
      getMeta('og:article:published_time') ||
      document.querySelector('#publish_time')?.textContent?.trim() ||
      new Date().toISOString();

    // 4. 封面
    const cover = getMeta('og:image');

    // 5. blocks
    const blocks = parseContent();

    // 6. excerpt（前 160 字）
    const excerpt = blocks
      .filter((b) => b.type === 'text')
      .map((b) => b.content)
      .join(' ')
      .slice(0, 160);

    // 7. tags（暂空，让 admin 选）
    const tags = [];

    return {
      title,
      author,
      publishedAt,
      cover: cover || null,
      excerpt,
      tags,
      source: location.href,
      sourceType: 'wechat-tampermonkey',
      blocks,
    };
  }

  // ==================== 5. 下载 ====================
  function downloadJson(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 文件名：标题-2026-06-14.json
    const safeTitle = data.title
      ? data.title
          .replace(/[\\/:*?"<>|]/g, '')
          .slice(0, 30)
      : 'wechat-article';
    a.download = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==================== 6. 绑定事件 ====================
  btn.addEventListener('click', () => {
    try {
      btn.disabled = true;
      btn.innerHTML = '⏳ 解析中...';
      const data = extract();
      if (!data.title) {
        alert('⚠️ 未找到标题，请确认这是公众号文章页');
        return;
      }
      if (!data.blocks.length) {
        alert('⚠️ 未找到正文，可能公众号改版了。反馈给我修脚本。');
        return;
      }
      downloadJson(data);
      btn.innerHTML = `✅ 已导出 ${data.blocks.length} 块`;
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '📦 导出 JSON';
      }, 3000);
    } catch (e) {
      alert('❌ 解析失败：' + (e.message || e));
      btn.disabled = false;
      btn.innerHTML = '📦 导出 JSON';
    }
  });
})();
