#!/usr/bin/env node
/**
 * Patch hero <picture> blocks and preloads for mobile WebP variants.
 * Run after generating *-mob.webp files in img/.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = [
  'index.html', 'b2b.html', 'b2c.html', 'helper.html', 'bloomi.html',
  'ru/index.html', 'ru/b2b.html', 'ru/b2c.html', 'ru/helper.html', 'ru/bloomi.html',
];

const heroMap = {
  'hero.webp': { mob: 'hero-mob.webp', fallback: 'hero.png', w: 1920, h: 1080, mobW: 768, mobH: 432 },
  'banner-b2b.webp': { mob: 'banner-b2b-mob.webp', fallback: 'banner-b2b.jpg', w: 1920, h: 1072, mobW: 768, mobH: 429 },
  'b2c-banner.webp': { mob: 'b2c-banner-mob.webp', fallback: 'b2c-banner.png', w: 1376, h: 768, mobW: 768, mobH: 429 },
  'bloomy-banner2.webp': { mob: 'bloomy-banner2-mob.webp', fallback: 'bloomy-banner2.jpg', w: 1365, h: 768, mobW: 768, mobH: 433 },
  'helper-hero.webp': { mob: 'helper-hero-mob.webp', fallback: 'helper-hero.jpg', w: 1920, h: 1080, mobW: 768, mobH: 432 },
};

function prefix(isRu) {
  return isRu ? '../img/' : 'img/';
}

function patchPreload(html, isRu) {
  const p = prefix(isRu);
  for (const [desk, meta] of Object.entries(heroMap)) {
    const old = `<link rel="preload" as="image" href="${p}${desk}" type="image/webp" fetchpriority="high">`;
    if (!html.includes(old)) continue;
    const neu = `<link rel="preload" as="image" href="${p}${meta.mob}" type="image/webp" fetchpriority="high" media="(max-width: 767px)">
    <link rel="preload" as="image" href="${p}${desk}" type="image/webp" fetchpriority="high" media="(min-width: 768px)">`;
    html = html.replace(old, neu);
  }
  return html;
}

function patchPicture(html, isRu) {
  const p = prefix(isRu);
  for (const [desk, meta] of Object.entries(heroMap)) {
    const re = new RegExp(
      `<picture([^>]*)>\\s*<source srcset="${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${desk.replace('.', '\\.')}" type="image/webp">\\s*<img([^>]*)>`,
      'g'
    );
    html = html.replace(re, (match, picAttrs, imgAttrs) => {
      if (imgAttrs.includes('sizes=')) return match;
      const img = imgAttrs
        .replace(/width="[^"]*"/, `width="${meta.w}"`)
        .replace(/height="[^"]*"/, `height="${meta.h}"`);
      return `<picture${picAttrs}>
                    <source media="(max-width: 767px)" srcset="${p}${meta.mob}" type="image/webp">
                    <source srcset="${p}${desk}" type="image/webp">
                    <img ${imgAttrs.trim()} sizes="100vw">`;
    });
  }
  return html;
}

for (const file of files) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');
  const isRu = file.startsWith('ru/');
  html = patchPreload(html, isRu);
  html = patchPicture(html, isRu);
  fs.writeFileSync(full, html);
  console.log('patched', file);
}
