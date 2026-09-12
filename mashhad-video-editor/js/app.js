// نقطة الدخول: تربط الواجهة بالحالة والمحرّك.

import {
  state, on, changed, select, seek, clipAt, uid,
  makeClip, makeText, totalDuration,
  saveProject, loadSaved, newProject,
} from './state.js';
import { addFile, removeMedia, restorePlaceholders } from './media.js';
import * as engine from './engine.js';
import { initTimeline, formatTime, render as renderTimeline } from './timeline.js';
import { initInspector } from './inspector.js';
import { exportVideo, downloadBlob, isSupported, pickMimeType, extensionFor, safeFilename } from './export.js';

const $ = (id) => document.getElementById(id);

const el = {
  canvas: $('preview'),
  projectName: $('projectName'),
  binList: $('binList'),
  dropZone: $('dropZone'),
  fileInput: $('fileInput'),
  btnImport: $('btnImport'),
  btnPlay: $('btnPlay'),
  btnStart: $('btnStart'),
  btnSplit: $('btnSplit'),
  btnText: $('btnText'),
  btnDelete: $('btnDelete'),
  btnSave: $('btnSave'),
  btnExport: $('btnExport'),
  tcNow: $('tcNow'),
  tcTotal: $('tcTotal'),
  zoom: $('zoom'),
  toast: $('toast'),
  inspector: $('inspector'),
  dialog: $('exportDialog'),
};

const RATIOS = {
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
};

/* ---------- إشعارات ---------- */

let toastTimer = 0;
function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2600);
}

/* ---------- الاستيراد ---------- */

async function importFiles(files) {
  const list = [...files];
  if (!list.length) return;

  let added = 0;
  for (const file of list) {
    try {
      const rec = await addFile(file);
      placeOnTimeline(rec);
      added += 1;
    } catch (err) {
      toast(err.message || `تعذّر استيراد ${file.name}`);
    }
  }

  if (added) {
    changed();
    toast(`أُضيف ${added} ${added === 1 ? 'ملف' : 'ملفات'}`);
  }
}

function placeOnTimeline(rec) {
  if (rec.kind === 'audio') {
    state.project.music = {
      mediaId: rec.id,
      start: 0,
      end: rec.duration || 30,
      in: 0,
      volume: 0.6,
    };
  } else {
    state.project.clips.push(makeClip(rec.id, { duration: rec.duration, kind: rec.kind }));
  }
}

function wireImport() {
  el.btnImport.addEventListener('click', () => el.fileInput.click());
  el.dropZone.addEventListener('click', () => el.fileInput.click());

  el.fileInput.addEventListener('change', () => {
    importFiles(el.fileInput.files);
    el.fileInput.value = '';
  });

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  for (const type of ['dragenter', 'dragover']) {
    el.dropZone.addEventListener(type, (e) => { stop(e); el.dropZone.classList.add('is-over'); });
  }
  for (const type of ['dragleave', 'drop']) {
    el.dropZone.addEventListener(type, (e) => { stop(e); el.dropZone.classList.remove('is-over'); });
  }
  el.dropZone.addEventListener('drop', (e) => importFiles(e.dataTransfer.files));

  // امنع المتصفح من فتح الملف عند إفلاته خارج المنطقة المخصصة.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
}

/* ---------- مكتبة الوسائط ---------- */

function renderBin() {
  const frag = document.createDocumentFragment();

  for (const rec of state.media.values()) {
    const li = document.createElement('li');
    li.className = 'bin-item';

    if (rec.thumb) {
      const img = document.createElement('img');
      img.src = rec.thumb;
      img.alt = '';
      li.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = rec.kind === 'audio' ? '♪' : rec.missing ? '⚠' : '▦';
      li.appendChild(ph);
    }

    const meta = document.createElement('div');
    meta.className = 'bin-meta';
    const name = document.createElement('div');
    name.className = 'bin-name';
    name.textContent = rec.name;
    name.title = rec.name;
    const sub = document.createElement('div');
    sub.className = 'bin-sub';
    sub.textContent = rec.missing
      ? 'مفقود — أعد استيراده'
      : rec.kind === 'image'
        ? 'صورة'
        : `${formatTime(rec.duration || 0, false)}`;
    meta.append(name, sub);
    li.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'bin-actions';

    const add = document.createElement('button');
    add.className = 'bin-add';
    add.type = 'button';
    add.textContent = '＋';
    add.title = 'إضافة إلى الشريط الزمني';
    add.disabled = rec.missing;
    add.addEventListener('click', () => {
      placeOnTimeline(rec);
      changed();
      toast('أُضيف إلى الشريط الزمني');
    });

    const remove = document.createElement('button');
    remove.className = 'bin-add remove';
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = 'إزالة من المكتبة';
    remove.addEventListener('click', () => {
      removeMedia(rec.id);
      select(null);
    });

    actions.append(add, remove);
    li.appendChild(actions);
    frag.appendChild(li);
  }

  el.binList.replaceChildren(frag);
  el.dropZone.hidden = state.media.size > 3;
}

/* ---------- التحرير ---------- */

function splitAtPlayhead() {
  const cur = clipAt(state.playhead);
  if (!cur || cur.ended) {
    toast('ضع المؤشر فوق مقطع أولاً');
    return;
  }

  const { clip } = cur;
  const cutPoint = Math.round(cur.sourceTime * 1000) / 1000;
  if (cutPoint <= clip.in + 0.1 || cutPoint >= clip.out - 0.1) {
    toast('نقطة القصّ قريبة جداً من طرف المقطع');
    return;
  }

  const index = state.project.clips.indexOf(clip);
  const second = { ...clip, id: uid('clip'), filters: { ...clip.filters }, in: cutPoint };
  clip.out = cutPoint;
  state.project.clips.splice(index + 1, 0, second);

  changed();
  select('clip', second.id);
  toast('تم القصّ');
}

function deleteSelected() {
  const sel = state.selection;
  if (!sel) {
    toast('لا يوجد عنصر محدد');
    return;
  }

  if (sel.type === 'clip') {
    state.project.clips = state.project.clips.filter((c) => c.id !== sel.id);
  } else if (sel.type === 'text') {
    state.project.texts = state.project.texts.filter((t) => t.id !== sel.id);
  } else if (sel.type === 'music') {
    state.project.music = null;
  }

  select(null);
  changed();
}

function addTextAtPlayhead() {
  const t = makeText(state.playhead);
  state.project.texts.push(t);
  changed();
  select('text', t.id);
  toast('أُضيف نص — عدّله من لوحة الخصائص');
}

/* ---------- شريط الأدوات ---------- */

function wireTopbar() {
  el.projectName.addEventListener('input', () => {
    state.project.name = el.projectName.value;
  });

  document.querySelectorAll('.ratios button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [w, h] = RATIOS[btn.dataset.ratio] || RATIOS['16:9'];
      state.project.width = w;
      state.project.height = h;
      engine.applySize();
      document.querySelectorAll('.ratios button')
        .forEach((b) => b.classList.toggle('is-active', b === btn));
      changed();
    });
  });

  el.btnSave.addEventListener('click', () => {
    toast(saveProject()
      ? 'حُفظ المشروع في هذا المتصفح'
      : 'تعذّر الحفظ — مساحة التخزين ممتلئة');
  });
}

function wireTransport() {
  el.btnPlay.addEventListener('click', () => engine.toggle());
  el.btnStart.addEventListener('click', () => { engine.pause(); seek(0); });
  el.btnSplit.addEventListener('click', splitAtPlayhead);
  el.btnText.addEventListener('click', addTextAtPlayhead);
  el.btnDelete.addEventListener('click', deleteSelected);

  el.zoom.addEventListener('input', () => {
    state.pps = Number(el.zoom.value);
    renderTimeline();
  });

  on('play', () => {
    el.btnPlay.textContent = state.playing ? '⏸' : '▶';
    el.btnPlay.setAttribute('aria-label', state.playing ? 'إيقاف مؤقت' : 'تشغيل');
  });
}

function wireKeyboard() {
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.metaKey || e.ctrlKey) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        engine.toggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        engine.pause();
        seek(state.playhead + (e.shiftKey ? 1 : 1 / state.project.fps));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        engine.pause();
        seek(state.playhead - (e.shiftKey ? 1 : 1 / state.project.fps));
        break;
      case 'Home':
        e.preventDefault();
        seek(0);
        break;
      case 's': case 'S': case 'ط':
        splitAtPlayhead();
        break;
      case 't': case 'T': case 'ف':
        addTextAtPlayhead();
        break;
      case 'Delete': case 'Backspace':
        e.preventDefault();
        deleteSelected();
        break;
      default:
        break;
    }
  });
}

/* ---------- التصدير ---------- */

function wireExport() {
  const setup = $('exportSetup');
  const progress = $('exportProgress');
  const bar = $('exportBar');
  const status = $('exportStatus');
  const startBtn = $('exportStart');
  const cancelBtn = $('exportCancel');
  let signal = null;

  el.btnExport.addEventListener('click', () => {
    if (!isSupported()) {
      toast('متصفحك لا يدعم التصدير — جرّب Chrome أو Edge');
      return;
    }
    if (!state.project.clips.length) {
      toast('أضِف مقطعاً واحداً على الأقل');
      return;
    }
    setup.hidden = false;
    progress.hidden = true;
    startBtn.disabled = false;
    bar.style.width = '0';
    el.dialog.showModal();
  });

  cancelBtn.addEventListener('click', () => {
    if (signal) signal.aborted = true;
    el.dialog.close();
  });

  startBtn.addEventListener('click', async () => {
    const scale = Number($('exportQuality').value);
    const bitrate = Number($('exportBitrate').value);
    const total = totalDuration();

    setup.hidden = true;
    progress.hidden = false;
    startBtn.disabled = true;
    signal = { aborted: false };

    try {
      const blob = await exportVideo({
        scale,
        bitrate,
        signal,
        onProgress: (ratio) => {
          bar.style.width = `${(ratio * 100).toFixed(1)}%`;
          const left = Math.max(0, total - ratio * total);
          status.textContent = `جارٍ التسجيل… تبقّى ${formatTime(left, false)}`;
        },
      });

      const ext = extensionFor(pickMimeType());
      downloadBlob(blob, `${safeFilename(state.project.name)}.${ext}`);
      status.textContent = 'اكتمل التصدير — بدأ التنزيل.';
      toast('اكتمل التصدير');
      setTimeout(() => el.dialog.close(), 1200);
    } catch (err) {
      status.textContent = err.message || 'فشل التصدير.';
      toast(err.message || 'فشل التصدير');
    } finally {
      signal = null;
      startBtn.disabled = false;
    }
  });
}

/* ---------- الحفظ التلقائي والاستعادة ---------- */

let saveTimer = 0;
function scheduleAutosave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProject, 1500);
}

function restore() {
  const data = loadSaved();
  if (!data) return;

  state.project = { ...newProject(), ...data.project };
  restorePlaceholders(data.media || []);
  el.projectName.value = state.project.name;

  const ratio = Object.entries(RATIOS)
    .find(([, [w, h]]) => w === state.project.width && h === state.project.height);
  document.querySelectorAll('.ratios button').forEach((b) => {
    b.classList.toggle('is-active', ratio ? b.dataset.ratio === ratio[0] : false);
  });

  engine.applySize();
  changed();

  if ((data.media || []).length) {
    toast('استُعيد المشروع — أعد استيراد ملفات الوسائط بنفس الأسماء');
  }
}

/* ---------- الإقلاع ---------- */

function updateClock() {
  el.tcNow.textContent = formatTime(state.playhead);
  el.tcTotal.textContent = formatTime(totalDuration());
}

function boot() {
  engine.attach(el.canvas);

  initTimeline({
    timeline: $('timeline'),
    scroll: $('timelineScroll'),
    ruler: $('ruler'),
    trackVideo: $('trackVideo'),
    trackText: $('trackText'),
    trackAudio: $('trackAudio'),
    playhead: $('playhead'),
  });

  initInspector(el.inspector, { onDelete: deleteSelected });

  wireImport();
  wireTopbar();
  wireTransport();
  wireKeyboard();
  wireExport();

  on('media', renderBin);
  on('change', () => { updateClock(); scheduleAutosave(); });
  on('time', updateClock);

  renderBin();
  restore();
  updateClock();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
