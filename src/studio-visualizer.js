/**
 * Studio Visualizer - Multi-mode Engine with Reactive Particles
 * Phase 1b: single RAF loop, idle throttling, buffer reuse, DPR scaling.
 */
let currentVizMode = 'bars';
let particles = [];

function setVizMode(mode) {
    currentVizMode = mode;
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.speedX *= 0.95;
        this.speedY *= 0.95;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class VizEngine {
    constructor(canvas, player) {
        this.canvas = canvas;
        this.player = player;
        this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

        this.spectrogramData = [];
        this.flowField = [];
        this.lastTime = 0;

        // Reusable buffers - dialokasikan sekali, ukurannya menyesuaikan fftSize
        this.freqBuffer = null;
        this.timeBuffer = null;
        this.spectrogramSlice = null;

        this.cssWidth = 0;
        this.cssHeight = 0;
        this.dpr = 1;

        this.roundRectSupported =
            typeof CanvasRenderingContext2D !== 'undefined' &&
            typeof CanvasRenderingContext2D.prototype.roundRect === 'function';

        this.initFlowField();
    }

    initFlowField() {
        const rows = 20;
        const cols = 20;
        for (let i = 0; i < rows * cols; i++) {
            this.flowField.push({ x: 0, y: 0, angle: 0 });
        }
    }

    ensureBuffers(analyser) {
        const neededFreq = analyser.frequencyBinCount;
        const neededTime = analyser.fftSize;
        if (!this.freqBuffer || this.freqBuffer.length !== neededFreq) {
            this.freqBuffer = new Uint8Array(neededFreq);
        }
        if (!this.timeBuffer || this.timeBuffer.length !== neededTime) {
            this.timeBuffer = new Uint8Array(neededTime);
        }
        const sliceLen = Math.floor(neededFreq / 4);
        if (!this.spectrogramSlice || this.spectrogramSlice.length !== sliceLen) {
            this.spectrogramSlice = new Uint8Array(sliceLen);
        }
    }

    syncCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        const cssW = Math.max(1, Math.floor(rect.width));
        const cssH = Math.max(1, Math.floor(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (cssW !== this.cssWidth || cssH !== this.cssHeight || dpr !== this.dpr) {
            this.cssWidth = cssW;
            this.cssHeight = cssH;
            this.dpr = dpr;
            this.canvas.width = Math.floor(cssW * dpr);
            this.canvas.height = Math.floor(cssH * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        return { w: cssW, h: cssH };
    }

    renderFrame(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        const { w, h } = this.syncCanvasSize();
        const ctx = this.ctx;
        ctx.clearRect(0, 0, w, h);

        const analyser = this.player.analyser;
        const isLive = this.player.isPlaying && analyser;

        if (!isLive) {
            this.drawIdle(ctx, w, h, time);
            return;
        }

        this.ensureBuffers(analyser);
        analyser.getByteFrequencyData(this.freqBuffer);
        analyser.getByteTimeDomainData(this.timeBuffer);

        switch (currentVizMode) {
            case 'bars':
                drawBars(ctx, w, h, this.freqBuffer);
                break;
            case 'wave':
                drawWave(ctx, w, h, this.timeBuffer);
                break;
            case 'circular':
                drawCircular(ctx, w, h, this.freqBuffer);
                break;
            case 'spectrogram':
                this.drawSpectrogram(ctx, w, h, this.freqBuffer);
                break;
            case 'flow':
                this.drawFlowField(ctx, w, h, this.freqBuffer, this.timeBuffer);
                break;
        }

        if (particles.length) {
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => { p.update(); p.draw(ctx); });
        }
    }

    drawIdle(ctx, w, h, time) {
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const y = h / 2 + Math.sin(time / 500) * 10;
        ctx.moveTo(w * 0.1, y);
        ctx.lineTo(w * 0.9, y);
        ctx.stroke();
    }

    drawSpectrogram(ctx, w, h, data) {
        const slice = this.spectrogramSlice;
        const step = data.length / slice.length;
        for (let i = 0; i < slice.length; i++) {
            slice[i] = data[Math.floor(i * step)];
        }
        this.spectrogramData.unshift(slice.slice());
        if (this.spectrogramData.length > 50) this.spectrogramData.pop();

        const sw = w / slice.length;
        const sh = h / 50;

        for (let ri = 0; ri < this.spectrogramData.length; ri++) {
            const row = this.spectrogramData[ri];
            const alpha = 1 - ri / 50;
            for (let ci = 0; ci < row.length; ci++) {
                const val = row[ci];
                ctx.fillStyle = `rgba(0, ${val}, 255, ${alpha})`;
                ctx.fillRect(ci * sw, h - ri * sh, sw + 1, sh + 1);
            }
        }
    }

    drawFlowField(ctx, w, h, freqData, timeData) {
        const rows = 15;
        const cols = 25;
        const dw = w / cols;
        const dh = h / rows;

        ctx.lineWidth = 2;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                const fVal = freqData[idx % freqData.length] / 255;
                const tVal = timeData[idx % timeData.length] / 128 - 1;

                const x = c * dw + dw / 2;
                const y = r * dh + dh / 2;
                const len = dw * fVal * 1.5;
                const angle = tVal * Math.PI * 2;

                ctx.strokeStyle = `hsla(${fVal * 360}, 100%, 60%, 0.4)`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
                ctx.stroke();

                if (fVal > 0.6) {
                    ctx.fillStyle = '#00f2ff';
                    ctx.beginPath();
                    ctx.arc(x, y, fVal * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}

/**
 * Visualizer controller - satu loop RAF, throttled saat idle.
 */
function initVisualizer(canvas, player) {
    const engine = new VizEngine(canvas, player);

    const timerEl = document.getElementById('timer');
    let running = false;
    let rafId = 0;

    const IDLE_INTERVAL_MS = 500;   // 2 fps saat idle
    let lastIdleFrame = 0;

    function tick(time) {
        if (!running) return;

        const isLive = !!(player.isPlaying && player.analyser);

        if (!isLive) {
            if (time - lastIdleFrame >= IDLE_INTERVAL_MS) {
                lastIdleFrame = time;
                engine.renderFrame(time);
                updateTimer(false);
            }
        } else {
            engine.renderFrame(time);
            updateTimer(true);
        }

        rafId = requestAnimationFrame(tick);
    }

    function updateTimer(active) {
        if (!timerEl) return;
        if (!active) {
            if (timerEl.textContent !== '00:00 / 00:00') {
                timerEl.textContent = '00:00 / 00:00';
            }
            return;
        }
        const cur = Math.max(0, player.ctx.currentTime - (player.startTime || 0));
        const tot = typeof player.getDuration === 'function' ? Math.max(0, player.getDuration()) : 0;
        const fmt = (t) =>
            Math.floor(t / 60) + ':' + Math.floor(t % 60).toString().padStart(2, '0');
        timerEl.textContent = `${fmt(cur)} / ${fmt(tot)}`;
    }

    function start() {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(tick);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
        } else {
            start();
        }
    });

    // Mulai loop dalam mode idle; interval throttle otomatis menghemat CPU
    start();
}

function drawBars(ctx, w, h, data) {
    const binCount = Math.floor(data.length / 2);
    const bw = w / binCount;
    const gap = bw > 3 ? 2 : 0;

    for (let i = 0; i < binCount; i++) {
        const v = data[i] / 255;
        const bh = v * h;
        const x = i * bw;
        if (x > w) break;

        const hue = 190 - v * 40;  // cyan ke biru
        const light = 45 + v * 25;
        ctx.fillStyle = `hsl(${hue}, 100%, ${light}%)`;

        if (bw - gap > 0 && bh > 0) {
            ctx.fillRect(x, h - bh, bw - gap, bh);
        }
    }
}

function drawWave(ctx, w, h, timeData) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f2ff';
    ctx.beginPath();
    const sw = w / timeData.length;
    for (let i = 0; i < timeData.length; i++) {
        const y = (timeData[i] / 128) * (h / 2);
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * sw, y);
    }
    ctx.stroke();
}

function drawCircular(ctx, w, h, data) {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.3;
    for (let i = 0; i < data.length; i += 8) {
        const v = data[i] / 255;
        const a = (i / data.length) * Math.PI * 2;
        ctx.strokeStyle = `hsl(${(i / data.length) * 360}, 100%, 60%)`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * (r + v * 100), cy + Math.sin(a) * (r + v * 100));
        ctx.stroke();
    }
}
