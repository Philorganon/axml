# Panduan Lengkap: Cara Membuat Musik Sendiri dengan AXML v4.0

Selamat datang di **AXML (Audio XML)**! Panduan ini dirancang untuk musisi, produser, programmer, dan kreator yang ingin belajar cara menciptakan musik elektronik profesional dari nol menggunakan kode deklaratif AXML.

---

## 1. Konsep Dasar: Bagaimana AXML Bekerja?

Membuat musik di AXML sama sederhananya dengan membuat halaman web menggunakan HTML:
* **HTML** menyusun teks, tombol, dan gambar.
* **AXML** menyusun instrumen synthesizer, ketukan drum, akor harmoni, dan melodi lagu.

Setiap file AXML adalah dokumen teks XML biasa berekstensi `.axml`. Ketika Anda menekan tombol **PLAY** di AXML Studio, browser Anda secara real-time mengubah kode XML ini menjadi gelombang suara analog digital melalui Web Audio API.

---

## 2. Struktur Anatomi Lagu AXML

Setiap lagu AXML memiliki 4 bagian utama yang tersusun rapi:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<axml version="4.0">
  
  <!-- 1. IDENTITAS LAGU -->
  <metadata>
    <title>Judul Lagu Anda</title>
    <artist>Nama Anda</artist>
    <tempo>120</tempo>
    <key>C</key>
    <scale>major</scale>
  </metadata>

  <!-- 2. RAK INSTRUMEN (DESAIN SUARA) -->
  <instruments>
    <!-- Definisi synthesizer, drum, bass, lead -->
  </instruments>

  <!-- 3. POLA MAKRO (OPSIONAL) -->
  <patterns>
    <!-- Riff atau ketukan drum yang sering berulang -->
  </patterns>

  <!-- 4. TIMELINE & PARTITUR MUSIK (MULTI-TRACK) -->
  <tracks>
    <!-- Jalur nada untuk setiap instrumen -->
  </tracks>

</axml>
```

---

## 3. Langkah Demi Langkah: Membuat Lagu Pertama Anda

### Langkah 1: Menentukan Visi Lagu (`<metadata>`)
Tentukan kecepatan lagu (**BPM**) dan nada dasar (**Key**):
* **Tempo 80 - 95 BPM**: Lo-Fi, Hip-Hop santai, R&B.
* **Tempo 120 - 128 BPM**: House, Synthwave, Pop, EDM.
* **Tempo 140 - 175 BPM**: Trance, Dubstep, Drum & Bass.

Contoh:
```xml
<metadata>
  <title>Langkah Pertama</title>
  <artist>Saya Sendiri</artist>
  <tempo>124</tempo>
  <key>Am</key>
  <scale>minor</scale>
</metadata>
```

---

### Langkah 2: Merancang Suara Instrumen (`<instruments>`)
Pilih jenis suara yang ingin Anda gunakan:
* `type="kick"`: Suara dentuman drum bass (sub-bass punch).
* `type="snare"`: Pukulan drum snare dengan white noise renyah.
* `type="hihat"`: Desisan simbal drum frekuensi tinggi.
* `type="sawtooth"`: Suara synth gergaji tajam khas EDM, Synthwave, dan Bass tebal.
* `type="square"`: Suara 8-bit retro, chiptune, atau lead hollow.
* `type="sine"`: Suara murni, lembut, cocok untuk Sub-bass dan Ambient Pad.
* `type="triangle"`: Suara lembut bernuansa flute atau electric piano.

Contoh Palet Suara Lengkap:
```xml
<instruments>
  <instrument id="kick" type="kick" volume="1.0" attack="0.01" release="0.1"/>
  <instrument id="snare" type="snare" volume="0.8" attack="0.01" release="0.12" cutoff="2400"/>
  <instrument id="hihat" type="hihat" volume="0.4" attack="0.01" release="0.04" cutoff="8000"/>
  <instrument id="bass" type="sawtooth" volume="0.8" attack="0.01" decay="0.1" sustain="0.4" release="0.1" cutoff="800" resonance="6"/>
  <instrument id="lead" type="square" volume="0.6" attack="0.02" decay="0.15" sustain="0.5" release="0.3" cutoff="3000" delay="0.3" reverb="0.4"/>
</instruments>
```

---

### Langkah 3: Membuat Ketukan Drum (Rhythm Section)
Dalam metrum 4/4 standar, 1 Bar (birama) terdiri dari 4 ketukan (`beat 0, 1, 2, 3`):
* **Kick**: Bunyikan di ketukan `0, 1, 2, 3` (gaya "4-on-the-floor" club beat).
* **Snare**: Bunyikan di ketukan `1` dan `3` (atau `2` dan `4` pada hitungan musik konvensional).
* **Hi-Hat**: Bunyikan di sela-sela ketukan (`0.5, 1.5, 2.5, 3.5`) untuk memberi ayunan ritme (groove).

Contoh Track Drum:
```xml
<track instrument="kick" name="Kick Drum">
  <note pitch="C1" start="0" duration="q"/>
  <note pitch="C1" start="1" duration="q"/>
  <note pitch="C1" start="2" duration="q"/>
  <note pitch="C1" start="3" duration="q"/>
</track>

<track instrument="snare" name="Snare">
  <note pitch="D2" start="1" duration="q"/>
  <note pitch="D2" start="3" duration="q"/>
</track>

<track instrument="hihat" name="Hi-Hat">
  <note pitch="F#2" start="0.5" duration="e"/>
  <note pitch="F#2" start="1.5" duration="e"/>
  <note pitch="F#2" start="2.5" duration="e"/>
  <note pitch="F#2" start="3.5" duration="e"/>
</track>
```

---

### Langkah 4: Menulis Bassline yang Menghentak
Bass biasanya berada pada oktaf rendah (`C1` sampai `B2`). Sesuaikan nada bass dengan akor yang sedang berjalan:

```xml
<track instrument="bass" name="Synth Bass">
  <!-- Bar 1: Mengikuti nada dasar A -->
  <note pitch="A1" start="0" duration="e"/>
  <note pitch="A1" start="0.5" duration="e"/>
  <note pitch="A1" start="1.5" duration="e"/>
  <note pitch="C2" start="2" duration="q"/>
  <note pitch="E2" start="3" duration="q"/>
</track>
```

---

### Langkah 5: Menulis Harmoni Akor (`<chord>`)
Tag `<chord>` memungkinkan beberapa nada berbunyi secara bersamaan pada waktu dan durasi yang sama (Polyphonic):

```xml
<track instrument="pad" name="Atmosphere Chords">
  <!-- Akor A Minor selama 4 beat (1 bar penuh) -->
  <chord start="0" duration="w">
    <note pitch="A3"/>
    <note pitch="C4"/>
    <note pitch="E4"/>
  </chord>
  
  <!-- Akor F Major pada Bar kedua -->
  <chord start="4" duration="w">
    <note pitch="F3"/>
    <note pitch="A3"/>
    <note pitch="C4"/>
  </chord>
</track>
```

---

### Langkah 6: Menciptakan Melodi Utama yang Menempel di Kepala
Gunakan oktaf tengah-tinggi (`C4` sampai `B5`) agar melodi terdengar jelas di atas bass dan drum:

```xml
<track instrument="lead" name="Catchy Melody">
  <note pitch="E4" start="0" duration="q"/>
  <note pitch="A4" start="1" duration="h"/>
  <note pitch="G4" start="3" duration="q"/>
  <note pitch="C5" start="4" duration="w"/>
</track>
```

---

## 4. Tabel Singkatan Durasi Nada

AXML menyediakan singkatan durasi musikal yang praktis:

| Simbol | Istilah Musik | Jumlah Ketukan (Beat) | Contoh Nilai Desimal |
| :---: | :--- | :---: | :---: |
| `w` | Whole Note (Utuh) | 4.0 | `duration="4"` |
| `h` | Half Note (Setengah) | 2.0 | `duration="2"` |
| `q` | Quarter Note (Seperempat) | 1.0 | `duration="1"` |
| `e` | Eighth Note (Seperdelapan) | 0.5 | `duration="0.5"` |
| `s` | Sixteenth Note (Seperenambelas)| 0.25 | `duration="0.25"` |
| `t` | Thirty-second Note | 0.125 | `duration="0.125"` |
| `dotted-h` | Dotted Half | 3.0 | `duration="3"` |
| `dotted-q` | Dotted Quarter | 1.5 | `duration="1.5"` |
| `dotted-e` | Dotted Eighth | 0.75 | `duration="0.75"` |

---

## 5. Struktur Lengkap Aransemen Lagu (Song Form)

Untuk membuat karya musik yang utuh berdurasi 1 - 3 menit, susunlah lagu Anda mengikuti struktur lagu elektronik modern:

1. **Intro (Beat 0 - 16)**: Memperkenalkan suasana dan melodi tipis (hanya Pad dan Arp).
2. **Verse / Build-up (Beat 16 - 32)**: Bassline mulai masuk, drum hi-hat mulai membangun ketegangan.
3. **Drop / Chorus (Beat 32 - 64)**: Semua instrumen menyala bersamaan (Kick, Snare, Full Bass, Lead Melody). Ini adalah puncak energi lagu!
4. **Breakdown (Beat 64 - 80)**: Drum berhenti sejenak, memberikan ruang istirahat emosional bagi pendengar.
5. **Final Drop (Beat 80 - 112)**: Klimaks lagu dengan energi tertinggi.
6. **Outro (Beat 112 - 128)**: Satu per satu instrumen memudar hingga hening.

---

## 6. Tips Mixing & Polishing di AXML Studio

1. **Atur Panning Stereo (`pan`)**:
   * Simpan Kick dan Bass di tengah (`pan="0"`).
   * Geser Arp atau Hi-Hat sedikit ke kiri atau kanan (`pan="-0.3"` atau `pan="0.3"`) agar musik terdengar lebar dan sinematik.
2. **Kendalikan Volume (`volume`)**:
   * Jangan biarkan semua instrumen bervolume `1.0`. Beri prioritas: Kick (`0.9`), Bass (`0.75`), Lead (`0.65`), Pad (`0.4`).
3. **Gunakan Efek Reverb & Delay**:
   * Tambahkan `delay="0.25"` dan `reverb="0.4"` pada instrumen lead untuk memberi gema ruang yang megah.
4. **Format Kode Otomatis**:
   * Tekan tombol **FORMAT** di toolbar Studio atau shortcut `Ctrl+Alt+F` untuk merapikan indentasi XML Anda.
5. **Ekspor Karya Anda**:
   * Klik tombol **WAV** untuk merender master audio 32-bit yang siap diputar di mana saja.
   * Klik tombol **MIDI** untuk membuka partitur Anda di software DAW lain (FL Studio, Ableton, Logic).
