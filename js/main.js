/* VendStore — main interactions */

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

/* ─── Lenis + GSAP (lazy, via __vsInitMotion) ─── */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
let lenisInstance = null;
let motionReady = false;

function initMotion() {
  if (motionReady) return;
  if (isSafari || typeof Lenis === 'undefined') return;
  motionReady = true;

  lenisInstance = new Lenis({
    prevent: (node) => node.closest('.modal__window') !== null,
  });
  window.__vsLenis = lenisInstance;

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenisInstance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    gsap.utils.toArray('.steps__step, .audience__figure, .product-spot, .card, .split__media, .product-pick, .offer-card').forEach((el, i) => {
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom-=60',
            toggleActions: 'play none none none',
          },
          delay: (i % 3) * 0.08,
        }
      );
    });
  }
}

window.__vsInitMotion = initMotion;
initMotion();

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
  body.classList.add('menu-open');
  html.classList.add('menu-open');
  burger?.setAttribute('aria-expanded', 'true');
  mobileMenu?.setAttribute('aria-hidden', 'false');
  lenisInstance?.stop();
}

function closeMenu() {
  burger?.classList.remove('is-active');
  mobileMenu?.classList.remove('is-open');
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

const modalTitles = {
  partner: ['Заявка', 'партнеру'],
  callback: ['Консультація', 'VendStore'],
  location: ['Пропозиція', 'локації'],
};

function openModal(opts = {}) {
  if (!modal) return;
  const type = opts.formType || 'partner';
  const product = opts.product || '';

  if (modalForm) {
    const typeInput = modalForm.querySelector('[name="form_type"]');
    if (typeInput) typeInput.value = type;
    if (modalProductInput) modalProductInput.value = product;
  }

  const parts = modalTitles[type] || modalTitles.partner;
  if (modalTitle) {
    modalTitle.innerHTML = `${parts[0]} <span>${parts[1]}</span>`;
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
    alert('Не вдалося надіслати заявку. Спробуйте ще раз або напишіть на hello@vendstore.ua');
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

