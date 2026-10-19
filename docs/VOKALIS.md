# Vokalis dalam AXML

Dalam konteks **AXML (Audio XML)**, vokal bukan sekadar instrumen, melainkan inti dari penyampaian emosi dan lirik dalam sebuah komposisi musik.

## Definisi Utama
Vokalis dalam AXML direpresentasikan melalui instrumen bertipe `vocal`. Ini memungkinkan suara manusia disintesis secara digital menggunakan teknologi *formant filtering*.

*   **Penyanyi tunggal**: Vokalis seringkali bertindak sebagai instrumen utama (`lead vocalist`) yang membawa melodi dan lirik.
*   **Harmoni Group**: Anda bisa menggunakan beberapa instrumen vokal dengan `vowel` berbeda (misal: 'a' dan 'o') untuk menciptakan harmoni kelompok vokal atau backing vokal.

## Peran dan Tugas Vokalis Digital
1.  **Mengkomunikasikan Lirik**: Melalui atribut `text` pada tag `<note>`, vokalis menyampaikan pesan dan cerita secara visual di layar monitor studio.
2.  **Ekspresi Emosi**: 
    *   **Glide (Cengkok)**: Menggunakan atribut `glide` untuk memberikan transisi nada yang halus (portamento).
    *   **Breathiness (Napas)**: Menggunakan atribut `breath` untuk memberikan karakter suara yang lebih manusiawi dan intim.
    *   **Vibrato**: Menggunakan modulasi LFO pada `pitch` untuk getaran suara yang natural.

## Contoh Implementasi AXML

```xml
<instruments>
  <!-- Vokalis Utama dengan Karakter Soul -->
  <instrument id="vokalis_utama" 
              type="vocal" 
              vowel="a" 
              breath="0.1" 
              glide="0.15" 
              lfoRate="4.5" 
              lfoAmount="0.1" 
              lfoTarget="pitch" 
              reverb="0.6" />
</instruments>

<tracks>
  <track instrument="vokalis_utama">
    <note pitch="E4" start="0" duration="h" text="Ha" />
    <note pitch="G4" start="2" duration="h" text="ti" />
    <note pitch="A4" start="4" duration="w" text="Ku" />
  </track>
</tracks>
```

## Kesimpulan
Vokalis di dalam AXML adalah pusat perhatian yang menggabungkan bunyi sintetis manusia dengan teks lirik, menciptakan pengalaman musik yang lebih hidup dan komunikatif bagi audiens.
