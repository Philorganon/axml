/**
 * AXML Studio Presets
 * Phase 1b: no innerHTML, no emoji in log, keyboard-friendly actions.
 */
var AXML_PRESETS = {
    // Basses
    "Cyber Bass": `<instrument id="cyberbass" type="sawtooth" volume="0.8" attack="0.01" decay="0.1" sustain="0.6" release="0.2" cutoff="600" resonance="12" distortion="0.6" lfoRate="4" lfoAmount="0.3" lfoTarget="cutoff" />`,
    "Deep Sub": `<instrument id="sub" type="sine" volume="0.9" attack="0.05" decay="0.2" sustain="0.8" release="0.4" cutoff="200" resonance="1" />`,
    "Gritty FM": `<instrument id="gritty" type="sawtooth" volume="0.7" attack="0.01" decay="0.15" sustain="0.4" release="0.1" cutoff="1200" resonance="8" distortion="0.8" bitcrush="0.3" />`,

    // Leads
    "Neon Lead": `<instrument id="neonlead" type="square" volume="0.6" attack="0.05" decay="0.2" sustain="0.4" release="0.4" cutoff="2500" resonance="4" chorus="0.5" reverb="0.4" lfoRate="6" lfoAmount="0.1" lfoTarget="pan" />`,
    "Rave Saw": `<instrument id="ravesaw" type="sawtooth" volume="0.6" attack="0.01" decay="0.1" sustain="0.7" release="0.3" cutoff="5000" resonance="2" chorus="0.8" distortion="0.2" />`,
    "Ethereal Flute": `<instrument id="flute" type="sine" volume="0.5" attack="0.2" decay="0.2" sustain="0.6" release="1.0" cutoff="1500" resonance="4" chorus="0.4" reverb="0.8" lfoRate="3" lfoAmount="0.2" lfoTarget="volume" />`,

    // Pads
    "Dream Pad": `<instrument id="dreampad" type="sine" volume="0.5" attack="2.0" decay="1.0" sustain="0.8" release="2.5" cutoff="1200" resonance="2" chorus="0.8" reverb="0.9" />`,
    "Retro String": `<instrument id="strings" type="sawtooth" volume="0.4" attack="0.5" sustain="1.0" release="1.5" cutoff="1000" resonance="1" chorus="0.6" reverb="0.5" />`,

    // Plucks
    "8-Bit Pluck": `<instrument id="pluck" type="square" volume="0.6" attack="0.005" decay="0.1" sustain="0" release="0.1" cutoff="4000" bitcrush="0.4" />`,
    "Crystal Bell": `<instrument id="bell" type="sine" volume="0.6" attack="0.01" decay="0.4" sustain="0.1" release="0.8" cutoff="3000" resonance="10" chorus="0.3" reverb="0.6" />`,

    // Percussion
    "Industrial Kick": `<instrument id="kick" type="kick" volume="1.0" attack="0.01" release="0.1" distortion="0.3" />`,
    "Crispy Snare": `<instrument id="snare" type="snare" volume="0.8" attack="0.01" release="0.1" cutoff="1500" bitcrush="0.2" />`,
    "Metallic Hihat": `<instrument id="hihat" type="hihat" volume="0.4" attack="0.01" release="0.05" cutoff="8000" resonance="5" />`,
};

function makeIconButton(iconName, label, handler) {
    const btn = document.createElement('button');
    btn.className = 'btn-mini';
    btn.type = 'button';
    btn.title = label;
    btn.setAttribute('aria-label', label);

    const icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.fontSize = '12px';
    icon.textContent = iconName;
    btn.appendChild(icon);

    btn.addEventListener('click', handler);
    return btn;
}

function loadPresetsToUI() {
    const list = document.getElementById('preset-list');
    if (!list) return;

    while (list.firstChild) list.removeChild(list.firstChild);

    Object.keys(AXML_PRESETS).forEach(name => {
        const row = document.createElement('div');
        row.className = 'project-item preset-item';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.padding = '8px 12px';
        row.style.marginBottom = '4px';
        row.style.cursor = 'pointer';
        row.style.borderRadius = '4px';
        row.style.transition = 'var(--transition)';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.alignItems = 'center';
        info.style.gap = '8px';

        const infoIcon = document.createElement('i');
        infoIcon.className = 'material-icons';
        infoIcon.setAttribute('aria-hidden', 'true');
        infoIcon.style.fontSize = '16px';
        infoIcon.style.color = 'var(--primary)';
        infoIcon.textContent = 'extension';

        const nameSpan = document.createElement('span');
        nameSpan.style.fontSize = '0.85rem';
        nameSpan.textContent = name;

        info.appendChild(infoIcon);
        info.appendChild(nameSpan);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';

        const btnInsert = makeIconButton('add', `Insert preset ${name}`, (e) => {
            e.stopPropagation();
            insertPreset(name);
        });
        const btnCopy = makeIconButton('content_copy', `Copy preset ${name} to clipboard`, (e) => {
            e.stopPropagation();
            copyPresetToClipboard(name);
        });

        actions.appendChild(btnInsert);
        actions.appendChild(btnCopy);

        row.appendChild(info);
        row.appendChild(actions);

        row.addEventListener('click', () => insertPreset(name));
        row.setAttribute('role', 'listitem');

        list.appendChild(row);
    });
}

function insertPreset(name) {
    const xml = AXML_PRESETS[name];
    const editor = document.getElementById('code-editor');
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    const insertion = xml + '\n';
    editor.value = value.slice(0, start) + insertion + value.slice(end);

    const newCursor = start + insertion.length;
    editor.selectionStart = newCursor;
    editor.selectionEnd = newCursor;
    editor.focus();

    if (typeof log === 'function') log(`Preset '${name}' inserted at cursor`);
}

function copyPresetToClipboard(name) {
    const xml = AXML_PRESETS[name];
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
        if (typeof log === 'function') log('Clipboard API not available in this context', 'error');
        return;
    }
    navigator.clipboard.writeText(xml).then(() => {
        if (typeof log === 'function') log(`Preset '${name}' copied to clipboard`);
    }).catch(() => {
        if (typeof log === 'function') log(`Failed to copy preset '${name}'`, 'error');
    });
}
