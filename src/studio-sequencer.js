/**
 * Studio Sequencer - Arpeggio & Sequence Generator
 */
class AXMLSequencer {
    constructor() {
        this.active = false;
        this.steps = 16;
        this.trackName = "Lead";
        this.instrumentId = "lead";
        this.notes = new Array(16).fill(null);
    }

    toggleStep(i, pitch = "C4") {
        if (this.notes[i] === pitch) this.notes[i] = null;
        else this.notes[i] = pitch;
    }

    generateAXML() {
        let xml = `    <track instrument="${this.instrumentId}" name="${this.trackName}">\n`;
        this.notes.forEach((note, i) => {
            if (note) {
                xml += `      <note pitch="${note}" start="${i * 0.25}" duration="0.25"/>\n`;
            }
        });
        xml += `    </track>`;
        return xml;
    }
}

function openSequencer() {
    const editor = document.getElementById('code-editor');
    if (!editor) return;

    const seq = new AXMLSequencer();
    seq.notes[0] = "A4";
    seq.notes[2] = "C5";
    seq.notes[4] = "E5";
    seq.notes[6] = "G5";
    seq.notes[8] = "A5";
    seq.notes[10] = "C6";
    seq.notes[12] = "E5";
    seq.notes[14] = "G4";

    const xml = seq.generateAXML();
    const pos = editor.selectionStart || 0;
    editor.value = editor.value.substring(0, pos) + "\n" + xml + "\n" + editor.value.substring(pos);
    editor.selectionStart = editor.selectionEnd = pos + xml.length + 2;
    editor.focus();

    if (typeof log === 'function') {
        log("Arpeggio sequence generated and inserted into editor", "audio");
    }
}
