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
        // O ícone agora é <span class="mt-bars"> com 3 barras; o morph para "X"
        // é 100% CSS via [aria-expanded="true"]. Aqui só alternamos o estado.

        function toggleMenu() {
            const isOpen = navbar.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        }

        function closeMenu() {
            if (!navbar.classList.contains('active')) return;
            navbar.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Abrir menu');
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

        // Em vez de reagir a cada interseção isolada (que pisca quando duas
        // seções cruzam o limite juntas), mantemos o conjunto de seções
        // visíveis e destacamos sempre a PRIMEIRA na ordem do documento.
        const orderedIds = Array.prototype.map.call(sections, s => s.id);
        const visible = new Set();

        function setActive() {
            let activeId = null;
            for (const id of orderedIds) { if (visible.has(id)) { activeId = id; break; } }
            navAnchors.forEach(a => {
                const on = map[activeId] === a;
                a.classList.toggle('active', on);
                if (on) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            });
        }

        const navObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) visible.add(entry.target.id);
                else visible.delete(entry.target.id);
            });
            setActive();
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(s => navObs.observe(s));
    })();


    /* ============================================
       1c. ACORDEÃO "COMO FUNCIONA" (mobile/retraído)
       No desktop os passos ficam expandidos (controlado pelo CSS).
       Em telas ≤900px cada card mostra só o número + título; o corpo
       abre/fecha ao clicar, com a seta no canto girando.
       Colocado ANTES do reveal de propósito: o bloco de reveal tem um
       `return` para "menos movimento", e o acordeão precisa rodar sempre.
       ============================================ */
    (function processAccordion() {
        const steps = document.querySelectorAll('.process-step');
        if (!steps.length) return;
        const mq = window.matchMedia('(max-width: 900px)');

        steps.forEach(step => {
            const head = step.querySelector('.step-head');
            if (!head) return;
            head.addEventListener('click', function () {
                if (!mq.matches) return;                 // só age quando retraído/mobile
                const open = step.classList.toggle('is-open');
                head.setAttribute('aria-expanded', String(open));
            });
        });

        // Sincroniza o estado ao carregar e ao cruzar o breakpoint:
        // mobile começa retraído; desktop fica todo expandido (coerência p/ leitores de tela).
        function sync() {
            const mobile = mq.matches;
            steps.forEach(step => {
                const head = step.querySelector('.step-head');
                step.classList.remove('is-open');
                if (head) head.setAttribute('aria-expanded', mobile ? 'false' : 'true');
            });
        }
        sync();
        if (mq.addEventListener) mq.addEventListener('change', sync);
        else if (mq.addListener) mq.addListener(sync);
    })();


    /* ============================================
       1b. "LER MAIS / LER MENOS" nas avaliações (mobile)
       A partir da 3ª linha o texto fica oculto; um botão abre/fecha
       com animação fluida (max-height). Cada card é independente — o
       grid usa align-items:start, então abrir um NÃO estica o vizinho.
       Colocado ANTES do reveal de propósito (precisa rodar sempre).
       ============================================ */
    (function reviewsReadMore() {
        const cards = document.querySelectorAll('.review-card');
        if (!cards.length) return;
        const mq = window.matchMedia('(max-width: 900px)');
        const LINES = 3;

        function lineHeightOf(el) {
            const cs = getComputedStyle(el);
            let lh = parseFloat(cs.lineHeight);
            if (isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.6;
            return lh;
        }

        // Abre/fecha um card (lógica única, usada pelo clique no card inteiro).
        function toggleCard(card, txt, btn) {
            const expanded = card.classList.toggle('is-expanded');
            if (btn) {
                btn.setAttribute('aria-expanded', String(expanded));
                const lbl = btn.querySelector('.rt-label');
                if (lbl) lbl.textContent = expanded ? 'ler menos' : 'ler mais';
            }
            if (expanded) {
                txt.style.maxHeight = txt.scrollHeight + 'px';
            } else {
                // fixa a altura atual em px antes de animar para o recolhido
                txt.style.maxHeight = txt.scrollHeight + 'px';
                void txt.offsetHeight; // força reflow
                txt.style.maxHeight = (txt.dataset.collapsed || 0) + 'px';
            }
        }

        // O clique vale no card INTEIRO: tocar em qualquer lugar abre/fecha.
        // Guarda o vínculo com dataset p/ não duplicar em resize/troca de breakpoint.
        function bindCardClick(card, txt) {
            if (card.dataset.rtBound) return;
            card.dataset.rtBound = '1';
            card.addEventListener('click', function () {
                if (!card.classList.contains('rt-on')) return;   // só quando há "ler mais"
                // não dispara se o usuário estava selecionando texto
                const sel = window.getSelection && window.getSelection().toString();
                if (sel && sel.length > 0) return;
                toggleCard(card, txt, card.querySelector('.review-toggle'));
            });
        }

        function buildBtn(card, txt) {
            let btn = card.querySelector('.review-toggle');
            if (btn) return btn;
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'review-toggle';
            btn.setAttribute('aria-expanded', 'false');
            // O clique no botão sobe (bubbling) e é tratado pelo handler do card.
            btn.innerHTML =
                '<span class="rt-label">ler mais</span>' +
                '<svg class="rt-chev icon" aria-hidden="true"><use href="#i-chevron"></use></svg>';
            card.appendChild(btn);
            return btn;
        }

        function setup() {
            cards.forEach(function (card) {
                const txt = card.querySelector('.review-text');
                if (!txt) return;
                txt.style.maxHeight = 'none';                 // mede sem limite
                const collapsed = Math.round(lineHeightOf(txt) * LINES);
                const full = txt.scrollHeight;

                if (full <= collapsed + 4) {                 // cabe em até 3 linhas
                    card.classList.remove('is-expanded', 'rt-on');
                    txt.style.maxHeight = '';
                    delete txt.dataset.collapsed;
                    const old = card.querySelector('.review-toggle');
                    if (old) old.remove();
                    return;
                }
                card.classList.add('rt-on');
                txt.dataset.collapsed = collapsed;
                const btn = buildBtn(card, txt);
                bindCardClick(card, txt);
                if (card.classList.contains('is-expanded')) {
                    txt.style.maxHeight = txt.scrollHeight + 'px';
                    btn.querySelector('.rt-label').textContent = 'ler menos';
                    btn.setAttribute('aria-expanded', 'true');
                } else {
                    txt.style.maxHeight = collapsed + 'px';
                    btn.querySelector('.rt-label').textContent = 'ler mais';
                    btn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        function teardown() {
            cards.forEach(function (card) {
                const txt = card.querySelector('.review-text');
                if (txt) { txt.style.maxHeight = ''; delete txt.dataset.collapsed; }
                card.classList.remove('is-expanded', 'rt-on');
                const btn = card.querySelector('.review-toggle');
                if (btn) btn.remove();
            });
        }

        function apply() { mq.matches ? setup() : teardown(); }

        apply();
        window.addEventListener('load', apply);   // recalcula após carregar fontes
        if (mq.addEventListener) mq.addEventListener('change', apply);
        else if (mq.addListener) mq.addListener(apply);

        // ao redimensionar, recalcula a altura (largura muda o nº de linhas)
        let rAF;
        window.addEventListener('resize', function () {
            if (!mq.matches) return;
            cancelAnimationFrame(rAF);
            rAF = requestAnimationFrame(function () {
                cards.forEach(function (card) {
                    const txt = card.querySelector('.review-text');
                    if (!txt || !txt.dataset.collapsed) return;
                    if (card.classList.contains('is-expanded')) {
                        txt.style.maxHeight = 'none';
                        txt.style.maxHeight = txt.scrollHeight + 'px';
                    } else {
                        const collapsed = Math.round(lineHeightOf(txt) * LINES);
                        txt.dataset.collapsed = collapsed;
                        txt.style.maxHeight = collapsed + 'px';
                    }
                });
            });
        });
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
        // Itens em grupos
        '.check-list li',
        '.process-steps li',
        '.projects-grid > *',
        '.faq-grid > *',
        '.reviews-grid > *',
        // Bloco do "Sobre"
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
    staggerChildren('.contact-form', '.form-field, button', 45);   // só campos visíveis + botão (botão aparece rápido)

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

            // will-change só enquanto anima; removido ao terminar (libera GPU)
            function reveal() {
                el.style.willChange = 'opacity, transform';
                el.classList.add('is-visible');
                el.addEventListener('transitionend', function te(ev) {
                    if (ev.propertyName === 'transform') {
                        el.style.willChange = '';
                        el.removeEventListener('transitionend', te);
                    }
                });
            }
            if (delay > 0) setTimeout(reveal, delay);
            else reveal();

            observer.unobserve(el);
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'  // dispara um pouco antes do elemento aparecer 100%
    });

    revealItems.forEach(el => observer.observe(el));


    /* ============================================
       3. BARRA DE PROGRESSO DE LEITURA
       ============================================ */
    (function scrollProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) return;
        let ticking = false;
        function update() {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const p = max > 0 ? h.scrollTop / max : 0;
            bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    })();

    /* ============================================
       4. FAB DO WHATSAPP — aparece ao sair do hero
       ============================================ */
    (function waFab() {
        const fab = document.getElementById('wa-fab');
        if (!fab) return;
        const hero = document.getElementById('home');
        if ('IntersectionObserver' in window && hero) {
            const io = new IntersectionObserver(function (entries) {
                fab.classList.toggle('is-visible', !entries[0].isIntersecting);
            }, { rootMargin: '-40% 0px 0px 0px' });
            io.observe(hero);
        } else {
            fab.classList.add('is-visible');
        }
    })();

    /* ============================================
       5. CONSENTIMENTO (LGPD) — controla o Google Ads
       O gtag NÃO carrega até o visitante aceitar. A escolha
       fica salva em localStorage. Para voltar a carregar
       sempre (sem banner), chame loadGtag() direto.
       ============================================ */
    (function consent() {
        const AW_ID = 'AW-17724271591';
        const KEY = 'cookie-consent';
        const banner = document.getElementById('cookie-banner');

        function loadGtag() {
            if (window.__gtagLoaded) return;
            window.__gtagLoaded = true;
            const sc = document.createElement('script');
            sc.async = true;
            sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW_ID;
            document.head.appendChild(sc);
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', AW_ID);
        }

        let saved = null;
        try { saved = localStorage.getItem(KEY); } catch (e) {}
        if (saved === 'accepted') { loadGtag(); return; }
        if (saved === 'rejected') { return; }

        if (!banner) return;
        banner.hidden = false;
        requestAnimationFrame(() => banner.classList.add('is-visible'));

        function decide(value) {
            try { localStorage.setItem(KEY, value); } catch (e) {}
            banner.classList.remove('is-visible');
            setTimeout(() => { banner.hidden = true; }, 450);
            if (value === 'accepted') loadGtag();
        }
        const a = document.getElementById('cookie-accept');
        const r = document.getElementById('cookie-reject');
        if (a) a.addEventListener('click', () => decide('accepted'));
        if (r) r.addEventListener('click', () => decide('rejected'));
    })();

})();