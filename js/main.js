/* VendStore — main interactions */

/* ─── Language switch — paired pages ─── */
(function initLangSwitch() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const inRu = pathParts[0] === 'ru';
  let file = inRu ? pathParts[1] : pathParts[pathParts.length - 1];
  if (!file || !file.endsWith('.html')) file = 'index.html';

  const ruAvailable = new Set(['index.html', 'helper.html', 'bloomi.html', 'b2b.html', 'b2c.html']);
  const urls = {
    uk: inRu ? `../${file}` : file,
    ru: inRu ? file : `ru/${file}`,
  };

  document.querySelectorAll('.lang-switch__btn[hreflang]').forEach((btn) => {
    const lang = btn.getAttribute('hreflang');
    if (lang === 'uk') {
      btn.href = urls.uk;
      return;
    }
    if (lang !== 'ru') return;

    if (ruAvailable.has(file)) {
      btn.href = urls.ru;
      btn.removeAttribute('aria-disabled');
      btn.removeAttribute('title');
      btn.classList.remove('lang-switch__btn--pending');
      return;
    }

    btn.href = '#';
    btn.setAttribute('aria-disabled', 'true');
    btn.title = document.documentElement.lang === 'ru'
      ? 'Украинская версия скоро'
      : 'Русская версия скоро';
    btn.classList.add('lang-switch__btn--pending');
    btn.addEventListener('click', (event) => event.preventDefault());
  });
})();

/* ─── Active nav link ─── */
(function () {
  const page = document.body.dataset.page;
  if (!page) return;
  const map = { home: 'index.html' };
  const current = map[page] || `${page}.html`;
  document.querySelectorAll('.header__nav a, .header__menu nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === current || (page === 'home' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });
})();

/* ─── FAQ accordion ─── */
document.querySelectorAll('[data-faq] .faq__q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq__item');
    const open = item.classList.contains('is-open');
    item.closest('[data-faq]')?.querySelectorAll('.faq__item').forEach((i) => i.classList.remove('is-open'));
    if (!open) item.classList.add('is-open');
  });
});

const header = document.querySelector('.header');
const body = document.body;
const html = document.documentElement;

/* ─── Hero video (як у KAYA) ─── */
(function () {
  const video = document.querySelector('.hero__video');
  if (!video) return;

  const isMobile = window.innerWidth < 768;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = conn && conn.saveData;
  const slowNet = conn && /^([23]g|slow-2g)$/i.test(conn.effectiveType || '');

  if (isMobile || saveData || slowNet) {
    video.remove();
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');

  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        const retry = () => {
          video.muted = true;
          video.play().catch(() => {});
          ['touchstart', 'click', 'scroll'].forEach((ev) =>
            window.removeEventListener(ev, retry));
        };
        ['touchstart', 'click', 'scroll'].forEach((ev) =>
          window.addEventListener(ev, retry, { once: true, passive: true }));
      });
    }
  };

  const startLoad = () => {
    if (!video.querySelector('source')) {
      const source = document.createElement('source');
      source.src = 'img/hero-video.mp4';
      source.type = 'video/mp4';
      video.appendChild(source);
    }
    video.load();
    const onReady = () => {
      video.classList.add('is-loaded');
      tryPlay();
    };
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('canplay', onReady, { once: true });
    setTimeout(() => {
      if (!video.classList.contains('is-loaded')) {
        video.classList.add('is-loaded');
        tryPlay();
      }
    }, 3000);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(startLoad, { timeout: 2000 });
  } else {
    window.addEventListener('load', () => setTimeout(startLoad, 500), { once: true });
  }
})();

function getAssetBase() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] === 'ru' ? '../' : '';
}

function vendorPath(relativePath) {
  return `${getAssetBase()}${relativePath}`;
}

/* ─── Lenis + GSAP ─── */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getMotionScripts() {
  return [
    vendorPath('js/vendor/gsap.min.js'),
    vendorPath('js/vendor/ScrollTrigger.min.js'),
    vendorPath('js/vendor/lenis.min.js'),
  ];
}
const MOBILE_MAX_WIDTH = 899;

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
}
let lenisInstance = null;
let lenisReady = false;
let gsapMotionReady = false;
let motionScriptsLoading = false;

function setupProductCurtains() {
  document.querySelectorAll('.product-spot__visual').forEach((visual) => {
    const parallax = visual.querySelector('.product-spot__parallax');
    if (parallax) {
      const img = parallax.querySelector('img');
      if (img) visual.insertBefore(img, parallax);
      parallax.remove();
    }

    if (visual.querySelector('.product-spot__curtain')) return;

    const curtain = document.createElement('div');
    curtain.className = 'product-spot__curtain';
    curtain.setAttribute('aria-hidden', 'true');

    const img = visual.querySelector(':scope > img');
    if (img) {
      img.after(curtain);
    } else {
      visual.appendChild(curtain);
    }
  });
}

setupProductCurtains();

function initScrollProgress() {
  if (prefersReducedMotion) return;

  let progressBar = document.querySelector('.vs-scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'vs-scroll-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);
  }

  const setProgress = (ratio) => {
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
  };

  window.__vsSetScrollProgress = setProgress;

  const updateNative = () => {
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(limit > 0 ? window.scrollY / limit : 0);
  };

  window.addEventListener('scroll', updateNative, { passive: true });
  updateNative();
}

function initLenis() {
  if (lenisReady || isSafari || typeof Lenis === 'undefined') {
    if (isSafari) {
      document.documentElement.classList.add('no-lenis');
    }
    return;
  }

  lenisReady = true;
  document.documentElement.classList.add('lenis', 'lenis-smooth');

  lenisInstance = new Lenis({
    lerp: 0.09,
    smoothWheel: true,
    prevent: (node) => node.closest('.modal__window') !== null,
  });
  window.__vsLenis = lenisInstance;

  if (!prefersReducedMotion && typeof window.__vsSetScrollProgress === 'function') {
    lenisInstance.on('scroll', ({ scroll, limit }) => {
      window.__vsSetScrollProgress(limit ? scroll / limit : 0);
    });
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenisInstance.scrollTo(value, { immediate: true });
        }
        return lenisInstance.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    lenisInstance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const lenisRaf = (time) => {
      lenisInstance.raf(time);
      requestAnimationFrame(lenisRaf);
    };
    requestAnimationFrame(lenisRaf);
  }
}

function revealOnScroll(targets, options = {}) {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const {
    trigger,
    start = 'top 88%',
    y = 18,
    x = 0,
    duration = 0.72,
    stagger = 0,
    ease = 'power2.out',
  } = options;

  const list = gsap.utils.toArray(targets);
  if (!list.length) return;

  gsap.fromTo(
    list,
    { y, x, opacity: 0 },
    {
      y: 0,
      x: 0,
      opacity: 1,
      duration,
      stagger,
      ease,
      scrollTrigger: {
        trigger: trigger || list[0],
        start,
        toggleActions: 'play none none none',
      },
    }
  );
}

function parallaxImg(img, trigger, options = {}) {
  if (!img || !trigger || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  if (isMobileViewport()) return;

  const { start = -12, end = 12, scrub = 0.5 } = options;

  gsap.fromTo(
    img,
    { yPercent: start },
    {
      yPercent: end,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub,
      },
    }
  );
}

function initPageHeroAnimation() {
  const pageHero = document.querySelector('.page-hero');
  if (!pageHero) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  const eyebrow = pageHero.querySelector('.eyebrow');
  const title = pageHero.querySelector('.page-hero__title');
  const text = pageHero.querySelector('.page-hero__text');
  const actions = pageHero.querySelector('.page-hero__actions');
  const stats = pageHero.querySelectorAll('.page-hero__stat');

  if (eyebrow) {
    tl.fromTo(eyebrow, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.68 });
  }
  if (title) {
    tl.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, '-=0.38');
  }
  if (text) {
    tl.fromTo(text, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, '-=0.52');
  }
  if (actions) {
    tl.fromTo(actions, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65 }, '-=0.48');
  }
  if (stats.length) {
    tl.fromTo(
      stats,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.58, stagger: 0.09 },
      '-=0.42'
    );
  }
}

function initInnerPageMotion() {
  document.querySelectorAll('.split').forEach((split) => {
    const content = split.querySelector('.split__content');
    const media = split.querySelector('.split__media');
    const isReverse = split.classList.contains('split--reverse');

    if (content) {
      revealOnScroll(content, {
        trigger: split,
        start: 'top 84%',
        x: isMobileViewport() ? 0 : isReverse ? 44 : -44,
        y: 0,
        duration: 0.82,
      });
    }

    if (media) {
      revealOnScroll(media, {
        trigger: split,
        start: 'top 84%',
        x: isMobileViewport() ? 0 : isReverse ? -44 : 44,
        y: 0,
        duration: 0.82,
      });
    }
  });

  document.querySelectorAll('.cards').forEach((grid) => {
    revealOnScroll(grid.querySelectorAll('.card'), {
      trigger: grid,
      start: 'top 86%',
      stagger: 0.08,
      y: 22,
    });
  });

  document.querySelectorAll('.values').forEach((grid) => {
    revealOnScroll(grid.querySelectorAll('.values__item'), {
      trigger: grid,
      start: 'top 86%',
      stagger: 0.07,
      y: 20,
    });
  });

  document.querySelectorAll('.product-models').forEach((grid) => {
    revealOnScroll(grid.querySelectorAll('.product-model'), {
      trigger: grid,
      start: 'top 86%',
      stagger: 0.1,
      y: 26,
    });
  });

  document.querySelectorAll('.product-picks').forEach((grid) => {
    revealOnScroll(grid.querySelectorAll('.product-pick'), {
      trigger: grid,
      start: 'top 86%',
      stagger: 0.08,
      y: 22,
    });
  });

  document.querySelectorAll('.product-stat').forEach((stat) => {
    revealOnScroll(stat, { trigger: stat, start: 'top 84%', y: 28, duration: 0.8 });
  });

  document.querySelectorAll('.product-chips').forEach((list) => {
    revealOnScroll(list.querySelectorAll('li'), {
      trigger: list,
      start: 'top 88%',
      stagger: 0.05,
      y: 14,
    });
  });

  document.querySelectorAll('.products__features').forEach((list) => {
    revealOnScroll(list.querySelectorAll('li'), {
      trigger: list.closest('.split') || list,
      start: 'top 88%',
      stagger: 0.06,
      y: 12,
    });
  });

  document.querySelectorAll('.specs').forEach((list) => {
    revealOnScroll(list.querySelectorAll('li'), {
      trigger: list.closest('.specs-layout') || list,
      start: 'top 88%',
      stagger: 0.06,
      y: 12,
    });
  });

  document.querySelectorAll('.specs-layout__media').forEach((media) => {
    revealOnScroll(media, {
      trigger: media.closest('.specs-layout') || media,
      start: 'top 86%',
      y: 28,
    });
  });

  document.querySelectorAll('.faq-section').forEach((section) => {
    const intro = section.querySelector('.faq-layout__intro');
    const items = section.querySelectorAll('.faq__item');
    const media = section.querySelector('.faq-layout__media');
    const ghost = section.querySelector('.faq-layout__ghost');
    const stage = section.querySelector('.faq-stage') || section;

    if (intro) {
      revealOnScroll(intro, { trigger: section, start: 'top 84%', y: 22 });
    }

    if (items.length) {
      revealOnScroll(items, {
        trigger: stage,
        start: 'top 82%',
        stagger: 0.07,
        y: 16,
      });
    }

    if (media) {
      revealOnScroll(media, {
        trigger: section,
        start: 'top 80%',
        x: 36,
        y: 0,
        duration: 0.85,
      });
    }

    if (ghost) {
      gsap.fromTo(
        ghost,
        { opacity: 0.08, x: 20 },
        {
          opacity: 0.22,
          x: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        }
      );
    }
  });

  document.querySelectorAll('.location-cta__inner').forEach((inner) => {
    revealOnScroll(inner, {
      trigger: inner.closest('.location-cta'),
      start: 'top 82%',
      y: 36,
      duration: 0.85,
    });
  });
}

function initGsapMotion() {
  if (gsapMotionReady || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  gsapMotionReady = true;
  document.body.classList.add('is-motion-ready');
  gsap.registerPlugin(ScrollTrigger);

  if (!prefersReducedMotion) {
    const hero = document.querySelector('.hero--home');
    if (hero) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      const body = hero.querySelector('.hero__body');
      const actions = hero.querySelector('.hero__actions');
      if (body) {
        tl.fromTo(body, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 });
      }
      if (actions) {
        tl.fromTo(actions, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65 }, '-=0.42');
      }
    } else {
      initPageHeroAnimation();
    }

    document.querySelectorAll('.home-perks').forEach((strip) => {
      const items = strip.querySelectorAll('.home-perks__item');
      if (!items.length) return;
      gsap.fromTo(
        items,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.58,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: strip,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    gsap.utils
      .toArray(
        '.products__head, .steps__head, .audience__intro, .page-block__head, .calc-section__head, .location__intro'
      )
      .forEach((el) => {
        gsap.fromTo(
          el,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.72,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

    document.querySelectorAll('.steps__track').forEach((track) => {
      const steps = track.querySelectorAll('.steps__step');
      if (!steps.length) return;
      gsap.fromTo(
        steps,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.62,
          stagger: 0.07,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: track,
            start: 'top 86%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    initInnerPageMotion();
    initScrollParallax();
    initAudienceLaneMotion();
  }

  ScrollTrigger.refresh();
}

function initProductCurtainPin() {
  if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  const stage = document.querySelector('.products__stage');
  if (!stage) return;

  const visuals = stage.querySelectorAll('.product-spot__visual');
  if (!visuals.length) return;

  const pinScrollDistance = () => window.innerHeight * (isMobileViewport() ? 0.9 : 1.05);

  if (isMobileViewport()) {
    stage.querySelectorAll('.product-spot').forEach((spot) => {
      const visual = spot.querySelector('.product-spot__visual');
      if (!visual) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: spot,
          start: 'top top',
          end: () => `+=${pinScrollDistance()}`,
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(visual, { '--curtain-h': '100%' }, { '--curtain-h': '0%', ease: 'none' }, 0);
    });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${pinScrollDistance()}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  visuals.forEach((visual) => {
    tl.fromTo(visual, { '--curtain-h': '100%' }, { '--curtain-h': '0%', ease: 'none' }, 0);
  });
}

function initAudienceLaneMotion() {
  if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  if (isMobileViewport()) return;

  document.querySelectorAll('.audience__lane').forEach((lane) => {
    const figure = lane.querySelector('.audience__figure');
    const img = lane.querySelector('.audience__frame img');
    const isB2c = lane.classList.contains('audience__lane--b2c');

    if (figure) {
      gsap.fromTo(
        figure,
        {
          y: 120,
          x: isB2c ? -48 : 48,
          rotate: isB2c ? -1.5 : 1.5,
        },
        {
          y: -100,
          x: isB2c ? 24 : -24,
          rotate: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: lane,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.85,
            invalidateOnRefresh: true,
          },
        }
      );
    }

    if (img) {
      gsap.fromTo(
        img,
        { yPercent: -18, scale: 1.1 },
        {
          yPercent: 16,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: lane,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.65,
            invalidateOnRefresh: true,
          },
        }
      );
    }
  });
}

function initScrollParallax() {
  if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  initProductCurtainPin();

  const ctaBanner = document.querySelector('.cta-banner');
  const ctaLeft = document.querySelector('.cta-banner__left');
  if (ctaBanner && ctaLeft) {
    gsap.fromTo(
      ctaLeft,
      { '--cta-bg-y': '18%' },
      {
        '--cta-bg-y': '72%',
        ease: 'none',
        scrollTrigger: {
          trigger: ctaBanner,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  }

  if (!isMobileViewport()) {
    document.querySelectorAll('.cta-banner__format-media picture').forEach((picture) => {
      gsap.fromTo(
        picture,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: picture.closest('.cta-banner__format') || picture,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });
  }

  document.querySelectorAll('.location-cta').forEach((section) => {
    const img = section.querySelector('.location-cta__bg img');
    if (!img) return;

    parallaxImg(img, section, { start: -14, end: 14, scrub: 0.5 });
  });

  document.querySelectorAll('.page-hero').forEach((hero) => {
    const img = hero.querySelector('.page-hero__bg img');
    parallaxImg(img, hero, { start: -10, end: 10, scrub: 0.45 });
  });

  document.querySelectorAll('.split__media img').forEach((img) => {
    const split = img.closest('.split');
    parallaxImg(img, split || img, { start: -12, end: 12, scrub: 0.55 });
  });

  document.querySelectorAll('.faq-layout__media img').forEach((img) => {
    const section = img.closest('.faq-section');
    parallaxImg(img, section || img, { start: -10, end: 10, scrub: 0.5 });
  });
}

function initMotion() {
  initLenis();
  initGsapMotion();
}

function loadMotionScripts() {
  if (motionScriptsLoading || gsapMotionReady) return;
  motionScriptsLoading = true;

  const scripts = getMotionScripts();

  (function next(index) {
    if (index >= scripts.length) {
      initMotion();
      return;
    }

    const script = document.createElement('script');
    script.src = scripts[index];
    script.onload = () => next(index + 1);
    document.head.appendChild(script);
  })(0);
}

initScrollProgress();
window.__vsInitMotion = initMotion;

function scheduleMotionScripts() {
  if (prefersReducedMotion || motionScriptsLoading || gsapMotionReady) return;

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    loadMotionScripts();
  };

  window.addEventListener('scroll', start, { once: true, passive: true });
  window.addEventListener('pointerdown', start, { once: true, passive: true });

  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 4000 });
  } else {
    window.addEventListener('load', () => setTimeout(start, 2500), { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleMotionScripts, { once: true });
} else {
  scheduleMotionScripts();
}

function updateHeader() {
  if (!header) return;
  header.classList.toggle('header--scrolled', window.scrollY >= 80);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

/* ─── Burger menu ─── */
const burger = document.querySelector('.burger');
const mobileMenu = document.getElementById('mobile-menu');

function openMenu() {
  burger?.classList.add('is-active');
  mobileMenu?.classList.add('is-open');
  header?.classList.add('header--menu-open');
  body.classList.add('menu-open');
  html.classList.add('menu-open');
  burger?.setAttribute('aria-expanded', 'true');
  mobileMenu?.setAttribute('aria-hidden', 'false');
  lenisInstance?.stop();
}

function closeMenu() {
  burger?.classList.remove('is-active');
  mobileMenu?.classList.remove('is-open');
  header?.classList.remove('header--menu-open');
  body.classList.remove('menu-open');
  html.classList.remove('menu-open');
  burger?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  lenisInstance?.start();
}

burger?.addEventListener('click', () => {
  burger.classList.contains('is-active') ? closeMenu() : openMenu();
});

mobileMenu?.querySelectorAll('a, button').forEach((el) => {
  el.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

/* ─── Audience tabs ─── */
const audienceTabs = document.querySelectorAll('.audience__tab');
const audiencePanels = document.querySelectorAll('.audience__lane, .audience__panel');

if (!audienceTabs.length) {
  audiencePanels.forEach((p) => { p.hidden = false; });
}

audienceTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const id = tab.dataset.tab;
    audienceTabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    audiencePanels.forEach((panel) => {
      const show = panel.id === `panel-${id}`;
      panel.classList.toggle('is-active', show);
      panel.hidden = !show;
    });
  });
});

/* ─── Product tabs ─── */
const productBtns = document.querySelectorAll('.products__nav-btn');
const productPanels = document.querySelectorAll('.products__panel');

productBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.product;
    productBtns.forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    productPanels.forEach((panel) => {
      const show = panel.dataset.panel === key;
      panel.classList.toggle('is-active', show);
      panel.hidden = !show;
    });
  });
});

/* ─── Phone mask ─── */
function applyPhoneMask(input) {
  input.addEventListener('input', () => {
    let digits = input.value.replace(/\D/g, '');
    if (digits.startsWith('380')) digits = digits.slice(3);
    else if (digits.startsWith('38')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 9);

    let mask = '';
    if (digits.length > 0) {
      const p1 = digits.slice(0, 2);
      const p2 = digits.slice(2, 5);
      const p3 = digits.slice(5, 7);
      const p4 = digits.slice(7, 9);
      mask = '+38 (0' + p1;
      if (digits.length > 2) mask += ') ' + p2;
      if (digits.length > 5) mask += '-' + p3;
      if (digits.length > 7) mask += '-' + p4;
    }
    input.value = mask;
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && input.value === '+38 (0') {
      e.preventDefault();
      input.value = '';
    }
  });
}

document.querySelectorAll('input[type="tel"]').forEach(applyPhoneMask);

/* ─── Modal ─── */
const modal = document.getElementById('modal');
const modalSuccess = document.getElementById('modal-success');
const modalForm = document.getElementById('modal-form');
const modalTitle = document.getElementById('modal-title');
const modalProductInput = document.getElementById('modal-product');
const locationForm = document.getElementById('location-form');

let savedScrollY = 0;

function lockScroll() {
  savedScrollY = lenisInstance?.scroll ?? window.scrollY ?? 0;
  lenisInstance?.stop();
  body.style.top = `-${savedScrollY}px`;
  body.classList.add('modal-open');
  if (window.innerWidth < 1024) body.classList.add('modal-open--fixed');
}

function unlockScroll() {
  const y = savedScrollY;
  body.classList.remove('modal-open', 'modal-open--fixed');
  body.style.top = '';
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  html.style.scrollBehavior = '';
  if (lenisInstance) {
    lenisInstance.scrollTo(y, { immediate: true, force: true });
    lenisInstance.start();
  }
  ScrollTrigger?.refresh();
}

const modalCopy = {
  partner: {
    title: ['Заявка на', 'партнерство'],
    subtitle:
      'Залиште контакти — підберемо формат і надішлемо розрахунок протягом 1 робочого дня.',
  },
  callback: {
    title: ['Заявка на', 'партнерство'],
    subtitle:
      'Залиште контакти — підберемо формат і надішлемо розрахунок протягом 1 робочого дня.',
  },
  location: {
    title: ['Запропонувати', 'локацію'],
    subtitle: 'Опишіть площу або адресу — перевіримо локацію на карту трафіку.',
  },
};

function openModal(opts = {}) {
  if (!modal) return;
  const type = opts.formType || 'partner';
  const product = opts.product || '';
  const copy = modalCopy[type] || modalCopy.partner;
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalProductLabel = document.getElementById('modal-product-label');

  if (modalForm) {
    const typeInput = modalForm.querySelector('[name="form_type"]');
    if (typeInput) typeInput.value = type;
    if (modalProductInput) modalProductInput.value = product;
  }

  if (modalTitle) {
    modalTitle.innerHTML = `${copy.title[0]} <span>${copy.title[1]}</span>`;
  }

  if (modalSubtitle) {
    modalSubtitle.textContent = copy.subtitle;
  }

  if (modalProductLabel) {
    if (product) {
      modalProductLabel.textContent = product;
      modalProductLabel.hidden = false;
    } else {
      modalProductLabel.textContent = '';
      modalProductLabel.hidden = true;
    }
  }

  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  lockScroll();
}

function closeModal() {
  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  unlockScroll();
}

function openModalSuccess() {
  if (modal?.classList.contains('is-open')) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }
  modalSuccess?.classList.add('is-open');
  modalSuccess?.setAttribute('aria-hidden', 'false');
  if (!body.classList.contains('modal-open')) lockScroll();
}

function closeModalSuccess() {
  modalSuccess?.classList.remove('is-open');
  modalSuccess?.setAttribute('aria-hidden', 'true');
  unlockScroll();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.js-open-modal');
  if (!btn) return;
  e.preventDefault();
  openModal({
    formType: btn.dataset.formType || 'callback',
    product: btn.dataset.product || '',
  });
});

document.querySelectorAll('.js-modal-close').forEach((el) => {
  el.addEventListener('click', closeModal);
});

document.querySelectorAll('.js-modal-success-close').forEach((el) => {
  el.addEventListener('click', closeModalSuccess);
});

modal?.addEventListener('click', (e) => {
  if (!e.target.closest('.modal__window')) closeModal();
});

modalSuccess?.addEventListener('click', (e) => {
  if (!e.target.closest('.modal__window')) closeModalSuccess();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeModalSuccess();
  }
});

/* ─── Form validation & submit ─── */
const scriptSrc = document.querySelector('script[src*="vendstore/js/main.js"], script[src="js/main.js"]')?.src || '';
const siteRoot = scriptSrc.replace(/\/js\/main\.js.*$/, '') || '';
const sendUrl = `${siteRoot}/send.php`;

function validateField(input) {
  const isPhone = input.type === 'tel';
  const isRequired = input.hasAttribute('required');
  const empty = input.value.trim() === '';
  const phoneOk = /^\+38 \(0\d{2}\) \d{3}-\d{2}-\d{2}$/.test(input.value);
  const invalid = (isRequired && empty) || (isPhone && !empty && !phoneOk) || (isPhone && isRequired && !phoneOk);

  input.classList.toggle('is-error', invalid);
  input.classList.toggle('is-valid', !invalid && !empty);

  let err = input.parentElement?.querySelector('.form-error');
  if (invalid) {
    if (!err) {
      err = document.createElement('span');
      err.className = 'form-error';
      input.after(err);
    }
    err.textContent = empty ? "Обов'язкове поле" : 'Введіть повний номер';
  } else if (err) {
    err.remove();
  }
  return !invalid;
}

async function submitForm(form, submitBtn) {
  const required = form.querySelectorAll('input[required], textarea[required]');
  let valid = true;
  form.querySelectorAll('input[type="tel"]').forEach((f) => {
    if (!validateField(f)) valid = false;
  });
  required.forEach((f) => {
    if (f.type !== 'tel' && !validateField(f)) valid = false;
  });
  if (!valid) return;

  const original = submitBtn?.textContent || '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'ВІДПРАВКА...';
  }

  try {
    const res = await fetch(sendUrl, { method: 'POST', body: new FormData(form) });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Send failed');

    form.reset();
    form.querySelectorAll('.is-valid, .is-error').forEach((el) => el.classList.remove('is-valid', 'is-error'));
    form.querySelectorAll('.form-error').forEach((el) => el.remove());
    openModalSuccess();
  } catch (err) {
    console.error(err);
    alert('Не вдалося надіслати заявку. Спробуйте ще раз або напишіть на headofmarketingv12@gmail.com');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  }
}

if (modalForm) {
  modalForm.querySelectorAll('input').forEach((f) => {
    f.addEventListener('blur', () => validateField(f));
  });
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(modalForm, modalForm.querySelector('button[type="submit"]'));
  });
}

if (locationForm) {
  locationForm.querySelectorAll('input[required], input[type="tel"]').forEach((f) => {
    f.addEventListener('blur', () => validateField(f));
  });
  locationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(locationForm, locationForm.querySelector('button[type="submit"]'));
  });
}

const calcForm = document.getElementById('calc-form');

if (calcForm) {
  calcForm.querySelectorAll('input[required], input[type="tel"]').forEach((f) => {
    f.addEventListener('blur', () => validateField(f));
  });
  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(calcForm, calcForm.querySelector('button[type="submit"]'));
  });
}

/* Smooth anchor (same page only) */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenisInstance) {
      lenisInstance.scrollTo(target, { offset: -80 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Mark home nav on index */
if (document.body.dataset.page === 'home') {
  document.querySelector('.header__menu a[href="index.html"]')?.classList.add('is-active');
}

/* ─── Product detail overlay (home) ─── */
(function () {
  function closeProductDetail(visual) {
    if (!visual) return;
    const detail = visual.querySelector('.product-spot__detail');
    const trigger = visual.querySelector('.js-product-detail-open');
    visual.classList.remove('is-detail-open');
    if (detail) {
      detail.classList.remove('is-open');
      detail.setAttribute('aria-hidden', 'true');
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function getHeaderOffset() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--vs-header-h').trim();
    return parseInt(raw, 10) || 80;
  }

  function scrollVisualToStart(visual) {
    return new Promise((resolve) => {
      const headerOffset = getHeaderOffset();
      const top = visual.getBoundingClientRect().top;

      if (Math.abs(top - headerOffset) <= 3) {
        resolve();
        return;
      }

      const targetY = window.pageYOffset + top - headerOffset;
      let settled = false;

      function finish() {
        if (settled) return;
        settled = true;
        window.removeEventListener('scroll', onScroll);
        clearTimeout(timer);
        resolve();
      }

      function onScroll() {
        if (Math.abs(visual.getBoundingClientRect().top - headerOffset) <= 3) {
          finish();
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      const timer = setTimeout(finish, 800);

      if (window.__vsLenis && typeof window.__vsLenis.scrollTo === 'function') {
        window.__vsLenis.scrollTo(targetY, { duration: 0.75, onComplete: finish });
        return;
      }

      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    });
  }

  function openProductDetail(visual, trigger) {
    const detail = visual.querySelector('.product-spot__detail');
    if (!detail || visual.classList.contains('is-detail-open')) return;

    return scrollVisualToStart(visual).then(() => {
      document.querySelectorAll('.product-spot__visual.is-detail-open').forEach((v) => {
        if (v !== visual) closeProductDetail(v);
      });
      visual.classList.add('is-detail-open');
      detail.classList.add('is-open');
      detail.setAttribute('aria-hidden', 'false');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    });
  }

  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('.js-product-detail-open');
    if (openBtn) {
      e.preventDefault();
      const visual = openBtn.closest('.product-spot__visual');
      if (!visual || visual.dataset.detailBusy === 'true') return;
      visual.dataset.detailBusy = 'true';
      openProductDetail(visual, openBtn).finally(() => {
        delete visual.dataset.detailBusy;
      });
      return;
    }
    const closeBtn = e.target.closest('.js-product-detail-close');
    if (closeBtn) {
      e.preventDefault();
      closeProductDetail(closeBtn.closest('.product-spot__visual'));
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.product-spot__visual.is-detail-open').forEach(closeProductDetail);
  });
})();

/* ─── Income calculator (noUiSlider) ─── */
(function initCalculator() {
  const section = document.getElementById('calculator');
  if (!section) return;

  const CONFIG = {
    avgCheck: 85,
    marginPerSale: 35,
    daysInMonth: 30,
    fopMonthly: 4500,
    terminalMonthly: 800,
    rentMonthly: 1000,
  };

  const SLIDERS = [
    { selector: '.js-range-init-1', countId: 'calc-count-1', min: 17, max: 150, start: 17 },
    { selector: '.js-range-init-2', countId: 'calc-count-2', min: 1, max: 12, start: 1 },
    { selector: '.js-range-init-3', countId: 'calc-count-3', min: 1, max: 12, start: 1 },
  ];

  const profitEl = document.getElementById('calc-profit');
  const profitRowEl = document.getElementById('calc-profit-row');
  const grossEl = document.getElementById('calc-gross');
  const expensesEl = document.getElementById('calc-expenses');
  const summaryInput = document.getElementById('calc-form-summary');

  const VALUE_MAP = {
    'calc-count-1': 'calc-value-1',
    'calc-count-2': 'calc-value-2',
    'calc-count-3': 'calc-value-3',
  };

  function formatMoney(value) {
    return `${Math.round(value).toLocaleString('uk-UA')} грн`;
  }

  function updateProfit() {
    const cupsPerDay = parseInt(document.getElementById('calc-count-1')?.textContent, 10) || 0;
    const units = parseInt(document.getElementById('calc-count-2')?.textContent, 10) || 0;
    const months = parseInt(document.getElementById('calc-count-3')?.textContent, 10) || 0;

    const grossPerUnitMonth =
      CONFIG.marginPerSale * cupsPerDay * CONFIG.daysInMonth;
    const totalGross = grossPerUnitMonth * units * months;
    const perUnitMonthly = CONFIG.terminalMonthly + CONFIG.rentMonthly;
    const totalExpenses =
      CONFIG.fopMonthly * months + perUnitMonthly * units * months;
    const netProfit = totalGross - totalExpenses;
    const formatted = formatMoney(netProfit);

    if (profitEl) profitEl.textContent = formatted;
    if (profitRowEl) profitRowEl.textContent = formatted;
    if (grossEl) grossEl.textContent = formatMoney(totalGross);
    if (expensesEl) expensesEl.textContent = formatMoney(totalExpenses);
    if (summaryInput) {
      summaryInput.value =
        `Продажів/день: ${cupsPerDay}; апаратів: ${units}; місяців: ${months}; ` +
        `дохід: ${formatted}`;
    }
  }

  function bindSlider(container, countId, range) {
    const countEl = document.getElementById(countId);
    const valueEl = document.getElementById(VALUE_MAP[countId]);
    if (!container || !countEl || !window.noUiSlider) return;
    if (container.noUiSlider) return;

    const intFormat = {
      to: (value) => Math.round(value),
      from: (value) => parseInt(value, 10),
    };

    noUiSlider.create(container, {
      start: [range.start],
      connect: [true, false],
      step: 1,
      tooltips: window.matchMedia('(min-width: 768px)').matches ? [true] : [false],
      range: { min: range.min, max: range.max },
      format: intFormat,
      behaviour: 'tap-drag',
    });

    container.noUiSlider.on('update', (values) => {
      const val = values[0];
      countEl.textContent = val;
      if (valueEl) valueEl.textContent = val;
      updateProfit();
    });

    countEl.textContent = String(range.start);
    if (valueEl) valueEl.textContent = String(range.start);
  }

  function initSliders() {
    SLIDERS.forEach((cfg) => {
      bindSlider(section.querySelector(cfg.selector), cfg.countId, cfg);
    });
    updateProfit();
  }

  if (window.noUiSlider) {
    initSliders();
    return;
  }

  const script = document.createElement('script');
  script.src = vendorPath('js/vendor/nouislider.min.js');
  script.onload = initSliders;
  script.onerror = () => {
    console.error('noUiSlider failed to load:', script.src);
  };
  document.head.appendChild(script);
})();

/* ─── Product model image slider (Swiper) ─── */
(function () {
  const sliders = [...document.querySelectorAll('[data-model-slider]')];
  if (!sliders.length) return;

  const sliderRegistry = new Map();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isPanelVisible = (panel) => {
    if (!panel) return true;
    return !panel.hidden && panel.classList.contains('is-active');
  };

  const getPaginationEl = (slider) => {
    const parent = slider.parentElement;
    if (!parent) return null;
    const dots = [...parent.children].filter((el) => el.classList.contains('model-slider__dots'));
    return dots[0] || null;
  };

  const initSwiper = (slider, force = false) => {
    if (sliderRegistry.has(slider) || typeof Swiper === 'undefined') return;

    const panel = slider.closest('.model-variant__panel');
    if (!force && panel && !isPanelVisible(panel)) return;

    const slides = slider.querySelectorAll('.swiper-slide');
    if (slides.length < 2) return;

    const interval = parseInt(slider.dataset.interval, 10) || 4500;
    const paginationEl = getPaginationEl(slider);

    const instance = new Swiper(slider, {
      slidesPerView: 1,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: 750,
      loop: slides.length > 1,
      observer: true,
      observeParents: true,
      resizeObserver: true,
      autoplay: reducedMotion
        ? false
        : {
            delay: interval,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
      pagination: paginationEl
        ? {
            el: paginationEl,
            clickable: true,
            type: 'bullets',
            bulletClass: 'model-slider__dot',
            bulletActiveClass: 'is-active',
            renderBullet(index, className) {
              return `<button type="button" class="${className}" role="tab" aria-label="Слайд ${index + 1}"></button>`;
            },
          }
        : undefined,
      watchOverflow: true,
    });

    sliderRegistry.set(slider, {
      instance,
      start: () => instance.autoplay?.start(),
      stop: () => instance.autoplay?.stop(),
      update: () => {
        instance.update();
        instance.slideToLoop?.(instance.realIndex || 0, 0, false);
      },
    });
  };

  const ensureSwiper = (slider) => {
    if (!sliderRegistry.has(slider)) {
      initSwiper(slider, true);
    }
    const api = sliderRegistry.get(slider);
    if (!api) return null;
    api.update();
    api.start();
    return api;
  };

  const bootSwipers = () => {
    sliders.forEach((slider) => initSwiper(slider));

    sliders.forEach((slider) => {
      const panel = slider.closest('.model-variant__panel');
      if (panel && !isPanelVisible(panel)) {
        sliderRegistry.get(slider)?.stop();
      }
    });

    document.querySelectorAll('[data-model-variant]').forEach((variant) => {
      const tabs = [...variant.querySelectorAll('[data-variant-tab]')];
      const panels = [...variant.querySelectorAll('[data-variant-panel]')];
      const card = variant.closest('.product-model');
      const metas = card ? [...card.querySelectorAll('[data-variant-meta]')] : [];

      if (!tabs.length || !panels.length) return;

      const activate = (key) => {
        tabs.forEach((tab) => {
          const active = tab.dataset.variantTab === key;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        panels.forEach((panel) => {
          const active = panel.dataset.variantPanel === key;
          panel.classList.toggle('is-active', active);
          panel.hidden = !active;
          panel.querySelectorAll('[data-model-slider]').forEach((slider) => {
            if (active) {
              ensureSwiper(slider);
            } else {
              sliderRegistry.get(slider)?.stop();
            }
          });
        });

        metas.forEach((meta) => {
          const active = meta.dataset.variantMeta === key;
          meta.classList.toggle('is-active', active);
          meta.hidden = !active;
        });
      };

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => activate(tab.dataset.variantTab));
      });
    });
  };

  if (window.Swiper) {
    bootSwipers();
    return;
  }

  const script = document.createElement('script');
  script.src = vendorPath('js/vendor/swiper-bundle.min.js');
  script.onload = bootSwipers;
  script.onerror = () => {
    console.error('Swiper failed to load:', script.src);
  };
  document.head.appendChild(script);
})();

/* ─── Models earnings presentation (between cards) ─── */
(function () {
  const spread = document.querySelector('[data-earn-spread]');
  if (!spread) return;

  const singleEl = spread.querySelector('[data-earn-single]');
  const boxEl = spread.querySelector('[data-earn-box]');
  const slimEl = spread.querySelector('[data-earn-slim]');
  const isSingle = spread.dataset.earnMode === 'single' || Boolean(singleEl);

  if (isSingle && !singleEl) return;
  if (!isSingle && (!boxEl || !slimEl)) return;

  const targets = isSingle
    ? { single: 11550 }
    : { box: 16050, slim: 9450 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frames = new Map();
  let hasPlayed = false;

  const format = (value) => value.toLocaleString('uk-UA');

  const animateCounter = (el, target, delay = 0) => {
    window.setTimeout(() => {
      if (reducedMotion) {
        el.textContent = format(target);
        return;
      }

      const prev = frames.get(el);
      if (prev) window.cancelAnimationFrame(prev);

      const start = performance.now();
      const duration = 1200;

      const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        el.textContent = format(current);

        if (progress < 1) {
          frames.set(el, window.requestAnimationFrame(step));
        } else {
          frames.delete(el);
        }
      };

      frames.set(el, window.requestAnimationFrame(step));
    }, delay);
  };

  const play = () => {
    spread.classList.remove('is-playing');
    void spread.offsetWidth;
    spread.classList.add('is-playing');

    if (isSingle) {
      singleEl.textContent = '0';
      animateCounter(singleEl, targets.single, 550);
      return;
    }

    boxEl.textContent = '0';
    slimEl.textContent = '0';
    animateCounter(boxEl, targets.box, 550);
    animateCounter(slimEl, targets.slim, 950);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasPlayed) {
          hasPlayed = true;
          play();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 }
  );

  observer.observe(spread);

  if (reducedMotion) {
    if (isSingle) {
      singleEl.textContent = format(targets.single);
    } else {
      boxEl.textContent = format(targets.box);
      slimEl.textContent = format(targets.slim);
    }
    spread.classList.add('is-playing');
  }
})();

/* ─── Specs presentation (synced with 3D video) ─── */
(function () {
  const root = document.querySelector('[data-specs-presentation]');
  if (!root) return;

  const presentation = root.closest('.specs-presentation');
  const progressBar = presentation?.querySelector('.specs-presentation__bar');
  const hasVideoTabs = presentation?.hasAttribute('data-specs-videos');
  const tabs = hasVideoTabs ? [...presentation.querySelectorAll('[data-specs-video-tab]')] : [];
  const panels = hasVideoTabs ? [...presentation.querySelectorAll('[data-specs-video-panel]')] : [];

  const items = [...root.querySelectorAll('li')];
  if (!items.length) return;

  let activeIndex = 0;
  let rafId = null;
  let isInView = false;
  let video = null;

  const setActive = (index) => {
    if (index === activeIndex) return;
    activeIndex = index;
    items.forEach((item, i) => item.classList.toggle('is-active', i === index));
  };

  const resetProgress = () => {
    activeIndex = -1;
    setActive(0);
    if (progressBar) progressBar.style.transform = 'scaleX(0)';
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tick = () => {
    if (!video) {
      rafId = window.requestAnimationFrame(tick);
      return;
    }

    const duration = video.duration;
    if (!duration || !Number.isFinite(duration)) {
      rafId = window.requestAnimationFrame(tick);
      return;
    }

    const time = video.currentTime % duration;
    const ratio = time / duration;
    const index = Math.min(items.length - 1, Math.floor(ratio * items.length));

    setActive(index);

    if (progressBar) {
      progressBar.style.transform = `scaleX(${ratio})`;
    }

    if (!video.paused && !video.ended) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  };

  const startLoop = () => {
    if (rafId === null) {
      rafId = window.requestAnimationFrame(tick);
    }
  };

  const stopLoop = () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const loadVideoSources = (targetVideo) => {
    if (!targetVideo || targetVideo.dataset.loaded === 'true') return;

    targetVideo.querySelectorAll('source[data-src]').forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });

    targetVideo.load();
    targetVideo.dataset.loaded = 'true';
  };

  const bindVideo = (nextVideo, { force = false } = {}) => {
    if (!nextVideo || (!force && nextVideo === video)) return;

    if (video) {
      video.pause();
      video.removeEventListener('play', startLoop);
      video.removeEventListener('pause', stopLoop);
      video.removeEventListener('ended', stopLoop);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', tick);
    }

    video = nextVideo;
    resetProgress();

    video.addEventListener('play', startLoop);
    video.addEventListener('pause', stopLoop);
    video.addEventListener('ended', stopLoop);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', tick);

    if (isInView) {
      loadVideoSources(video);
      video.muted = true;
      video.play().catch(() => {});
    }
  };

  function onLoadedMetadata() {
    tick();
    if (video && !video.paused) startLoop();
  }

  const initialVideo =
    presentation?.querySelector('.specs-presentation__panel.is-active .specs-presentation__video') ||
    presentation?.querySelector('.specs-presentation__video');

  if (reducedMotion || !initialVideo) {
    setActive(0);
    if (progressBar) progressBar.style.transform = 'scaleX(1)';
    return;
  }

  const activateTab = (key) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.specsVideoTab === key;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const active = panel.dataset.specsVideoPanel === key;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });

    const nextVideo = presentation?.querySelector(
      `.specs-presentation__panel.is-active .specs-presentation__video`
    );
    bindVideo(nextVideo);
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.specsVideoTab));
  });

  bindVideo(initialVideo, { force: true });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInView = entry.isIntersecting;
        if (!video) return;

        if (entry.isIntersecting) {
          loadVideoSources(video);
          video.muted = true;
          video.play().catch(() => {});
        } else {
          video.pause();
          stopLoop();
        }
      });
    },
    { threshold: 0.35 }
  );

  const observeTarget = presentation?.querySelector('.specs-presentation__screen') || video;
  if (observeTarget) observer.observe(observeTarget);

  if (!video.paused) startLoop();
})();

