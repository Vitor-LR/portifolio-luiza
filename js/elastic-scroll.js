/* ============================================================
   Overscroll elástico (rubber-band) — DISCRETO.
   Ao chegar ao topo/fim e continuar puxando, o conteúdo estica
   um pouco e volta com mola. Envolve <main>+<footer>; header fixo
   e barra de progresso ficam de fora. Em repouso, remove transform
   e will-change por completo (não interfere em position: sticky).
   Desligado em prefers-reduced-motion.
   ============================================================ */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var main = document.querySelector('main');
    if (!main) return;
    var footer = document.querySelector('.footer');

    var wrap = document.createElement('div');
    wrap.className = 'elastic-wrap';
    main.parentNode.insertBefore(wrap, main);
    wrap.appendChild(main);
    if (footer) wrap.appendChild(footer);

    var MAX = 26;          // deslocamento máximo (px) — discreto
    var EASE = 0.16;
    var SPRING = 0.86;

    var target = 0, rendered = 0, holding = false, ticking = false;

    function clamp(v) { return v < -MAX ? -MAX : (v > MAX ? MAX : v); }
    function atTop() { return window.scrollY <= 0; }
    function atBottom() {
        return Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1;
    }
    function apply(v) { wrap.style.transform = 'translate3d(0,' + v.toFixed(2) + 'px,0)'; }
    function settle() { rendered = 0; target = 0; wrap.style.transform = ''; wrap.style.willChange = ''; ticking = false; }

    function loop() {
        if (!holding) target *= SPRING;
        rendered += (target - rendered) * EASE;
        if (!holding && Math.abs(target) < 0.25 && Math.abs(rendered) < 0.25) { settle(); return; }
        apply(rendered);
        requestAnimationFrame(loop);
    }
    function start() {
        if (!ticking) { ticking = true; wrap.style.willChange = 'transform'; requestAnimationFrame(loop); }
    }

    window.addEventListener('wheel', function (e) {
        var dy = e.deltaY;
        var pulling = (atTop() && dy < 0) || (atBottom() && dy > 0);
        if (!pulling) return;
        var resist = 1 - Math.min(Math.abs(target) / MAX, 1);
        target = clamp(target + (-dy * 0.07 * resist));
        start();
    }, { passive: true });

    var startY = 0;
    window.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
        var dy = e.touches[0].clientY - startY;
        if ((atTop() && dy > 0) || (atBottom() && dy < 0)) {
            holding = true;
            var resist = 1 - Math.min(Math.abs(dy) / 600, 0.8);
            target = clamp(dy * 0.14 * resist);
            start();
        } else if (holding) { holding = false; }
    }, { passive: true });
    window.addEventListener('touchend', function () { holding = false; start(); }, { passive: true });
})();
