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

  // Photo carousel under #air. Add another .film-slide figure to extend it.
  // Cloned slides keep a neighbour visible on both sides, including when there are only two photos.
  const carousel = $('#filmCarousel');
  if (carousel) {
    const slides = $$('.film-slide', carousel);
    const sources = slides.map(s => {
      const img = $('img', s);
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    });
    const n = sources.length;
    const dotsWrap = $('.film-dots', carousel);
    const viewport = $('.film-viewport', carousel);
    const stage = document.createElement('div');
    stage.className = 'film-stage';
    viewport.appendChild(stage);
    slides.forEach(s => { s.classList.add('film-source'); s.setAttribute('aria-hidden', 'true'); });
    const copies = 6;
    const strip = [];
    for (let c = 0; c < copies; c++) sources.forEach((_, i) => strip.push(i));
    let cursor = n * 2;
    let timer = 0;
    let paused = reduce;
    let touching = false;
    let dragged = false;
    let startX = 0;
    let dx = 0;
    let pointerKind = 'mouse';
    let recenterTimer = 0;
    const cards = strip.map((logical, i) => {
      const fig = document.createElement('figure');
      fig.className = 'film-card';
      const img = document.createElement('img');
      img.src = sources[logical].src;
      img.alt = '';
      img.draggable = false;
      fig.appendChild(img);
      fig.addEventListener('click', () => {
        if (dragged || i === cursor) return;
        cursor = i;
        layout(false);
        scheduleRecenter();
        restart();
      });
      stage.appendChild(fig);
      return fig;
    });
    const dots = sources.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'film-dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'תמונה ' + (i + 1));
      b.addEventListener('click', () => { goLogical(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });
    const logicalOf = c => ((c % n) + n) % n;
    const layout = instant => {
      stage.classList.toggle('is-instant', !!instant);
      const logical = logicalOf(cursor);
      cards.forEach((card, i) => {
        const delta = i - cursor;
        card.classList.toggle('is-center', delta === 0);
        card.classList.toggle('is-next', delta === 1);
        card.classList.toggle('is-prev', delta === -1);
        card.classList.toggle('is-far-left', delta > 1);
        card.classList.toggle('is-far-right', delta < -1);
        const img = $('img', card);
        const on = delta === 0;
        img.alt = on ? sources[logical].alt : '';
        card.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach((d, i) => {
        const on = i === logical;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      slides.forEach((s, i) => s.classList.toggle('is-active', i === logical));
    };
    const recenter = () => {
      const target = n * 2 + logicalOf(cursor);
      if (target === cursor) return;
      cursor = target;
      layout(true);
      stage.getBoundingClientRect();
      stage.classList.remove('is-instant');
    };
    const scheduleRecenter = () => {
      clearTimeout(recenterTimer);
      recenterTimer = setTimeout(recenter, reduce ? 0 : 580);
    };
    const step = dir => { cursor += dir; layout(false); scheduleRecenter(); };
    const next = () => step(1);
    const prev = () => step(-1);
    const goLogical = logical => {
      let best = cursor, bestAbs = Infinity;
      strip.forEach((item, i) => {
        if (item !== logical) return;
        const d = Math.abs(i - cursor);
        if (d < bestAbs) { bestAbs = d; best = i; }
      });
      if (best === cursor) return;
      cursor = best;
      layout(false);
      scheduleRecenter();
    };
    $('.film-next', carousel).addEventListener('click', () => { next(); restart(); });
    $('.film-prev', carousel).addEventListener('click', () => { prev(); restart(); });
    carousel.addEventListener('keydown', e => {
      // RTL: ArrowLeft moves forward, ArrowRight moves back.
      if (e.key === 'ArrowLeft') { e.preventDefault(); next(); restart(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); prev(); restart(); }
    });
    carousel.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      touching = true;
      dragged = false;
      pointerKind = e.pointerType || 'mouse';
      startX = e.clientX;
      dx = 0;
      stop();
    });
    carousel.addEventListener('pointermove', e => { if (touching) dx = e.clientX - startX; });
    const endSwipe = () => {
      if (!touching) return;
      touching = false;
      if (dx <= -48) { dragged = true; next(); }
      else if (dx >= 48) { dragged = true; prev(); }
      dx = 0;
      if (pointerKind === 'touch') paused = false;
      restart();
    };
    carousel.addEventListener('pointerup', endSwipe);
    carousel.addEventListener('pointercancel', endSwipe);
    const stop = () => { clearInterval(timer); timer = 0; };
    const start = () => {
      stop();
      if (paused || reduce || n < 2) return;
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
    layout(true);
    start();
  }

  $('#yr').textContent = new Date().getFullYear();
})();
