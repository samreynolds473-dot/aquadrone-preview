(() => {
  const desktop = document.getElementById('navSvc');
  const desktopBtn = document.getElementById('navSvcBtn');
  const desktopMenu = document.getElementById('navSvcMenu');
  const mobile = document.getElementById('mnavSvc');
  const mobileBtn = document.getElementById('mnavSvcBtn');
  const mobileMenu = document.getElementById('mnavSvcMenu');
  if (!desktop || !mobile) return;

  const items = menu => [...menu.querySelectorAll('a')];
  const expanded = (btn, open) => btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  const desktopOpen = () => !desktop.classList.contains('is-dismissed') && (desktop.classList.contains('is-open') || desktop.matches(':hover') || desktop.matches(':focus-within'));

  const syncDesktop = () => expanded(desktopBtn, desktopOpen());

  desktopBtn.addEventListener('click', () => {
    const open = desktopOpen();
    if (open) {
      desktop.classList.remove('is-open');
      desktop.classList.add('is-dismissed');
      expanded(desktopBtn, false);
    } else {
      desktop.classList.add('is-open');
      desktop.classList.remove('is-dismissed');
      expanded(desktopBtn, true);
    }
  });

  desktop.addEventListener('mouseenter', syncDesktop);
  desktop.addEventListener('mouseleave', () => {
    desktop.classList.remove('is-dismissed');
    syncDesktop();
  });
  desktop.addEventListener('focusin', syncDesktop);
  desktop.addEventListener('focusout', e => {
    if (!desktop.contains(e.relatedTarget)) {
      desktop.classList.remove('is-dismissed', 'is-open');
      expanded(desktopBtn, false);
    }
  });

  const move = (menu, dir) => {
    const links = items(menu);
    const i = links.indexOf(document.activeElement);
    const next = links[(i + dir + links.length) % links.length];
    next?.focus();
  };

  desktop.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!desktopOpen() && !desktop.matches(':focus-within')) return;
      e.preventDefault();
      desktop.classList.remove('is-open');
      desktop.classList.add('is-dismissed');
      expanded(desktopBtn, false);
      desktop.querySelector(':scope > a').focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      desktop.classList.remove('is-dismissed');
      desktop.classList.add('is-open');
      expanded(desktopBtn, true);
      if (desktopMenu.contains(document.activeElement)) move(desktopMenu, 1);
      else items(desktopMenu)[0]?.focus();
    } else if (e.key === 'ArrowUp' && desktopMenu.contains(document.activeElement)) {
      e.preventDefault();
      move(desktopMenu, -1);
    }
  });

  const setMobile = open => {
    mobile.classList.toggle('is-open', open);
    expanded(mobileBtn, open);
  };
  mobileBtn.addEventListener('click', () => setMobile(!mobile.classList.contains('is-open')));
  mobile.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobile.classList.contains('is-open')) {
      e.preventDefault();
      e.stopPropagation();
      setMobile(false);
      mobileBtn.focus();
    } else if (e.key === 'ArrowDown' && mobile.classList.contains('is-open')) {
      e.preventDefault();
      if (mobileMenu.contains(document.activeElement)) move(mobileMenu, 1);
      else items(mobileMenu)[0]?.focus();
    } else if (e.key === 'ArrowUp' && mobileMenu.contains(document.activeElement)) {
      e.preventDefault();
      move(mobileMenu, -1);
    }
  });

  const mnav = document.getElementById('mnav');
  document.getElementById('burger')?.addEventListener('click', () => setMobile(false));
  document.getElementById('mclose')?.addEventListener('click', () => setMobile(false));
  mnav?.addEventListener('click', e => { if (e.target.closest('a')) setMobile(false); });
})();
