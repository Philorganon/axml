/**
 * AXML Studio App Entry Point
 * v4.0 - Modular Architecture & Diagnostics Edition
 * Phase 1b: DOMContentLoaded, addEventListener, transport state management.
 */

var parser = new AXMLParser();
var player = new AXMLPlayer();
var project = new ProjectManager();
var shortcuts;

function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
        fn();
    }
}

onReady(async () => {
    if (typeof ComponentLoader !== 'undefined') {
        await ComponentLoader.loadComponents();
    }

    window.editorElement = document.getElementById('code-editor');
    window.statusBadgeElement = document.getElementById('status-badge');

    const canvas = document.getElementById('canvas');
    if (canvas && typeof initVisualizer === 'function') {
        initVisualizer(canvas, player);
    }

    if (typeof initLibrary === 'function') {
        initLibrary(parser, player);
    }
    shortcuts = new ShortcutManager(player);

    if (typeof initMobileResponsive === 'function') {
        initMobileResponsive();
    }

    bindActions();

    if (!loadFromHash(parser, player)) {
        let last = localStorage.getItem('axml_last_project');
        // Migration guard: format lama JSON tidak kompatibel dengan parser XML.
        if (last && last.trim().startsWith('{')) {
            localStorage.removeItem('axml_last_project');
            last = null;
        }

        if (last && window.editorElement) {
            window.editorElement.value = last;
            try {
                const data = parser.parse(last);
                updateUI(data, player);
                if (typeof updateCursorPos === 'function') updateCursorPos();
            } catch (e) {
                if (typeof log === 'function') log('Failed to restore last session', 'error');
            }
        } else {
            const first = document.querySelector('#project-list .project-item');
            if (first) first.click();
        }
    }

    if (typeof log === 'function') {
        log("AXML Studio 4.0 Engine Initialized - Ready", "info");
    }
});

function setTransportBusy(busy) {
    const btnPlay = document.getElementById('btn-play');
    const btnStop = document.getElementById('btn-stop');
    if (btnPlay) {
        btnPlay.disabled = busy;
        btnPlay.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
    if (btnStop) {
        btnStop.disabled = busy;
    }
    if (window.statusBadgeElement) {
        window.statusBadgeElement.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
}

function bindActions() {
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
        btnPlay.addEventListener('click', () => { playProject().catch(() => {}); });
    }

    const btnStop = document.getElementById('btn-stop');
    if (btnStop) {
        btnStop.addEventListener('click', () => {
            player.stop();
            if (statusBadgeElement) {
                statusBadgeElement.className = 'status-badge';
                statusBadgeElement.textContent = 'IDLE';
            }
            if (typeof log === 'function') log('Playback halted', 'audio');
        });
    }

    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', async () => {
            if (!window.editorElement) window.editorElement = document.getElementById('code-editor');
            if (!window.editorElement) return;

            const icon = btnExport.querySelector('i');
            try {
                btnExport.disabled = true;
                if (icon) icon.classList.add('rotating');
                if (typeof log === 'function') log('Rendering 32-bit float audio master to WAV...', 'audio');
                const data = parser.parse(window.editorElement.value);
                player.load(data);
                await player.downloadWAV();
                if (typeof log === 'function') log('Master WAV exported successfully', 'audio');
            } catch (e) {
                if (typeof log === 'function') {
                    log(`WAV render failed: ${e.message}`, 'error', {
                        line: e.line,
                        column: e.column,
                        snippet: e.snippet,
                        hint: e.hint
                    });
                }
            } finally {
                btnExport.disabled = false;
                if (icon) icon.classList.remove('rotating');
            }
        });
    }

    const btnMidi = document.getElementById('btn-midi');
    if (btnMidi) {
        btnMidi.addEventListener('click', () => {
            if (!window.editorElement) window.editorElement = document.getElementById('code-editor');
            if (!window.editorElement) return;
            try {
                const data = parser.parse(window.editorElement.value);
                const exporter = new MidiExporter(data);
                exporter.export();
                if (typeof log === 'function') log('Standard MIDI File (Type 1) exported', 'audio');
            } catch (e) {
                if (typeof log === 'function') {
                    log(`MIDI export failed: ${e.message}`, 'error', {
                        line: e.line,
                        column: e.column,
                        snippet: e.snippet,
                        hint: e.hint
                    });
                }
            }
        });
    }

    if (window.editorElement) {
        window.editorElement.addEventListener('input', () => {
            if (typeof updateCursorPos === 'function') updateCursorPos();
        });
    }
}

async function playProject() {
    if (!window.editorElement) window.editorElement = document.getElementById('code-editor');
    if (!window.statusBadgeElement) window.statusBadgeElement = document.getElementById('status-badge');
    if (!window.editorElement) return;

    setTransportBusy(true);

    try {
        await player.init();
        const xmlCode = window.editorElement.value;
        const data = parser.parse(xmlCode);
        player.load(data);
        updateUI(data, player);

        if (statusBadgeElement) {
            statusBadgeElement.className = 'status-badge';
            statusBadgeElement.textContent = 'SYNCING AUDIO';
        }
        await player.loadSamples();
        await player.play();

        if (statusBadgeElement) {
            statusBadgeElement.className = 'status-badge playing';
            statusBadgeElement.textContent = 'LIVE';
        }
        project.save(xmlCode);
        if (typeof log === 'function') {
            log(`Audio live: ${data.tracks.length} tracks compiling at ${data.metadata.tempo} BPM`, 'audio');
        }
    } catch (e) {
        if (statusBadgeElement) {
            statusBadgeElement.className = 'status-badge has-error';
            statusBadgeElement.textContent = e.line ? `ERROR (LN ${e.line})` : 'PARSING ERROR';
        }
        if (typeof log === 'function') {
            log(e.message, 'error', {
                line: e.line,
                column: e.column,
                snippet: e.snippet,
                hint: e.hint
            });
        }
        console.error(e);
        throw e;
    } finally {
        setTransportBusy(false);
    }
}
