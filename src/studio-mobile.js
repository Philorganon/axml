/**
 * Studio Mobile View Orchestrator
 * Phase 1b: inert management, aria-current, focus handoff, scroll preservation.
 */
(function () {
    'use strict';

    const VIEWS = {
        sidebar: '.sidebar',
        editor: '.editor-main',
        monitor: '.monitor'
    };

    const lastScroll = { sidebar: 0, editor: 0, monitor: 0 };
    let currentView = 'sidebar';
    const isMobile = () => window.innerWidth <= 880;

    function getSections() {
        return Object.keys(VIEWS).map(key => ({
            key,
            el: document.querySelector(VIEWS[key])
        })).filter(s => s.el);
    }

    function applyInert(el, inert) {
        if (inert) {
            el.setAttribute('inert', '');
            el.setAttribute('aria-hidden', 'true');
        } else {
            el.removeAttribute('inert');
            el.removeAttribute('aria-hidden');
        }
    }

    function updateNavState(view) {
        document.querySelectorAll('.mobile-nav-item').forEach(btn => {
            const label = (btn.textContent || '').trim().toLowerCase();
            const target = label === 'library' ? 'sidebar'
                         : label === 'editor' ? 'editor'
                         : label === 'studio' ? 'monitor'
                         : null;
            const active = target === view;
            btn.classList.toggle('active', active);
            if (active) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });
    }

    function switchMobileView(view, btn) {
        if (!VIEWS[view]) return;

        if (!isMobile()) {
            return;
        }

        const sections = getSections();
        const leaving = sections.find(s => s.key === currentView);
        const entering = sections.find(s => s.key === view);

        if (leaving) {
            lastScroll[leaving.key] = window.scrollY;
            leaving.el.classList.remove('active-view');
            applyInert(leaving.el, true);
        }

        if (entering) {
            entering.el.classList.add('active-view');
            applyInert(entering.el, false);

            entering.el.setAttribute('tabindex', '-1');
            try {
                entering.el.focus({ preventScroll: true });
            } catch (_) {
                entering.el.focus();
            }
            entering.el.removeAttribute('tabindex');

            requestAnimationFrame(() => {
                window.scrollTo({ top: lastScroll[view] || 0, behavior: 'auto' });
            });
        }

        currentView = view;
        updateNavState(view);
    }

    function initMobileResponsive() {
        const sections = getSections();

        if (isMobile()) {
            sections.forEach(s => {
                if (s.key === currentView) {
                    s.el.classList.add('active-view');
                    applyInert(s.el, false);
                } else {
                    s.el.classList.remove('active-view');
                    applyInert(s.el, true);
                }
            });
            updateNavState(currentView);
        } else {
            sections.forEach(s => {
                s.el.classList.remove('active-view');
                applyInert(s.el, false);
            });
        }
    }

    window.addEventListener('resize', () => {
        if (!isMobile()) {
            const sections = getSections();
            sections.forEach(s => {
                s.el.classList.remove('active-view');
                applyInert(s.el, false);
            });
        } else {
            initMobileResponsive();
        }
    });

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.mobile-nav-item');
        if (!btn) return;

        const label = (btn.textContent || '').trim().toLowerCase();
        const view = label === 'library' ? 'sidebar'
                   : label === 'editor' ? 'editor'
                   : label === 'studio' ? 'monitor'
                   : null;

        if (view) {
            event.preventDefault();
            switchMobileView(view, btn);
        }
    });

    window.switchMobileView = switchMobileView;
    window.initMobileResponsive = initMobileResponsive;
})();
