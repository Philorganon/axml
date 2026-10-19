window.AXML_EXAMPLES = {
  "Happy Birthday": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="3.5">
    <metadata>
        <title>Happy Birthday</title>
        <artist>AXML Studio</artist>
        <tempo>120</tempo>
        <key>C</key>
    </metadata>
    <instruments>
        <instrument id="piano" type="sine" volume="0.6" attack="0.05" decay="0.1" sustain="0.7" release="0.5" reverb="0.2" />
    </instruments>
    <tracks>
        <track instrument="piano" name="Melody">
            <note pitch="C4" duration="q" /><note pitch="C4" duration="q" />
            <note pitch="D4" duration="h" /><note pitch="C4" duration="h" />
            <note pitch="F4" duration="h" /><note pitch="E4" duration="w" />
        </track>
    </tracks>
</axml>`,
  "Neon Dreams": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="3.5">
  <metadata>
    <title>Neon Dreams</title>
    <artist>AXML Pro</artist>
    <tempo>120</tempo>
    <key>C</key>
  </metadata>
  <instruments>
    <instrument id="lead" type="sine" volume="0.6" attack="0.05" decay="0.2" sustain="0.6" release="0.4" cutoff="5000" reverb="0.3" />
    <instrument id="bass" type="sawtooth" volume="0.5" attack="0.01" decay="0.1" sustain="0.8" release="0.2" cutoff="800" distortion="0.4" />
    <instrument id="pad" type="triangle" volume="0.4" attack="1.5" decay="0.5" sustain="0.7" release="2.0" cutoff="2000" reverb="0.6" pan="-0.5" />
  </instruments>
  <tracks>
    <track instrument="pad" name="Intro Pad">
      <chord start="0" duration="w"><note pitch="C3"/><note pitch="E3"/><note pitch="G3"/></chord>
    </track>
    <track instrument="bass" name="Bass Line">
      <note pitch="C2" duration="whole" start="0"/><note pitch="A1" duration="whole" start="4"/>
    </track>
  </tracks>
</axml>`,
  "Lofi Chill": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="3.5">
  <metadata>
    <title>Lofi Chill</title>
    <artist>AXML Pro</artist>
    <tempo>85</tempo>
  </metadata>
  <instruments>
    <instrument id="keys" type="triangle" volume="0.5" attack="0.1" release="0.8" cutoff="1500" reverb="0.6" />
    <instrument id="kick" type="kick" volume="0.8" />
  </instruments>
  <tracks>
    <track instrument="keys" name="Chords">
      <chord start="0" duration="w"><note pitch="G3" /><note pitch="Bb3" /><note pitch="D4" /></chord>
    </track>
    <track instrument="kick" name="Beat">
      <note pitch="C2" duration="q" start="0"/><note pitch="C2" duration="q" start="2"/>
    </track>
  </tracks>
</axml>`,
  "Cyberpunk City": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="3.5">
  <metadata>
    <title>Cyberpunk City</title>
    <artist>AXML Master</artist>
    <tempo>128</tempo>
    <key>Am</key>
  </metadata>
  <instruments>
    <instrument id="kick" type="kick" volume="1.0" distortion="0.2" />
    <instrument id="snare" type="snare" volume="0.8" cutoff="1500" />
    <instrument id="bass" type="sawtooth" volume="0.7" attack="0.01" decay="0.1" sustain="0.6" release="0.2" cutoff="650" resonance="12" distortion="0.4" lfoRate="4" lfoAmount="0.3" lfoTarget="cutoff" />
    <instrument id="lead" type="square" volume="0.5" attack="0.05" decay="0.2" sustain="0.4" release="0.4" cutoff="2500" resonance="8" chorus="0.6" reverb="0.4" />
  </instruments>
  <tracks>
    <track instrument="kick" name="Drums">
      <note pitch="C2" start="0" duration="q" /><note pitch="C2" start="2" duration="q" />
    </track>
    <track instrument="bass" name="Bass">
      <note pitch="A1" start="0" duration="q" /><note pitch="G1" start="2" duration="q" />
    </track>
  </tracks>
</axml>`,
  "Techno Pulse": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="3.5">
  <metadata><title>Techno Pulse</title><tempo>135</tempo></metadata>
  <instruments>
    <instrument id="kick" type="kick" volume="1.0" distortion="0.5"/>
    <instrument id="syn" type="sawtooth" volume="0.5" arp="up" arpRate="0.25" cutoff="1200" resonance="15"/>
  </instruments>
  <tracks>
    <track instrument="kick" name="BD"><note pitch="C2" start="0" duration="1"/><note pitch="C2" start="1" duration="1"/></track>
    <track instrument="syn" name="Arp"><note pitch="C3" start="0" duration="4"/></track>
  </tracks>
</axml>`,
  "Ambient Space": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="3.5">
  <metadata><title>Ambient Space</title><tempo>60</tempo></metadata>
  <instruments>
    <instrument id="pad" type="sine" volume="0.4" attack="2.0" release="3.0" reverb="0.9" chorus="0.6"/>
  </instruments>
  <tracks>
    <track instrument="pad" name="Drone"><chord start="0" duration="16"><note pitch="C4"/><note pitch="G4"/><note pitch="C5"/></chord></track>
  </tracks>
</axml>`
};
