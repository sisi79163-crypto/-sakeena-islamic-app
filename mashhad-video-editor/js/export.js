// التصدير: تسجيل مخرجات Canvas مع الصوت عبر MediaRecorder.
// التسجيل يجري بزمن حقيقي لأن المتصفح لا يوفّر ترميزاً أسرع من الزمن بلا مكتبات خارجية.

import { state, totalDuration, seek } from './state.js';
import { beginAudioCapture, endAudioCapture, audioCtx } from './media.js';
import * as engine from './engine.js';

export function isSupported() {
  return typeof MediaRecorder !== 'undefined'
    && typeof HTMLCanvasElement.prototype.captureStream === 'function';
}

export function pickMimeType() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  if (!MediaRecorder.isTypeSupported) return '';
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

export function extensionFor(mime) {
  return mime.startsWith('video/mp4') ? 'mp4' : 'webm';
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * يصدّر المشروع كاملاً إلى Blob.
 * @param {{scale?:number, bitrate?:number, onProgress?:(ratio:number)=>void, signal?:{aborted:boolean}}} opts
 */
export async function exportVideo(opts = {}) {
  const { scale = 1, bitrate = 8_000_000, onProgress, signal } = opts;

  if (!isSupported()) throw new Error('متصفحك لا يدعم التسجيل من Canvas.');
  const total = totalDuration();
  if (total <= 0.1) throw new Error('الشريط الزمني فارغ.');

  const canvas = engine.canvasEl();
  if (!canvas) throw new Error('لوحة العرض غير جاهزة.');

  const originalWidth = state.project.width;
  const originalHeight = state.project.height;

  engine.pause();
  audioCtx();

  let recorder = null;
  let dest = null;

  try {
    if (scale !== 1) {
      state.project.width = Math.max(2, Math.round((originalWidth * scale) / 2) * 2);
      state.project.height = Math.max(2, Math.round((originalHeight * scale) / 2) * 2);
      engine.applySize();
      await wait(60);
    }

    const stream = canvas.captureStream(state.project.fps);
    dest = beginAudioCapture();
    if (dest) {
      for (const track of dest.stream.getAudioTracks()) stream.addTrack(track);
    }

    const mimeType = pickMimeType();
    recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: bitrate,
    });

    const chunks = [];
    recorder.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    });
    const stopped = new Promise((resolve) => {
      recorder.addEventListener('stop', resolve, { once: true });
    });

    // ابدأ من الصفر ودع أول إطار يستقر قبل بدء التسجيل.
    seek(0);
    await wait(300);

    recorder.start(500);
    engine.play();

    while (true) {
      await wait(100);
      if (signal?.aborted) break;
      const ratio = Math.min(1, state.playhead / total);
      onProgress?.(ratio);
      if (!state.playing || state.playhead >= total - 0.02) break;
    }

    // امنح آخر إطار فرصة للوصول إلى المسجّل.
    await wait(250);
    engine.pause();
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;

    if (signal?.aborted) throw new Error('أُلغي التصدير.');
    if (!chunks.length) throw new Error('لم يُسجَّل أي محتوى.');

    onProgress?.(1);
    return new Blob(chunks, { type: mimeType || 'video/webm' });
  } finally {
    endAudioCapture();
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { /* متوقف مسبقاً */ }
    }
    if (scale !== 1) {
      state.project.width = originalWidth;
      state.project.height = originalHeight;
      engine.applySize();
    }
    engine.pause();
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function safeFilename(name) {
  const clean = String(name || 'mashhad').replace(/[\\/:*?"<>|]+/g, '-').trim();
  return clean || 'mashhad';
}
