/**
 * Studio UI Orchestrator
 * High-performance UI module with safe DOM manipulation,
 * line gutter synchronization, diagnostic error cards,
 * clean event-driven architecture (No Inline Handlers), and professional DAW telemetry.
 */

var editorElement = null;
var editorGutterElement = null;
var logPanel = null;
var statusBadgeElement = null;
var projectListElement = null;
var currentLogFilter = 'all';
var isLooping = false;

const DOCS = [
    { title: "Root Architecture", tag: "<axml>", desc: "Main project container. Must include version attribute (e.g., version='4.0')." },
    { title: "Project Metadata", tag: "<metadata>", desc: "Defines composition context: <title>, <artist>, <tempo> (BPM), and <key>." },
    { title: "Instrument (The Synth)", tag: "<instrument>", desc: "Oscillator types: sine, sawtooth, square, triangle, kick, snare, hihat." },
    { title: "Sound Envelopes", tag: "ADSR", desc: "Synthesis shaping: attack (fade-in), decay, sustain (level 0-1), release (fade-out)." },
    { title: "Logic Filters", tag: "Filters", desc: "Resonant biquad filters: cutoff (Hz) and resonance (Q) for dynamic sculpting." },
    { title: "FX Rack (DSP)", tag: "DSP", desc: "Audio effects: distortion (0-1), chorus (0-1), bitcrush (0-1), reverb (0-1), delay (0-1)." },
    { title: "LFO Modulation", tag: "Modulation", desc: "Periodic modulation: lfoRate (Hz), lfoAmount (depth), lfoTarget (cutoff, volume, pan)." },
    { title: "Tracks & Sequencing", tag: "<track>", desc: "Sequence stream for an instrument. Supports volume, pan, and mute attributes." },
    { title: "Note Notation", tag: "<note>", desc: "Attributes: pitch (C4, A#3, rest), start (beat), duration (q, e, s, w, h, or numeric beats)." },
    { title: "Polyphony (Chords)", tag: "<chord>", desc: "Simultaneous notes sharing a single start and duration beat interval." },
    { title: "Pattern Macros", tag: "<patterns>", desc: "Reusable sequence modules. Call via <play pattern='ID' start='X' repeat='4' step='4'/>." },
    { title: "Visualizer Modes", tag: "Monitor", desc: "Switch visualizer modes in monitor: Bars, Waveform, Circular, Spectrogram, Flow." },
    { title: "Sequencer Tool", tag: "Tool", desc: "Generate algorithmic arpeggios directly into the editor via the toolbar button." }
];

/**
 * XSS-Safe, Categorized Studio Logging with Diagnostic Error Cards
 */
function log(msg, type = 'info', details = null) {
    if (!logPanel) logPanel = document.getElementById('log');
    if (!logPanel) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.dataset.type = type;

    const row = document.createElement('div');
    row.className = 'log-entry-row';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = new Date().toLocaleTimeString().split(' ')[0];
    row.appendChild(timeSpan);

    const badge = document.createElement('span');
    badge.className = `log-badge ${type}`;
    badge.textContent = type.toUpperCase();
    row.appendChild(badge);

    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = msg;
    row.appendChild(msgSpan);

    entry.appendChild(row);

    // Render Diagnostic Card for Errors
    if (details && (details.line || details.snippet || details.hint)) {
        const diag = document.createElement('div');
        diag.className = 'error-diagnostic';

        if (details.line) {
            const metaLine = document.createElement('div');
            metaLine.className = 'error-meta-line';

            const locSpan = document.createElement('span');
            locSpan.textContent = `Location: Line ${details.line}${details.column ? `, Column ${details.column}` : ''}`;
            metaLine.appendChild(locSpan);

            const jumpBtn = document.createElement('button');
            jumpBtn.type = 'button';
            jumpBtn.className = 'error-jump-btn';
            jumpBtn.textContent = 'Jump to Line';
            jumpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                jumpToEditorLine(details.line, details.column);
            });
            metaLine.appendChild(jumpBtn);
            diag.appendChild(metaLine);
        }

        if (details.snippet) {
            const snippetPre = document.createElement('pre');
            snippetPre.className = 'code-snippet-preview';
            snippetPre.textContent = details.snippet;
            diag.appendChild(snippetPre);
        }

        if (details.hint) {
            const hintDiv = document.createElement('div');
            hintDiv.style.cssText = 'color: var(--primary); font-size: 0.68rem; margin-top: 4px;';
            hintDiv.textContent = `Remedy: ${details.hint}`;
            diag.appendChild(hintDiv);
        }

        entry.appendChild(diag);
    }

    if (currentLogFilter !== 'all' && type !== currentLogFilter) {
        entry.style.display = 'none';
    }

    logPanel.prepend(entry);

    if (logPanel.children.length > 120) {
        logPanel.removeChild(logPanel.lastChild);
    }
}

function filterLogs(filter) {
    currentLogFilter = filter;
    document.querySelectorAll('.console-filter-btn').forEach(b => {
        const active = b.dataset.filter === filter;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (!logPanel) logPanel = document.getElementById('log');
    if (!logPanel) return;

    Array.from(logPanel.children).forEach(entry => {
        if (filter === 'all') {
            entry.style.display = 'flex';
        } else if (filter === 'error') {
            entry.style.display = entry.classList.contains('error') ? 'flex' : 'none';
        } else if (filter === 'audio') {
            entry.style.display = (entry.classList.contains('audio') || entry.classList.contains('mixer')) ? 'flex' : 'none';
        }
    });
}

function clearLog() {
    if (!logPanel) logPanel = document.getElementById('log');
    if (logPanel) while (logPanel.firstChild) logPanel.removeChild(logPanel.firstChild);
}

function jumpToEditorLine(line, col = 1) {
    if (!editorElement) editorElement = document.getElementById('code-editor');
    if (!editorElement) return;

    const lines = editorElement.value.split('\n');
    let charIndex = 0;
    const targetLine = Math.max(1, Math.min(lines.length, line));

    for (let i = 0; i < targetLine - 1; i++) {
        charIndex += lines[i].length + 1;
    }
    charIndex += Math.max(0, col - 1);

    editorElement.focus();
    editorElement.setSelectionRange(charIndex, charIndex);

    const lineHeight = 22;
    editorElement.scrollTop = Math.max(0, (targetLine - 4) * lineHeight);
    updateGutter();
    updateCursorPos();
}

/**
 * Line Number Gutter Synchronization
 */
function updateGutter() {
    if (!editorElement) editorElement = document.getElementById('code-editor');
    if (!editorGutterElement) editorGutterElement = document.getElementById('editor-gutter');
    if (!editorElement || !editorGutterElement) return;

    const lines = editorElement.value.split('\n');
    const totalLines = lines.length;
    const cursorLine = editorElement.value.substring(0, editorElement.selectionStart).split('\n').length;

    while (editorGutterElement.firstChild) {
        editorGutterElement.removeChild(editorGutterElement.firstChild);
    }

    const frag = document.createDocumentFragment();
    for (let i = 1; i <= totalLines; i++) {
        const div = document.createElement('div');
        div.className = `line-num${i === cursorLine ? ' active' : ''}`;
        div.textContent = i;
        frag.appendChild(div);
    }
    editorGutterElement.appendChild(frag);
    editorGutterElement.scrollTop = editorElement.scrollTop;
}

function updateCursorPos() {
    if (!editorElement) editorElement = document.getElementById('code-editor');
    const cursorPosEl = document.getElementById('cursor-pos');
    if (!editorElement || !cursorPosEl) return;

    const val = editorElement.value.substring(0, editorElement.selectionStart);
    const lines = val.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorPosEl.textContent = `Ln ${line}, Col ${col}`;
    updateGutter();
}

/**
 * Drawer & Panel Toggles for Clean Layout
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-panel');
    const btn = document.getElementById('btn-toggle-sidebar');
    if (!sidebar) return;
    const collapsed = sidebar.classList.toggle('is-collapsed');
    if (btn) btn.classList.toggle('active', !collapsed);
}

function toggleBottomDock() {
    const dock = document.getElementById('bottom-dock');
    const btn = document.getElementById('btn-toggle-dock');
    if (!dock) return;
    const collapsed = dock.classList.toggle('is-collapsed');
    if (btn) btn.classList.toggle('active', !collapsed);
}

function toggleMonitor() {
    const monitor = document.getElementById('monitor-panel');
    const btn = document.getElementById('btn-toggle-monitor');
    if (!monitor) return;
    const collapsed = monitor.classList.toggle('is-collapsed');
    if (btn) btn.classList.toggle('active', !collapsed);
}

function switchDockTab(tabId) {
    document.querySelectorAll('.dock-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.dockTab === tabId);
    });
    document.querySelectorAll('.dock-pane').forEach(p => {
        p.classList.toggle('active', p.id === `dock-pane-${tabId}`);
    });
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        const active = b.dataset.tab === tabId;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    const tab = document.getElementById('tab-' + tabId);
    if (tab) tab.classList.add('active');
}

function toggleMixerMode(mode) {
    const mixer = document.getElementById('mixer-grid');
    const fx = document.getElementById('fx-dashboard');
    const btnMixer = document.getElementById('btn-mode-mixer');
    const btnFx = document.getElementById('btn-mode-fx');

    if (mode === 'mixer') {
        if (mixer) mixer.style.display = 'flex';
        if (fx) fx.style.display = 'none';
        if (btnMixer) btnMixer.classList.add('active');
        if (btnFx) btnFx.classList.remove('active');
    } else {
        if (mixer) mixer.style.display = 'none';
        if (fx) fx.style.display = 'flex';
        if (btnMixer) btnMixer.classList.remove('active');
        if (btnFx) btnFx.classList.add('active');
    }
}

function filterProjects(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('#project-list .project-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
    });
}

function initLibrary(parser, player) {
    const projectList = document.getElementById('project-list');
    const examples = (typeof AXML_EXAMPLES !== 'undefined') ? AXML_EXAMPLES : {};

    if (projectList) {
        while (projectList.firstChild) projectList.removeChild(projectList.firstChild);

        Object.keys(examples).forEach(name => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');

            const header = document.createElement('div');
            header.className = 'project-item-header';

            const icon = document.createElement('i');
            icon.className = 'material-icons item-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = 'graphic_eq';

            const span = document.createElement('span');
            span.className = 'project-name';
            span.textContent = name;

            header.appendChild(icon);
            header.appendChild(span);
            item.appendChild(header);

            const loadProject = () => {
                document.querySelectorAll('#project-list .project-item').forEach(p => p.classList.remove('active'));
                item.classList.add('active');

                if (!editorElement) editorElement = document.getElementById('code-editor');
                if (editorElement) {
                    editorElement.value = examples[name];
                    try {
                        const data = parser.parse(editorElement.value);
                        updateUI(data, player);
                        updateGutter();
                        log(`Loaded project: ${name}`, "info");
                    } catch (e) {
                        log(`Parse error in ${name}: ${e.message}`, "error", {
                            line: e.line,
                            column: e.column,
                            snippet: e.snippet,
                            hint: e.hint
                        });
                    }
                }
            };

            item.addEventListener('click', loadProject);
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadProject();
                }
            });

            projectList.appendChild(item);
        });
    }

    if (typeof loadPresetsToUI === 'function') {
        loadPresetsToUI();
    }

    const helpContent = document.getElementById('help-content');
    if (helpContent) {
        while (helpContent.firstChild) helpContent.removeChild(helpContent.firstChild);
        DOCS.forEach(d => {
            const div = document.createElement('div');
            div.className = 'doc-item';

            const topRow = document.createElement('div');
            topRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';

            const title = document.createElement('strong');
            title.style.cssText = 'color:var(--primary); font-family:var(--font-display); font-size:0.75rem;';
            title.textContent = d.title;

            const tag = document.createElement('span');
            tag.className = 'doc-tag';
            tag.textContent = d.tag;

            topRow.appendChild(title);
            topRow.appendChild(tag);

            const p = document.createElement('p');
            p.style.cssText = 'font-size:0.75rem; margin-top:6px; line-height:1.5; color:var(--text-secondary);';
            p.textContent = d.desc;

            div.appendChild(topRow);
            div.appendChild(p);
            helpContent.appendChild(div);
        });
    }

    // Bind Editor Gutter, Scroll, and Tab Indentation
    if (!editorElement) editorElement = document.getElementById('code-editor');
    if (editorElement) {
        editorElement.addEventListener('keyup', updateCursorPos);
        editorElement.addEventListener('click', updateCursorPos);
        editorElement.addEventListener('input', () => {
            updateGutter();
            updateCursorPos();
        });
        editorElement.addEventListener('scroll', () => {
            if (editorGutterElement) editorGutterElement.scrollTop = editorElement.scrollTop;
        });

        // Tab Key Indentation
        editorElement.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editorElement.selectionStart;
                const end = editorElement.selectionEnd;
                editorElement.value = editorElement.value.substring(0, start) + '  ' + editorElement.value.substring(end);
                editorElement.selectionStart = editorElement.selectionEnd = start + 2;
                updateGutter();
                updateCursorPos();
            }
        });

        updateGutter();
    }
}

async function shareProject() {
    try {
        if (!editorElement) editorElement = document.getElementById('code-editor');
        if (!editorElement) return;
        const code = editorElement.value;
        const encoded = btoa(unescape(encodeURIComponent(code)));
        const url = window.location.origin + window.location.pathname + '#project=' + encoded;
        await navigator.clipboard.writeText(url);
        log("Shareable project URL copied to clipboard", "info");
    } catch (e) {
        log("Failed to copy share link: " + e.message, "error");
    }
}

function loadFromHash(parser, player) {
    const hash = window.location.hash;
    if (hash.startsWith('#project=') && editorElement) {
        try {
            const encoded = hash.split('=')[1];
            const code = decodeURIComponent(escape(atob(encoded)));
            editorElement.value = code;
            const data = parser.parse(code);
            updateUI(data, player);
            updateGutter();
            log("Project loaded from URL parameter", "info");
            return true;
        } catch (e) {
            log("Error loading project from URL: " + e.message, "error");
        }
    }
    return false;
}

/**
 * Hierarchical XML Auto-Indenter (2-space standard)
 */
function formatXml(xmlStr) {
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    let xml = xmlStr.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    xml.split('\r\n').forEach(node => {
        node = node.trim();
        if (!node) return;
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad !== 0) pad -= 1;
        } else if (node.match(/^<[!?]/)) {
            indent = 0;
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }
        formatted += '  '.repeat(pad) + node + '\n';
        pad += indent;
    });
    return formatted.trim();
}

function formatCode(parser) {
    if (!editorElement) editorElement = document.getElementById('code-editor');
    if (!editorElement) return;
    let code = editorElement.value.trim();
    if (!code) return;
    try {
        const xml = parser.domParser.parseFromString(code, "text/xml");
        const err = xml.querySelector("parsererror");
        if (err) throw parser._extractParserError(err, code);

        const ser = new XMLSerializer();
        const raw = ser.serializeToString(xml);
        editorElement.value = formatXml(raw);
        updateGutter();
        updateCursorPos();
        log("AXML formatted with hierarchical 2-space indentation", "info");
    } catch (e) {
        log("Format failed: " + e.message, 'error', {
            line: e.line,
            column: e.column,
            snippet: e.snippet,
            hint: e.hint
        });
    }
}

function toggleQuickMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('quick-dropdown');
    const btn = document.getElementById('btn-quick-insert');
    if (dropdown) {
        const isOpen = dropdown.classList.toggle('show');
        if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
}

window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('quick-dropdown');
    const btn = document.getElementById('btn-quick-insert');
    if (dropdown && !e.target.closest('.quick-insert-wrapper')) {
        dropdown.classList.remove('show');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }
});

function insertSnippet(type) {
    if (!editorElement) editorElement = document.getElementById('code-editor');
    if (!editorElement) return;

    let snippet = '';
    switch (type) {
        case 'track':
            snippet = '\n  <track name="synth_lead" instrument="lead" volume="0.8" pan="0">\n    <note pitch="C4" start="0" duration="q"/>\n    <note pitch="D#4" start="1" duration="q"/>\n    <note pitch="G4" start="2" duration="q"/>\n    <note pitch="A#4" start="3" duration="q"/>\n  </track>\n';
            break;
        case 'note':
            snippet = '  <note pitch="C4" start="0" duration="q"/>\n';
            break;
        case 'chord':
            snippet = '  <chord notes="C4,D#4,G4,A#4" start="0" duration="h"/>\n';
            break;
        case 'pattern':
            snippet = '  <play pattern="bass_riff" start="0" repeat="4" step="4"/>\n';
            break;
        case 'synth':
            snippet = '\n    <instrument id="lead" type="sawtooth">\n      <envelope attack="0.05" decay="0.12" sustain="0.65" release="0.25"/>\n      <filter cutoff="3200" resonance="2.5"/>\n    </instrument>\n';
            break;
        case 'filter':
            snippet = '      <filter cutoff="2400" resonance="3.0"/>\n';
            break;
    }

    const start = editorElement.selectionStart;
    const end = editorElement.selectionEnd;
    const text = editorElement.value;
    editorElement.value = text.substring(0, start) + snippet + text.substring(end);
    editorElement.selectionStart = editorElement.selectionEnd = start + snippet.length;
    editorElement.focus();
    updateGutter();
    updateCursorPos();

    const dropdown = document.getElementById('quick-dropdown');
    if (dropdown) dropdown.classList.remove('show');
    const btn = document.getElementById('btn-quick-insert');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    log(`Inserted ${type} template at cursor`, "info");
}

function saveToLocal() {
    if (!editorElement) editorElement = document.getElementById('code-editor');
    if (!editorElement) return;
    const code = editorElement.value;
    const titleEl = document.getElementById('meta-title');
    const title = titleEl ? titleEl.textContent : 'project';
    localStorage.setItem('axml_last_project', code);
    log(`Project '${title}' saved to local storage`, "info");
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    log("Interface theme toggled", "info");
}

function toggleLoop() {
    isLooping = !isLooping;
    const btn = document.getElementById('btn-loop');
    if (btn) {
        btn.classList.toggle('active', isLooping);
        btn.setAttribute('aria-pressed', isLooping ? 'true' : 'false');
    }
    if (typeof player !== 'undefined' && player) player.isLooping = isLooping;
    log(isLooping ? "Track loop mode enabled" : "Track loop mode disabled", "audio");
}

function setVizMode(mode, btn) {
    if (typeof currentVizMode !== 'undefined') currentVizMode = mode;
    document.querySelectorAll('.viz-btn').forEach(b => {
        const active = b === btn || b.dataset.mode === mode;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

/**
 * Global Keyboard Shortcut Manager
 */
class ShortcutManager {
    constructor(player) {
        this.player = player;
        this.setup();
    }

    setup() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                if (e.ctrlKey && e.code === 'KeyS') {
                    e.preventDefault();
                    saveToLocal();
                }
                if (e.ctrlKey && e.code === 'Enter') {
                    e.preventDefault();
                    document.getElementById('btn-play')?.click();
                }
                return;
            }

            // Space: Play/Stop
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.player.isPlaying) {
                    document.getElementById('btn-stop')?.click();
                } else {
                    document.getElementById('btn-play')?.click();
                }
            }

            // Ctrl+S: Save
            if (e.ctrlKey && e.code === 'KeyS') {
                e.preventDefault();
                saveToLocal();
            }

            // Ctrl+Enter: Compile & Play
            if (e.ctrlKey && e.code === 'Enter') {
                e.preventDefault();
                document.getElementById('btn-play')?.click();
            }

            // B: Toggle Left Sidebar
            if (e.ctrlKey && e.code === 'KeyB') {
                e.preventDefault();
                toggleSidebar();
            }

            // J: Toggle Bottom Dock (Console/Mixer)
            if (e.ctrlKey && e.code === 'KeyJ') {
                e.preventDefault();
                toggleBottomDock();
            }
        });
    }
}

/**
 * Main UI Loop & Telemetry Updater
 */
function updateUI(data, player) {
    if (!data) return;
    const titleEl = document.getElementById('meta-title');
    const artistEl = document.getElementById('meta-artist');
    const tempoEl = document.getElementById('meta-tempo');
    const keyEl = document.getElementById('meta-key');
    const filenameEl = document.getElementById('current-filename');
    const docStatsEl = document.getElementById('doc-stats');
    const docTempoEl = document.getElementById('doc-tempo');
    const docKeyEl = document.getElementById('doc-key');

    if (titleEl) titleEl.textContent = data.metadata.title;
    if (artistEl) artistEl.textContent = data.metadata.artist;
    if (tempoEl) tempoEl.textContent = data.metadata.tempo + ' BPM';
    if (keyEl) keyEl.textContent = `${data.metadata.key} ${data.metadata.scale || ''}`.trim();
    if (filenameEl) filenameEl.textContent = (data.metadata.title || 'untitled').toUpperCase().replace(/\s+/g, '_') + '.axml';

    if (docStatsEl) docStatsEl.textContent = `${data.tracks.length} tracks`;
    if (docTempoEl) docTempoEl.textContent = `${data.metadata.tempo} BPM`;
    if (docKeyEl) docKeyEl.textContent = data.metadata.key || 'C';

    const rackTrackCountEl = document.getElementById('rack-track-count');
    if (rackTrackCountEl) {
        rackTrackCountEl.textContent = `${data.tracks.length} TRACK${data.tracks.length === 1 ? '' : 'S'}`;
    }

    const mixer = document.getElementById('mixer-grid');
    if (mixer) {
        while (mixer.firstChild) mixer.removeChild(mixer.firstChild);

        // Master Channel Strip with dB calibration scale
        const masterVol = player.master ? player.master.gain.value : 0.8;
        const masterDb = masterVol <= 0.001 ? '-inf' : (20 * Math.log10(masterVol)).toFixed(1) + ' dB';
        const masterChan = document.createElement('div');
        masterChan.className = 'mixer-channel master-channel';
        masterChan.dataset.track = 'master';

        masterChan.innerHTML = `
            <div class="channel-top">
                <span class="chan-type-badge mst">MST</span>
                <span class="chan-pan-badge">C</span>
            </div>
            <div class="fader-section">
                <div class="db-scale">
                    <span>+6</span>
                    <span>0</span>
                    <span>-6</span>
                    <span>-12</span>
                    <span>-24</span>
                    <span>-inf</span>
                </div>
                <div class="fader-track"><div class="fader-cap" style="bottom: ${masterVol * 100}%;"></div></div>
                <div class="vumeter"><div class="vumeter-level" id="vu-master"></div></div>
            </div>
            <div class="channel-bottom">
                <span class="chan-label">MASTER</span>
                <span class="chan-vol-val">${masterDb}</span>
            </div>
        `;
        mixer.appendChild(masterChan);

        // Individual Track Channel Strips with Mute/Solo & dB calibration
        data.tracks.forEach((t) => {
            const trackVol = (player.trackGains && player.trackGains[t.name]) ? player.trackGains[t.name].gain.value : (t.volume || 0.7);
            const trackDb = trackVol <= 0.001 ? '-inf' : (20 * Math.log10(trackVol)).toFixed(1) + ' dB';
            const inst = data.instruments[t.instrumentId];
            const rawType = (inst?.type || 'SYNTH').toLowerCase();
            const instType = rawType.substring(0, 4).toUpperCase();
            const panVal = t.pan ? (t.pan > 0 ? `R${Math.round(t.pan * 100)}` : `L${Math.round(-t.pan * 100)}`) : 'C';

            let badgeClass = 'synth';
            if (rawType.includes('kick') || rawType.includes('snare') || rawType.includes('drum') || rawType.includes('hihat') || rawType.includes('noise')) {
                badgeClass = 'drum';
            } else if (rawType.includes('bass') || rawType.includes('saw')) {
                badgeClass = 'bass';
            } else if (rawType.includes('tri') || rawType.includes('sine')) {
                badgeClass = 'sine';
            }

            const chan = document.createElement('div');
            chan.className = 'mixer-channel';
            chan.dataset.track = t.name;

            // Safe DOM Construction without inline onclick
            chan.innerHTML = `
                <div class="channel-top">
                    <span class="chan-type-badge ${badgeClass}">${instType}</span>
                    <span class="chan-pan-badge" title="Pan: ${panVal}">${panVal}</span>
                </div>
                <div class="fader-section">
                    <div class="db-scale">
                        <span>+6</span>
                        <span>0</span>
                        <span>-6</span>
                        <span>-12</span>
                        <span>-24</span>
                        <span>-inf</span>
                    </div>
                    <div class="fader-track"><div class="fader-cap" style="bottom: ${trackVol * 100}%;"></div></div>
                    <div class="vumeter"><div class="vumeter-level" id="vu-${t.name}"></div></div>
                </div>
                <div class="channel-switches">
                    <button class="track-btn btn-mute" type="button" title="Mute Track" aria-label="Mute track ${t.name}">M</button>
                    <button class="track-btn btn-solo" type="button" title="Solo Track" aria-label="Solo track ${t.name}">S</button>
                </div>
                <div class="channel-bottom">
                    <span class="chan-label" title="${t.name}">${t.name.substring(0, 8)}</span>
                    <span class="chan-vol-val">${trackDb}</span>
                </div>
            `;

            chan.querySelector('.btn-mute').addEventListener('click', (e) => {
                if (typeof toggleTrackMute === 'function') toggleTrackMute(t.name, e.currentTarget);
            });
            chan.querySelector('.btn-solo').addEventListener('click', (e) => {
                if (typeof toggleTrackSolo === 'function') toggleTrackSolo(t.name, e.currentTarget);
            });

            mixer.appendChild(chan);
        });

        if (typeof initMixerEvents === 'function') initMixerEvents(player);
    }
    initFXEvents(player);
}

function initFXEvents(player) {
    document.querySelectorAll('.v-slider[data-param]').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const target = e.target.dataset.param;
            const valLabel = document.getElementById('val-' + (target === 'cutoff' ? 'cutoff' : (target === 'resonance' ? 'reson' : 'reverb')));

            if (valLabel) {
                if (target === 'cutoff') valLabel.textContent = val >= 1000 ? `${(val / 1000).toFixed(1)}kHz` : `${Math.round(val)}Hz`;
                else if (target === 'resonance') valLabel.textContent = val.toFixed(1);
                else if (target === 'reverb') valLabel.textContent = `${Math.round(val * 100)}%`;
            }

            if (player.data) {
                Object.values(player.data.instruments).forEach(inst => {
                    if (inst.hasOwnProperty(target)) inst[target] = val;
                });
            }
        });
    });
}

/**
 * Event-Driven UI Initialization (Replaces all inline onclick/oninput)
 */
function initStudioEvents() {
    // Drawer Toggles
    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-toggle-dock')?.addEventListener('click', toggleBottomDock);
    document.getElementById('btn-toggle-monitor')?.addEventListener('click', toggleMonitor);

    // Sidebar Close Buttons (for mobile or quick collapse)
    document.getElementById('btn-close-sidebar')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-close-monitor')?.addEventListener('click', toggleMonitor);
    document.getElementById('btn-close-dock')?.addEventListener('click', toggleBottomDock);

    // Header Actions
    document.getElementById('btn-format')?.addEventListener('click', () => {
        if (typeof parser !== 'undefined') formatCode(parser);
    });
    document.getElementById('btn-save')?.addEventListener('click', saveToLocal);
    document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
    document.getElementById('btn-share')?.addEventListener('click', shareProject);
    document.getElementById('btn-sequencer')?.addEventListener('click', () => {
        if (typeof openSequencer === 'function') openSequencer();
    });

    // Quick Insert Menu
    document.getElementById('btn-quick-insert')?.addEventListener('click', toggleQuickMenu);
    document.querySelectorAll('#quick-dropdown button[data-snippet]').forEach(btn => {
        btn.addEventListener('click', () => {
            insertSnippet(btn.dataset.snippet);
        });
    });

    // Sidebar Tabs
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            showTab(btn.dataset.tab);
        });
    });

    // Project Search
    document.getElementById('project-search')?.addEventListener('input', (e) => {
        filterProjects(e.target.value);
    });

    // Bottom Dock Tabs
    document.querySelectorAll('.dock-tab-btn[data-dock-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchDockTab(btn.dataset.dockTab);
        });
    });

    // Mixer & DSP Modes
    document.getElementById('btn-mode-mixer')?.addEventListener('click', () => toggleMixerMode('mixer'));
    document.getElementById('btn-mode-fx')?.addEventListener('click', () => toggleMixerMode('fx'));

    // Console Filters
    document.querySelectorAll('.console-filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            filterLogs(btn.dataset.filter);
        });
    });
    document.getElementById('btn-clear-log')?.addEventListener('click', clearLog);

    // Visualizer Mode Buttons
    document.querySelectorAll('.viz-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            setVizMode(btn.dataset.mode, btn);
        });
    });

    // Transport Loop
    document.getElementById('btn-loop')?.addEventListener('click', toggleLoop);
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudioEvents);
} else {
    initStudioEvents();
}
