(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // #air panel: wide on desktop, portrait on mobile; reduced motion keeps the poster
  $$('.air-vid').forEach(v => {
    if (!reduce) return;
    v.removeAttribute('autoplay');
    v.pause();
    v.removeAttribute('src');
    $$('source', v).forEach(s => s.remove());
    v.load();
  });
  if (!reduce) {
    const wide = matchMedia('(min-width: 821px)');
    const syncAir = () => $$('.air-vid').forEach(v => {
      const on = v.classList.contains('air-vid-wide') ? wide.matches : !wide.matches;
      if (on) v.play().catch(() => {});
      else v.pause();
    });
    syncAir();
    wide.addEventListener('change', syncAir);
  }

  // header
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile nav
  const mnav = $('#mnav');
  $('#burger').onclick = () => mnav.classList.add('open');
  $('#mclose').onclick = () => mnav.classList.remove('open');
  $$('a', mnav).forEach(a => a.addEventListener('click', () => mnav.classList.remove('open')));

  // reveal + counters
  const count = el => {
    const to = +el.dataset.to, t0 = performance.now(), d = 1600;
    const tick = t => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    reduce ? (el.textContent = to) : requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in', 'in-view');
    $$('.count', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  // lazy videos: load when near, pause when away
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else if (v.src) v.pause();
  }), { rootMargin: '200px' });
  $$('.lazyvid').forEach(v => vio.observe(v));

  // sectors accordion — linked cards navigate; unlinked cards still toggle
  $$('.sector').forEach(s => {
    if (s.tagName === 'A') return;
    s.addEventListener('click', () => {
      const open = s.classList.contains('open');
      $$('.sector').forEach(x => x.classList.remove('open'));
      if (!open) s.classList.add('open');
    });
  });

  // FAQ
  $$('.qa button').forEach(b => b.addEventListener('click', () => {
    const qa = b.parentElement, open = qa.classList.toggle('open');
    b.setAttribute('aria-expanded', open);
  }));

  // before/after
  const ba = $('#ba');
  if (ba) {
    let drag = false;
    const set = p => { p = Math.max(2, Math.min(98, p)); ba.style.setProperty('--pos', p + '%'); ba.setAttribute('aria-valuenow', Math.round(p)); };
    const fromEvt = e => { const r = ba.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
    ba.addEventListener('pointerdown', e => { drag = true; ba.setPointerCapture(e.pointerId); fromEvt(e); });
    ba.addEventListener('pointermove', e => drag && fromEvt(e));
    ba.addEventListener('pointerup', () => drag = false);
    ba.addEventListener('keydown', e => {
      const cur = parseFloat(getComputedStyle(ba).getPropertyValue('--pos')) || 50;
      if (e.key === 'ArrowLeft') set(cur - 4); if (e.key === 'ArrowRight') set(cur + 4);
    });
  }

  // lead form — PREVIEW ONLY, not wired to any backend
  const form = $('#leadForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim();
      (f.closest('.field') || f.parentElement).classList.toggle('err', bad);
      if (bad) ok = false;
    });
    const ph = $('#f-phone');
    if (ph.value && !/^[0-9+\-\s()]{9,}$/.test(ph.value)) { ph.closest('.field').classList.add('err'); ok = false; }
    if (!ok) return;
    // TODO: send to CRM / email service here.
    $('#formBox').classList.add('done');
  });

  // Photo carousel under #air. Add a .film-slide figure in the HTML to extend it.
  const carousel = $('#filmCarousel');
  if (carousel) {
    const slides = $$('.film-slide', carousel);
    const dotsWrap = $('.film-dots', carousel);
    let index = 0;
    let timer = 0;
    let paused = reduce;
    let touching = false;
    let startX = 0;
    let dx = 0;
    let pointerKind = 'mouse';
    const show = i => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const on = n === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      $$('.film-dot', dotsWrap).forEach((d, n) => {
        const on = n === index;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    };
    slides.forEach((s, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'film-dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'תמונה ' + (n + 1));
      b.addEventListener('click', () => { show(n); restart(); });
      dotsWrap.appendChild(b);
    });
    const next = () => show(index + 1);
    const prev = () => show(index - 1);
    $('.film-next', carousel).addEventListener('click', () => { next(); restart(); });
    $('.film-prev', carousel).addEventListener('click', () => { prev(); restart(); });
    carousel.addEventListener('keydown', e => {
      // RTL: ArrowLeft moves forward through the slides, ArrowRight moves back.
      if (e.key === 'ArrowLeft') { e.preventDefault(); next(); restart(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); prev(); restart(); }
    });
    carousel.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      touching = true;
      pointerKind = e.pointerType || 'mouse';
      startX = e.clientX;
      dx = 0;
      stop();
    });
    carousel.addEventListener('pointermove', e => { if (touching) dx = e.clientX - startX; });
    const endSwipe = () => {
      if (!touching) return;
      touching = false;
      // Swipe toward the next control (left) advances; swipe right goes back.
      if (dx <= -48) next();
      else if (dx >= 48) prev();
      dx = 0;
      if (pointerKind === 'touch') paused = false;
      restart();
    };
    carousel.addEventListener('pointerup', endSwipe);
    carousel.addEventListener('pointercancel', endSwipe);
    const stop = () => { clearInterval(timer); timer = 0; };
    const start = () => {
      stop();
      if (paused || reduce || slides.length < 2) return;
      timer = setInterval(next, 6500);
    };
    const restart = () => { if (!touching) start(); };
    carousel.addEventListener('pointerenter', e => {
      if (e.pointerType === 'touch') return;
      paused = true;
      stop();
    });
    carousel.addEventListener('pointerleave', () => {
      paused = carousel.contains(document.activeElement);
      start();
    });
    carousel.addEventListener('focusin', () => { paused = true; stop(); });
    carousel.addEventListener('focusout', () => {
      paused = carousel.matches(':hover');
      start();
    });
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
    show(0);
    start();
  }

  $('#yr').textContent = new Date().getFullYear();
})();
