/* ============================================
   LUIZA LOMBARD - ADVOCACIA PREVIDENCIÁRIA
   Script principal
   ============================================ */

(function () {
    'use strict';

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
                if (window.innerWidth > 1024) closeMenu();
            }, 150);
        });
    }


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

    // Stagger: aplica atraso progressivo nos filhos de grupos
    // (assim os cards/itens entram um após o outro, em vez de todos juntos)
    function staggerChildren(parentSelector, childSelector, stepMs) {
        document.querySelectorAll(parentSelector).forEach(parent => {
            const children = childSelector
                ? parent.querySelectorAll(childSelector)
                : parent.children;
            Array.from(children).forEach((child, i) => {
                child.style.transitionDelay = `${i * stepMs}ms`;
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

    // Observer: marca cada item como visível quando entra na viewport
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            el.classList.add('is-visible');
            observer.unobserve(el);

            /* Limpa o transition-delay inline (aplicado pelo stagger) depois
               que a animação de entrada termina. Sem isso, qualquer transition
               futura no elemento — como o :hover dos botões e cards — herda
               o delay do stagger e fica "preguiçosa" pra responder ao mouse. */
            const cleanup = (e) => {
                // O evento dispara para opacity E transform; basta agir uma vez
                if (e.propertyName !== 'opacity') return;
                el.style.transitionDelay = '';
                el.removeEventListener('transitionend', cleanup);
            };
            el.addEventListener('transitionend', cleanup);
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'  // dispara um pouco antes do elemento aparecer 100%
    });

    revealItems.forEach(el => observer.observe(el));

})();