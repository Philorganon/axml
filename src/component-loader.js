/**
 * AXML Component Loader
 * Enables modular HTML components while maintaining fallback resilience.
 */
class ComponentLoader {
    static async loadComponents() {
        const slots = document.querySelectorAll('[data-component]');
        const isHttp = window.location.protocol.startsWith('http');

        if (!isHttp) {
            // Under file:// protocol, browsers may block fetch() with CORS.
            // Templates pre-rendered in HTML shell are preserved.
            return;
        }

        const promises = Array.from(slots).map(async (slot) => {
            const componentName = slot.getAttribute('data-component');
            if (!componentName) return;

            try {
                const response = await fetch(`components/${componentName}.html`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                slot.outerHTML = html;
            } catch (err) {
                // If fetch fails (e.g. offline or relative path resolution), keep slot content intact
                console.warn(`[ComponentLoader] Could not load component ${componentName}:`, err.message);
            }
        });

        await Promise.all(promises);
    }
}
