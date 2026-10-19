/**
 * Studio Mixer Logic & Channel Routing
 */

var trackMutes = {};
var trackSolos = {};
var originalTrackGains = {};

function initMixerEvents(player) {
    const faders = document.querySelectorAll('.fader-cap');
    faders.forEach(cap => {
        cap.onmousedown = (e) => {
            e.preventDefault();
            const track = cap.parentElement;
            const bounds = track.getBoundingClientRect();

            const moveHandler = (moveEvent) => {
                let y = moveEvent.clientY - bounds.top;
                y = Math.max(0, Math.min(bounds.height, y));
                const percent = Math.max(0, Math.min(1, 1 - (y / bounds.height)));
                cap.style.bottom = (percent * 100) + '%';

                const channel = track.closest('.mixer-channel');
                const trackName = channel.dataset.track;

                const volValEl = channel.querySelector('.chan-vol-val');
                if (volValEl) {
                    const dbStr = percent <= 0.001 ? '-inf' : (percent >= 0.99 ? '+6.0 dB' : (20 * Math.log10(percent)).toFixed(1) + ' dB');
                    volValEl.textContent = dbStr;
                }

                if (trackName === 'master') {
                    if (player.master) player.master.gain.value = percent;
                } else {
                    if (player.trackGains && player.trackGains[trackName]) {
                        originalTrackGains[trackName] = percent;
                        if (!trackMutes[trackName]) {
                            player.trackGains[trackName].gain.value = percent;
                        }
                    }
                }
            };

            const upHandler = () => {
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };

            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        };
    });
}

function toggleTrackMute(trackName, btn) {
    if (typeof player === 'undefined' || !player.trackGains || !player.trackGains[trackName]) return;

    trackMutes[trackName] = !trackMutes[trackName];
    if (btn) btn.classList.toggle('active', trackMutes[trackName]);

    if (trackMutes[trackName]) {
        player.trackGains[trackName].gain.value = 0;
    } else {
        const restoredVol = originalTrackGains[trackName] !== undefined ? originalTrackGains[trackName] : 0.7;
        player.trackGains[trackName].gain.value = restoredVol;
    }
}

function toggleTrackSolo(trackName, btn) {
    if (typeof player === 'undefined' || !player.trackGains) return;

    trackSolos[trackName] = !trackSolos[trackName];
    if (btn) btn.classList.toggle('active', trackSolos[trackName]);

    const anySolo = Object.values(trackSolos).some(Boolean);

    Object.keys(player.trackGains).forEach(name => {
        const gainNode = player.trackGains[name];
        const baseVol = originalTrackGains[name] !== undefined ? originalTrackGains[name] : 0.7;

        if (anySolo) {
            gainNode.gain.value = trackSolos[name] ? baseVol : 0;
        } else {
            gainNode.gain.value = trackMutes[name] ? 0 : baseVol;
        }
    });
}
