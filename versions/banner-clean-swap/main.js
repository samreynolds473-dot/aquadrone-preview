(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero video: pick resolution
  const hv = $('#heroVideo');
  if (hv) { hv.src = innerWidth < 820 ? hv.dataset.srcMobile : hv.dataset.srcDesktop; hv.play().catch(() => {}); }

  // footer portrait: reduced motion keeps the poster only
  const fv = $('.footer-film video');
  if (fv && reduce) {
    fv.removeAttribute('autoplay');
    fv.pause();
    fv.removeAttribute('src');
    $$('source', fv).forEach(s => s.remove());
    fv.load();
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

  $('#yr').textContent = new Date().getFullYear();
})();
