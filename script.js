document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A refresh always starts at the top of the page. Left to itself the
// browser restores the old scroll position (or re-follows a "#contact"
// left in the URL by an in-page link) before the hero has its final
// height, and lands near the footer. html has scroll-behavior: smooth,
// so these jumps must ask for 'instant' or they animate instead.
const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
if (navEntry && navEntry.type === 'reload') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// A shared link that lands on a section (e.g. a link ending in
// "#services") arrives with the hash already in the URL. The browser
// tries to jump there immediately, before the hero video and other
// content have settled — so it lands wildly off target, often well
// past the section, near the bottom of the page. Cancel that early
// jump, then scroll to the real target once the page has actually
// finished loading.
if (window.location.hash) {
  const sharedTargetId = window.location.hash.slice(1);
  window.scrollTo({ top: 0, behavior: 'instant' });
  window.addEventListener('load', () => {
    const target = document.getElementById(sharedTargetId);
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });
}

// Every Tangmere logo (header and footer both) always returns to the
// very top of the homepage. On the homepage itself a plain #top anchor
// silently fails, because the anchor target is the sticky header,
// which browsers treat as already in view and refuse to scroll to.
const brandLinks = document.querySelectorAll('.brand');
if (brandLinks.length) {
  const isHomePage = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname.endsWith('/');
  brandLinks.forEach((brand) => {
    brand.addEventListener('click', (e) => {
      if (isHomePage) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });
}

// Measure the real header height so the hero (if present) can sit a
// negative margin underneath it and let the header float transparently
// on top of the hero photo instead of pushing it down the page.
const measureNavHeight = () => {
  const header = document.querySelector('.site-header__inner');
  if (header) {
    document.documentElement.style.setProperty('--nav-h', `${header.offsetHeight}px`);
  }
};
measureNavHeight();
window.addEventListener('resize', measureNavHeight);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(measureNavHeight);
}

// Hero film: six clips that crossfade in order and loop forever, always
// autoplaying. Only the first clip loads with the page; each later clip
// starts buffering while the one before it plays, and its poster (its own
// first frame) covers any wait. Where a browser refuses autoplay (iOS Low
// Power Mode, a page opened in a background tab), it starts on the first
// tap or key press, and again whenever the page is shown.
const heroReel = document.getElementById('heroReel');
if (heroReel) {
  const slides = [...heroReel.querySelectorAll('.hero__slide')];
  const FADE_MS = 1200; // matches .hero__slide.is-entering in styles.css
  // A slide can ask for a slower dissolve into itself with data-fade="ms".
  const fadeMs = (i) => Number(slides[i].dataset.fade) || FADE_MS;

  let current = 0;
  let inView = true;
  let fade = null; // { from, to, timer } while a crossfade is running

  const load = (i) => {
    const v = slides[i];
    if (!v.getAttribute('src')) {
      v.poster = v.dataset.poster;
      v.preload = 'auto';
      v.src = v.dataset.src;
    }
  };

  // A tap, click or key press anywhere on the page counts as permission to play.
  let gestureArmed = false;
  const startOnFirstGesture = () => {
    if (gestureArmed) return;
    gestureArmed = true;
    const events = ['pointerdown', 'touchstart', 'keydown'];
    const go = () => {
      events.forEach((t) => document.removeEventListener(t, go, true));
      gestureArmed = false;
      syncPlayback();
    };
    events.forEach((t) => document.addEventListener(t, go, { capture: true, passive: true }));
  };

  // Plays whenever the hero can be seen; pauses when it can't, to save battery.
  const syncPlayback = () => {
    const v = slides[current];
    if (inView && !document.hidden) {
      // An AbortError only means our own pause() interrupted it; ignore that.
      v.play().catch((err) => {
        if (err && err.name === 'NotAllowedError') startOnFirstGesture();
      });
    } else {
      v.pause();
    }
  };

  const finishFade = () => {
    if (!fade) return;
    clearTimeout(fade.timer);
    fade.to.classList.remove('is-entering');
    fade.to.classList.add('is-active');
    fade.to.style.transitionDuration = '';
    fade.from.classList.remove('is-active');
    fade.from.pause();
    // Rewind now, while hidden, so it's ready at frame one when the film loops.
    fade.from.currentTime = 0;
    fade = null;
  };

  const advance = () => {
    const next = (current + 1) % slides.length;
    const from = slides[current];
    const to = slides[next];
    const ms = fadeMs(next);
    load(next);
    to.style.transitionDuration = `${ms}ms`;
    to.classList.add('is-entering');
    current = next;
    fade = { from, to, timer: setTimeout(finishFade, ms) };
    syncPlayback();
    load((next + 1) % slides.length);
  };

  // Start the next clip one fade-length before this one ends, so the outgoing
  // clip is still moving underneath while the new one fades in over it.
  const tick = () => {
    const v = slides[current];
    const next = (current + 1) % slides.length;
    if (!fade && v.duration && v.duration - v.currentTime <= fadeMs(next) / 1000) {
      advance();
    }
    requestAnimationFrame(tick);
  };

  // Resume whenever the page is shown again, including Safari restoring it
  // from the back/forward cache (pageshow), which otherwise leaves it frozen.
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pageshow', syncPlayback);
  window.addEventListener('focus', syncPlayback);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }).observe(heroReel);
  }

  // Some Safari versions only honour the muted attribute once it's also set
  // as a property, and won't autoplay unmuted video at all.
  slides.forEach((v) => { v.muted = true; v.defaultMuted = true; });
  slides[0].addEventListener('playing', () => load(1), { once: true });
  syncPlayback();
  requestAnimationFrame(tick);
}

// Header: transparent over the hero photo, solid once scrolled past it.
// Pages with no photo hero (e.g. aircraft detail pages) stay solid always.
const siteHeader = document.querySelector('.site-header');
if (document.querySelector('.hero__bg')) {
  const setHeaderSolid = () => {
    siteHeader.classList.toggle('site-header--solid', window.scrollY > 40);
  };
  setHeaderSolid();
  window.addEventListener('scroll', setHeaderSolid, { passive: true });
} else {
  siteHeader.classList.add('site-header--solid');
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');

navToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Language switch (header dropdown) — UI only: the site has no
// translated content yet, so this records a choice without
// pretending to switch to a language that doesn't exist.
const langSwitch = document.getElementById('langSwitch');
if (langSwitch) {
  const langToggle = document.getElementById('langToggle');
  const langMenu = document.getElementById('langMenu');

  const closeLangMenu = () => {
    langMenu.hidden = true;
    langToggle.setAttribute('aria-expanded', 'false');
  };
  const openLangMenu = () => {
    langMenu.hidden = false;
    langToggle.setAttribute('aria-expanded', 'true');
  };

  langToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (langMenu.hidden) openLangMenu(); else closeLangMenu();
  });

  langMenu.querySelectorAll('li').forEach((option) => {
    option.addEventListener('click', () => {
      langMenu.querySelectorAll('li').forEach((o) => o.setAttribute('aria-selected', 'false'));
      option.setAttribute('aria-selected', 'true');
      closeLangMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (!langSwitch.contains(e.target)) closeLangMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLangMenu();
  });
}

// Mobile language switch: a simple button row rather than a dropdown
// inside the mobile nav panel.
document.querySelectorAll('.lang-switch--mobile').forEach((group) => {
  group.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
    });
  });
});

// Contact form (static site — no backend, so acknowledge locally with a
// proper confirmation state, plus a WhatsApp handoff pre-filled with what
// the visitor just told us, so continuing the conversation there takes
// no retyping).
const form = document.getElementById('contactForm');
if (form) {
  const successPanel = document.getElementById('contactSuccess');
  const successTitle = document.getElementById('contactSuccessTitle');
  const successWhatsapp = document.getElementById('contactSuccessWhatsapp');
  const resetButton = document.getElementById('contactReset');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const interest = form.interest.value;

    successTitle.textContent = name ? `Thank you, ${name}.` : 'Thank you.';

    const waMessage = `Hi Tangmere, I'm ${name || 'reaching out'} and I've just sent an enquiry about ${interest.toLowerCase()} through your website. Could we continue here?`;
    successWhatsapp.href = `https://wa.me/447703849361?text=${encodeURIComponent(waMessage)}`;

    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  resetButton.addEventListener('click', () => {
    form.reset();
    successPanel.hidden = true;
    form.hidden = false;
  });
}
