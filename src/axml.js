/**
 * AXML (Audio XML) Library
 * Version 1.0 - Professional Synthesis Engine
 * 
 * Features:
 * - Advanced FM/Subtractive Synthesis
 * - ADSR Envelopes with Curve support
 * - Dynamic Filters (LP/HP/BP)
 * - Effects Rack (Reverb, Delay, Distortion, Pan)
 * - Pattern-based Sequencing
 * - Master Dynamics (Compressor/Limiter)
 */

// --- Audio Utilities ---

function bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    const setUint16 = (d) => { view.setUint16(pos, d, true); pos += 2; };
    const setUint32 = (d) => { view.setUint32(pos, d, true); pos += 4; };

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); // RIFF WAVE
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); setUint32(length - pos - 4);

    for (i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));
    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
            view.setInt16(pos, sample, true); pos += 2;
        }
        offset++;
    }
    return new Blob([buffer], { type: "audio/wav" });
}

// --- Music Theory Engine ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALE_MODES = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'locrian': [0, 1, 3, 5, 6, 8, 10],
    'pentatonic_major': [0, 2, 4, 7, 9],
    'pentatonic_minor': [0, 3, 5, 7, 10],
    'blues': [0, 3, 5, 6, 7, 10],
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
    'whole_tone': [0, 2, 4, 6, 8, 10],
    'diminished': [0, 2, 3, 5, 6, 8, 9, 11],
    'hungarian_minor': [0, 2, 3, 6, 7, 8, 11],
    'japanese': [0, 1, 5, 7, 8],
    'egyptian': [0, 2, 5, 7, 10],
    'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const CHORD_TYPES = {
    'maj': [0, 4, 7],
    'min': [0, 3, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
    'maj7': [0, 4, 7, 11],
    'min7': [0, 3, 7, 10],
    'dom7': [0, 4, 7, 10],
    'dim7': [0, 3, 6, 9],
    'm7b5': [0, 3, 6, 10],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    '6': [0, 4, 7, 9],
    'm6': [0, 3, 7, 9],
    '9': [0, 4, 7, 10, 14],
    'maj9': [0, 4, 7, 11, 14],
    'min9': [0, 3, 7, 10, 14],
    '11': [0, 4, 7, 10, 14, 17],
    'maj11': [0, 4, 7, 11, 14, 17],
    'min11': [0, 3, 7, 10, 14, 17],
    '13': [0, 4, 7, 10, 14, 17, 21],
    'maj13': [0, 4, 7, 11, 14, 17, 21],
    'min13': [0, 3, 7, 10, 14, 17, 21],
    'add9': [0, 4, 7, 14]
};

function getNoteFromName(name) {
    const match = name.match(/^([A-G])([#b]?)(\d+)$/);
    if (!match) return 60;
    let [_, letter, accidental, octave] = match;
    let semitone = NOTE_NAMES.indexOf(letter);
    if (accidental === '#') semitone += 1;
    else if (accidental === 'b') semitone -= 1;
    return parseInt(octave) * 12 + semitone + 12; // Adjusted to MIDI 0 = C-1
}

function getFrequency(note) {
    if (note === 'rest' || !note) return 0;
    if (!isNaN(note)) return 440 * Math.pow(2, (parseInt(note) - 69) / 12);

    const match = String(note).match(/^([A-G])([#b]?)(\d+)$/);
    if (!match) return 0;

    let [_, letter, accidental, octave] = match;
    let semitone = NOTE_NAMES.indexOf(letter);
    if (accidental === '#') semitone += 1;
    else if (accidental === 'b') semitone -= 1;

    // Standard formula: A4 (440Hz) is MIDI 69. C4 is MIDI 60.
    const midi = parseInt(octave) * 12 + semitone + 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function generateChord(root, type) {
    const rootMidi = isNaN(root) ? getNoteFromName(root) : parseInt(root);
    const intervals = CHORD_TYPES[type] || [0];
    return intervals.map(i => rootMidi + i);
}

function snapToScale(note, key, mode) {
    const midi = isNaN(note) ? getNoteFromName(note) : parseInt(note);
    const keyRoot = NOTE_NAMES.indexOf(key.replace(/[0-9]/g, ''));
    const intervals = SCALE_MODES[mode] || SCALE_MODES['major'];

    let noteInOctave = (midi - keyRoot) % 12;
    if (noteInOctave < 0) noteInOctave += 12;

    if (intervals.includes(noteInOctave)) return midi;

    // Find closest interval
    let closest = intervals[0];
    let minDiff = 12;
    intervals.forEach(i => {
        let diff = Math.abs(i - noteInOctave);
        if (diff < minDiff) {
            minDiff = diff;
            closest = i;
        }
    });

    return midi - noteInOctave + closest;
}

const DURATION_MAP = {
    'w': 4, 'h': 2, 'q': 1, 'e': 0.5, 's': 0.25, 't': 0.125,
    'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25, 'thirtysecond': 0.125,
    'dotted-h': 3, 'dotted-q': 1.5, 'dotted-e': 0.75, 'dotted-s': 0.375
};

// --- Advanced Audio Modules ---

/**
 * Base class for all audio processing modules.
 * Provides standard interface for connecting and disconnecting nodes.
 */
class AudioModule {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();
    }

    connect(destination) {
        if (destination instanceof AudioModule) {
            this.output.connect(destination.input);
        } else {
            this.output.connect(destination);
        }
    }

    disconnect() {
        this.output.disconnect();
    }
}

/**
 * ADSR Envelope Generator
 */
class Envelope {
    constructor(ctx, param) {
        this.ctx = ctx;
        this.param = param;
    }

    trigger(time, attack, decay, sustain, release, volume, duration) {
        this.param.cancelScheduledValues(time);
        this.param.setValueAtTime(0, time);
        this.param.linearRampToValueAtTime(volume, time + attack);
        this.param.linearRampToValueAtTime(volume * sustain, time + attack + decay);
        this.param.setValueAtTime(volume * sustain, time + duration);
        this.param.linearRampToValueAtTime(0, time + duration + release);
    }
}

/**
 * Modular Effects Rack for Instruments
 */
class EffectsChain extends AudioModule {
    constructor(ctx, inst) {
        super(ctx);
        this.inst = inst;
        this.setup();
    }

    setup() {
        let lastNode = this.input;

        // Distortion
        if (this.inst.distortion > 0) {
            const shaper = this.ctx.createWaveShaper();
            const amount = this.inst.distortion * 400;
            const curve = new Float32Array(44100);
            const deg = Math.PI / 180;
            for (let i = 0; i < 44100; ++i) {
                const x = (i * 2) / 44100 - 1;
                curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
            }
            shaper.curve = curve;
            lastNode.connect(shaper);
            lastNode = shaper;
        }

        // Filter
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(this.inst.cutoff, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(this.inst.resonance, this.ctx.currentTime);
        lastNode.connect(this.filter);
        lastNode = this.filter;

        // Bitcrusher
        if (this.inst.bitcrush > 0) {
            const crusher = this.ctx.createWaveShaper();
            const bits = 16 - (this.inst.bitcrush * 14);
            const steps = Math.pow(2, bits);
            const curve = new Float32Array(44100);
            for (let i = 0; i < 44100; i++) {
                const x = (i / 44099) * 2 - 1;
                curve[i] = Math.round(x * steps) / steps;
            }
            crusher.curve = curve;
            lastNode.connect(crusher);
            lastNode = crusher;
        }

        // Chorus
        if (this.inst.chorus > 0) {
            const delay = this.ctx.createDelay();
            delay.delayTime.value = 0.02;
            const lfo = this.ctx.createOscillator();
            lfo.frequency.value = 1.5;
            const depth = this.ctx.createGain();
            depth.gain.value = 0.002 * this.inst.chorus;
            lfo.connect(depth);
            depth.connect(delay.delayTime);
            lfo.start();

            const mix = this.ctx.createGain();
            mix.gain.value = this.inst.chorus * 0.5;
            lastNode.connect(delay);
            delay.connect(mix);

            const chorusFinal = this.ctx.createGain();
            lastNode.connect(chorusFinal);
            mix.connect(chorusFinal);
            lastNode = chorusFinal;
        }

        // Delay
        if (this.inst.delay > 0) {
            this.dLine = this.ctx.createDelay(5.0);
            this.dFeedback = this.ctx.createGain();
            this.dLine.delayTime.setValueAtTime(this.inst.delayTime, this.ctx.currentTime);
            this.dFeedback.gain.setValueAtTime(this.inst.delayFeedback, this.ctx.currentTime);

            this.dLine.connect(this.dFeedback);
            this.dFeedback.connect(this.dLine);

            const dMix = this.ctx.createGain();
            dMix.gain.setValueAtTime(this.inst.delay, this.ctx.currentTime);
            lastNode.connect(this.dLine);
            this.dLine.connect(dMix);

            const dFinal = this.ctx.createGain();
            lastNode.connect(dFinal);
            dMix.connect(dFinal);
            lastNode = dFinal;
        }

        // Pan
        this.panner = this.ctx.createStereoPanner();
        this.panner.pan.setValueAtTime(this.inst.pan, this.ctx.currentTime);
        lastNode.connect(this.panner);
        lastNode = this.panner;

        lastNode.connect(this.output);
    }
}

/**
 * Handles the synthesis of a single musical note.
 */
class Voice extends AudioModule {
    constructor(ctx, inst, freq, time, duration, lastFreq = null) {
        super(ctx);
        this.inst = inst;
        this.freq = freq;
        this.time = time;
        this.duration = duration;
        this.lastFreq = lastFreq || freq;
        this.nodes = [];
        this.setup();
    }

    setup() {
        let osc;
        let gain = this.ctx.createGain();
        this.gainNode = gain;

        // --- Generator Section ---
        if (this.inst.type === 'kick') {
            osc = this.ctx.createOscillator();
            osc.frequency.setValueAtTime(150, this.time);
            osc.frequency.exponentialRampToValueAtTime(0.01, this.time + 0.5);
            osc.connect(gain);
        } else if (this.inst.type === 'snare' || this.inst.type === 'hihat') {
            const bSource = this.ctx.createBufferSource();
            const bSize = this.ctx.sampleRate * 0.5;
            const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
            const d = b.getChannelData(0);
            for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
            bSource.buffer = b;
            bSource.connect(gain);
            osc = bSource;
        } else {
            osc = this.ctx.createOscillator();
            osc.type = this.inst.type === 'piano' ? 'triangle' : (this.inst.type === 'synth' ? 'sawtooth' : this.inst.type);
            osc.frequency.setValueAtTime(this.lastFreq, this.time);
            if (this.inst.glide > 0) osc.frequency.exponentialRampToValueAtTime(this.freq, this.time + this.inst.glide);
            else osc.frequency.setValueAtTime(this.freq, this.time);
            osc.connect(gain);
        }

        // --- Envelope Section ---
        const env = new Envelope(this.ctx, gain.gain);
        env.trigger(this.time, this.inst.attack, this.inst.decay, this.inst.sustain, this.inst.release, this.inst.volume, this.duration);

        // --- Modulation Section ---
        if (this.inst.lfoRate > 0) {
            const lfo = this.ctx.createOscillator();
            lfo.type = this.inst.lfoType;
            lfo.frequency.value = this.inst.lfoRate;
            const lGain = this.ctx.createGain();
            lGain.gain.value = this.inst.lfoAmount * 100;
            lfo.connect(lGain);

            if (this.inst.lfoTarget === 'pitch') {
                if (this.oscs) this.oscs.forEach(o => lGain.connect(o.detune));
                else if (osc.detune) lGain.connect(osc.detune);
            }
            lfo.start(this.time);
            lfo.stop(this.time + this.duration + this.inst.release);
        }

        gain.connect(this.output);

        if (this.oscs) {
            this.oscs.forEach(o => {
                o.start(this.time);
                o.stop(this.time + this.duration + this.inst.release);
            });
        } else if (osc && osc.start) {
            osc.start(this.time);
            osc.stop(this.time + this.duration + this.inst.release);
        }
    }

}


/**
 * Advanced Arpeggiator Engine
 */
class Arpeggiator {
    constructor(player, ev) {
        this.player = player;
        this.ev = ev;
        this.inst = ev.inst;
    }

    schedule(time, duration) {
        const bpm = this.player.data.metadata.tempo;
        const spb = 60 / bpm;
        const freq = getFrequency(this.ev.pitch);
        const rateInBeats = DURATION_MAP[this.inst.arpRate] || 0.25;
        const rateInSecs = rateInBeats * spb;
        const steps = Math.floor(duration / rateInSecs);

        for (let i = 0; i < steps; i++) {
            const stepTime = time + i * rateInSecs;
            const stepDur = rateInSecs * 0.8;

            let pitchShift = 0;
            const wrap = this.inst.octaves * 12;
            if (this.inst.arp === 'up') pitchShift = (i * 3) % wrap;
            else if (this.inst.arp === 'down') pitchShift = - ((i * 3) % wrap);
            else if (this.inst.arp === 'random') pitchShift = Math.floor(Math.random() * wrap);

            const arpFreq = freq * Math.pow(2, pitchShift / 12);
            this.player.spawnVoice(this.ev, arpFreq, stepTime, stepDur);
        }
    }
}

// --- Engine Classes & Diagnostics ---

class AXMLError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'AXMLError';
        this.line = options.line || null;
        this.column = options.column || null;
        this.snippet = options.snippet || '';
        this.hint = options.hint || '';
        this.rule = options.rule || 'SYNTAX';
    }
}
if (typeof window !== 'undefined') window.AXMLError = AXMLError;

class AXMLParser {
    constructor() {
        this.domParser = new DOMParser();
    }

    parse(xmlString) {
        if (!xmlString || !xmlString.trim()) {
            throw new AXMLError("Source code is empty", {
                hint: "Write or load an AXML project before compiling."
            });
        }

        const doc = this.domParser.parseFromString(xmlString, "text/xml");
        const parserErr = doc.querySelector("parsererror");
        if (parserErr) {
            throw this._extractParserError(parserErr, xmlString);
        }

        const axml = doc.querySelector("axml");
        if (!axml) {
            throw new AXMLError("Root <axml> tag not found", {
                hint: "Wrap your audio project in a root <axml version=\"4.0\">...</axml> container.",
                rule: "SCHEMA"
            });
        }

        const metadata = this._parseMetadata(doc);
        const instruments = this._parseInstruments(doc);
        const patterns = this._parsePatterns(doc);
        const tracks = this._parseTracks(doc, instruments, patterns);

        return {
            metadata,
            instruments,
            patterns,
            tracks
        };
    }

    _extractParserError(parserErrNode, xmlString) {
        const text = parserErrNode.textContent || "";
        let line = null;
        let column = null;
        let detail = "XML syntax error";

        // Chromium / Blink match: error on line X at column Y: <msg>
        const blinkMatch = text.match(/line\s+(\d+)\s+at\s+column\s+(\d+):\s*(.*)/i);
        if (blinkMatch) {
            line = parseInt(blinkMatch[1]);
            column = parseInt(blinkMatch[2]);
            detail = blinkMatch[3].trim().split('\n')[0];
        } else {
            // Firefox / Gecko match: Line Number X, Column Y:
            const geckoMatch = text.match(/line\s*(?:number)?\s*[:\s](\d+)[,\s]+col(?:umn)?\s*[:\s](\d+)/i);
            if (geckoMatch) {
                line = parseInt(geckoMatch[1]);
                column = parseInt(geckoMatch[2]);
            } else {
                const simple = text.match(/line\s+(\d+)/i);
                if (simple) line = parseInt(simple[1]);
            }
        }

        let snippet = "";
        if (line !== null && xmlString) {
            const lines = xmlString.split(/\r?\n/);
            const startLine = Math.max(1, line - 1);
            const endLine = Math.min(lines.length, line + 1);
            for (let i = startLine; i <= endLine; i++) {
                const lineContent = lines[i - 1] || "";
                const isTarget = i === line;
                snippet += `${isTarget ? '>' : ' '} ${String(i).padStart(3, ' ')} | ${lineContent}\n`;
                if (isTarget && column !== null) {
                    const pad = Math.max(0, column - 1);
                    snippet += `       | ${' '.repeat(pad)}^\n`;
                }
            }
        }

        let hint = "Verify that all XML tags are properly closed and attribute values are quoted.";
        if (detail.includes("mismatch") || detail.includes("Opening and ending")) {
            hint = "Check for unclosed or mismatched opening and closing tags.";
        } else if (detail.includes("unquoted")) {
            hint = "Ensure all attribute values are enclosed in double quotes.";
        }

        return new AXMLError(`AXML Syntax Error: ${detail}`, {
            line,
            column,
            snippet,
            hint,
            rule: "SYNTAX"
        });
    }

    _parseMetadata(doc) {
        const m = doc.querySelector("metadata");
        const tempoVal = parseFloat(m?.querySelector("tempo")?.textContent);
        return {
            title: m?.querySelector("title")?.textContent || "Untitled Project",
            artist: m?.querySelector("artist")?.textContent || "Unknown Artist",
            tempo: (!isNaN(tempoVal) && tempoVal > 0) ? tempoVal : 120,
            key: m?.querySelector("key")?.textContent || "C",
            scale: m?.querySelector("scale")?.textContent || "major",
            signature: m?.querySelector("time-signature")?.textContent || "4/4"
        };
    }

    _parseInstruments(doc) {
        const insts = {};
        doc.querySelectorAll("instruments instrument").forEach(el => {
            const id = el.getAttribute("id");
            if (!id) return;
            insts[id] = {
                id,
                type: el.getAttribute("type") || "sine",
                volume: parseFloat(el.getAttribute("volume") || "0.7"),
                attack: parseFloat(el.getAttribute("attack") || "0.01"),
                decay: parseFloat(el.getAttribute("decay") || "0.1"),
                sustain: parseFloat(el.getAttribute("sustain") || "0.5"),
                release: parseFloat(el.getAttribute("release") || "0.3"),
                cutoff: parseFloat(el.getAttribute("cutoff") || "20000"),
                resonance: parseFloat(el.getAttribute("resonance") || "1"),
                reverb: parseFloat(el.getAttribute("reverb") || "0"),
                pan: parseFloat(el.getAttribute("pan") || "0"),
                distortion: parseFloat(el.getAttribute("distortion") || "0"),
                delay: parseFloat(el.getAttribute("delay") || "0"),
                delayTime: parseFloat(el.getAttribute("delayTime") || "0.3"),
                delayFeedback: parseFloat(el.getAttribute("delayFeedback") || "0.4"),
                lfoRate: parseFloat(el.getAttribute("lfoRate") || "0"),
                lfoAmount: parseFloat(el.getAttribute("lfoAmount") || "0"),
                lfoType: el.getAttribute("lfoType") || "sine",
                lfoTarget: el.getAttribute("lfoTarget") || "cutoff",
                chorus: parseFloat(el.getAttribute("chorus") || "0"),
                bitcrush: parseFloat(el.getAttribute("bitcrush") || "0"),
                vowel: el.getAttribute("vowel") || "a",
                breath: parseFloat(el.getAttribute("breath") || "0"),
                glide: parseFloat(el.getAttribute("glide") || "0"),
                arp: el.getAttribute("arp") || "none",
                arpRate: el.getAttribute("arpRate") || "1/16",
                octaves: parseInt(el.getAttribute("octaves") || "1"),
                src: el.getAttribute("src") || null
            };
        });
        return insts;
    }

    _parsePatterns(doc) {
        const pats = {};
        doc.querySelectorAll("patterns pattern").forEach(el => {
            const id = el.getAttribute("id");
            if (id) pats[id] = this._parseEvents(el);
        });
        return pats;
    }

    _parseTracks(doc, instruments = {}, patterns = {}) {
        return Array.from(doc.querySelectorAll("tracks track")).map((el, index) => {
            const instrumentId = el.getAttribute("instrument") || el.getAttribute("instrumentId");
            const name = el.getAttribute("name") || `Track ${index + 1}`;
            const volumeAttr = el.getAttribute("volume");
            const panAttr = el.getAttribute("pan");

            // Semantic check for missing instruments
            if (instrumentId && !instruments[instrumentId]) {
                if (typeof log === 'function') {
                    log(`Warning: Track "${name}" references undefined instrument "${instrumentId}"`, 'warn');
                }
            }

            return {
                instrumentId,
                name,
                volume: volumeAttr !== null ? parseFloat(volumeAttr) : 0.8,
                pan: panAttr !== null ? parseFloat(panAttr) : 0,
                mute: el.getAttribute("mute") === "true",
                solo: el.getAttribute("solo") === "true",
                events: this._parseEvents(el)
            };
        });
    }

    _parseEvents(container) {
        const events = [];
        let cursor = 0;
        const projectKey = container.closest('axml')?.querySelector('metadata key')?.textContent || "C";
        const projectScale = container.closest('axml')?.querySelector('metadata scale')?.textContent || "major";

        Array.from(container.children).forEach(el => {
            const start = el.getAttribute("start") !== null ? parseFloat(el.getAttribute("start")) : cursor;
            const durValue = el.getAttribute("duration");
            const duration = DURATION_MAP[durValue] || parseFloat(durValue) || 1;
            const velocity = parseFloat(el.getAttribute("velocity") || "0.7");

            if (el.tagName === "note") {
                const pitch = el.getAttribute("pitch");
                const chordType = el.getAttribute("chord");
                const snapScale = el.getAttribute("scale") || null;

                if (chordType) {
                    const chordNotes = generateChord(pitch, chordType);
                    chordNotes.forEach(p => {
                        events.push({
                            type: 'note',
                            pitch: p,
                            start,
                            duration,
                            velocity,
                            text: el.getAttribute("text")
                        });
                    });
                } else {
                    let finalPitch = pitch;
                    if (snapScale) {
                        finalPitch = snapToScale(pitch, projectKey, snapScale);
                    }
                    events.push({
                        type: 'note',
                        pitch: finalPitch,
                        start,
                        duration,
                        velocity,
                        text: el.getAttribute("text")
                    });
                }
                cursor = start + duration;
            } else if (el.tagName === "chord") {
                const notes = Array.from(el.querySelectorAll("note")).map(n => ({
                    pitch: n.getAttribute("pitch"),
                    duration: DURATION_MAP[n.getAttribute("duration")] || parseFloat(n.getAttribute("duration")) || duration,
                    velocity: parseFloat(n.getAttribute("velocity") || "0.7")
                }));
                events.push({ type: 'chord', notes, start, duration });
                cursor = start + duration;
            } else if (el.tagName === "play") {
                const pid = el.getAttribute("pattern") || el.getAttribute("patternId");
                const repeat = parseInt(el.getAttribute("repeat") || el.getAttribute("times") || "1");
                const step = parseFloat(el.getAttribute("step") || "4");

                for (let r = 0; r < repeat; r++) {
                    const playStart = start + (r * step);
                    events.push({ type: 'play', patternId: pid, start: playStart });
                }
                cursor = start + (repeat * step);
            }
        });
        return events;
    }
}

class AXMLPlayer {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.limiter = null;
        this.analyser = null;
        this.reverbBus = null;
        this.delayBus = null;
        this.phaserBus = null;

        this.data = null;
        this.samples = {};
        this.flatEvents = [];
        this.lastNoteFreq = {};
        this.isPlaying = false;
        this.startTime = 0;
        this.timer = null;
        this.nextEventIndex = 0;

        this.onNote = null;
        this.onEnded = null;
        this.trackGains = {};
    }

    async init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // --- High Fidelity Master Chain ---
        this.master = this.ctx.createGain();
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-1.5, 0);
        this.limiter.knee.setValueAtTime(0, 0);
        this.limiter.ratio.setValueAtTime(20, 0);
        this.limiter.attack.setValueAtTime(0.003, 0);
        this.limiter.release.setValueAtTime(0.25, 0);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;

        this.master.connect(this.limiter);
        this.limiter.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // --- Global FX Buses ---
        await this.setupMasterFX();
    }

    async setupMasterFX(context = this.ctx) {
        // Reverb
        this.reverbBus = context.createConvolver();
        const irLen = context.sampleRate * 2.5;
        const ir = context.createBuffer(2, irLen, context.sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = ir.getChannelData(c);
            for (let i = 0; i < irLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
        }
        this.reverbBus.buffer = ir;
        this.reverbBus.connect(this.master || context.destination);

        // Delay
        this.delayBus = context.createDelay(5.0);
        this.delayFeedback = context.createGain();
        this.delayFeedback.gain.value = 0.45;
        this.delayBus.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayBus);
        this.delayBus.connect(this.master || context.destination);

        // Phaser
        this.phaserBus = context.createGain();
        const pLFO = context.createOscillator();
        pLFO.frequency.value = 0.15;
        const pFilter = context.createBiquadFilter();
        pFilter.type = 'allpass';
        pFilter.frequency.value = 1200;
        const pDepth = context.createGain();
        pDepth.gain.value = 600;
        pLFO.connect(pDepth);
        pDepth.connect(pFilter.frequency);
        pLFO.start();
        this.phaserBus.connect(pFilter);
        pFilter.connect(this.master || context.destination);
    }

    load(data) {
        this.data = data;
        this.flatEvents = [];
        data.tracks.forEach(track => {
            const inst = data.instruments[track.instrumentId];
            if (!inst) return;

            // Initialize track gain and pan if missing
            const trackVol = (track.volume !== undefined && !isNaN(track.volume)) ? track.volume : 0.7;
            if (!this.trackGains[track.name] && this.ctx) {
                const g = this.ctx.createGain();
                g.gain.value = trackVol;

                if (this.ctx.createStereoPanner && track.pan !== undefined) {
                    const p = this.ctx.createStereoPanner();
                    p.pan.value = track.pan || 0;
                    g.connect(p);
                    p.connect(this.master);
                } else {
                    g.connect(this.master);
                }
                this.trackGains[track.name] = g;
            } else if (this.trackGains[track.name]) {
                this.trackGains[track.name].gain.value = trackVol;
            }

            const process = (evs, offset = 0) => {
                evs.forEach(e => {
                    if (e.type === 'note') {
                        this.flatEvents.push({ ...e, start: e.start + offset, inst, trackName: track.name });
                    } else if (e.type === 'chord') {
                        e.notes.forEach(n => {
                            this.flatEvents.push({
                                type: 'note',
                                pitch: n.pitch,
                                start: e.start + offset,
                                duration: n.duration,
                                velocity: n.velocity,
                                inst,
                                trackName: track.name
                            });
                        });
                    } else if (e.type === 'play') {
                        const p = data.patterns[e.patternId];
                        if (p) process(p, e.start + offset);
                    }
                });
            };
            process(track.events);
        });
        this.flatEvents.sort((a, b) => a.start - b.start);
    }

    async loadSamples() {
        const promises = [];
        Object.values(this.data.instruments).forEach(inst => {
            if (inst.type === 'sample' && inst.src && !this.samples[inst.src]) {
                const p = fetch(inst.src).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b)).then(d => { this.samples[inst.src] = d; });
                promises.push(p);
            }
        });
        await Promise.all(promises);
    }

    /**
     * Spawns a new voice/note instance with its own FX chain.
     */
    spawnVoice(ev, freq, time, duration, context = this.ctx, destination = this.master) {
        const lastFreq = this.lastNoteFreq[ev.trackName] || freq;
        this.lastNoteFreq[ev.trackName] = freq;

        // 1. Synthesis Voice
        const voice = new Voice(context, ev.inst, freq, time, duration, lastFreq);

        // 2. Instrument Effects Rack
        const fx = new EffectsChain(context, ev.inst);

        // 3. Routing
        voice.connect(fx);

        // Track Gain or Master
        const trackGain = this.trackGains[ev.trackName];
        if (trackGain && context === this.ctx) {
            fx.connect(trackGain);
        } else {
            fx.connect(destination);
        }

        // Global FX Sends (Reverb/Delay)
        if (ev.inst.reverb > 0 && this.reverbBus) {
            const rG = context.createGain(); rG.gain.value = ev.inst.reverb;
            fx.output.connect(rG); rG.connect(this.reverbBus);
        }
        if (ev.inst.delay > 0 && this.delayBus) {
            const dG = context.createGain(); dG.gain.value = ev.inst.delay;
            fx.output.connect(dG); dG.connect(this.delayBus);
        }
    }

    getDuration() {
        if (!this.flatEvents.length) return 0;
        const bpm = this.data.metadata.tempo;
        const last = this.flatEvents[this.flatEvents.length - 1];
        return (last.start + last.duration) * (60 / bpm);
    }

    async play() {
        await this.init();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        this.isPlaying = true;
        this.startTime = this.ctx.currentTime + 0.1;
        this.nextEventIndex = 0;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timer);
        if (this.ctx) this.ctx.suspend();
        if (this.onEnded) this.onEnded();
    }

    scheduler() {
        if (!this.isPlaying) return;
        const bpm = this.data.metadata.tempo;
        const spb = 60 / bpm;
        const ahead = 0.2;

        while (this.nextEventIndex < this.flatEvents.length) {
            const ev = this.flatEvents[this.nextEventIndex];
            const time = this.startTime + (ev.start * spb);
            if (time > this.ctx.currentTime + ahead) break;

            this.scheduleNote(ev, time, ev.duration * spb);
            this.nextEventIndex++;
        }

        if (this.nextEventIndex >= this.flatEvents.length) {
            if (this.ctx.currentTime > this.startTime + this.getDuration() + 1) {
                this.stop(); return;
            }
        }
        this.timer = setTimeout(() => this.scheduler(), 25);
    }

    scheduleNote(ev, time, duration) {
        if (ev.inst.arp !== 'none') {
            const arp = new Arpeggiator(this, ev);
            arp.schedule(time, duration);
        } else {
            const freq = getFrequency(ev.pitch);
            if (freq > 0) this.spawnVoice(ev, freq, time, duration);
        }
    }

    async renderToBuffer() {
        if (!this.flatEvents.length) return null;
        const bpm = this.data.metadata.tempo;
        const spb = 60 / bpm;
        const duration = this.getDuration() + 3;
        const sampleRate = 44100;
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, Math.ceil(sampleRate * duration), sampleRate);

        const master = offlineCtx.createGain();
        master.connect(offlineCtx.destination);

        const oldCtx = this.ctx;
        this.ctx = offlineCtx;
        const oldMaster = this.master;
        this.master = master;

        await this.setupMasterFX(offlineCtx);

        this.flatEvents.forEach(ev => {
            const time = ev.start * spb;
            const noteDur = ev.duration * spb;
            if (ev.inst.arp !== 'none') {
                new Arpeggiator(this, ev).schedule(time, noteDur);
            } else {
                const freq = getFrequency(ev.pitch);
                if (freq > 0) this.spawnVoice(ev, freq, time, noteDur, offlineCtx, master);
            }
        });

        const buffer = await offlineCtx.startRendering();
        this.ctx = oldCtx;
        this.master = oldMaster;
        return buffer;
    }

    async downloadWAV() {
        const buffer = await this.renderToBuffer();
        if (!buffer) return;
        const blob = bufferToWave(buffer, buffer.length);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(this.data.metadata.title || 'song').toLowerCase().replace(/\s+/g, '-')}.wav`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

/**
 * MIDI File Exporter for AXML Projects
 */
class MidiExporter {
    constructor(data) {
        this.data = data;
    }

    export() {
        // Simple MIDI File Header
        const header = [
            0x4D, 0x54, 0x68, 0x64, // MThd
            0x00, 0x00, 0x00, 0x06, // Length 6
            0x00, 0x01,             // Format 1 (Tracks)
            0x00, 0x01,             // 1 Track for now
            0x01, 0xE0              // 480 ticks per quarter
        ];

        let trackEvents = [];
        const bpm = this.data.metadata.tempo;
        const ticksPerBeat = 480;

        // Convert flat events to MIDI
        const flat = [];
        this.data.tracks.forEach((track, tid) => {
            const process = (evs, offset = 0) => {
                evs.forEach(e => {
                    if (e.type === 'note') {
                        const startTick = (e.start + offset) * ticksPerBeat;
                        const endTick = (e.start + offset + e.duration) * ticksPerBeat;
                        const midi = getNoteFromName(e.pitch);
                        flat.push({ tick: startTick, type: 0x90, note: midi, vel: 100, ch: tid });
                        flat.push({ tick: endTick, type: 0x80, note: midi, vel: 0, ch: tid });
                    } else if (e.type === 'play') {
                        const p = this.data.patterns[e.patternId];
                        if (p) process(p, e.start + offset);
                    }
                });
            };
            process(track.events);
        });

        flat.sort((a, b) => a.tick - b.tick);

        let lastTick = 0;
        flat.forEach(e => {
            const delta = e.tick - lastTick;
            this.writeVarInt(trackEvents, delta);
            trackEvents.push(e.type | (e.ch & 0x0F));
            trackEvents.push(e.note);
            trackEvents.push(e.vel);
            lastTick = e.tick;
        });

        // End of track
        trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

        const trackHeader = [
            0x4D, 0x54, 0x72, 0x6B, // MTrk
            (trackEvents.length >> 24) & 0xFF,
            (trackEvents.length >> 16) & 0xFF,
            (trackEvents.length >> 8) & 0xFF,
            trackEvents.length & 0xFF
        ];

        const bytes = new Uint8Array([...header, ...trackHeader, ...trackEvents]);
        const blob = new Blob([bytes], { type: 'audio/midi' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(this.data.metadata.title || 'song').toLowerCase().replace(/\s+/g, '-')}.mid`;
        a.click();
    }

    writeVarInt(arr, val) {
        let buffer = val & 0x7F;
        while ((val >>= 7) > 0) {
            buffer <<= 8;
            buffer |= 0x80 | (val & 0x7F);
        }
        while (true) {
            arr.push(buffer & 0xFF);
            if (buffer & 0x80) buffer >>= 8;
            else break;
        }
    }
}

/**
 * Manages AXML Project state, persistence and versioning.
 */
class ProjectManager {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
    }

    save(xmlCode) {
        localStorage.setItem('axml_last_project', xmlCode);

        // Add to history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(xmlCode);
        if (this.history.length > this.maxHistory) this.history.shift();
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return JSON.parse(this.history[this.historyIndex]);
        }
        return null;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            return JSON.parse(this.history[this.historyIndex]);
        }
        return null;
    }

    exportToXML(data) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<axml>\n';
        xml += `  <metadata title="${data.metadata.title}" tempo="${data.metadata.tempo}" key="${data.metadata.key}" scale="${data.metadata.scale}"/>\n`;

        xml += '  <instruments>\n';
        Object.values(data.instruments).forEach(inst => {
            xml += `    <instrument id="${inst.id}" type="${inst.type}" volume="${inst.volume}" attack="${inst.attack}" decay="${inst.decay}" sustain="${inst.sustain}" release="${inst.release}" cutoff="${inst.cutoff}" resonance="${inst.resonance}" reverb="${inst.reverb}" delay="${inst.delay}" lfoRate="${inst.lfoRate}" lfoAmount="${inst.lfoAmount}" lfoTarget="${inst.lfoTarget}" arp="${inst.arp}" arpRate="${inst.arpRate}" octaves="${inst.octaves}"${inst.src ? ` src="${inst.src}"` : ''}/>\n`;
        });
        xml += '  </instruments>\n';

        xml += '  <patterns>\n';
        Object.entries(data.patterns).forEach(([id, evs]) => {
            xml += `    <pattern id="${id}">\n`;
            evs.forEach(e => {
                xml += `      <note pitch="${e.pitch}" start="${e.start}" duration="${e.duration}" velocity="${e.velocity || 0.8}"/>\n`;
            });
            xml += '    </pattern>\n';
        });
        xml += '  </patterns>\n';

        xml += '  <tracks>\n';
        data.tracks.forEach(t => {
            xml += `    <track name="${t.name}" instrumentId="${t.instrumentId}">\n`;
            t.events.forEach(e => {
                if (e.type === 'play') xml += `      <play patternId="${e.patternId}" start="${e.start}"/>\n`;
                else xml += `      <note pitch="${e.pitch}" start="${e.start}" duration="${e.duration}"/>\n`;
            });
            xml += '    </track>\n';
        });
        xml += '  </tracks>\n</axml>';
        return xml;
    }
}

// Fallback to prevent crashes if notify is called
window.notify = {
    show: (msg, type) => {
        if (typeof log === 'function') log(msg, type === 'error' ? 'error' : 'mixer');
        else console.log(`[${type}] ${msg}`);
    }
};
