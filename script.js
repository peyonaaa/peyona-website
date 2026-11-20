(() => {
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Every animated path draws from 0 to 1 regardless of its real length
  $$('.grow path').forEach(p => p.setAttribute('pathLength', '1'));

  // Statement: wrap words so they light up as the reader scrolls
  const statement = $('[data-words]');
  const accents = ['ideas', 'innovative', 'meaningful'];
  statement.innerHTML = statement.textContent.trim().split(/\s+/).map(w =>
    `<span class="w${accents.includes(w.replace(/\W/g, '').toLowerCase()) ? ' is-accent' : ''}">${w}</span>`
  ).join(' ');
  const words = $$('.w', statement);

  /* ---------- Intro ---------- */
  const hero = $('.hero');
  const start = () => {
    root.classList.add('loaded');
    $$('.split, .reveal-up, .clip-reveal, .draw', hero).forEach(el => el.classList.add('in-view'));
  };
  if (calm) start();
  else addEventListener('load', () => setTimeout(start, 1300));
  setTimeout(start, 4000); // never leave the loader up on a slow image

  /* ---------- Reveal on view ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('.split, .reveal-up, .clip-reveal, .draw, .stages, .ugnay').forEach(el => { if (!hero.contains(el)) io.observe(el); });

  /* ---------- Scroll-driven pieces ---------- */
  const header = $('.site-header');
  const ugnay = $('.ugnay');
  const chapters = $$('.chapter');
  const dots = $$('.chapter-dots i');
  const navLinks = $$('.nav-link');
  const sections = navLinks.map(a => $(a.hash));
  let lastY = scrollY, ticking = false;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;

    root.style.setProperty('--scroll', (y / (document.body.scrollHeight - vh)).toFixed(4));
    header.classList.toggle('is-scrolled', y > 20);
    header.classList.toggle('is-hidden', y > lastY && y > vh * .6 && !document.body.classList.contains('menu-open'));
    lastY = y;

    // Light the statement word by word between 85% and 35% of the viewport
    const r = statement.getBoundingClientRect();
    const p = clamp((vh * .85 - r.top) / (vh * .5 + r.height));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', calm || i < lit));

    // Ugnay pin progress: 0 when the pin starts, 1 when it ends
    const u = ugnay.getBoundingClientRect();
    const up = clamp(-u.top / Math.max(1, u.height - vh));
    ugnay.style.setProperty('--p', clamp(up * 1.6).toFixed(4));
    const idx = Math.min(chapters.length - 1, Math.floor(up * chapters.length));
    chapters.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));

    // Current nav item
    let current = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * .4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-current', i === current));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.menu-button');
  const nav = $('#primary-nav');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Page wipe for in-page links ---------- */
  const wipe = $('.wipe');
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = a.hash.length > 1 && $(a.hash);
    if (!target) return;
    setMenu(false);
    if (calm || a.classList.contains('skip-link')) return;
    e.preventDefault();
    wipe.className = 'wipe is-in';
    setTimeout(() => {
      root.style.scrollBehavior = 'auto';
      target.scrollIntoView();
      root.style.scrollBehavior = '';
      history.pushState(null, '', a.hash);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      wipe.className = 'wipe is-in is-out';
      setTimeout(() => { wipe.className = 'wipe'; }, 750);
    }, 650);
  }));

  /* ---------- Petal rain in the hero ---------- */
  const rains = $$('.petal-rain');
  if (!calm) {
    const colours = ['var(--blue)', 'var(--petal)', 'var(--petal-pale)'];
    const rand = (a, b) => a + Math.random() * (b - a);
    const small = innerWidth < 760;
    rains.forEach(rain => {
      // The front layer is fewer, bigger petals: closer to the viewer
      const front = rain.classList.contains('is-front');
      const count = front ? (small ? 4 : 8) : (small ? 14 : 28);
      for (let i = 0; i < count; i++) {
        const drop = document.createElement('span');
        const t = front ? rand(7, 12) : rand(9, 18);
        const size = front ? rand(16, 28) : rand(9, 22);
        drop.className = 'drop' + (size < 12 ? ' is-far' : '');
        drop.style.cssText = `--l:${rand(0, 100)}%;--s:${size}px;--t:${t}s;--delay:${-rand(0, t)}s;` +
          `--dx:${rand(-80, 140)}px;--f:${rand(1.6, 3.4)}s;--c:${colours[i % 3]};--o:${rand(.45, .9)}`;
        drop.innerHTML = '<svg viewBox="0 0 40 60"><path d="M20 2C6 18 6 42 20 58 34 42 34 18 20 2Z"/></svg>';
        rain.append(drop);
      }
    });
    const setHeight = () => rains.forEach(rain => rain.style.setProperty('--h', rain.offsetHeight + 'px'));
    setHeight();
    addEventListener('resize', setHeight);
    // Stop animating once the hero is off screen
    new IntersectionObserver(([e]) => rains.forEach(rain => rain.classList.toggle('is-paused', !e.isIntersecting))).observe(hero);
  }

  if (calm || !fine) return;

  /* ---------- Cursor, magnetic buttons, petals ---------- */
  const cursor = $('.cursor');
  const label = $('.cursor-label');
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;

  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.classList.remove('is-hidden');
    const hb = hero.getBoundingClientRect();
    if (hb.bottom > 0) {
      hero.style.setProperty('--mx', (mx / innerWidth - .5).toFixed(3));
      hero.style.setProperty('--my', (my / innerHeight - .5).toFixed(3));
    }
  });
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));

  (function loop() {
    cx += (mx - cx) * .2; cy += (my - cy) * .2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();

  document.addEventListener('pointerover', e => {
    const labelled = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    cursor.classList.toggle('has-label', !!labelled && !link);
    cursor.classList.toggle('is-hover', !!link);
    cursor.classList.toggle('on-dark', !!e.target.closest('.ugnay, .ugnay-award, .contact, .footer'));
    if (labelled) label.textContent = labelled.dataset.cursor;
  });

  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .25;
      const y = (e.clientY - r.top - r.height / 2) * .35;
      el.style.translate = `${x}px ${y}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
})();
