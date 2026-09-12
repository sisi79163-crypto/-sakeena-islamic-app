// لوحة الخصائص: تبني الحقول حسب العنصر المحدد وتربطها بالحالة مباشرة.

import { state, selected, changed, clipDuration, on } from './state.js';

let host = null;
let onDelete = () => {};

export function initInspector(el, handlers = {}) {
  host = el;
  onDelete = handlers.onDelete || onDelete;
  on('select', render);
  on('change', refreshOutputs);
  render();
}

/* ---------- أدوات مسار الكائن ---------- */

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

function set(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
}

/** الأزمنة تنتج عن قسمة بكسلات على ثوانٍ فتحمل كسوراً طويلة لا فائدة منها. */
function round(value, places = 3) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function display(value) {
  return typeof value === 'number' && Number.isFinite(value) ? String(round(value)) : String(value ?? '');
}

/* ---------- قوالب الحقول ---------- */

function range(label, path, min, max, step, unit = '') {
  return `
    <div class="field">
      <span>${label}</span>
      <div class="range-row">
        <input type="range" data-bind="${path}" min="${min}" max="${max}" step="${step}">
        <output data-for="${path}" data-unit="${unit}"></output>
      </div>
    </div>`;
}

function number(label, path, min, max, step) {
  return `
    <div class="field">
      <span>${label}</span>
      <input type="number" dir="ltr" data-bind="${path}" min="${min}" max="${max}" step="${step}">
    </div>`;
}

function seg(label, path, options, numeric = false) {
  const buttons = options
    .map((o) => `<button type="button" data-value="${o.value}">${o.label}</button>`)
    .join('');
  return `
    <div class="field">
      <span>${label}</span>
      <div class="seg" data-seg="${path}" ${numeric ? 'data-numeric="1"' : ''}>${buttons}</div>
    </div>`;
}

function color(label, path) {
  return `<div class="field"><span>${label}</span><input type="color" data-bind="${path}"></div>`;
}

/* ---------- العرض ---------- */

function render() {
  if (!host) return;
  const sel = state.selection;
  const item = selected();

  if (!sel || !item) {
    host.innerHTML = '<p class="empty">اختر مقطعاً أو نصاً من الشريط الزمني لتعديل خصائصه.</p>';
    return;
  }

  if (sel.type === 'clip') renderClip(item);
  else if (sel.type === 'text') renderText(item);
  else if (sel.type === 'music') renderMusic(item);

  bind(item);
  refreshOutputs();
}

function renderClip(clip) {
  const rec = state.media.get(clip.mediaId);
  const isImage = rec && rec.kind === 'image';
  const maxOut = rec ? (isImage ? 600 : rec.duration || 600) : 600;

  host.innerHTML = `
    <div class="group">
      <h3>المقطع</h3>
      <p class="bin-name" title="${rec ? rec.name : ''}">${rec ? rec.name : 'وسيط مفقود'}</p>
      <div class="field-row">
        ${number('من (ث)', 'in', 0, maxOut, 0.05)}
        ${number('إلى (ث)', 'out', 0, maxOut, 0.05)}
      </div>
      <p class="note" id="clipLen"></p>
      ${isImage ? '' : range('السرعة', 'speed', 0.25, 3, 0.05, '×')}
      ${isImage ? '' : range('مستوى الصوت', 'volume', 0, 1, 0.01, '')}
      ${seg('ملء الإطار', 'fit', [
        { value: 'cover', label: 'ملء' },
        { value: 'contain', label: 'احتواء' },
      ])}
    </div>

    <div class="group">
      <h3>الفلاتر</h3>
      ${range('السطوع', 'filters.brightness', 0.2, 2, 0.01, '×')}
      ${range('التباين', 'filters.contrast', 0.2, 2, 0.01, '×')}
      ${range('التشبّع', 'filters.saturate', 0, 2.5, 0.01, '×')}
      ${range('ضبابية', 'filters.blur', 0, 30, 0.5, 'px')}
      ${range('سيبيا', 'filters.sepia', 0, 1, 0.01, '')}
      ${range('تدرّج رمادي', 'filters.grayscale', 0, 1, 0.01, '')}
      ${range('دوران اللون', 'filters.hue', -180, 180, 1, '°')}
      <button type="button" class="btn small" id="resetFilters">إعادة الضبط</button>
    </div>

    <button type="button" class="btn ghost" id="deleteItem">حذف المقطع</button>
  `;

  host.querySelector('#resetFilters').addEventListener('click', () => {
    Object.assign(clip.filters, {
      brightness: 1, contrast: 1, saturate: 1, blur: 0, sepia: 0, grayscale: 0, hue: 0,
    });
    changed();
    render();
  });
}

function renderText(t) {
  host.innerHTML = `
    <div class="group">
      <h3>النص</h3>
      <div class="field">
        <span>المحتوى</span>
        <textarea data-bind="text" rows="3"></textarea>
      </div>
      <div class="field-row">
        ${number('يبدأ (ث)', 'start', 0, 36000, 0.1)}
        ${number('ينتهي (ث)', 'end', 0, 36000, 0.1)}
      </div>
    </div>

    <div class="group">
      <h3>المظهر</h3>
      ${range('الحجم', 'size', 0.02, 0.3, 0.005, '')}
      ${color('اللون', 'color')}
      ${seg('الخط', 'font', [
        { value: 'sans', label: 'حديث' },
        { value: 'serif', label: 'نسخي' },
        { value: 'mono', label: 'ثابت' },
      ])}
      ${seg('السماكة', 'weight', [
        { value: '400', label: 'عادي' },
        { value: '700', label: 'عريض' },
        { value: '900', label: 'أعرض' },
      ], true)}
      ${seg('المحاذاة', 'align', [
        { value: 'right', label: 'يمين' },
        { value: 'center', label: 'وسط' },
        { value: 'left', label: 'يسار' },
      ])}
      ${range('حدّ أسود', 'stroke', 0, 0.3, 0.01, '')}
    </div>

    <div class="group">
      <h3>الموضع والخلفية</h3>
      ${range('أفقياً', 'x', 0, 1, 0.005, '')}
      ${range('عمودياً', 'y', 0, 1, 0.005, '')}
      ${color('لون الخلفية', 'boxColor')}
      ${range('شفافية الخلفية', 'boxOpacity', 0, 1, 0.01, '')}
    </div>

    <button type="button" class="btn ghost" id="deleteItem">حذف النص</button>
  `;
}

function renderMusic(m) {
  const rec = state.media.get(m.mediaId);
  host.innerHTML = `
    <div class="group">
      <h3>الموسيقى</h3>
      <p class="bin-name">${rec ? rec.name : 'ملف صوتي'}</p>
      ${range('مستوى الصوت', 'volume', 0, 1, 0.01, '')}
      <div class="field-row">
        ${number('يبدأ (ث)', 'start', 0, 36000, 0.1)}
        ${number('ينتهي (ث)', 'end', 0, 36000, 0.1)}
      </div>
      ${number('إزاحة داخل الملف (ث)', 'in', 0, 36000, 0.1)}
    </div>
    <button type="button" class="btn ghost" id="deleteItem">إزالة الموسيقى</button>
  `;
}

/* ---------- الربط ---------- */

function bind(item) {
  host.querySelectorAll('[data-bind]').forEach((input) => {
    const path = input.dataset.bind;
    input.value = display(get(item, path));

    input.addEventListener('input', () => {
      const raw = input.type === 'range' || input.type === 'number'
        ? Number(input.value)
        : input.value;
      if (typeof raw === 'number' && !Number.isFinite(raw)) return;
      set(item, path, raw);
      sanitize(item);
      changed();
    });
  });

  host.querySelectorAll('[data-seg]').forEach((group) => {
    const path = group.dataset.seg;
    const numeric = group.dataset.numeric === '1';
    const current = String(get(item, path));

    group.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.value === current);
      btn.addEventListener('click', () => {
        set(item, path, numeric ? Number(btn.dataset.value) : btn.dataset.value);
        group.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b === btn));
        changed();
      });
    });
  });

  const del = host.querySelector('#deleteItem');
  if (del) del.addEventListener('click', () => onDelete());
}

/** يمنع القيم غير المنطقية بعد أي تعديل يدوي. */
function sanitize(item) {
  const sel = state.selection;
  if (!sel) return;

  if (sel.type === 'clip') {
    const rec = state.media.get(item.mediaId);
    const max = rec ? (rec.kind === 'image' ? 600 : rec.duration || 600) : 600;
    item.in = round(Math.min(Math.max(0, item.in), Math.max(0, max - 0.1)));
    item.out = round(Math.min(Math.max(item.in + 0.1, item.out), max));
    item.speed = Math.min(3, Math.max(0.25, item.speed || 1));
  } else {
    item.start = round(Math.max(0, item.start));
    item.end = round(item.end <= item.start ? item.start + 0.2 : item.end);
  }
}

/** يحدّث القيم المعروضة بجانب المزالق دون إعادة بناء اللوحة. */
function refreshOutputs() {
  if (!host) return;
  const item = selected();
  if (!item) return;

  host.querySelectorAll('output[data-for]').forEach((out) => {
    const value = get(item, out.dataset.for);
    if (typeof value !== 'number') return;
    const decimals = Math.abs(value) >= 10 || Number.isInteger(value) ? 0 : 2;
    out.textContent = `${value.toFixed(decimals)}${out.dataset.unit || ''}`;
  });

  const len = host.querySelector('#clipLen');
  if (len && state.selection?.type === 'clip') {
    len.textContent = `المدة على الشريط: ${clipDuration(item).toFixed(2)} ثانية`;
  }

  host.querySelectorAll('[data-bind]').forEach((input) => {
    if (document.activeElement === input) return;
    const value = get(item, input.dataset.bind);
    if (value == null) return;
    const next = display(value);
    if (next !== input.value) input.value = next;
  });
}
