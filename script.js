/* ============================================
   LUIZA LOMBARD - ADVOCACIA PREVIDENCIÁRIA
   Script principal
   ============================================ */

(function () {
    'use strict';

    /* ============================================
       0. TEMA CLARO / ESCURO
       O bootstrap inline no <head> já aplica o tema salvo antes da
       pintura (evita "flash"). Aqui tratamos o botão e a cor do tema.
       ============================================ */
    (function theme() {
        const toggle = document.getElementById('theme-toggle');
        const meta = document.querySelector('meta[name="theme-color"]');
        const COLORS = { light: '#636b2f', dark: '#2c2a26' };

        function apply(t) {
            const dark = t === 'dark';
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            if (meta) meta.setAttribute('content', dark ? COLORS.dark : COLORS.light);
            if (toggle) toggle.setAttribute('aria-pressed', String(dark));
        }

        let saved = null;
        try { saved = localStorage.getItem('theme'); } catch (e) {}
        apply(saved === 'dark' ? 'dark' : 'light');

        if (toggle) {
            toggle.addEventListener('click', function () {
                const dark = document.documentElement.getAttribute('data-theme') === 'dark';
                const next = dark ? 'light' : 'dark';
                try { localStorage.setItem('theme', next); } catch (e) {}
                apply(next);
            });
        }
    })();

    /* ============================================
       1. MENU MOBILE
       ============================================ */
    const menuToggle = document.getElementById('menu-icon');
    const navbar = document.getElementById('navbar');

    if (menuToggle && navbar) {
        const navLinks = navbar.querySelectorAll('a');
        // Antes usávamos <i class="bi bi-list"></i> e trocávamos as classes.
        // Agora é <svg><use href="#i-list"></use></svg> — basta trocar o href do <use>.
        const useEl = menuToggle.querySelector('use');

        function toggleMenu() {
            const isOpen = navbar.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(isOpen));

            if (useEl) {
                useEl.setAttribute('href', isOpen ? '#i-x' : '#i-list');
            }
        }

        function closeMenu() {
            if (!navbar.classList.contains('active')) return;
            navbar.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            if (useEl) {
                useEl.setAttribute('href', '#i-list');
            }
        }

        menuToggle.addEventListener('click', toggleMenu);

        navLinks.forEach(link => link.addEventListener('click', closeMenu));

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });

        document.addEventListener('click', function (e) {
            if (
                navbar.classList.contains('active') &&
                !navbar.contains(e.target) &&
                !menuToggle.contains(e.target)
            ) {
                closeMenu();
            }
        });

        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 1180) closeMenu();
            }, 150);
        });
    }


    /* ============================================
       1b. NAV ATIVO (scroll-spy)
       Marca o link da seção visível com .active (destaque sutil).
       Roda independente de "menos movimento" (é só cor, não animação).
       ============================================ */
    (function navScrollSpy() {
        const sections = document.querySelectorAll('main section[id]');
        const navAnchors = document.querySelectorAll('.navbar a[href^="#"]');
        if (!sections.length || !navAnchors.length || !('IntersectionObserver' in window)) return;

        const map = {};
        navAnchors.forEach(a => { map[a.getAttribute('href').slice(1)] = a; });

        const navObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const active = map[entry.target.id];
                if (!active) return;
                navAnchors.forEach(a => a.classList.remove('active'));
                active.classList.add('active');
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(s => navObs.observe(s));
    })();


    /* ============================================
       2. SCROLL REVEAL (IntersectionObserver)
       Elementos aparecem com fade-up conforme entram na viewport.
       ============================================ */

    // Respeita preferência do usuário por menos movimento (acessibilidade)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Seletor combinado de tudo que deve animar no scroll.
    // Note: o hero (#home) NÃO entra aqui — ele tem animação própria no CSS (on load).
    const REVEAL_SELECTOR = [
        // Cabeçalhos e introduções de seções (exceto hero)
        'main section:not(#home) > .heading',
        'main section:not(#home) > .subheading',
        'main section:not(#home) > .section-intro',
        'main section:not(#home) > .faq-cta',
        'main section:not(#home) > .gradient-btn',
        // Itens em grupos
        '.check-list li',
        '.process-steps li',
        '.projects-grid > *',
        '.faq-grid > *',
        '.reviews-grid > *',
        // Bloco do "Sobre"
        '.about-img',
        '.about-content > *',
        // Formulário de contato
        '.contact-form > .form-field',
        '.contact-form > button'
    ].join(',');

    const revealItems = document.querySelectorAll(REVEAL_SELECTOR);

    // Adiciona a classe base de reveal em cada item
    revealItems.forEach(el => el.classList.add('reveal'));

    /* Stagger: guarda o atraso (em ms) de cada item em um data-attribute.
       IMPORTANTE: NÃO setamos `transition-delay` inline aqui — se setássemos,
       esse delay vazaria para qualquer transition futura no elemento (hover,
       focus, etc.), deixando o hover "preguiçoso" pra responder ao mouse.
       Em vez disso, na hora que o item entra na viewport, usamos setTimeout
       pra adicionar a classe `is-visible` com o atraso desejado. O efeito
       visual de stagger fica idêntico, mas o elemento nunca carrega delay. */
    function staggerChildren(parentSelector, childSelector, stepMs) {
        document.querySelectorAll(parentSelector).forEach(parent => {
            const children = childSelector
                ? parent.querySelectorAll(childSelector)
                : parent.children;
            Array.from(children).forEach((child, i) => {
                child.dataset.revealDelay = i * stepMs;
            });
        });
    }

    staggerChildren('.check-list', 'li', 70);
    staggerChildren('.process-steps', 'li', 130);
    staggerChildren('.projects-grid', null, 130);
    staggerChildren('.faq-grid', null, 110);
    staggerChildren('.reviews-grid', null, 110);
    staggerChildren('.about-content', null, 100);
    staggerChildren('.contact-form', null, 70);

    // Se o usuário prefere menos movimento, mostra tudo imediatamente
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach(el => el.classList.add('is-visible'));
        return;
    }

    // Observer: marca cada item como visível quando entra na viewport,
    // respeitando o delay do stagger via setTimeout (não via CSS transition-delay).
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const delay = parseInt(el.dataset.revealDelay, 10) || 0;

            if (delay > 0) {
                setTimeout(() => el.classList.add('is-visible'), delay);
            } else {
                el.classList.add('is-visible');
            }

            observer.unobserve(el);
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'  // dispara um pouco antes do elemento aparecer 100%
    });

    revealItems.forEach(el => observer.observe(el));

})();