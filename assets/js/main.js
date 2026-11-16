// Just Code People — shared front-end behavior
// Vanilla JS, no build step required.

document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================================
     Contact form configuration — EDIT THIS
     ---------------------------------------------------------------------
     CONTACT_ENDPOINT: URL that receives the form by POST. Leave it as an
     empty string and the form falls back to opening the visitor's email
     app with everything pre-filled (works today, no account needed).

     Works out of the box with any endpoint that accepts a JSON POST, e.g.:
       Formspree  → 'https://formspree.io/f/YOUR-FORM-ID'
       Basin      → 'https://usebasin.com/f/YOUR-FORM-ID'
       Netlify / your own serverless function → its URL
     ===================================================================== */
  const CONTACT_ENDPOINT = '';
  const CONTACT_EMAIL = 'info@justcodepeople.com';


  /* =====================================================================
     Translations (EN / PT-BR / DE)
     ---------------------------------------------------------------------
     The dictionary lives in assets/js/i18n.js and is keyed by the English
     source text. On load we snapshot every translatable string straight
     from the page, so switching back to English is always lossless and no
     data-i18n attributes have to be sprinkled through the HTML.
     Anything not present in the dictionary simply stays in English.
     ===================================================================== */

  const I18N = window.JCP_I18N || { languages: [], meta: {}, pt: {}, de: {} };
  const LANGS = I18N.languages.length ? I18N.languages
    : [{ code: 'en', htmlLang: 'en', flag: '🇺🇸', short: 'EN', label: 'English' }];
  const STORAGE_KEY = 'jcp-lang';
  const I18N_ATTRS = ['placeholder', 'alt', 'aria-label', 'title'];
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG']);

  // Snapshot of the page in its original language: what apply() restores.
  const textNodes = [];   // { node, original, before, after }
  const attrNodes = [];   // { el, attr, original }
  let originalTitle = document.title;
  const descTag = document.querySelector('meta[name="description"]');
  let originalDesc = descTag ? descTag.getAttribute('content') : null;

  function isSkipped(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (SKIP_TAGS.has(n.tagName) || n.namespaceURI === 'http://www.w3.org/2000/svg') return true;
      if (n.getAttribute && n.getAttribute('translate') === 'no') return true;
      if (n.classList && (n.classList.contains('lang-switch') || n.classList.contains('lang-switcher'))) return true;
    }
    return false;
  }

  function snapshot() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (!node.parentElement || isSkipped(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      const raw = node.nodeValue;
      const trimmed = raw.trim();
      const start = raw.indexOf(trimmed);
      textNodes.push({
        node,
        original: trimmed,
        before: raw.slice(0, start),
        after: raw.slice(start + trimmed.length)
      });
    }
    document.querySelectorAll('[' + I18N_ATTRS.join('],[') + ']').forEach((el) => {
      if (isSkipped(el)) return;
      I18N_ATTRS.forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value && value.trim()) attrNodes.push({ el, attr, original: value.trim() });
      });
    });
  }

  // Translate a single string; falls back to the English original.
  function t(text, lang) {
    if (lang === 'en') return text;
    const dict = I18N[lang];
    return (dict && dict[text]) || text;
  }

  function applyLanguage(lang) {
    const meta = LANGS.find((l) => l.code === lang) || LANGS[0];

    textNodes.forEach((entry) => {
      entry.node.nodeValue = entry.before + t(entry.original, lang) + entry.after;
    });
    attrNodes.forEach((entry) => {
      entry.el.setAttribute(entry.attr, t(entry.original, lang));
    });

    // <title>, meta description and <html lang> use their own dictionary.
    const metaDict = I18N.meta || {};
    const title = metaDict[originalTitle];
    document.title = (lang !== 'en' && title && title[lang]) || originalTitle;
    if (descTag && originalDesc) {
      const desc = metaDict[originalDesc];
      descTag.setAttribute('content', (lang !== 'en' && desc && desc[lang]) || originalDesc);
    }
    document.documentElement.setAttribute('lang', meta.htmlLang);

    // Keep both switchers showing the same thing.
    if (switchLabel) switchLabel.textContent = meta.flag + ' ' + meta.short;
    document.querySelectorAll('.lang-menu [data-lang]').forEach((item) => {
      item.setAttribute('aria-selected', String(item.dataset.lang === lang));
    });
    document.querySelectorAll('[data-lang-select]').forEach((radio) => {
      radio.checked = radio.value === lang;
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    currentLang = lang;
    // WhatsApp float: rebuild the wa.me link with the message in the active language.
    document.querySelectorAll('.whatsapp-float[data-wa-text]').forEach((a) => {
      a.setAttribute('href', 'https://wa.me/' + a.dataset.waNumber + '?text=' + encodeURIComponent(t(a.dataset.waText, lang)));
    });
    document.dispatchEvent(new CustomEvent('jcp:lang', { detail: lang }));
  }

  /* Pick the starting language: saved choice > browser language > English. */
  function detectLanguage() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (saved && LANGS.some((l) => l.code === saved)) return saved;
    const nav = (navigator.language || 'en').toLowerCase();
    if (nav.startsWith('pt')) return 'pt';
    if (nav.startsWith('de')) return 'de';
    return 'en';
  }

  /* Build the header dropdown around the existing .lang-switch button, so
     no page markup needs to change. */
  const switchBtn = document.querySelector('.lang-switch');
  let switchLabel = null;
  let currentLang = 'en';

  snapshot();

  if (switchBtn) {
    switchBtn.textContent = '';
    switchLabel = document.createElement('span');
    const caret = document.createElement('span');
    caret.className = 'lang-caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '▾';
    switchBtn.append(switchLabel, caret);
    switchBtn.setAttribute('aria-haspopup', 'listbox');
    switchBtn.setAttribute('aria-expanded', 'false');
    switchBtn.setAttribute('aria-label', 'Language / Idioma / Sprache');

    const wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher';
    switchBtn.parentNode.insertBefore(wrapper, switchBtn);
    wrapper.appendChild(switchBtn);

    const menu = document.createElement('ul');
    menu.className = 'lang-menu';
    menu.setAttribute('role', 'listbox');
    LANGS.forEach((l) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.dataset.lang = l.code;
      li.textContent = l.flag + '  ' + l.label;
      li.addEventListener('click', () => {
        applyLanguage(l.code);
        closeMenu();
      });
      menu.appendChild(li);
    });
    wrapper.appendChild(menu);

    function closeMenu() {
      wrapper.classList.remove('open');
      switchBtn.setAttribute('aria-expanded', 'false');
    }
    switchBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = wrapper.classList.toggle('open');
      switchBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  /* Footer radio buttons drive the same switch. */
  document.querySelectorAll('[data-lang-select]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
      if (event.target.checked) applyLanguage(event.target.value);
    });
  });

  applyLanguage(detectLanguage());


  /* Carousel (only pages with [data-carousel]) ---------------------------
     scroll-snap does the swiping; JS wires buttons, dots and keyboard. */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('[data-carousel]').forEach(function (root) {
      var track = root.querySelector('.carousel-track');
      var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel-slide'));
      var prev = root.querySelector('.carousel-prev');
      var next = root.querySelector('.carousel-next');
      var dotsBox = root.querySelector('.carousel-dots');
      var n = slides.length;
      var index = 0;
      var dots = [];
      var dotText = root.getAttribute('data-dot-label') || 'Go to photo'; /* each carousel can name what it holds */
      function dotLabel(k) { return t(dotText, currentLang) + ' ' + (k + 1); }
      if (!track || !n) return;

      slides.forEach(function (s, i) {
        s.setAttribute('role', 'group');
        s.setAttribute('aria-label', (i + 1) + ' / ' + n);
      });
      if (n < 2) { root.setAttribute('data-single', ''); return; }

      function update() {
        slides.forEach(function (s, i) { s.setAttribute('aria-hidden', i === index ? 'false' : 'true'); });
        dots.forEach(function (d, i) {
          if (i === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
        });
        prev.disabled = index === 0;
        next.disabled = index === n - 1;
        prev.setAttribute('aria-disabled', String(index === 0));
        next.setAttribute('aria-disabled', String(index === n - 1));
      }
      function goTo(i, instant) {
        index = Math.max(0, Math.min(n - 1, i));
        track.scrollTo({ left: index * track.clientWidth, behavior: (instant || reduce.matches) ? 'auto' : 'smooth' });
        update();
      }

      for (var i = 0; i < n; i++) {
        (function (k) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'carousel-dot';
          b.textContent = String(k + 1);
          b.setAttribute('aria-label', dotLabel(k));
          b.addEventListener('click', function () { goTo(k); });
          dotsBox.appendChild(b);
          dots.push(b);
        })(i);
      }
      prev.addEventListener('click', function () { goTo(index - 1); });
      next.addEventListener('click', function () { goTo(index + 1); });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
      });
      var tick;
      track.addEventListener('scroll', function () {
        clearTimeout(tick);
        tick = setTimeout(function () {
          var i = Math.round(track.scrollLeft / track.clientWidth);
          if (i !== index) { index = Math.max(0, Math.min(n - 1, i)); update(); }
        }, 60);
      }, { passive: true });
      window.addEventListener('resize', function () { goTo(index, true); });
      update();
      document.addEventListener('jcp:lang', function () {
        dots.forEach(function (d, k) { d.setAttribute('aria-label', dotLabel(k)); });
      });
    });

  /* Mobile navigation toggle -------------------------------------------- */
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  if (header && navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* Highlight the current page in the main nav --------------------------- */
  const currentPage = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.main-nav a').forEach((link) => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* Contact form -----------------------------------------------------------
     Posts to CONTACT_ENDPOINT when one is configured above; otherwise it
     hands the message to the visitor's email client so nothing is lost. */
  const contactForm = document.querySelector('#contact-form');
  const formStatus = document.querySelector('#form-status');

  function setStatus(key, state) {
    if (!formStatus) return;
    formStatus.textContent = t(key, currentLang);
    formStatus.className = 'form-status visible' + (state ? ' ' + state : '');
  }

  if (contactForm) {
    const submitBtn = contactForm.querySelector('[type="submit"]');

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const data = Object.fromEntries(new FormData(contactForm).entries());
      if (data._gotcha) return; // honeypot: silently drop bots

      /* No endpoint configured yet — open the visitor's email app. */
      if (!CONTACT_ENDPOINT) {
        const body = data.message + '\n\n— ' + data.name + ' <' + data.email + '>';
        setStatus('Opening your email app...', null);
        window.location.href = 'mailto:' + CONTACT_EMAIL +
          '?subject=' + encodeURIComponent(data.subject) +
          '&body=' + encodeURIComponent(body);
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus('Sending...', 'pending');
      try {
        const response = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        setStatus('Thanks! Your message has been sent - we will get back to you shortly.', 'success');
        contactForm.reset();
      } catch (error) {
        console.error('Contact form submit failed:', error);
        setStatus('Something went wrong. Please try again, or write to us directly at info@justcodepeople.com.', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});

/* Parallax dos halos do hero -------------------------------------------------
   Toda pagina segue o mesmo padrao: <section class="hero" id="hero"> com tres
   .hero-glow dentro. Importado dinamicamente e com falha silenciosa — se o
   modulo nao carregar, a animacao por CSS continua funcionando sozinha. */
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const glows = [...hero.querySelectorAll('.hero-glow')];
  if (!glows.length) return;
  import('./hero-motion.js?v=ce94de1b')
    .then((m) => m.attachMotion(() => ({ hero, glows })))
    .catch(() => {});
});
