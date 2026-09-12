// استيراد الوسائط محلياً: قراءة البيانات الوصفية، توليد المصغرات، وربط الصوت.
// لا يُرفع أي ملف إلى أي خادم — كل شيء يبقى داخل المتصفح عبر object URLs.

import { state, uid, emit } from './state.js';

export function kindOf(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

function loadVideo(url) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('video');
    el.preload = 'auto';
    el.playsInline = true;
    el.crossOrigin = 'anonymous';
    el.src = url;
    el.addEventListener('loadedmetadata', () => resolve(el), { once: true });
    el.addEventListener('error', () => reject(new Error('تعذّرت قراءة الفيديو')), { once: true });
  });
}

/**
 * ملفات WebM الناتجة عن MediaRecorder (تسجيلات الشاشة، ومخرجات هذا المحرّر نفسه)
 * تصل بلا مدة في الترويسة فتكون duration = Infinity. القفز إلى زمن بعيد
 * يجبر المتصفح على حساب المدة الحقيقية ثم نعيد المؤشر إلى الصفر.
 */
function plausibleDuration(value) {
  return Number.isFinite(value) && value > 0 && value < 86400;
}

/** آخر خط دفاع: نهاية المدى القابل للقفز إليه تعكس طول الملف الحقيقي. */
function seekableEnd(el) {
  try {
    return el.seekable && el.seekable.length ? el.seekable.end(el.seekable.length - 1) : 0;
  } catch {
    return 0;
  }
}

function resolveDuration(el) {
  if (plausibleDuration(el.duration)) return Promise.resolve(el.duration);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      el.removeEventListener('timeupdate', onUpdate);
      clearTimeout(timer);
      if (plausibleDuration(el.duration)) resolve(el.duration);
      else resolve(plausibleDuration(seekableEnd(el)) ? seekableEnd(el) : 0);
    };
    const onUpdate = () => {
      if (el.currentTime > 0) {
        try { el.currentTime = 0; } catch { /* تجاهل */ }
        finish();
      }
    };
    const timer = setTimeout(finish, 4000);

    el.addEventListener('timeupdate', onUpdate);
    try { el.currentTime = 1e7; } catch { finish(); }
  });
}

function loadAudio(url) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('audio');
    el.preload = 'auto';
    el.src = url;
    el.addEventListener('loadedmetadata', () => resolve(el), { once: true });
    el.addEventListener('error', () => reject(new Error('تعذّرت قراءة الصوت')), { once: true });
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.decoding = 'async';
    el.src = url;
    el.addEventListener('load', () => resolve(el), { once: true });
    el.addEventListener('error', () => reject(new Error('تعذّرت قراءة الصورة')), { once: true });
  });
}

/** يستخرج إطاراً كمصغّرة من مقطع فيديو. */
export function captureThumb(rec, time = 0) {
  if (rec.kind === 'image') {
    return Promise.resolve(drawThumb(rec.el, rec.width, rec.height));
  }
  if (rec.kind !== 'video' || !rec.el) return Promise.resolve('');

  return new Promise((resolve) => {
    const el = document.createElement('video');
    el.preload = 'auto';
    el.muted = true;
    el.playsInline = true;
    el.src = rec.url;

    const done = (value) => {
      el.removeAttribute('src');
      el.load();
      resolve(value);
    };
    const timer = setTimeout(() => done(''), 6000);

    el.addEventListener('loadeddata', () => {
      el.currentTime = Math.min(Math.max(0.05, time), Math.max(0.05, rec.duration - 0.05));
    }, { once: true });

    el.addEventListener('seeked', () => {
      clearTimeout(timer);
      try {
        done(drawThumb(el, rec.width, rec.height));
      } catch {
        done('');
      }
    }, { once: true });

    el.addEventListener('error', () => { clearTimeout(timer); done(''); }, { once: true });
  });
}

function drawThumb(source, w, h) {
  const width = 160;
  const height = Math.max(1, Math.round((h / Math.max(1, w)) * width));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.6);
}

/** يبني سجل وسيط من ملف محلي، ويعيد ربط أي عنصر محفوظ مطابق. */
export async function addFile(file) {
  const kind = kindOf(file);
  if (!kind) throw new Error(`نوع غير مدعوم: ${file.name}`);

  const url = URL.createObjectURL(file);
  let el;
  let duration = 0;
  let width = 0;
  let height = 0;

  if (kind === 'video') {
    el = await loadVideo(url);
    duration = await resolveDuration(el);
    width = el.videoWidth;
    height = el.videoHeight;
  } else if (kind === 'audio') {
    el = await loadAudio(url);
    duration = await resolveDuration(el);
  } else {
    el = await loadImage(url);
    width = el.naturalWidth;
    height = el.naturalHeight;
    duration = 0;
  }

  // إعادة ربط عنصر محفوظ ينتظر ملفه (مطابقة بالاسم والحجم).
  const placeholder = [...state.media.values()].find(
    (m) => m.missing && m.name === file.name && m.size === file.size,
  );

  const rec = placeholder || { id: uid('med') };
  Object.assign(rec, {
    kind, name: file.name, size: file.size,
    url, el, duration, width, height,
    missing: false, wired: false, source: null, gain: null,
    thumb: rec.thumb || '',
  });

  state.media.set(rec.id, rec);
  emit('media');

  captureThumb(rec, 0.1).then((thumb) => {
    if (thumb) { rec.thumb = thumb; emit('media'); }
  });

  return rec;
}

export function removeMedia(id) {
  const rec = state.media.get(id);
  if (!rec) return;
  if (rec.url) URL.revokeObjectURL(rec.url);
  state.media.delete(id);
  state.project.clips = state.project.clips.filter((c) => c.mediaId !== id);
  if (state.project.music && state.project.music.mediaId === id) state.project.music = null;
  emit('media');
  emit('change');
}

/** يستعيد سجلات وسائط محفوظة كعناصر "مفقودة" تنتظر إعادة الاستيراد. */
export function restorePlaceholders(list) {
  for (const m of list) {
    state.media.set(m.id, { ...m, missing: true, el: null, url: '', thumb: '', wired: false });
  }
  emit('media');
}

/* ---------- رسم الصوت عبر Web Audio ---------- */

let ac = null;
let exportDest = null;

export function audioCtx() {
  if (!ac) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ac = Ctx ? new Ctx() : null;
  }
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}

/** يمرّر صوت العنصر عبر عقدة كسب حتى يمكن التحكم به وتسجيله. */
export function wireAudio(rec) {
  if (!rec || rec.wired || rec.kind === 'image' || !rec.el) return;
  const ctx = audioCtx();
  if (!ctx) return;
  try {
    rec.source = ctx.createMediaElementSource(rec.el);
    rec.gain = ctx.createGain();
    rec.source.connect(rec.gain);
    rec.gain.connect(ctx.destination);
    if (exportDest) rec.gain.connect(exportDest);
    rec.wired = true;
  } catch {
    // بعض المتصفحات ترفض ربط العنصر مرتين — يبقى الصوت يعمل افتراضياً.
    rec.wired = false;
  }
}

export function setGain(rec, value) {
  if (rec && rec.gain) rec.gain.gain.value = value;
  else if (rec && rec.el) rec.el.volume = Math.min(1, Math.max(0, value));
}

/** يوجّه كل الأصوات المربوطة إلى وجهة تسجيل إضافية أثناء التصدير. */
export function beginAudioCapture() {
  const ctx = audioCtx();
  if (!ctx) return null;
  exportDest = ctx.createMediaStreamDestination();
  for (const rec of state.media.values()) {
    wireAudio(rec);
    if (rec.gain) {
      try { rec.gain.connect(exportDest); } catch { /* مربوط مسبقاً */ }
    }
  }
  return exportDest;
}

export function endAudioCapture() {
  if (!exportDest) return;
  for (const rec of state.media.values()) {
    if (rec.gain) {
      try { rec.gain.disconnect(exportDest); } catch { /* غير مربوط */ }
    }
  }
  exportDest = null;
}
