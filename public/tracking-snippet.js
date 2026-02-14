/**
 * ═══════════════════════════════════════════════════════════════
 * SaaS Compass — Snippet de Tracking para Site/Landing Page
 * ═══════════════════════════════════════════════════════════════
 * 
 * INSTRUÇÕES:
 * 1. Substitua SUPABASE_URL pela URL do seu projeto Supabase
 * 2. Cole este script antes do </body> em todas as páginas do site
 * 3. Para formulários, chame window.__captureLeadFromForm(formData)
 * 
 * FUNCIONALIDADES:
 * - Rastreia visitantes automaticamente (pageview)
 * - Captura UTMs (utm_source, utm_medium, utm_campaign)
 * - Registra referrer (Google, LinkedIn, etc.)
 * - Gera visitor_id persistente via localStorage
 * - Função helper para capturar leads de formulários
 */

(function () {
    // ─── CONFIGURAÇÃO ────────────────────────────────────
    var SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';

    // ─── VISITOR ID (persistente) ────────────────────────
    var vid = localStorage.getItem('_sc_vid');
    if (!vid) {
        vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('_sc_vid', vid);
    }

    // ─── PARSE UTMs ──────────────────────────────────────
    var params = new URLSearchParams(window.location.search);
    var utms = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_term: params.get('utm_term'),
        utm_content: params.get('utm_content'),
    };

    // Salvar UTMs no sessionStorage para persistir durante a sessão
    if (utms.utm_source) {
        sessionStorage.setItem('_sc_utms', JSON.stringify(utms));
    } else {
        var savedUtms = sessionStorage.getItem('_sc_utms');
        if (savedUtms) {
            try { utms = JSON.parse(savedUtms); } catch (e) { }
        }
    }

    // ─── TRACK VISIT ─────────────────────────────────────
    fetch(SUPABASE_URL + '/functions/v1/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_type: 'pageview',
            page: window.location.pathname + window.location.search,
            referrer: document.referrer || null,
            visitor_id: vid,
            utm_source: utms.utm_source,
            utm_medium: utms.utm_medium,
            utm_campaign: utms.utm_campaign,
            utm_term: utms.utm_term,
            utm_content: utms.utm_content,
        }),
    }).catch(function () { });

    // ─── CAPTURA DE LEAD (helper para formulários) ───────
    window.__captureLeadFromForm = function (formData) {
        return fetch(SUPABASE_URL + '/functions/v1/capture-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.name || null,
                email: formData.email || null,
                phone: formData.phone || null,
                company: formData.company || null,
                message: formData.message || null,
                form_source: 'website',
                page_url: window.location.href,
                referrer: document.referrer || null,
                utm_source: utms.utm_source,
                utm_medium: utms.utm_medium,
                utm_campaign: utms.utm_campaign,
            }),
        });
    };

    // ─── AUTO-CAPTURE: Interceptar submissão de forms ────
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || form.getAttribute('data-sc-ignore')) return;

        var data = {};
        var inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(function (input) {
            var name = (input.name || input.id || '').toLowerCase();
            if (name.includes('name') || name.includes('nome')) data.name = input.value;
            if (name.includes('email')) data.email = input.value;
            if (name.includes('phone') || name.includes('tel') || name.includes('whats')) data.phone = input.value;
            if (name.includes('company') || name.includes('empresa')) data.company = input.value;
            if (name.includes('message') || name.includes('mensagem')) data.message = input.value;
        });

        if (data.email || data.name || data.phone) {
            window.__captureLeadFromForm(data);

            // Também registra como evento
            fetch(SUPABASE_URL + '/functions/v1/track-visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_type: 'form_submit',
                    page: window.location.pathname,
                    visitor_id: vid,
                    utm_source: utms.utm_source,
                    metadata: { form_id: form.id || form.action || 'unknown' },
                }),
            }).catch(function () { });
        }
    });

    // ─── TRACK CTA CLICKS ────────────────────────────────
    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-sc-cta]');
        if (!el) return;

        fetch(SUPABASE_URL + '/functions/v1/track-visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_type: 'cta_click',
                page: window.location.pathname,
                visitor_id: vid,
                utm_source: utms.utm_source,
                metadata: { cta: el.getAttribute('data-sc-cta') },
            }),
        }).catch(function () { });
    });

    console.log('[SaaS Compass] Tracking ativo. Visitor ID:', vid);
})();
