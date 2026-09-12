// الشريط الزمني: رسم المقاطع والنصوص، السحب لإعادة الترتيب، والقصّ من الأطراف.

import {
  state, layout, clipDuration, totalDuration, videoDuration,
  select, changed, seek, on,
} from './state.js';

let els = {};

export function initTimeline(refs) {
  els = refs;

  els.ruler.addEventListener('pointerdown', (e) => {
    seekFromPointer(e, els.ruler);
    els.ruler.setPointerCapture(e.pointerId);
    const move = (ev) => seekFromPointer(ev, els.ruler);
    const up = () => {
      els.ruler.removeEventListener('pointermove', move);
      els.ruler.removeEventListener('pointerup', up);
    };
    els.ruler.addEventListener('pointermove', move);
    els.ruler.addEventListener('pointerup', up);
  });

  for (const track of [els.trackVideo, els.trackText, els.trackAudio]) {
    track.addEventListener('pointerdown', (e) => {
      if (e.target === track) {
        select(null);
        seekFromPointer(e, track);
      }
    });
  }

  on('change', render);
  on('media', render);
  on('select', markSelection);
  on('time', updatePlayhead);

  render();
}

function seekFromPointer(e, el) {
  const rect = el.getBoundingClientRect();
  seek((e.clientX - rect.left) / state.pps);
}

/* ---------- الرسم ---------- */

export function render() {
  if (!els.timeline) return;

  // أثناء السحب نكتفي بتحديث المواضع حتى لا يُستبدل العنصر الممسوك بالمؤشر.
  if (state.dragging) {
    updateGeometry();
    updatePlayhead();
    return;
  }

  const total = Math.max(totalDuration(), 8);
  const width = Math.max(total * state.pps + 120, els.scroll.clientWidth);
  els.timeline.style.width = `${width}px`;

  renderRuler(total, width);
  renderVideoClips();
  renderTextClips();
  renderMusicClip();
  markSelection();
  updatePlayhead();
}

function renderRuler(total, width) {
  const pps = state.pps;
  const step = pps >= 120 ? 1 : pps >= 60 ? 2 : pps >= 30 ? 5 : 10;
  const frag = document.createDocumentFragment();

  for (let t = 0; t <= total + step; t += step) {
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.style.left = `${t * pps}px`;
    tick.textContent = formatTime(t, false);
    frag.appendChild(tick);
  }

  els.ruler.replaceChildren(frag);
  els.ruler.style.width = `${width}px`;
}

function renderVideoClips() {
  const frag = document.createDocumentFragment();

  for (const entry of layout()) {
    const { clip, start, duration } = entry;
    const rec = state.media.get(clip.mediaId);
    const el = document.createElement('div');
    el.className = 'clip';
    el.dataset.id = clip.id;
    el.dataset.type = 'clip';
    el.style.left = `${start * state.pps}px`;
    el.style.width = `${Math.max(12, duration * state.pps)}px`;

    if (rec && rec.thumb) {
      const thumb = document.createElement('div');
      thumb.className = 'clip-thumb';
      thumb.style.backgroundImage = `url(${rec.thumb})`;
      el.appendChild(thumb);
    }

    const label = document.createElement('span');
    label.className = 'clip-label';
    label.textContent = rec ? `${rec.missing ? '⚠ ' : ''}${rec.name}` : 'وسيط مفقود';
    el.appendChild(label);

    el.append(handle('left'), handle('right'));
    attachClipDrag(el, clip);
    frag.appendChild(el);
  }

  replaceClips(els.trackVideo, frag);
}

function renderTextClips() {
  const frag = document.createDocumentFragment();

  for (const t of state.project.texts) {
    const el = document.createElement('div');
    el.className = 'clip text-clip';
    el.dataset.id = t.id;
    el.dataset.type = 'text';
    el.style.left = `${t.start * state.pps}px`;
    el.style.width = `${Math.max(12, (t.end - t.start) * state.pps)}px`;

    const label = document.createElement('span');
    label.className = 'clip-label';
    label.textContent = t.text.split('\n')[0] || 'نص';
    el.appendChild(label);

    el.append(handle('left'), handle('right'));
    attachRangeDrag(el, t, { min: 0 });
    frag.appendChild(el);
  }

  replaceClips(els.trackText, frag);
}

function renderMusicClip() {
  const frag = document.createDocumentFragment();
  const m = state.project.music;

  if (m) {
    const rec = state.media.get(m.mediaId);
    const el = document.createElement('div');
    el.className = 'clip audio-clip';
    el.dataset.id = m.mediaId;
    el.dataset.type = 'music';
    el.style.left = `${m.start * state.pps}px`;
    el.style.width = `${Math.max(12, (m.end - m.start) * state.pps)}px`;

    const label = document.createElement('span');
    label.className = 'clip-label';
    label.textContent = rec ? `♪ ${rec.name}` : '♪ موسيقى';
    el.appendChild(label);

    el.append(handle('left'), handle('right'));
    attachRangeDrag(el, m, { min: 0 });
    frag.appendChild(el);
  }

  replaceClips(els.trackAudio, frag);
}

function replaceClips(track, frag) {
  track.querySelectorAll('.clip').forEach((n) => n.remove());
  track.appendChild(frag);
}

/** يعيد وضع العناصر الموجودة دون إعادة بنائها — يُستخدم أثناء السحب. */
function updateGeometry() {
  const entries = new Map(layout().map((e) => [e.clip.id, e]));
  els.trackVideo.querySelectorAll('.clip').forEach((node) => {
    const entry = entries.get(node.dataset.id);
    if (!entry) return;
    node.style.left = `${entry.start * state.pps}px`;
    node.style.width = `${Math.max(12, entry.duration * state.pps)}px`;
  });

  els.trackText.querySelectorAll('.clip').forEach((node) => {
    const t = state.project.texts.find((x) => x.id === node.dataset.id);
    if (!t) return;
    node.style.left = `${t.start * state.pps}px`;
    node.style.width = `${Math.max(12, (t.end - t.start) * state.pps)}px`;
  });

  const m = state.project.music;
  els.trackAudio.querySelectorAll('.clip').forEach((node) => {
    if (!m) return;
    node.style.left = `${m.start * state.pps}px`;
    node.style.width = `${Math.max(12, (m.end - m.start) * state.pps)}px`;
  });
}

function handle(side) {
  const el = document.createElement('div');
  el.className = `handle ${side}`;
  el.dataset.handle = side;
  return el;
}

/* ---------- تحديد ومؤشر ---------- */

function markSelection() {
  const sel = state.selection;
  document.querySelectorAll('.clip').forEach((el) => {
    const active = !!sel && el.dataset.type === sel.type && el.dataset.id === sel.id;
    el.classList.toggle('is-selected', active);
  });
}

export function updatePlayhead() {
  if (!els.playhead) return;
  const x = state.playhead * state.pps;
  els.playhead.style.left = `${x}px`;

  if (state.playing) {
    const view = els.scroll;
    const left = view.scrollLeft;
    const right = left + view.clientWidth;
    if (x < left + 40 || x > right - 80) {
      view.scrollLeft = Math.max(0, x - view.clientWidth * 0.35);
    }
  }
}

/* ---------- السحب ---------- */

/** سحب مقطع مرئي: تحريك لإعادة الترتيب، أو سحب طرف للقصّ. */
function attachClipDrag(el, clip) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    select('clip', clip.id);

    const side = e.target.dataset.handle;
    const startX = e.clientX;
    const rec = state.media.get(clip.mediaId);
    const maxOut = rec && rec.kind === 'image' ? 600 : (rec ? rec.duration : clip.out);
    const orig = { in: clip.in, out: clip.out };
    const index = state.project.clips.indexOf(clip);
    const startSec = layout()[index]?.start ?? 0;
    let dragging = false;

    el.setPointerCapture(e.pointerId);
    state.dragging = true;

    const move = (ev) => {
      const dx = ev.clientX - startX;
      if (!dragging && Math.abs(dx) < 4) return;
      dragging = true;
      const ds = (dx / state.pps) * (clip.speed || 1);

      if (side === 'left') {
        clip.in = clamp(orig.in + ds, 0, clip.out - 0.1);
        changed();
      } else if (side === 'right') {
        clip.out = clamp(orig.out + ds, clip.in + 0.1, maxOut || clip.in + 0.1);
        changed();
      } else {
        el.classList.add('is-dragging');
        el.style.transform = `translateX(${dx}px)`;
        el.dataset.target = String(targetIndex(startSec + dx / state.pps + clipDuration(clip) / 2, index));
      }
    };

    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      state.dragging = false;

      if (dragging && !side) {
        const target = Number(el.dataset.target);
        if (Number.isInteger(target) && target !== index) {
          const list = state.project.clips;
          list.splice(target, 0, ...list.splice(index, 1));
        }
      }
      el.classList.remove('is-dragging');
      el.style.transform = '';
      changed();
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}

/** أين يستقر المقطع المسحوب بين بقية المقاطع. */
function targetIndex(centerSec, movingIndex) {
  const others = layout().filter((_, i) => i !== movingIndex);
  let acc = 0;
  for (let i = 0; i < others.length; i += 1) {
    if (centerSec < acc + others[i].duration / 2) return i;
    acc += others[i].duration;
  }
  return others.length;
}

/** سحب عنصر له مدى زمني حر (نص أو موسيقى). */
function attachRangeDrag(el, item, { min = 0 } = {}) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    select(el.dataset.type, el.dataset.id);

    const side = e.target.dataset.handle;
    const startX = e.clientX;
    const orig = { start: item.start, end: item.end };
    el.setPointerCapture(e.pointerId);
    state.dragging = true;

    const move = (ev) => {
      const ds = (ev.clientX - startX) / state.pps;
      if (side === 'left') {
        item.start = clamp(orig.start + ds, min, item.end - 0.2);
      } else if (side === 'right') {
        item.end = round(Math.max(item.start + 0.2, orig.end + ds));
      } else {
        const span = orig.end - orig.start;
        item.start = round(Math.max(min, orig.start + ds));
        item.end = round(item.start + span);
      }
      changed();
    };

    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      state.dragging = false;
      changed();
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}

/* ---------- أدوات ---------- */

function clamp(v, lo, hi) {
  return round(Math.min(Math.max(v, lo), hi));
}

/** السحب يحوّل بكسلات إلى ثوانٍ، فنقصّ الكسور الطويلة التي لا معنى لها. */
function round(value, places = 3) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function formatTime(sec, withTenths = true) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const whole = Math.floor(rest);
  const pad = (n) => String(n).padStart(2, '0');
  return withTenths
    ? `${pad(m)}:${pad(whole)}.${Math.floor((rest - whole) * 10)}`
    : `${pad(m)}:${pad(whole)}`;
}

export { videoDuration };
