// محرّك العرض: يركّب الإطار الحالي على Canvas ويقود التشغيل والتزامن الصوتي.

import { state, clipAt, totalDuration, emit } from './state.js';
import { wireAudio, setGain, audioCtx } from './media.js';

let canvas = null;
let ctx = null;
let rafId = 0;
let lastTs = 0;

export function attach(el) {
  canvas = el;
  ctx = el.getContext('2d', { alpha: false });
  applySize();
  if (!rafId) rafId = requestAnimationFrame(loop);
}

export function applySize() {
  if (!canvas) return;
  canvas.width = state.project.width;
  canvas.height = state.project.height;
  canvas.style.aspectRatio = `${state.project.width} / ${state.project.height}`;
}

export function canvasEl() {
  return canvas;
}

/* ---------- حلقة العرض ---------- */

function loop(ts) {
  rafId = requestAnimationFrame(loop);
  const dt = lastTs ? Math.min(0.25, (ts - lastTs) / 1000) : 0;
  lastTs = ts;

  if (state.playing) advance(dt);
  syncMedia();
  draw(state.playhead);
}

function advance(dt) {
  const cur = clipAt(state.playhead);
  let moved = false;

  // عند وجود مقطع فيديو فعّال نشتق الزمن من العنصر نفسه حفاظاً على تزامن الصورة والصوت.
  if (cur && !cur.ended) {
    const rec = state.media.get(cur.clip.mediaId);
    if (rec && rec.kind === 'video' && rec.el && !rec.el.paused && !rec.el.seeking) {
      const derived = cur.start + (rec.el.currentTime - cur.clip.in) / (cur.clip.speed || 1);
      if (Number.isFinite(derived) && Math.abs(derived - state.playhead) < 1) {
        state.playhead = derived;
        moved = true;
      }
    }
  }
  if (!moved) state.playhead += dt;

  const total = totalDuration();
  if (state.playhead >= total) {
    state.playhead = total;
    pause();
  }
  emit('time');
}

function syncMedia() {
  const cur = clipAt(state.playhead);
  const music = state.project.music;

  for (const rec of state.media.values()) {
    if (!rec.el || rec.kind === 'image') continue;
    const isActive = cur && !cur.ended && cur.clip.mediaId === rec.id;
    const isMusic = music && music.mediaId === rec.id;
    if (!isActive && !isMusic && !rec.el.paused) rec.el.pause();
  }

  if (cur && !cur.ended) {
    const rec = state.media.get(cur.clip.mediaId);
    if (rec && rec.el && rec.kind === 'video') {
      const want = cur.sourceTime;
      rec.el.playbackRate = cur.clip.speed || 1;
      setGain(rec, cur.clip.volume ?? 1);

      if (state.playing) {
        if (rec.el.paused) {
          safeSeek(rec.el, want);
          rec.el.play().catch(() => {});
        } else if (Math.abs(rec.el.currentTime - want) > 0.3) {
          safeSeek(rec.el, want);
        }
      } else {
        if (!rec.el.paused) rec.el.pause();
        if (Math.abs(rec.el.currentTime - want) > 0.04) safeSeek(rec.el, want);
      }
    }
  }

  syncMusic();
}

function syncMusic() {
  const m = state.project.music;
  if (!m) return;
  const rec = state.media.get(m.mediaId);
  if (!rec || !rec.el) return;

  const within = state.playhead >= m.start && state.playhead < m.end;
  const local = (m.in || 0) + (state.playhead - m.start);
  setGain(rec, m.volume ?? 0.6);

  if (state.playing && within) {
    if (rec.el.paused) {
      safeSeek(rec.el, Math.max(0, local));
      rec.el.play().catch(() => {});
    } else if (Math.abs(rec.el.currentTime - local) > 0.4) {
      safeSeek(rec.el, Math.max(0, local));
    }
  } else if (!rec.el.paused) {
    rec.el.pause();
  }
}

function safeSeek(el, time) {
  try {
    el.currentTime = Math.max(0, time);
  } catch {
    /* العنصر غير جاهز بعد */
  }
}

/* ---------- الرسم ---------- */

export function draw(time = state.playhead) {
  if (!ctx) return;
  const { width, height, background } = state.project;

  ctx.save();
  ctx.filter = 'none';
  ctx.fillStyle = background || '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const cur = clipAt(time);
  if (cur && !cur.ended) {
    const rec = state.media.get(cur.clip.mediaId);
    if (rec && rec.el && (rec.kind === 'video' || rec.kind === 'image')) {
      ctx.save();
      ctx.filter = filterString(cur.clip.filters);
      drawFitted(rec, cur.clip.fit);
      ctx.restore();
    }
  }

  drawTexts(time);
}

function filterString(f) {
  if (!f) return 'none';
  return [
    `brightness(${f.brightness ?? 1})`,
    `contrast(${f.contrast ?? 1})`,
    `saturate(${f.saturate ?? 1})`,
    `blur(${f.blur ?? 0}px)`,
    `sepia(${f.sepia ?? 0})`,
    `grayscale(${f.grayscale ?? 0})`,
    `hue-rotate(${f.hue ?? 0}deg)`,
  ].join(' ');
}

function drawFitted(rec, fit) {
  const pw = state.project.width;
  const ph = state.project.height;
  const sw = rec.kind === 'image' ? rec.el.naturalWidth : rec.el.videoWidth || rec.width;
  const sh = rec.kind === 'image' ? rec.el.naturalHeight : rec.el.videoHeight || rec.height;
  if (!sw || !sh) return;

  const scale = fit === 'contain'
    ? Math.min(pw / sw, ph / sh)
    : Math.max(pw / sw, ph / sh);
  const w = sw * scale;
  const h = sh * scale;

  try {
    ctx.drawImage(rec.el, (pw - w) / 2, (ph - h) / 2, w, h);
  } catch {
    /* الإطار غير جاهز في هذه اللحظة */
  }
}

const FONTS = {
  sans: '"Segoe UI", "Noto Sans Arabic", Tahoma, sans-serif',
  serif: '"Amiri", "Noto Naskh Arabic", "Times New Roman", serif',
  mono: '"Courier New", monospace',
};

function drawTexts(time) {
  const pw = state.project.width;
  const ph = state.project.height;

  for (const t of state.project.texts) {
    if (time < t.start || time >= t.end || !t.text) continue;

    const size = Math.max(8, (t.size || 0.07) * ph);
    const lineHeight = size * 1.3;
    ctx.save();
    ctx.filter = 'none';
    ctx.font = `${t.weight || 700} ${size}px ${FONTS[t.font] || FONTS.sans}`;
    ctx.textAlign = t.align || 'center';
    ctx.textBaseline = 'middle';
    if ('direction' in ctx) ctx.direction = 'rtl';

    const lines = wrapText(t.text, pw * 0.92, size);
    const blockHeight = lines.length * lineHeight;
    const cx = (t.x ?? 0.5) * pw;
    const top = (t.y ?? 0.82) * ph - blockHeight / 2;

    if ((t.boxOpacity || 0) > 0) {
      let widest = 0;
      for (const line of lines) widest = Math.max(widest, ctx.measureText(line).width);
      const padX = size * 0.4;
      const padY = size * 0.25;
      let boxX = cx - widest / 2;
      if (t.align === 'left') boxX = cx;
      if (t.align === 'right') boxX = cx - widest;

      ctx.globalAlpha = t.boxOpacity;
      ctx.fillStyle = t.boxColor || '#000';
      roundRect(boxX - padX, top - padY, widest + padX * 2, blockHeight + padY * 2, size * 0.18);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    lines.forEach((line, i) => {
      const y = top + i * lineHeight + lineHeight / 2;
      if ((t.stroke || 0) > 0) {
        ctx.lineWidth = size * t.stroke;
        ctx.strokeStyle = 'rgba(0,0,0,.85)';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, cx, y);
      }
      ctx.fillStyle = t.color || '#fff';
      ctx.fillText(line, cx, y);
    });

    ctx.restore();
  }
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(text, maxWidth, size) {
  const out = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${line} ${words[i]}`;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        out.push(line);
        line = words[i];
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out.length ? out.slice(0, 8) : [''];
}

/* ---------- التحكم بالتشغيل ---------- */

export function play() {
  if (state.playing) return;
  const total = totalDuration();
  if (total <= 0) return;
  if (state.playhead >= total - 0.02) state.playhead = 0;

  audioCtx();
  for (const rec of state.media.values()) wireAudio(rec);

  state.playing = true;
  emit('play');
}

export function pause() {
  if (!state.playing) return;
  state.playing = false;
  pauseAll();
  emit('play');
}

export function toggle() {
  if (state.playing) pause(); else play();
}

export function pauseAll() {
  for (const rec of state.media.values()) {
    if (rec.el && rec.kind !== 'image' && !rec.el.paused) rec.el.pause();
  }
}
