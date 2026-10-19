# AXML AI Composer Specification & Prompting Guide

Panduan ini adalah standar resmi dan instruksi sistem (*system prompt*) agar model kecerdasan buatan (Large Language Models seperti ChatGPT, Claude, Gemini, DeepSeek, dll.) dapat menghasilkan komposisi musik **AXML v4.0** yang 100% valid, terstruktur rapi, tidak menghasilkan error parser, dan memiliki musikalitas yang harmonis.

---

## 1. System Prompt Siap Pakai untuk AI

Salin teks berikut dan berikan kepada AI sebagai instruksi utama:

```text
Kamu adalah AXML Maestro, komposer musik dan desainer suara sintetis tingkat tinggi yang menulis musik dalam format Audio XML (AXML v4.0).
Tugasmu adalah membuat komposisi musik lengkap dalam format AXML standar.

ATURAN STRUKTUR & SINTAKS WAJIB:
1. Root wajib: <axml version="4.0">...</axml>
2. Struktur hierarki:
   - <metadata>: <title>, <artist>, <tempo>, <key>, <scale>, <time-signature>
   - <instruments>: Daftar <instrument id="..." type="..."> dengan ADSR dan efek DSP
   - <patterns>: (Opsional) Pola drum/riff yang dapat diulang dengan <pattern id="...">
   - <tracks>: Kumpulan <track instrument="..." name="..."> berisi <note>, <chord>, atau <play>
3. Notasi Nada:
   - Format: Huruf besar + optional '#' + nomor oktaf (contoh: C4, D#4, A1, F#5).
   - Istirahat (silence): pitch="rest"
4. Durasi & Timing (Beat-based, 4/4 Time Signature):
   - 1 Bar = 4 Beat. 4 Bar = 16 Beat. 8 Bar = 32 Beat. 16 Bar = 64 Beat.
   - Durasi: "w" (4 beat), "h" (2 beat), "q" (1 beat), "e" (0.5 beat), "s" (0.25 beat) atau angka desimal.
   - Atribut "start" menentukan ketukan awal. Jika tidak disertakan, nada dimulai tepat setelah nada sebelumnya berakhir.
5. Rentang Oktaf Ideal:
   - Sub/Bass: Oktaf 1 sampai 2 (C1 - B2)
   - Chords/Pad: Oktaf 3 sampai 4 (C3 - B4)
   - Lead/Melodi: Oktaf 4 sampai 5 (C4 - B5)
   - Pluck/Arp: Oktaf 4 sampai 6 (C4 - B6)
6. Instrumen Perkusi:
   - type="kick" (start setiap beat 0, 1, 2, 3 untuk 4-on-the-floor, atau variasi sinkopasi)
   - type="snare" (start pada beat 1 & 3 untuk tempo cepat, atau beat 2 & 4)
   - type="hihat" (off-beat 0.5, 1.5, 2.5, 3.5 atau 16th-note 0.25)
7. Hasilkan HANYA kode XML valid. Jangan masukkan komentar HTML di dalam nilai tag, dan pastikan seluruh tag ditutup dengan benar.
```

---

## 2. Rumus & Kalkulasi Matematika Ketukan (Beat Math)

Untuk menghasilkan aransemen yang rapi dan selaras antartrack, AI harus memahami pembagian birama (measure) dalam metrum 4/4:

| Bagian Lagu | Jumlah Bar (Birama) | Rentang Beat (`start`) | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Intro** | 4 Bar | Beat `0` s/d `16` | Pad lembut, arpeggio tipis, belum ada kick penuh. |
| **Verse / Build** | 8 Bar | Beat `16` s/d `48` | Masuk bassline, hi-hat mulai aktif, melodi pembuka. |
| **Drop / Chorus** | 8 s/d 16 Bar | Beat `48` s/d `80` (atau `112`) | Energi penuh: Kick 4-on-the-floor, Lead melody, Full Bass, Chords. |
| **Bridge / Breakdown**| 4 Bar | Beat `80` s/d `96` | Drum berhenti sejenak, filter sweep, vokal/lead solo. |
| **Outro** | 4 Bar | Beat `96` s/d `112` | Pengurangan instrumen secara bertahap menuju silence. |

### Aturan Akumulasi Ketukan:
Jika sebuah nada memiliki `start="0"` dan `duration="q"` (1 beat):
* Nada berikutnya pada instrumen monophonic sebaiknya mulai di `start="1"`.
* Nada polyphonic (misal melodi bersamaan dengan bass) ditulis pada `<track>` yang berbeda dengan `start` yang sama.

---

## 3. Resep Suara Standar (Instrument Sound Design Matrix)

AI dapat menggunakan parameter berikut untuk membentuk instrumen khas berbagai genre:

### A. Cyberpunk / Synthwave Bass
```xml
<instrument id="synth_bass" 
            type="sawtooth" 
            volume="0.85" 
            attack="0.01" 
            decay="0.12" 
            sustain="0.4" 
            release="0.15" 
            cutoff="900" 
            resonance="6.5" 
            distortion="0.4" />
```

### B. Lush Ambient / Cinematic Pad
```xml
<instrument id="warm_pad" 
            type="sine" 
            volume="0.6" 
            attack="1.2" 
            decay="0.8" 
            sustain="0.85" 
            release="2.0" 
            cutoff="1400" 
            resonance="2.0" 
            reverb="0.75" 
            chorus="0.5" />
```

### C. EDM / Rave Saw Lead
```xml
<instrument id="rave_lead" 
            type="sawtooth" 
            volume="0.75" 
            attack="0.02" 
            decay="0.15" 
            sustain="0.65" 
            release="0.3" 
            cutoff="3800" 
            resonance="4.0" 
            delay="0.35" 
            reverb="0.4" />
```

### D. 808 Sub Kick & Percussion
```xml
<instrument id="kick" type="kick" volume="1.0" attack="0.01" release="0.1" distortion="0.2"/>
<instrument id="snare" type="snare" volume="0.85" attack="0.01" release="0.12" cutoff="2200"/>
<instrument id="hihat" type="hihat" volume="0.4" attack="0.01" release="0.05" cutoff="7500" resonance="4"/>
```

---

## 4. Pola Progresi Akor yang Disarankan untuk AI

Saat AI membuat harmoni akor (`<chord>`), gunakan tangga nada (Scale) yang konsisten:

### 1. Pop / EDM Emosional (A Minor: Am - F - C - G)
* Bar 1 (`start="0"`): `A3, C4, E4` (Am)
* Bar 2 (`start="4"`): `F3, A3, C4` (F)
* Bar 3 (`start="8"`): `C3, E3, G3` (C)
* Bar 4 (`start="12"`): `G3, B3, D4` (G)

### 2. Synthwave / Cyberpunk Dark (D Minor: Dm - Bb - C - Dm)
* Bar 1 (`start="0"`): `D3, F3, A3` (Dm)
* Bar 2 (`start="4"`): `A#2, D3, F3` (Bb)
* Bar 3 (`start="8"`): `C3, E3, G3` (C)
* Bar 4 (`start="12"`): `D3, F3, A3` (Dm)

### 3. Lo-Fi Chill (C Major 7th: Cmaj7 - Am7 - Dm7 - G7)
* Bar 1 (`start="0"`): `C3, E3, G3, B3` (Cmaj7)
* Bar 2 (`start="4"`): `A2, C3, E3, G3` (Am7)
* Bar 3 (`start="8"`): `D3, F3, A3, C4` (Dm7)
* Bar 4 (`start="12"`): `G2, B2, D3, F3` (G7)

---

## 5. Contoh Lagu Lengkap yang Dihasilkan AI (Gold Standard)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<axml version="4.0">
  <metadata>
    <title>Neon Horizon</title>
    <artist>AI Maestro</artist>
    <tempo>120</tempo>
    <key>Am</key>
    <scale>minor</scale>
    <time-signature>4/4</time-signature>
  </metadata>

  <instruments>
    <instrument id="kick" type="kick" volume="0.9" attack="0.01" release="0.08"/>
    <instrument id="snare" type="snare" volume="0.75" attack="0.01" release="0.1" cutoff="2500"/>
    <instrument id="hihat" type="hihat" volume="0.35" attack="0.01" release="0.04" cutoff="8000"/>
    <instrument id="bass" type="sawtooth" volume="0.8" attack="0.01" decay="0.12" sustain="0.5" release="0.2" cutoff="850" resonance="5"/>
    <instrument id="lead" type="square" volume="0.6" attack="0.03" decay="0.18" sustain="0.6" release="0.35" cutoff="2800" resonance="3" delay="0.3" reverb="0.4"/>
    <instrument id="pad" type="sine" volume="0.5" attack="0.8" decay="0.5" sustain="0.8" release="1.5" cutoff="1600" chorus="0.4" reverb="0.6"/>
  </instruments>

  <patterns>
    <pattern id="beat_4bar">
      <!-- Bar 1 -->
      <note pitch="C1" start="0" duration="q"/>
      <note pitch="rest" start="1" duration="q"/>
      <note pitch="C1" start="2" duration="q"/>
      <note pitch="rest" start="3" duration="q"/>
    </pattern>
  </patterns>

  <tracks>
    <!-- Drum Rhythm -->
    <track instrument="kick" name="Kick Drum">
      <play pattern="beat_4bar" start="0" repeat="4" step="4"/>
    </track>

    <track instrument="snare" name="Snare Backbeat">
      <note pitch="D2" start="1" duration="q"/>
      <note pitch="D2" start="3" duration="q"/>
      <note pitch="D2" start="5" duration="q"/>
      <note pitch="D2" start="7" duration="q"/>
      <note pitch="D2" start="9" duration="q"/>
      <note pitch="D2" start="11" duration="q"/>
      <note pitch="D2" start="13" duration="q"/>
      <note pitch="D2" start="15" duration="q"/>
    </track>

    <!-- Harmony Pad Chords -->
    <track instrument="pad" name="Warm Harmony">
      <chord start="0" duration="w">
        <note pitch="A3"/><note pitch="C4"/><note pitch="E4"/>
      </chord>
      <chord start="4" duration="w">
        <note pitch="F3"/><note pitch="A3"/><note pitch="C4"/>
      </chord>
      <chord start="8" duration="w">
        <note pitch="C3"/><note pitch="E3"/><note pitch="G3"/>
      </chord>
      <chord start="12" duration="w">
        <note pitch="G3"/><note pitch="B3"/><note pitch="D4"/>
      </chord>
    </track>

    <!-- Bass Line -->
    <track instrument="bass" name="Driving Bass">
      <!-- Bar 1 (Am) -->
      <note pitch="A1" start="0" duration="e"/>
      <note pitch="A1" start="0.5" duration="e"/>
      <note pitch="A1" start="1.5" duration="e"/>
      <note pitch="C2" start="2" duration="q"/>
      <note pitch="E2" start="3" duration="q"/>

      <!-- Bar 2 (F) -->
      <note pitch="F1" start="4" duration="e"/>
      <note pitch="F1" start="4.5" duration="e"/>
      <note pitch="F1" start="5.5" duration="e"/>
      <note pitch="A1" start="6" duration="q"/>
      <note pitch="C2" start="7" duration="q"/>

      <!-- Bar 3 (C) -->
      <note pitch="C2" start="8" duration="e"/>
      <note pitch="C2" start="8.5" duration="e"/>
      <note pitch="C2" start="9.5" duration="e"/>
      <note pitch="E2" start="10" duration="q"/>
      <note pitch="G2" start="11" duration="q"/>

      <!-- Bar 4 (G) -->
      <note pitch="G1" start="12" duration="e"/>
      <note pitch="G1" start="12.5" duration="e"/>
      <note pitch="B1" start="13.5" duration="e"/>
      <note pitch="D2" start="14" duration="q"/>
      <note pitch="E2" start="15" duration="q"/>
    </track>

    <!-- Catchy Lead Melody -->
    <track instrument="lead" name="Synth Lead">
      <note pitch="E4" start="0" duration="q"/>
      <note pitch="A4" start="1" duration="h"/>
      <note pitch="G4" start="3" duration="q"/>
      <note pitch="F4" start="4" duration="q"/>
      <note pitch="E4" start="5" duration="q"/>
      <note pitch="D4" start="6" duration="h"/>
      <note pitch="E4" start="8" duration="q"/>
      <note pitch="G4" start="9" duration="h"/>
      <note pitch="A4" start="11" duration="q"/>
      <note pitch="B4" start="12" duration="h"/>
      <note pitch="C5" start="14" duration="h"/>
    </track>
  </tracks>
</axml>
```

---

## 6. Checklist Validasi Output AI Sebelum Menyerahkan Kode

Sebelum AI mengembalikan respon kode, lakukan audit internal cepat:
1. [ ] Apakah root tag `<axml version="4.0">` dan `</axml>` sudah benar?
2. [ ] Apakah setiap `<track>` merujuk ke `instrument="..."` yang sudah dideklarasikan di `<instruments>`?
3. [ ] Apakah seluruh atribut `start` bernilai angka valid (positif, tidak bertumpuk jika monophonic)?
4. [ ] Apakah notasi nada sesuai standar (`A0` sampai `C8` atau `rest`)?
5. [ ] Apakah tidak ada tag XML yang tidak tertutup?
