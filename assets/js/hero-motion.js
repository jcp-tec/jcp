// Movimento de cor no fundo: parallax de ponteiro + deslocamento por scroll.
// get() devolve { hero, glows:[el], auras:[{el, host, mode}] } a cada frame.
export function attachMotion(get) {
  const pointer = { x: 0.5, y: 0.5 };
  const eased = { x: 0.5, y: 0.5 };
  let raf = 0;
  const factors = [[46, 34, 90], [-60, -28, -70], [34, 52, 40]];
  const onMove = (e) => {
    pointer.x = e.clientX / window.innerWidth;
    pointer.y = e.clientY / window.innerHeight;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const tick = () => {
    raf = requestAnimationFrame(tick);
    eased.x += (pointer.x - eased.x) * 0.06;
    eased.y += (pointer.y - eased.y) * 0.06;
    const px = (eased.x - 0.5) * 2;
    const py = (eased.y - 0.5) * 2;
    const cfg = get() || {};
    const hero = cfg.hero;
    const glows = cfg.glows || [];
    const auras = cfg.auras || [];

    if (hero) {
      const r = hero.getBoundingClientRect();
      const p = Math.max(-1, Math.min(1, -r.top / (window.innerHeight || 1)));
      glows.forEach((el, i) => {
        if (!el) return;
        const f = factors[i % 3];
        el.style.translate = (px * f[0]).toFixed(1) + 'px ' + (py * f[1] + p * f[2]).toFixed(1) + 'px';
      });
    }

    auras.forEach((a) => {
      if (!a || !a.el || !a.host) return;
      const r = a.host.getBoundingClientRect();
      const prog = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      if (a.mode === 'band') {
        a.el.style.transform = 'translate(' + (px * 50 + (prog - 0.5) * 120).toFixed(1) + 'px, ' + (py * 30).toFixed(1) + 'px)';
      } else {
        a.el.style.transform = 'translate(calc(-50% + ' + (px * 40).toFixed(1) + 'px), ' + ((prog - 0.5) * 90).toFixed(1) + 'px)';
        a.el.style.opacity = (0.45 + prog * 0.55).toFixed(3);
      }
    });
  };

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) tick();
  return () => {
    window.removeEventListener('pointermove', onMove);
    cancelAnimationFrame(raf);
  };
}
