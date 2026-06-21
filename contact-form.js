/* ============================================================
   FORMULÁRIO DE CONTATO — envio por AJAX + popup de confirmação
   - Ao enviar, abre um modal "Não sou um robô" na própria página
     (sem ir para a página externa do FormSubmit).
   - Confirmando, manda os dados via AJAX para o FormSubmit e, no
     sucesso, abre o popup de agradecimento (sem mudar de página).
   - Proteção anti-spam: campo honeypot (_honey) no formulário.
   - O campo de telefone aceita apenas números e os sinais + ( ) - e espaço.

   TROCAR o e-mail abaixo caso mude o destino do FormSubmit.
   ============================================================ */
(function () {
    'use strict';

    var form = document.querySelector('.contact-form');
    var modal = document.getElementById('cf-modal');

    // Telefone: aceita só números e os sinais + ( ) - e espaço
    var phone = document.getElementById('telefone');
    if (phone) {
        phone.addEventListener('input', function () {
            var clean = phone.value.replace(/[^0-9()+\-\s]/g, '');
            if (clean !== phone.value) {
                var pos = phone.selectionStart - (phone.value.length - clean.length);
                phone.value = clean;
                try { phone.setSelectionRange(pos, pos); } catch (e) {}
            }
        });
    }

    if (!form || !modal) return;

    var ENDPOINT = 'https://formsubmit.co/ajax/luizalombard.adv@gmail.com';

    var robot = document.getElementById('cf-robot');
    var sendBtn = document.getElementById('cf-send');
    var errEl = document.getElementById('cf-error');
    var closers = modal.querySelectorAll('[data-cf-close]');
    var lastFocus = null;

    // Popup de agradecimento (sucesso)
    var success = document.getElementById('cf-success');
    var successBack = document.getElementById('cf-success-back');
    var successClosers = success ? success.querySelectorAll('[data-cf-success-close]') : [];

    function openSuccess() {
        if (!success) return;
        success.hidden = false;
        void success.offsetWidth;            // força reflow p/ animar a entrada
        success.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (successBack) successBack.focus();
    }

    function closeSuccess() {
        if (!success) return;
        success.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(function () { success.hidden = true; }, 250);   // espera a animação de saída
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function setSending(on) {
        sendBtn.disabled = on || !robot.checked;
        sendBtn.textContent = on ? 'Enviando…' : 'Enviar mensagem';
    }

    function openModal() {
        errEl.hidden = true;
        robot.checked = false;
        setSending(false);
        sendBtn.disabled = true;
        lastFocus = document.activeElement;
        modal.hidden = false;
        void modal.offsetWidth; // força reflow p/ animar
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        robot.focus();
    }

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
        setSending(false);
        setTimeout(function () { modal.hidden = true; }, 200);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // intercepta o envio do formulário
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // respeita as validações nativas (campos obrigatórios, e-mail válido…)
        if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
        openModal();
    });

    robot.addEventListener('change', function () {
        sendBtn.disabled = !robot.checked;
    });

    closers.forEach(function (el) { el.addEventListener('click', closeModal); });
    successClosers.forEach(function (el) { el.addEventListener('click', closeSuccess); });

    // Elementos focáveis dentro do card do modal (para o focus trap)
    var card = modal.querySelector('.cf-modal__card');
    function focusables() {
        if (!card) return [];
        var sel = 'a[href], button:not([disabled]), input:not([disabled]), ' +
            '[tabindex]:not([tabindex="-1"])';
        return Array.prototype.filter.call(
            card.querySelectorAll(sel),
            function (el) { return el.offsetParent !== null; }
        );
    }

    document.addEventListener('keydown', function (e) {
        if (modal.hidden) return;
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key !== 'Tab') return;

        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        var active = document.activeElement;

        if (e.shiftKey && (active === first || !card.contains(active))) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // Teclado do popup de agradecimento: Esc fecha; Tab fica preso no botão
    document.addEventListener('keydown', function (e) {
        if (!success || success.hidden) return;
        if (e.key === 'Escape') { closeSuccess(); return; }
        if (e.key === 'Tab') {
            e.preventDefault();
            if (successBack) successBack.focus();
        }
    });

    sendBtn.addEventListener('click', function () {
        if (!robot.checked) return;
        setSending(true);
        errEl.hidden = true;

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new FormData(form)
        })
            .then(function (r) { return r.json().catch(function () { return {}; }); })
            .then(function (res) {
                var ok = res && (res.success === 'true' || res.success === true);
                if (ok) {
                    closeModal();        // fecha o "não sou robô"
                    form.reset();        // limpa o formulário
                    openSuccess();       // abre o agradecimento
                } else {
                    throw new Error((res && res.message) || 'falha no envio');
                }
            })
            .catch(function () {
                setSending(false);
                errEl.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
                errEl.hidden = false;
            });
    });
})();