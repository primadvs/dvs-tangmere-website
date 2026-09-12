document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A shared link that lands on a section (e.g. a link ending in
// "#services") arrives with the hash already in the URL. The browser
// tries to jump there immediately, before the hero video and other
// content have settled — so it lands wildly off target, often well
// past the section, near the bottom of the page. Cancel that early
// jump, then scroll to the real target once the page has actually
// finished loading.
if (window.location.hash) {
  const sharedTargetId = window.location.hash.slice(1);
  window.scrollTo(0, 0);
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

// Hero video: autoplay/loop for most visitors, but respect a reduced-motion
// preference by pausing on the poster frame instead of forcing playback.
const heroVideo = document.getElementById('heroVideo');
if (heroVideo) {
  if (prefersReducedMotion) {
    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
  } else {
    heroVideo.play().catch(() => {});
  }
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
