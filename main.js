(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero video: pick resolution
  const hv = $('#heroVideo');
  if (hv) { hv.src = innerWidth < 820 ? hv.dataset.srcMobile : hv.dataset.srcDesktop; hv.play().catch(() => {}); }

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

  // homepage product stage — sector switcher
  const shot = $('#stageShot');
  if (shot) {
    const slides = [
      { img: 'assets/img/spray-orange.webp', alt: 'רחפן מתיז מים על חזית זכוכית', idx: '01', line: 'מבנים מסחריים — מגדלי משרדים, מלונות וקירות מסך, בלי פיגומים.', href: 'our-services/commercial/', focus: 'center 46%' },
      { img: 'assets/img/envelope.webp', alt: 'מגדל מגורים עם חזית זכוכית', idx: '02', line: 'בתים ומגורים — ניקוי מהקרקע, בלי פיגומים מול החלונות ובלי עובדים על חבלים.', href: 'our-services/residential/', focus: 'center 42%' },
      { img: 'assets/img/hero-poster.jpg', alt: 'רחפן מנקה קיר מסך זכוכית', idx: '03', line: 'סולארי וגגות — גישה לאזורים שקשה להגיע אליהם, ושטיפה במים מסוננים.', href: 'our-services/solar/', focus: 'center 62%' },
      { img: 'assets/img/sector-industry.webp', alt: 'ניקוי קיר מבנה תעשייה ברחפן', idx: '04', line: 'תעשייה ותשתיות — משטחים גדולים ומורכבים, במהירות.', href: 'our-services/industry/', focus: 'center 70%' }
    ];
    const reflect = $('#stageReflect');
    const idxEl = $('#stageIdx');
    const lineEl = $('#stageLine');
    const learn = $('#stageLearn');
    const plate = $('#stagePlate');
    const rails = $$('.rail a');
    let i = 0;
    let timer = 0;
    slides.forEach(s => { const im = new Image(); im.src = s.img; });
    const show = n => {
      i = (n + slides.length) % slides.length;
      const s = slides[i];
      shot.style.opacity = '0';
      if (reflect) reflect.style.opacity = '0';
      clearTimeout(timer);
      const apply = () => {
        shot.src = s.img;
        shot.alt = s.alt;
        if (reflect) { reflect.src = s.img; reflect.style.opacity = ''; }
        if (plate) plate.style.setProperty('--focus', s.focus);
        const stage = $('#stage');
        if (stage) stage.style.setProperty('--focus', s.focus);
        if (idxEl) idxEl.textContent = s.idx;
        if (lineEl) lineEl.textContent = s.line;
        if (learn) learn.href = s.href;
        rails.forEach((a, k) => {
          const on = k === i;
          a.classList.toggle('is-on', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
        shot.style.opacity = '';
      };
      timer = setTimeout(apply, reduce ? 0 : 180);
    };
    const prev = $('#stagePrev'), next = $('#stageNext');
    if (prev) prev.addEventListener('click', () => show(i - 1));
    if (next) next.addEventListener('click', () => show(i + 1));
    rails.forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(+a.dataset.i); }));
    const stageEl = $('#stage');
    if (stageEl) stageEl.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.closest && e.target.closest('a, input, textarea, select')) return;
      e.preventDefault();
      show(e.key === 'ArrowRight' ? i + 1 : i - 1);
    });
    if (plate) {
      let x0 = null;
      plate.addEventListener('pointerdown', e => { x0 = e.clientX; });
      plate.addEventListener('pointerup', e => {
        if (x0 == null) return;
        const dx = e.clientX - x0;
        x0 = null;
        if (Math.abs(dx) < 48) return;
        show(dx < 0 ? i + 1 : i - 1);
      });
    }
  }
})();
