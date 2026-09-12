// حالة المشروع: بنية التحرير، مكتبة الوسائط، التحديد، ومؤشر الزمن.

const STORAGE_KEY = 'mashhad.project.v1';

let seq = 0;
export function uid(prefix = 'id') {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

export function newProject() {
  return {
    name: 'مشروع بلا عنوان',
    width: 1920,
    height: 1080,
    fps: 30,
    background: '#000000',
    clips: [],
    texts: [],
    music: null,
  };
}

export const state = {
  project: newProject(),
  /** @type {Map<string, MediaRecord>} */
  media: new Map(),
  /** @type {{type:'clip'|'text'|'music', id:string}|null} */
  selection: null,
  playhead: 0,
  playing: false,
  pps: 70, // بكسل لكل ثانية على الشريط الزمني
  // أثناء السحب نحدّث المواضع فقط؛ إعادة بناء العناصر تقطع التقاط المؤشر.
  dragging: false,
};

/* ---------- ناقل أحداث بسيط ---------- */

const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event).delete(fn);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  for (const fn of [...set]) fn(payload);
}

/* ---------- إنشاء العناصر ---------- */

export function makeClip(mediaId, { duration, kind }) {
  return {
    id: uid('clip'),
    mediaId,
    in: 0,
    out: kind === 'image' ? 4 : duration,
    speed: 1,
    volume: 1,
    fit: 'cover',
    filters: {
      brightness: 1,
      contrast: 1,
      saturate: 1,
      blur: 0,
      sepia: 0,
      grayscale: 0,
      hue: 0,
    },
  };
}

export function makeText(start) {
  return {
    id: uid('txt'),
    text: 'نص جديد',
    start,
    end: start + 3,
    x: 0.5,
    y: 0.82,
    size: 0.07, // نسبة من ارتفاع المشروع
    color: '#ffffff',
    font: 'sans',
    weight: 700,
    align: 'center',
    boxColor: '#000000',
    boxOpacity: 0,
    stroke: 0.12,
  };
}

/* ---------- حسابات الشريط الزمني ---------- */

export function clipDuration(clip) {
  return Math.max(0.05, (clip.out - clip.in) / (clip.speed || 1));
}

/** يرجع المقاطع مع مواضعها على الشريط الزمني (متتابعة بلا فجوات). */
export function layout(project = state.project) {
  let t = 0;
  return project.clips.map((clip) => {
    const dur = clipDuration(clip);
    const entry = { clip, start: t, end: t + dur, duration: dur };
    t += dur;
    return entry;
  });
}

export function videoDuration(project = state.project) {
  return layout(project).reduce((sum, e) => sum + e.duration, 0);
}

export function totalDuration(project = state.project) {
  let end = videoDuration(project);
  for (const t of project.texts) end = Math.max(end, t.end);
  if (project.music) end = Math.max(end, project.music.end ?? 0);
  return end;
}

/** يرجع المقطع الفعّال عند لحظة زمنية، مع الزمن المحلي داخل المصدر. */
export function clipAt(time, project = state.project) {
  const entries = layout(project);
  for (const e of entries) {
    if (time >= e.start && time < e.end) {
      return { ...e, sourceTime: e.clip.in + (time - e.start) * (e.clip.speed || 1) };
    }
  }
  const last = entries[entries.length - 1];
  if (last && time >= last.end) {
    return { ...last, sourceTime: last.clip.out, ended: true };
  }
  return null;
}

export function findClip(id) {
  return state.project.clips.find((c) => c.id === id) || null;
}

export function findText(id) {
  return state.project.texts.find((t) => t.id === id) || null;
}

export function selected() {
  if (!state.selection) return null;
  const { type, id } = state.selection;
  if (type === 'clip') return findClip(id);
  if (type === 'text') return findText(id);
  if (type === 'music') return state.project.music;
  return null;
}

export function select(type, id) {
  state.selection = type ? { type, id } : null;
  emit('select');
}

export function changed() {
  emit('change');
}

export function seek(time) {
  const max = Math.max(0, totalDuration());
  state.playhead = Math.min(Math.max(0, time), max);
  emit('time');
}

/* ---------- الحفظ والاستعادة ---------- */

export function saveProject() {
  const payload = {
    project: state.project,
    media: [...state.media.values()].map((m) => ({
      id: m.id,
      kind: m.kind,
      name: m.name,
      size: m.size,
      duration: m.duration,
      width: m.width,
      height: m.height,
    })),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.project) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSaved() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* تجاهل */ }
}
