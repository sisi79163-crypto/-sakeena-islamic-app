"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const STORAGE = {
  theme: "sakeena.theme",
  lastPage: "sakeena.lastPage",
  bookmark: "sakeena.bookmark",
  quranCache: "sakeena.quranCache.v1",
  location: "sakeena.location",
  dhikr: "sakeena.dhikr.v1",
  tasbih: "sakeena.tasbih",
  tasbihTarget: "sakeena.tasbihTarget",
  alarm: "sakeena.alarm.v1"
};

const DEFAULT_LOCATION = {
  latitude: 33.8938,
  longitude: 35.5018,
  label: "بيروت، لبنان",
  isDefault: true
};

const PRAYER_NAMES = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء"
};

const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const COUNTDOWN_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const DAILY_VERSES = [
  { text: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ", ref: "سورة الرعد · ٢٨" },
  { text: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا", ref: "سورة الشرح · ٥" },
  { text: "إِنَّ ٱللَّهَ مَعَ ٱلصَّابِرِينَ", ref: "سورة البقرة · ١٥٣" },
  { text: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ", ref: "سورة الطلاق · ٣" },
  { text: "لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ", ref: "سورة الزمر · ٥٣" },
  { text: "وَقُل رَّبِّ زِدْنِى عِلْمًا", ref: "سورة طه · ١١٤" },
  { text: "إِنَّ رَبِّى قَرِيبٌ مُّجِيبٌ", ref: "سورة هود · ٦١" }
];

const ADHKAR = {
  morning: [
    { id: "m1", count: 1, text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", note: "مرة واحدة" },
    { id: "m2", count: 1, text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ", note: "مرة واحدة" },
    { id: "m3", count: 3, text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", note: "ثلاث مرات" },
    { id: "m4", count: 3, text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", note: "ثلاث مرات" },
    { id: "m5", count: 100, text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", note: "مئة مرة" }
  ],
  evening: [
    { id: "e1", count: 1, text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", note: "مرة واحدة" },
    { id: "e2", count: 1, text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", note: "مرة واحدة" },
    { id: "e3", count: 3, text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", note: "ثلاث مرات" },
    { id: "e4", count: 3, text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", note: "ثلاث مرات" },
    { id: "e5", count: 100, text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", note: "مئة مرة" }
  ],
  sleep: [
    { id: "s1", count: 1, text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", note: "عند النوم" },
    { id: "s2", count: 3, text: "سُبْحَانَ اللَّهِ", note: "ثلاث وثلاثون مرة", target: 33 },
    { id: "s3", count: 3, text: "الْحَمْدُ لِلَّهِ", note: "ثلاث وثلاثون مرة", target: 33 },
    { id: "s4", count: 3, text: "اللَّهُ أَكْبَرُ", note: "أربع وثلاثون مرة", target: 34 }
  ]
};

const ASSISTANT_TOPICS = [
  {
    keys: ["صبر", "الصبر", "ابتلاء", "حزن"],
    title: "الصبر والاستعانة",
    text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    source: "البقرة: ١٥٣",
    note: "قسّم ما تواجهه إلى خطوة عملية الآن، وصلِّ ركعتين، ولا تتخذ قراراً كبيراً تحت ضغط اللحظة."
  },
  {
    keys: ["قلق", "خوف", "توتر", "طمأنينة", "راحة"],
    title: "طمأنينة القلب",
    text: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    source: "الرعد: ٢٨",
    note: "اقرأ الأذكار بهدوء مع تنفّس منتظم، واطلب مساعدة مختص عند استمرار القلق أو تأثيره في حياتك."
  },
  {
    keys: ["توبة", "ذنب", "مغفرة", "يأس"],
    title: "باب التوبة مفتوح",
    text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا",
    source: "الزمر: ٥٣",
    note: "التوبة تبدأ بترك الذنب، الندم، العزم على عدم الرجوع، وردّ الحقوق إن تعلّقت بالناس."
  },
  {
    keys: ["رزق", "مال", "عمل", "دين"],
    title: "التقوى والتوكّل",
    text: "وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    source: "الطلاق: ٢–٣",
    note: "التوكّل يجمع الأخذ بالأسباب المباحة مع اعتماد القلب على الله، لا ترك العمل والتخطيط."
  },
  {
    keys: ["والدين", "الوالدين", "أب", "أم", "بر"],
    title: "برّ الوالدين",
    text: "وَقَضَى رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا",
    source: "الإسراء: ٢٣",
    note: "ابدأ بكلمة طيبة وخدمة عملية، مع حفظ الحدود الشرعية وطلب الإصلاح بالحكمة عند الخلاف."
  },
  {
    keys: ["دعاء", "استجابة", "قرب"],
    title: "قرب الله وإجابة الدعاء",
    text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
    source: "البقرة: ١٨٦",
    note: "ادعُ بيقين، وكرّر الدعاء، وخذ بالأسباب، ولا تجعل تأخر الإجابة سبباً لتركها."
  }
];

const state = {
  view: "home",
  location: loadJSON(STORAGE.location, DEFAULT_LOCATION),
  prayerTimes: null,
  nextPrayer: null,
  countdownTimer: null,
  currentPage: clamp(Number(localStorage.getItem(STORAGE.lastPage)) || 1, 1, 604),
  pageAyahs: [],
  selectedAyah: null,
  audio: null,
  audioList: [],
  audioIndex: -1,
  isAudioPlaying: false,
  quranRequestId: 0,
  dhikrTab: "morning",
  dhikrCounts: loadJSON(STORAGE.dhikr, {}),
  tasbihCount: Number(localStorage.getItem(STORAGE.tasbih)) || 0,
  tasbihTarget: Number(localStorage.getItem(STORAGE.tasbihTarget)) || 33,
  alarm: loadJSON(STORAGE.alarm, { enabled: false, offset: 0, difficulty: "easy" }),
  alarmTimer: null,
  alarmLoop: null,
  alarmAnswer: null,
  audioContext: null,
  deferredInstallPrompt: null,
  compassEnabled: false,
  qiblaBearing: null,
  deviceHeading: null,
  toastTimer: null
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full storage quota must not break core functions.
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  })[character]);
}

function toArabicDigits(value) {
  return String(value).replace(/\d/g, digit => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function normalizeArabic(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTime(value = "") {
  return String(value).split(" ")[0].trim();
}

function formatTime(value) {
  if (!value) return "--:--";
  const [hours, minutes] = cleanTime(value).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("ar-LB", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => element.classList.remove("show"), 2600);
}

function setTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  localStorage.setItem(STORAGE.theme, normalized);
  const use = $("#themeButton use");
  use?.setAttribute("href", normalized === "dark" ? "#i-sun" : "#i-moon");
  $("meta[name='theme-color']")?.setAttribute("content", normalized === "dark" ? "#0c1716" : "#0f766e");
}

function showView(view, shouldFocus = true) {
  if (!$("#view-" + view)) return;
  state.view = view;
  $$(".view").forEach(panel => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  $$(".bottom-nav [data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (shouldFocus) $("#mainContent")?.focus({ preventScroll: true });
  if (view === "quran" && !state.pageAyahs.length) loadQuranPage(state.currentPage);
  if (view === "adhkar") renderAdhkar();
  if (history.replaceState) history.replaceState(null, "", view === "home" ? location.pathname + location.search : `#${view}`);
}

function showTool(tool) {
  showView("tools");
  $$(".tool-panel").forEach(panel => panel.classList.toggle("hidden", panel.id !== "tool-" + tool));
  $$(".tool-card").forEach(button => button.classList.toggle("active", button.dataset.tool === tool));
  setTimeout(() => $("#tool-" + tool)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

function setDates() {
  const now = new Date();
  $("#gregorianDate").textContent = new Intl.DateTimeFormat("ar-LB", { weekday: "long", day: "numeric", month: "long" }).format(now);
  try {
    $("#hijriDate").textContent = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(now);
  } catch {
    $("#hijriDate").textContent = "التاريخ الهجري";
  }
  const verse = DAILY_VERSES[now.getDate() % DAILY_VERSES.length];
  $("#dailyVerseText").textContent = verse.text;
  $("#dailyVerseRef").textContent = verse.ref;
}

function updateLocationLabels() {
  const label = state.location.label || "موقعي الحالي";
  $("#locationLabel").textContent = label;
  $("#prayerLocationLabel").textContent = label;
}

async function requestLocation() {
  if (!navigator.geolocation) {
    toast("المتصفح لا يدعم تحديد الموقع");
    return;
  }

  toast("جاري تحديد موقعك");
  navigator.geolocation.getCurrentPosition(async position => {
    state.location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      label: "موقعي الحالي",
      isDefault: false
    };
    saveJSON(STORAGE.location, state.location);
    updateLocationLabels();
    calculateQibla();
    await loadPrayerTimes();
    toast("تم تحديث الموقع والمواقيت");
  }, error => {
    const message = error.code === 1 ? "تم رفض صلاحية الموقع" : "تعذر تحديد الموقع";
    toast(message + "، سيبقى موقع بيروت الافتراضي");
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 600000 });
}

function getApiDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

async function loadPrayerTimes() {
  const { latitude, longitude } = state.location;
  renderPrayerLoading();
  try {
    const url = `https://api.aladhan.com/v1/timings/${getApiDate()}?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&method=3&school=0`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Prayer API returned " + response.status);
    const payload = await response.json();
    if (payload.code !== 200 || !payload.data?.timings) throw new Error("Invalid prayer response");
    state.prayerTimes = Object.fromEntries(PRAYER_ORDER.map(key => [key, cleanTime(payload.data.timings[key])]));
    if (payload.data.date?.hijri) {
      const hijri = payload.data.date.hijri;
      $("#hijriDate").textContent = `${toArabicDigits(hijri.day)} ${hijri.month.ar} ${toArabicDigits(hijri.year)} هـ`;
    }
    renderPrayerTimes();
    updateNextPrayer();
    scheduleFajrAlarm();
  } catch (error) {
    console.error(error);
    state.prayerTimes = null;
    renderPrayerError();
    $("#nextPrayerName").textContent = "المواقيت غير متاحة";
    $("#nextPrayerTime").textContent = "--:--";
    $("#prayerCountdown").textContent = "تحقق من الاتصال";
  }
}

function renderPrayerLoading() {
  $("#prayerGrid").innerHTML = PRAYER_ORDER.map(key => `
    <article class="prayer-time-card"><div><span>${PRAYER_NAMES[key]}</span><time>--:--</time></div><small>جاري التحميل</small></article>
  `).join("");
}

function renderPrayerError() {
  $("#prayerGrid").innerHTML = `<article class="prayer-time-card" style="grid-column:1/-1"><div><span>تعذر تحميل المواقيت</span><time>--:--</time></div><small>تحقق من الاتصال</small></article>`;
}

function parsePrayerDate(time, tomorrow = false) {
  const [hours, minutes] = cleanTime(time).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  if (tomorrow) date.setDate(date.getDate() + 1);
  return date;
}

function determineNextPrayer(now = new Date()) {
  if (!state.prayerTimes) return null;
  for (const key of COUNTDOWN_ORDER) {
    const date = parsePrayerDate(state.prayerTimes[key]);
    if (date > now) return { key, date, time: state.prayerTimes[key] };
  }
  return { key: "Fajr", date: parsePrayerDate(state.prayerTimes.Fajr, true), time: state.prayerTimes.Fajr };
}

function renderPrayerTimes() {
  if (!state.prayerTimes) {
    renderPrayerError();
    return;
  }
  const next = determineNextPrayer();
  $("#prayerGrid").innerHTML = PRAYER_ORDER.map(key => {
    const active = next?.key === key;
    const label = key === "Sunrise" ? "ليس صلاة" : active ? "القادمة" : "اليوم";
    return `<article class="prayer-time-card ${active ? "active" : ""}"><div><span>${PRAYER_NAMES[key]}</span><time datetime="${escapeHTML(state.prayerTimes[key])}">${escapeHTML(formatTime(state.prayerTimes[key]))}</time></div><small>${label}</small></article>`;
  }).join("");
}

function updateNextPrayer() {
  clearInterval(state.countdownTimer);
  state.countdownTimer = null;
  if (!state.prayerTimes) return;
  const tick = () => {
    if (!state.prayerTimes) return;
    const now = new Date();
    const next = determineNextPrayer(now);
    state.nextPrayer = next;
    const remaining = Math.max(0, next.date.getTime() - now.getTime());
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    $("#nextPrayerName").textContent = PRAYER_NAMES[next.key];
    $("#nextPrayerTime").textContent = formatTime(next.time);
    $("#prayerCountdown").textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    if (remaining < 1000) {
      renderPrayerTimes();
      scheduleFajrAlarm();
    }
  };
  tick();
  state.countdownTimer = setInterval(tick, 1000);
  renderPrayerTimes();
}

function calculateQibla() {
  const { latitude, longitude } = state.location;
  const kaabaLat = 21.4225 * Math.PI / 180;
  const kaabaLon = 39.8262 * Math.PI / 180;
  const lat = latitude * Math.PI / 180;
  const lon = longitude * Math.PI / 180;
  const deltaLon = kaabaLon - lon;
  const y = Math.sin(deltaLon);
  const x = Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(deltaLon);
  state.qiblaBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  $("#qiblaDegrees").textContent = `${toArabicDigits(Math.round(state.qiblaBearing))}°`;
  updateQiblaNeedle();
}

function updateQiblaNeedle() {
  if (state.qiblaBearing == null) return;
  const rotation = state.deviceHeading == null ? state.qiblaBearing : state.qiblaBearing - state.deviceHeading;
  $("#qiblaNeedle").style.transform = `rotate(${rotation}deg)`;
}

function orientationHandler(event) {
  let heading = event.webkitCompassHeading;
  if (typeof heading !== "number" && event.absolute && typeof event.alpha === "number") heading = 360 - event.alpha;
  if (typeof heading !== "number" && typeof event.alpha === "number") heading = 360 - event.alpha;
  if (typeof heading !== "number") return;
  state.deviceHeading = heading;
  updateQiblaNeedle();
  $("#qiblaHint").textContent = `حرّك الهاتف حتى يشير السهم إلى الكعبة · اتجاه الجهاز ${toArabicDigits(Math.round(heading))}°`;
}

async function enableCompass() {
  try {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") throw new Error("denied");
    }
    if (!state.compassEnabled) {
      window.addEventListener("deviceorientationabsolute", orientationHandler, true);
      window.addEventListener("deviceorientation", orientationHandler, true);
      state.compassEnabled = true;
    }
    $("#enableCompassButton span").textContent = "البوصلة مفعّلة";
    toast("تم تفعيل بوصلة الهاتف");
  } catch {
    toast("تعذر تشغيل البوصلة أو تم رفض الصلاحية");
  }
}

function getQuranCache() {
  return loadJSON(STORAGE.quranCache, {});
}

function cacheQuranPage(page, data) {
  const cache = getQuranCache();
  cache[page] = { savedAt: Date.now(), data };
  const keys = Object.keys(cache).sort((a, b) => cache[b].savedAt - cache[a].savedAt);
  keys.slice(14).forEach(key => delete cache[key]);
  saveJSON(STORAGE.quranCache, cache);
}

function setQuranState(mode) {
  $("#quranLoading").classList.toggle("hidden", mode !== "loading");
  $("#ayahContainer").classList.toggle("hidden", mode !== "ready");
  $("#quranError").classList.toggle("hidden", mode !== "error");
}

async function loadQuranPage(page, options = {}) {
  const targetPage = clamp(Number(page) || 1, 1, 604);
  const requestId = ++state.quranRequestId;
  stopAudio();
  state.currentPage = targetPage;
  state.selectedAyah = null;
  state.pageAyahs = [];
  localStorage.setItem(STORAGE.lastPage, String(targetPage));
  $("#lastPageLabel").textContent = `آخر قراءة: ${toArabicDigits(targetPage)}`;
  $("#pageInput").value = targetPage;
  $("#mushafPage").textContent = toArabicDigits(targetPage);
  $("#selectedAyahText").textContent = "حدد آية من الصفحة";
  $("#speechResult").classList.add("hidden");
  setQuranState("loading");

  const cache = getQuranCache()[targetPage]?.data;
  if (cache?.ayahs?.length) {
    renderQuranPage(cache);
    if (options.autoplay) await playPageAudio();
  }

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${targetPage}/quran-uthmani`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Quran API returned " + response.status);
    const payload = await response.json();
    if (requestId !== state.quranRequestId) return;
    if (payload.code !== 200 || !payload.data?.ayahs?.length) throw new Error("Invalid Quran response");
    cacheQuranPage(targetPage, payload.data);
    renderQuranPage(payload.data);
    if (options.autoplay && !state.isAudioPlaying) await playPageAudio();
  } catch (error) {
    console.error(error);
    if (requestId !== state.quranRequestId) return;
    if (!state.pageAyahs.length) setQuranState("error");
    else toast("تم عرض النسخة المحفوظة لعدم توفر الاتصال");
  }
}

function renderQuranPage(data) {
  state.pageAyahs = data.ayahs;
  const surahNames = [...new Set(data.ayahs.map(ayah => ayah.surah?.name).filter(Boolean))];
  $("#mushafSurah").textContent = surahNames.join(" · ") || "القرآن الكريم";
  $("#mushafJuz").textContent = `الجزء ${toArabicDigits(data.ayahs[0]?.juz || "—")}`;
  $("#mushafPage").textContent = toArabicDigits(state.currentPage);

  let previousSurah = null;
  const content = data.ayahs.map(ayah => {
    const divider = ayah.surah?.number !== previousSurah
      ? `<span class="surah-divider">سورة ${escapeHTML(ayah.surah?.name || "")}</span>`
      : "";
    previousSurah = ayah.surah?.number;
    return `${divider}<span class="ayah" tabindex="0" role="button" data-ayah-number="${ayah.number}" aria-label="الآية ${ayah.numberInSurah}">${escapeHTML(ayah.text)} <span class="ayah-number">${toArabicDigits(ayah.numberInSurah)}</span></span> `;
  }).join("");

  $("#ayahContainer").innerHTML = content;
  setQuranState("ready");
  $$(".ayah", $("#ayahContainer")).forEach(element => {
    element.addEventListener("click", () => selectAyah(Number(element.dataset.ayahNumber)));
    element.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectAyah(Number(element.dataset.ayahNumber));
      }
    });
  });
}

function selectAyah(number) {
  const ayah = state.pageAyahs.find(item => item.number === number);
  if (!ayah) return;
  state.selectedAyah = ayah;
  $$(".ayah", $("#ayahContainer")).forEach(element => element.classList.toggle("selected", Number(element.dataset.ayahNumber) === number));
  $("#selectedAyahText").textContent = ayah.text;
  $("#speechResult").classList.add("hidden");
  $("#speechStatus").textContent = "تم تحديد الآية";
}

function changeQuranPage(delta) {
  const nextPage = clamp(state.currentPage + delta, 1, 604);
  if (nextPage === state.currentPage) {
    toast(delta > 0 ? "هذه آخر صفحة" : "هذه أول صفحة");
    return;
  }
  loadQuranPage(nextPage);
  $("#mushafCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function fetchAudioList() {
  const response = await fetch(`https://api.alquran.cloud/v1/page/${state.currentPage}/ar.alafasy`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Audio API returned " + response.status);
  const payload = await response.json();
  if (payload.code !== 200 || !payload.data?.ayahs?.length) throw new Error("Invalid audio response");
  return payload.data.ayahs.filter(ayah => ayah.audio).map(ayah => ({ number: ayah.number, url: ayah.audio }));
}

async function playPageAudio() {
  if (state.isAudioPlaying) {
    stopAudio();
    return;
  }
  try {
    $("#audioButton span").textContent = "تحميل";
    state.audioList = await fetchAudioList();
    if (!state.audioList.length) throw new Error("No audio URLs");
    state.isAudioPlaying = true;
    updateAudioButton();
    playAudioAt(0);
  } catch (error) {
    console.error(error);
    state.isAudioPlaying = false;
    updateAudioButton();
    toast("تعذر تحميل التلاوة");
  }
}

function playAudioAt(index) {
  if (!state.isAudioPlaying || index >= state.audioList.length) {
    const shouldContinue = state.isAudioPlaying && state.currentPage < 604;
    stopAudio();
    if (shouldContinue) loadQuranPage(state.currentPage + 1, { autoplay: true });
    return;
  }
  state.audioIndex = index;
  const item = state.audioList[index];
  markPlayingAyah(item.number);
  state.audio = new Audio(item.url);
  state.audio.preload = "auto";
  state.audio.addEventListener("ended", () => playAudioAt(index + 1), { once: true });
  state.audio.addEventListener("error", () => playAudioAt(index + 1), { once: true });
  state.audio.play().catch(error => {
    console.error(error);
    stopAudio();
    toast("اضغط الاستماع مرة أخرى للسماح بتشغيل الصوت");
  });
}

function stopAudio() {
  state.isAudioPlaying = false;
  if (state.audio) {
    state.audio.pause();
    state.audio.removeAttribute("src");
    state.audio.load();
  }
  state.audio = null;
  state.audioIndex = -1;
  $$(".ayah.playing").forEach(element => element.classList.remove("playing"));
  updateAudioButton();
}

function markPlayingAyah(number) {
  $$(".ayah", $("#ayahContainer")).forEach(element => {
    const isPlaying = Number(element.dataset.ayahNumber) === number;
    element.classList.toggle("playing", isPlaying);
    if (isPlaying) element.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function updateAudioButton() {
  const use = $("#audioButton use");
  use?.setAttribute("href", state.isAudioPlaying ? "#i-pause" : "#i-play");
  $("#audioButton span").textContent = state.isAudioPlaying ? "إيقاف" : "استماع";
}

function startMemorization() {
  if (!state.selectedAyah) {
    if (state.pageAyahs[0]) selectAyah(state.pageAyahs[0].number);
    else {
      toast("حمّل صفحة من المصحف أولاً");
      return;
    }
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toast("التسميع الصوتي غير مدعوم في هذا المتصفح");
    $("#speechStatus").textContent = "غير مدعوم";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $("#speechStatus").textContent = "استمع إليك الآن";
  $("#memorizeButton span").textContent = "جاري الاستماع";

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    showSpeechComparison(state.selectedAyah.text, transcript);
  };
  recognition.onerror = event => {
    console.error(event.error);
    $("#speechStatus").textContent = "تعذر الاستماع";
    $("#memorizeButton span").textContent = "ابدأ التسميع";
    toast(event.error === "not-allowed" ? "تم رفض صلاحية الميكروفون" : "تعذر فهم التلاوة، أعد المحاولة");
  };
  recognition.onend = () => {
    if ($("#speechStatus").textContent === "استمع إليك الآن") $("#speechStatus").textContent = "انتهى الاستماع";
    $("#memorizeButton span").textContent = "ابدأ التسميع";
  };
  recognition.start();
}

function showSpeechComparison(target, transcript) {
  const targetWords = normalizeArabic(target).split(" ").filter(Boolean);
  const heardWords = normalizeArabic(transcript).split(" ").filter(Boolean);
  let matched = 0;
  let cursor = 0;
  const resultWords = targetWords.map(word => {
    const position = heardWords.indexOf(word, cursor);
    if (position !== -1) {
      matched += 1;
      cursor = position + 1;
      return `<span class="speech-word correct">${escapeHTML(word)}</span>`;
    }
    return `<span class="speech-word missed">${escapeHTML(word)}</span>`;
  });
  const score = targetWords.length ? Math.round(matched / targetWords.length * 100) : 0;
  $("#speechResult").innerHTML = `<strong>الدقة التقريبية: ${toArabicDigits(score)}٪</strong><div>${resultWords.join(" ")}</div><small>المسموع: ${escapeHTML(transcript)}</small>`;
  $("#speechResult").classList.remove("hidden");
  $("#speechStatus").textContent = score >= 85 ? "متقن" : score >= 55 ? "جيد، أعد الآية" : "تحتاج إعادة";
}

function getDhikrTarget(item) {
  return item.target || item.count;
}

function renderAdhkar() {
  const items = ADHKAR[state.dhikrTab];
  $("#adhkarList").innerHTML = items.map(item => {
    const target = getDhikrTarget(item);
    const current = clamp(Number(state.dhikrCounts[item.id]) || 0, 0, target);
    const remaining = Math.max(0, target - current);
    const done = remaining === 0;
    return `<article class="dhikr-card ${done ? "done" : ""}" data-dhikr-id="${item.id}">
      <p class="dhikr-text">${escapeHTML(item.text)}</p>
      <p class="dhikr-note">${escapeHTML(item.note)}</p>
      <button class="dhikr-counter" type="button" data-dhikr-count="${item.id}"><span>${done ? "تمّ الذكر" : `المتبقي ${toArabicDigits(remaining)}`}</span><strong>${toArabicDigits(current)} / ${toArabicDigits(target)}</strong></button>
    </article>`;
  }).join("");
  $$('[data-dhikr-count]').forEach(button => button.addEventListener("click", () => incrementDhikr(button.dataset.dhikrCount)));
  updateDhikrProgress();
}

function incrementDhikr(id) {
  const item = ADHKAR[state.dhikrTab].find(entry => entry.id === id);
  if (!item) return;
  const target = getDhikrTarget(item);
  const current = Number(state.dhikrCounts[id]) || 0;
  state.dhikrCounts[id] = current >= target ? 0 : current + 1;
  saveJSON(STORAGE.dhikr, state.dhikrCounts);
  if (navigator.vibrate) navigator.vibrate(20);
  renderAdhkar();
}

function updateDhikrProgress() {
  const items = ADHKAR[state.dhikrTab];
  const total = items.reduce((sum, item) => sum + getDhikrTarget(item), 0);
  const completed = items.reduce((sum, item) => sum + clamp(Number(state.dhikrCounts[item.id]) || 0, 0, getDhikrTarget(item)), 0);
  const percent = total ? Math.round(completed / total * 100) : 0;
  $("#adhkarProgress").textContent = `${toArabicDigits(percent)}٪`;
}

function resetDhikr() {
  ADHKAR[state.dhikrTab].forEach(item => { state.dhikrCounts[item.id] = 0; });
  saveJSON(STORAGE.dhikr, state.dhikrCounts);
  renderAdhkar();
  toast("تمت إعادة عدادات هذه المجموعة");
}

function updateTasbih() {
  $("#tasbihCount").textContent = toArabicDigits(state.tasbihCount);
  $("#tasbihMiniCount").textContent = `${toArabicDigits(state.tasbihCount)} تسبيحة`;
  $("#tasbihTargetState").textContent = `${toArabicDigits(state.tasbihCount)} / ${toArabicDigits(state.tasbihTarget)}`;
}

function incrementTasbih() {
  state.tasbihCount += 1;
  localStorage.setItem(STORAGE.tasbih, String(state.tasbihCount));
  updateTasbih();
  if (navigator.vibrate && state.tasbihCount % state.tasbihTarget === 0) navigator.vibrate([60, 60, 120]);
  else if (navigator.vibrate) navigator.vibrate(15);
}

function resetTasbih() {
  state.tasbihCount = 0;
  localStorage.setItem(STORAGE.tasbih, "0");
  updateTasbih();
  toast("تم تصفير المسبحة");
}

function setTasbihTarget(target) {
  state.tasbihTarget = Number(target);
  localStorage.setItem(STORAGE.tasbihTarget, String(state.tasbihTarget));
  updateTasbih();
}

function getNumericValue(selector) {
  const value = Number($(selector).value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function calculateZakat() {
  const assets = getNumericValue("#zakatCash") + getNumericValue("#zakatMetals") + getNumericValue("#zakatTrade");
  const debts = getNumericValue("#zakatDebt");
  const nisab = getNumericValue("#zakatNisab");
  const net = Math.max(0, assets - debts);
  const result = $("#zakatResult");
  if (!nisab) {
    result.innerHTML = "أدخل قيمة النصاب الحالية بعملتك أولاً.";
  } else if (net < nisab) {
    result.innerHTML = `<strong>لا تبلغ النصاب المدخل</strong><span>صافي المال: ${new Intl.NumberFormat("ar-LB", { maximumFractionDigits: 2 }).format(net)}</span>`;
  } else {
    const zakat = net * 0.025;
    result.innerHTML = `<span>الزكاة التقديرية</span><strong>${new Intl.NumberFormat("ar-LB", { maximumFractionDigits: 2 }).format(zakat)}</strong><small>عن صافي مال قدره ${new Intl.NumberFormat("ar-LB", { maximumFractionDigits: 2 }).format(net)}</small>`;
  }
  result.classList.remove("hidden");
}

function searchAssistant(query) {
  const normalized = normalizeArabic(query);
  const topic = ASSISTANT_TOPICS.find(item => item.keys.some(key => normalized.includes(normalizeArabic(key))));
  const result = $("#assistantResult");
  if (!normalized) {
    result.innerHTML = "<p>اكتب موضوعاً محدداً للبحث في الدليل المحلي.</p>";
    return;
  }
  if (!topic) {
    result.innerHTML = `<h3>لا توجد مادة محفوظة لهذا الموضوع</h3><p>جرّب كلمات مثل الصبر، القلق، التوبة، الرزق، الوالدين أو الدعاء.</p>`;
    return;
  }
  result.innerHTML = `<h3>${escapeHTML(topic.title)}</h3><p>${escapeHTML(topic.text)}</p><span class="source">${escapeHTML(topic.source)}</span><p style="margin-top:10px">${escapeHTML(topic.note)}</p>`;
}

function saveAlarmSettings() {
  state.alarm.enabled = $("#alarmEnabled").checked;
  state.alarm.offset = Number($("#alarmOffset").value) || 0;
  state.alarm.difficulty = $("#alarmDifficulty").value;
  saveJSON(STORAGE.alarm, state.alarm);
  updateAlarmUI();
  scheduleFajrAlarm();
}

async function enableAlarmFromToggle() {
  if ($("#alarmEnabled").checked) {
    await primeAudioContext();
    if ("Notification" in window && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch { /* not required */ }
    }
  }
  saveAlarmSettings();
}

function updateAlarmUI() {
  $("#alarmEnabled").checked = Boolean(state.alarm.enabled);
  $("#alarmOffset").value = String(state.alarm.offset || 0);
  $("#alarmDifficulty").value = state.alarm.difficulty || "easy";
  $("#alarmStatusMini").textContent = state.alarm.enabled ? `مفعّل قبل الفجر بـ${toArabicDigits(state.alarm.offset)} د` : "غير مفعّل";
}

function scheduleFajrAlarm() {
  clearTimeout(state.alarmTimer);
  state.alarmTimer = null;
  if (!state.alarm.enabled || !state.prayerTimes?.Fajr) return;
  const alarmDate = parsePrayerDate(state.prayerTimes.Fajr);
  alarmDate.setMinutes(alarmDate.getMinutes() - (state.alarm.offset || 0));
  if (alarmDate <= new Date()) alarmDate.setDate(alarmDate.getDate() + 1);
  const delay = alarmDate.getTime() - Date.now();
  const maxTimeout = 2147483647;
  state.alarmTimer = setTimeout(() => triggerAlarm(false), Math.min(delay, maxTimeout));
}

async function primeAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    state.audioContext ||= new AudioContext();
    if (state.audioContext.state === "suspended") await state.audioContext.resume();
  } catch (error) {
    // Autoplay policies may block the tone; the visual alarm must still run.
    console.error("Audio context unavailable", error);
  }
}

function makeAlarmQuestion() {
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const difficulty = state.alarm.difficulty || "easy";
  let question;
  let answer;
  if (difficulty === "hard") {
    const a = random(5, 14), b = random(3, 9), c = random(2, 20);
    question = `${a} × ${b} + ${c}`;
    answer = a * b + c;
  } else if (difficulty === "medium") {
    const a = random(3, 12), b = random(3, 12);
    question = `${a} × ${b}`;
    answer = a * b;
  } else {
    const a = random(4, 24), b = random(3, 20);
    question = `${a} + ${b}`;
    answer = a + b;
  }
  state.alarmAnswer = answer;
  $("#alarmQuestion").textContent = question;
}

async function triggerAlarm(isTest = false) {
  await primeAudioContext();
  makeAlarmQuestion();
  $("#alarmOverlay").classList.remove("hidden");
  $("#alarmAnswer").value = "";
  $("#alarmError").textContent = isTest ? "هذا اختبار للمنبّه" : "";
  setTimeout(() => $("#alarmAnswer").focus(), 80);
  playAlarmPattern();
  clearInterval(state.alarmLoop);
  state.alarmLoop = setInterval(playAlarmPattern, 3600);
  if (navigator.vibrate) navigator.vibrate([700, 250, 700, 250, 1000]);
  if ("Notification" in window && Notification.permission === "granted") {
    navigator.serviceWorker?.ready.then(registration => registration.showNotification("سكينة: حان وقت الفجر", {
      body: "الصلاة خير من النوم. افتح التطبيق وأكمل مسألة الإيقاف.",
      icon: "assets/icon-192.png",
      badge: "assets/icon-192.png",
      tag: "sakeena-fajr",
      renotify: true
    })).catch(() => {});
  }
}

function playAlarmPattern() {
  const context = state.audioContext;
  if (!context || context.state !== "running") return;
  [0, .42, .84].forEach((offset, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = index === 1 ? 740 : 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.28, context.currentTime + offset + .03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + .32);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + .34);
  });
}

function stopAlarm() {
  clearInterval(state.alarmLoop);
  state.alarmLoop = null;
  if (navigator.vibrate) navigator.vibrate(0);
  $("#alarmOverlay").classList.add("hidden");
  scheduleFajrAlarm();
}

function handleAlarmSubmit(event) {
  event.preventDefault();
  const answer = Number($("#alarmAnswer").value);
  if (answer === state.alarmAnswer) {
    stopAlarm();
    toast("تم إيقاف المنبّه");
  } else {
    $("#alarmError").textContent = "الإجابة غير صحيحة. حاول مرة أخرى.";
    $("#alarmAnswer").select();
    if (navigator.vibrate) navigator.vibrate([100, 80, 100]);
  }
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  const badge = $("#networkBadge");
  badge.textContent = online ? "متصل" : "دون اتصال";
  badge.classList.toggle("offline", !online);
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    $("#installButton").classList.remove("hidden");
  });
  $("#installButton").addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    $("#installButton").classList.add("hidden");
  });
  window.addEventListener("appinstalled", () => toast("تم تثبيت سكينة على جهازك"));
}

function setupQuranSwipe() {
  let startX = 0;
  let startY = 0;
  const card = $("#mushafCard");
  card.addEventListener("touchstart", event => {
    startX = event.changedTouches[0].clientX;
    startY = event.changedTouches[0].clientY;
  }, { passive: true });
  card.addEventListener("touchend", event => {
    const deltaX = event.changedTouches[0].clientX - startX;
    const deltaY = event.changedTouches[0].clientY - startY;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
    if (deltaX > 0) changeQuranPage(1);
    else changeQuranPage(-1);
  }, { passive: true });
}

function bindEvents() {
  $$(".bottom-nav [data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener("click", () => showView(button.dataset.go)));
  $$('[data-tool]').forEach(button => button.addEventListener("click", () => showTool(button.dataset.tool)));

  $("#themeButton").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#homeLocationButton").addEventListener("click", requestLocation);
  $("#refreshLocationButton").addEventListener("click", requestLocation);
  $("#enableCompassButton").addEventListener("click", enableCompass);

  $("#goToPageButton").addEventListener("click", () => loadQuranPage($("#pageInput").value));
  $("#pageInput").addEventListener("keydown", event => { if (event.key === "Enter") loadQuranPage(event.currentTarget.value); });
  $("#resumePageButton").addEventListener("click", () => loadQuranPage(Number(localStorage.getItem(STORAGE.lastPage)) || 1));
  $("#bookmarkPageButton").addEventListener("click", () => {
    localStorage.setItem(STORAGE.bookmark, String(state.currentPage));
    toast(`تم حفظ الصفحة ${toArabicDigits(state.currentPage)}`);
  });
  $("#bookmarkPageButton").addEventListener("dblclick", () => {
    const bookmark = Number(localStorage.getItem(STORAGE.bookmark));
    if (bookmark) loadQuranPage(bookmark);
  });
  $("#nextPageButton").addEventListener("click", () => changeQuranPage(1));
  $("#previousPageButton").addEventListener("click", () => changeQuranPage(-1));
  $("#retryQuranButton").addEventListener("click", () => loadQuranPage(state.currentPage));
  $("#audioButton").addEventListener("click", playPageAudio);
  $("#memorizeButton").addEventListener("click", startMemorization);

  $$('[data-dhikr-tab]').forEach(button => button.addEventListener("click", () => {
    state.dhikrTab = button.dataset.dhikrTab;
    $$('[data-dhikr-tab]').forEach(tab => tab.classList.toggle("active", tab === button));
    renderAdhkar();
  }));
  $("#resetAdhkarButton").addEventListener("click", resetDhikr);

  $("#tasbihButton").addEventListener("click", incrementTasbih);
  $("#resetTasbihButton").addEventListener("click", resetTasbih);
  $$('[data-target]').forEach(button => button.addEventListener("click", () => setTasbihTarget(button.dataset.target)));
  $("#calculateZakatButton").addEventListener("click", calculateZakat);
  $("#assistantButton").addEventListener("click", () => searchAssistant($("#assistantInput").value));
  $("#assistantInput").addEventListener("keydown", event => { if (event.key === "Enter") searchAssistant(event.currentTarget.value); });
  $$(".topic-chips button").forEach(button => button.addEventListener("click", () => {
    $("#assistantInput").value = button.textContent;
    searchAssistant(button.textContent);
  }));

  $("#alarmEnabled").addEventListener("change", enableAlarmFromToggle);
  $("#alarmOffset").addEventListener("change", saveAlarmSettings);
  $("#alarmDifficulty").addEventListener("change", saveAlarmSettings);
  $("#testAlarmButton").addEventListener("click", () => triggerAlarm(true));
  $("#alarmForm").addEventListener("submit", handleAlarmSubmit);

  window.addEventListener("online", () => { updateNetworkStatus(); loadPrayerTimes(); });
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("hashchange", () => {
    const requestedView = location.hash.slice(1);
    if (["home", "quran", "prayers", "adhkar", "tools"].includes(requestedView)) showView(requestedView);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      updateNextPrayer();
      scheduleFajrAlarm();
    }
  });
  setupQuranSwipe();
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  try {
    await navigator.serviceWorker.register("sw.js", { scope: "./" });
  } catch (error) {
    console.error("Service worker registration failed", error);
  }
}

async function init() {
  const savedTheme = localStorage.getItem(STORAGE.theme);
  const preferredTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(savedTheme || preferredTheme);
  setDates();
  updateLocationLabels();
  updateNetworkStatus();
  updateTasbih();
  updateAlarmUI();
  calculateQibla();
  bindEvents();
  setupInstallPrompt();
  const initialView = ["quran", "prayers", "adhkar", "tools"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  showView(initialView, false);
  await Promise.allSettled([loadPrayerTimes(), registerServiceWorker()]);
}

init();
