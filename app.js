// ===== English Fun 4 — logic chính (chế độ bài thi) =====
// Bé làm bài tự do: bỏ qua, quay lại, đổi đáp án thoải mái.
// Chỉ khi NỘP BÀI mới chấm điểm và hiện bảng đáp án kèm giải thích.
// Có cấp độ (Cơ bản / Nâng cao) và chế độ "Thi thử cuối kỳ".

const QUIZ_SIZE = 30;          // số câu mỗi lượt luyện tập
const QUIZ_MINUTES = 20;       // thời gian luyện tập (phút)
const EXAM_SIZE = 30;          // số câu đề thi thử
const EXAM_MINUTES = 25;       // thời gian đề thi thử (phút)

const LS = {
  customQuestions: "ef4_custom_questions",
  history: "ef4_history",
  wrongCounts: "ef4_wrong_counts",
  badges: "ef4_badges",
  seen: "ef4_seen_counts",
};

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ---------- Huy hiệu ----------
const BADGES = [
  { id: "first",   icon: "🎈", name: "Bài đầu tiên",      check: (s) => s.history.length >= 1 },
  { id: "star3",   icon: "🌟", name: "Đạt 3 sao",          check: (s) => s.history.some(h => h.stars === 3) },
  { id: "perfect", icon: "🏆", name: "Điểm tuyệt đối",     check: (s) => s.history.some(h => h.score === h.total) },
  { id: "exam",    icon: "🎓", name: "Hoàn thành đề thi thử", check: (s) => s.history.some(h => h.mode === "exam") },
  { id: "five",    icon: "🔥", name: "Hoàn thành 5 bài",    check: (s) => s.history.length >= 5 },
  { id: "ten",     icon: "💎", name: "Hoàn thành 10 bài",   check: (s) => s.history.length >= 10 },
  { id: "c100",    icon: "🧠", name: "100 câu trả lời đúng", check: (s) => s.history.reduce((n, h) => n + h.score, 0) >= 100 },
];

// ---------- Trạng thái ----------
let selectedTopic = "all";
let selectedLevel = "all";     // "all" | 1 | 2
let lastMode = "practice";
let quiz = null;

// ---------- Tiện ích ----------
const $ = (id) => document.getElementById(id);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const normText = (s) => (s || "").toLowerCase().trim()
  .replace(/[’]/g, "'").replace(/\s+/g, " ").replace(/[.?!]+$/, "");

// ---------- Âm thanh (Web Audio, không cần file) ----------
let audioCtx = null;
function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function beep(freq, dur, delay = 0, type = "sine", vol = 0.15) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t); o.stop(t + dur);
}
function playTap() { beep(620, .05, 0, "square", .06); }
function playFanfare() {
  beep(523, .15, 0); beep(659, .15, .15); beep(784, .15, .3);
  beep(1047, .35, .45); beep(784, .15, .85); beep(1047, .6, 1.0);
}

function allBasicMC() {
  return QUESTION_BANK.concat(load(LS.customQuestions, []));
}

function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
if ("speechSynthesis" in window) speechSynthesis.getVoices();

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
  window.scrollTo(0, 0);
}

// ---------- Chuyển dữ liệu nguồn thành câu hỏi trong bài ----------
// Đọc hiểu: dàn phẳng mỗi câu hỏi thành 1 mục (dùng chung đoạn văn)
const READING_ITEMS = [];
READING_BANK.forEach(p => p.questions.forEach(q =>
  READING_ITEMS.push({ t: p.t, passage: p.passage, q: q.q, o: q.o, a: q.a, e: q.e })));

function makeMC(r) {
  const order = shuffle([0, 1, 2, 3]);
  return { type: "mc", kind: "mc", t: r.t, d: r.d || 1, q: r.q,
    options: order.map(i => r.o[i]), answer: order.indexOf(r.a), s: r.s, e: r.e,
    _key: "mc:" + r.q };
}
function makeOdd(r) {
  const order = shuffle([0, 1, 2, 3]);
  return { type: "mc", kind: "odd", t: r.t, d: 2,
    q: "Chọn từ KHÁC LOẠI với những từ còn lại:",
    options: order.map(i => r.words[i]), answer: order.indexOf(r.odd),
    s: r.words.join(", "), e: r.e, _key: "odd:" + r.words.join(",") };
}
function makeError(r) {
  return { type: "mc", kind: "error", t: r.t, d: 2,
    q: "Tìm phần SAI trong câu sau:", context: r.parts.join(" "),
    options: r.parts, answer: r.a, noShuffle: true,
    s: r.parts.join(" "), e: r.e, _key: "err:" + r.parts.join(" ") };
}
function makeReading(r) {
  const order = shuffle([0, 1, 2, 3]);
  return { type: "mc", kind: "reading", t: r.t, d: 2, context: r.passage, q: r.q,
    options: order.map(i => r.o[i]), answer: order.indexOf(r.a),
    s: r.passage, e: r.e, _key: "rd:" + r.q };
}
function makeTransform(r) {
  return { type: "transform", t: r.t, d: 2, original: r.original, prompt: r.prompt,
    given: r.given, answer: r.answer, accept: (r.accept || [r.answer]).map(normText),
    s: r.answer, e: r.e, _key: "tr:" + r.original };
}
function makeSpell(q) {
  return { type: "spell", t: q.t, d: 1, img: q.img, w: q.w,
    accept: (q.accept || [q.w]).map(x => x.toLowerCase()), s: q.w, _key: "sp:" + q.w };
}
function makeReorder(q) {
  return { type: "reorder", t: q.t, d: 1, sentence: q.sentence,
    words: shuffle(q.sentence.split(" ")), s: q.sentence, _key: "ro:" + q.sentence };
}
function makeMatch(q) {
  return { type: "match", t: q.t, d: 1, pairs: q.pairs,
    left: shuffle(q.pairs.map(p => p.img)), right: shuffle(q.pairs.map(p => p.w)),
    s: q.pairs.map(p => p.w).join(". "), _key: "ma:" + q.pairs.map(p => p.w).join(",") };
}

// nhóm nguồn: pool() trả về mảng nguồn, key() tạo khóa nhận diện, make() dựng mục
const GROUPS = {
  mcBasic:   { pool: () => allBasicMC(), key: r => "mc:" + r.q, make: makeMC },
  mcAdv:     { pool: () => ADVANCED_BANK, key: r => "mc:" + r.q, make: makeMC },
  odd:       { pool: () => ODD_BANK, key: r => "odd:" + r.words.join(","), make: makeOdd },
  error:     { pool: () => ERROR_BANK, key: r => "err:" + r.parts.join(" "), make: makeError },
  reading:   { pool: () => READING_ITEMS, key: r => "rd:" + r.q, make: makeReading },
  transform: { pool: () => TRANSFORM_BANK, key: r => "tr:" + r.original, make: makeTransform },
  spell:     { pool: () => SPELL_BANK, key: r => "sp:" + r.w, make: makeSpell },
  reorder:   { pool: () => REORDER_BANK, key: r => "ro:" + r.sentence, make: makeReorder },
  match:     { pool: () => MATCH_BANK, key: r => "ma:" + r.pairs.map(p => p.w).join(","), make: makeMatch },
};

function pickLeastSeen(pool, n, seen, keyFn) {
  return shuffle(pool)
    .sort((a, b) => (seen[keyFn(a)] || 0) - (seen[keyFn(b)] || 0))
    .slice(0, n);
}

// ---------- Dựng bộ câu hỏi cho 1 lượt ----------
function buildQuizItems({ topic, level, mode }) {
  const seen = load(LS.seen, {});
  const size = mode === "exam" ? EXAM_SIZE : QUIZ_SIZE;
  const useTopic = topic !== "all" && mode !== "exam";
  const byTopic = (arr) => useTopic ? arr.filter(x => x.t === topic) : arr;

  const items = [];
  const used = new Set();
  function add(groupKey, n) {
    if (n <= 0) return;
    const g = GROUPS[groupKey];
    const pool = byTopic(g.pool()).filter(r => !used.has(g.key(r)));
    pickLeastSeen(pool, n, seen, g.key).forEach(r => {
      used.add(g.key(r));
      items.push(g.make(r));
    });
  }

  let spec, fill;
  if (mode === "exam") {
    // Đề thi thử: đủ dạng, thiên về nâng cao
    spec = [["odd", 4], ["error", 4], ["transform", 4], ["reading", 4], ["reorder", 3], ["spell", 2]];
    fill = ["mcAdv", "mcBasic"];
  } else if (level === 2) {
    spec = [["odd", 4], ["error", 4], ["transform", 4], ["reading", 4], ["reorder", 2]];
    fill = ["mcAdv", "mcBasic"];
  } else if (level === 1) {
    spec = [["spell", 4], ["reorder", 3], ["match", 3]];
    fill = ["mcBasic"];
  } else { // all
    spec = [["spell", 3], ["reorder", 3], ["match", 2], ["odd", 3], ["error", 3], ["transform", 2], ["reading", 3]];
    fill = ["mcBasic", "mcAdv"];
  }

  spec.forEach(([k, n]) => add(k, n));
  for (const fk of fill) { if (items.length >= size) break; add(fk, size - items.length); }
  if (items.length < size) add("mcBasic", size - items.length);  // dự phòng
  if (items.length < size) add("mcAdv", size - items.length);

  const mixed = shuffle(items).slice(0, size);
  mixed.forEach(it => { seen[it._key] = (seen[it._key] || 0) + 1; });
  save(LS.seen, seen);
  return mixed;
}

// ---------- Trang chính ----------
function ensureHomeElements() {
  const startBtn = $("btn-start");
  if (!$("level-row")) {
    const row = document.createElement("div");
    row.id = "level-row";
    row.className = "level-row";
    row.innerHTML = `<span class="level-label">Cấp độ:</span>` +
      [["all", "🎯 Tất cả"], ["1", "🌱 Cơ bản"], ["2", "🚀 Nâng cao"]]
        .map(([v, l]) => `<button class="level-chip" data-level="${v}">${l}</button>`).join("");
    startBtn.parentElement.insertBefore(row, startBtn);
    row.querySelectorAll(".level-chip").forEach(ch => ch.onclick = () => {
      selectedLevel = ch.dataset.level === "all" ? "all" : Number(ch.dataset.level);
      renderHome();
    });
  }
  if (!$("btn-exam")) {
    const ex = document.createElement("button");
    ex.id = "btn-exam";
    ex.className = "btn btn-big btn-exam";
    ex.innerHTML = "📝 Thi thử cuối kỳ (đề nâng cao)";
    startBtn.parentElement.insertBefore(ex, startBtn.nextSibling);
    ex.onclick = () => startQuiz("exam");
  }
}

function renderHome() {
  const history = load(LS.history, []);
  const totalStars = history.reduce((n, h) => n + h.stars, 0);
  $("total-stars").textContent = `⭐ ${totalStars}`;
  $("total-quizzes").textContent = `📝 ${history.length} bài`;

  const grid = $("topic-grid");
  grid.innerHTML = "";
  const chips = [{ key: "all", name: "Tổng hợp", icon: "🎲" }]
    .concat(Object.entries(TOPICS).map(([key, t]) => ({ key, ...t })));
  chips.forEach(c => {
    const div = document.createElement("div");
    div.className = "topic-chip" + (selectedTopic === c.key ? " selected" : "");
    div.innerHTML = `<span class="icon">${c.icon}</span>${c.name}`;
    div.onclick = () => { selectedTopic = c.key; renderHome(); };
    grid.appendChild(div);
  });

  document.querySelectorAll(".level-chip").forEach(ch =>
    ch.classList.toggle("selected", String(selectedLevel) === ch.dataset.level));

  const earned = load(LS.badges, []);
  const list = $("badge-list");
  list.innerHTML = "";
  BADGES.forEach(b => {
    const div = document.createElement("div");
    const has = earned.includes(b.id);
    div.className = "badge" + (has ? "" : " locked");
    div.textContent = `${b.icon} ${b.name}`;
    list.appendChild(div);
  });
}

// ---------- Làm bài ----------
function startQuiz(mode = "practice") {
  lastMode = mode;
  const items = buildQuizItems({ topic: selectedTopic, level: selectedLevel, mode });
  const minutes = mode === "exam" ? EXAM_MINUTES : QUIZ_MINUTES;
  quiz = {
    mode, items, minutes,
    index: 0,
    userAnswers: items.map(() => null),
    secondsLeft: minutes * 60,
    startedAt: Date.now(),
    timerId: setInterval(tick, 1000),
  };
  showScreen("quiz");
  renderTimer();
  renderQuestion();
}

function tick() {
  quiz.secondsLeft--;
  renderTimer();
  if (quiz.secondsLeft <= 0) submitQuiz(true);
}

function renderTimer() {
  const m = Math.floor(Math.max(quiz.secondsLeft, 0) / 60);
  const s = Math.max(quiz.secondsLeft, 0) % 60;
  const el = $("quiz-timer");
  el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  el.classList.toggle("warning", quiz.secondsLeft <= 60);
}

function isAnswered(i) {
  const st = quiz.userAnswers[i];
  const it = quiz.items[i];
  if (!st) return false;
  if (it.type === "mc") return st.choice != null;
  if (it.type === "spell" || it.type === "transform") return !!(st.text && st.text.trim());
  if (it.type === "reorder") return st.chosen.length === it.words.length;
  if (it.type === "match") return Object.keys(st.linked).length === it.pairs.length;
  return false;
}

function answeredCount() {
  return quiz.items.map((_, i) => isAnswered(i)).filter(Boolean).length;
}

function saveAnswer(state) {
  quiz.userAnswers[quiz.index] = state;
  renderPalette();
  const n = answeredCount();
  $("progress-fill").style.width = `${(n / quiz.items.length) * 100}%`;
}

function renderPalette() {
  const pal = $("palette");
  pal.innerHTML = "";
  quiz.items.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "pal-num"
      + (isAnswered(i) ? " done" : "")
      + (i === quiz.index ? " current" : "");
    b.textContent = i + 1;
    b.onclick = () => { playTap(); gotoQuestion(i); };
    pal.appendChild(b);
  });
}

function gotoQuestion(i) { quiz.index = i; renderQuestion(); }

function renderQuestion() {
  const it = quiz.items[quiz.index];
  $("quiz-progress").textContent = `Câu ${quiz.index + 1}/${quiz.items.length}`;
  const n = answeredCount();
  $("progress-fill").style.width = `${(n / quiz.items.length) * 100}%`;
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("options").innerHTML = "";
  $("task-area").innerHTML = "";
  $("btn-speak").onclick = () => speak(it.s || it.q);
  $("btn-prev").disabled = quiz.index === 0;
  renderPalette();

  if (it.type === "mc") renderMC(it);
  else if (it.type === "spell") renderSpell(it);
  else if (it.type === "transform") renderTransform(it);
  else if (it.type === "reorder") renderReorder(it);
  else if (it.type === "match") renderMatch(it);
}

// ----- Trắc nghiệm (gồm cả odd / error / reading) -----
function renderMC(it) {
  const qEl = $("question-text");
  if (it.context) {
    const boxClass = it.kind === "reading" ? "context-box reading-box" : "context-box";
    qEl.innerHTML = `<div class="${boxClass}">${it.context}</div><div class="q-line">${it.q}</div>`;
  } else {
    qEl.textContent = it.q;
  }
  const box = $("options");
  const letters = ["A", "B", "C", "D"];
  const st = quiz.userAnswers[quiz.index];
  it.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option" + (st && st.choice === i ? " selected" : "");
    btn.innerHTML = `<span class="letter">${letters[i]}</span><span>${opt}</span>`;
    btn.onclick = () => {
      playTap();
      saveAnswer({ choice: i });
      [...box.children].forEach((b, j) => b.classList.toggle("selected", j === i));
    };
    box.appendChild(btn);
  });
}

// ----- Nhìn hình viết từ -----
function renderSpell(it) {
  $("question-text").textContent = "Nhìn hình và viết từ tiếng Anh:";
  const st = quiz.userAnswers[quiz.index];
  $("task-area").innerHTML = `
    <div class="spell-img">${it.img}</div>
    <input id="spell-input" class="spell-input" type="text" autocomplete="off"
           placeholder="Gõ từ tiếng Anh..." maxlength="30">
  `;
  const input = $("spell-input");
  input.value = st ? st.text : "";
  input.oninput = () => saveAnswer({ text: input.value });
  input.onkeydown = (e) => { if (e.key === "Enter") nextQuestion(); };
}

// ----- Viết lại câu -----
function renderTransform(it) {
  $("question-text").textContent = it.prompt || "Viết lại câu:";
  const st = quiz.userAnswers[quiz.index];
  $("task-area").innerHTML = `
    <div class="transform-orig">📌 ${it.original}</div>
    ${it.given ? `<div class="transform-given">Gợi ý: ${it.given}</div>` : ""}
    <input id="tr-input" class="spell-input" type="text" autocomplete="off"
           placeholder="Viết câu trả lời..." maxlength="80">
  `;
  const input = $("tr-input");
  input.value = st ? st.text : "";
  input.oninput = () => saveAnswer({ text: input.value });
  input.onkeydown = (e) => { if (e.key === "Enter") nextQuestion(); };
}

// ----- Sắp xếp từ thành câu -----
function renderReorder(it) {
  $("question-text").textContent = "Sắp xếp các từ thành câu đúng:";
  $("task-area").innerHTML = `
    <div id="ro-answer" class="ro-answer"></div>
    <div id="ro-pool" class="ro-pool"></div>
  `;
  const answerBox = $("ro-answer");
  const poolBox = $("ro-pool");
  const st = quiz.userAnswers[quiz.index] || { chosen: [] };
  let chosen = [...st.chosen];

  const render = () => {
    saveAnswer({ chosen: [...chosen] });
    answerBox.innerHTML = chosen.length ? "" : `<span class="ro-hint">Bấm các từ bên dưới theo thứ tự đúng 👇</span>`;
    chosen.forEach((w, i) => {
      const chip = document.createElement("button");
      chip.className = "word-chip placed";
      chip.textContent = w;
      chip.onclick = () => { playTap(); chosen.splice(i, 1); render(); };
      answerBox.appendChild(chip);
    });
    poolBox.innerHTML = "";
    const remaining = [...it.words];
    chosen.forEach(w => { remaining.splice(remaining.indexOf(w), 1); });
    remaining.forEach(w => {
      const chip = document.createElement("button");
      chip.className = "word-chip";
      chip.textContent = w;
      chip.onclick = () => { playTap(); chosen.push(w); render(); };
      poolBox.appendChild(chip);
    });
  };
  render();
}

// ----- Nối hình với từ -----
function renderMatch(it) {
  $("question-text").textContent = "Nối mỗi hình với từ tiếng Anh đúng:";
  $("task-area").innerHTML = `
    <div class="match-grid">
      <div id="match-left" class="match-col"></div>
      <div id="match-right" class="match-col"></div>
    </div>
  `;
  const leftBox = $("match-left");
  const rightBox = $("match-right");
  const st = quiz.userAnswers[quiz.index] || { linked: {} };
  const linked = { ...st.linked };
  let selLeft = -1;

  const linkedRightOf = () => {
    const m = {};
    Object.entries(linked).forEach(([li, rj]) => { m[rj] = Number(li); });
    return m;
  };

  const render = () => {
    saveAnswer({ linked: { ...linked } });
    const linkedRight = linkedRightOf();
    leftBox.innerHTML = "";
    rightBox.innerHTML = "";
    it.left.forEach((img, i) => {
      const b = document.createElement("button");
      b.className = "match-item match-img";
      b.textContent = img;
      if (linked[i] !== undefined) b.classList.add("pair-" + (i % 4), "paired");
      if (selLeft === i) b.classList.add("selecting");
      b.onclick = () => {
        playTap();
        if (linked[i] !== undefined) { delete linked[i]; selLeft = -1; }
        else selLeft = selLeft === i ? -1 : i;
        render();
      };
      leftBox.appendChild(b);
    });
    it.right.forEach((w, j) => {
      const b = document.createElement("button");
      b.className = "match-item match-word";
      b.textContent = w;
      const li = linkedRight[j];
      if (li !== undefined) b.classList.add("pair-" + (li % 4), "paired");
      b.onclick = () => {
        playTap();
        if (linkedRight[j] !== undefined) { delete linked[linkedRight[j]]; render(); return; }
        if (selLeft === -1) return;
        linked[selLeft] = j;
        selLeft = -1;
        render();
      };
      rightBox.appendChild(b);
    });
  };
  render();
}

// ---------- Điều hướng ----------
function nextQuestion() { quiz.index = (quiz.index + 1) % quiz.items.length; renderQuestion(); }
function prevQuestion() { if (quiz.index > 0) { quiz.index--; renderQuestion(); } }

// ---------- Chấm bài ----------
function gradeItem(it, st, i) {
  const answered = isAnswered(i);
  let correct = false, userText = "—";
  if (it.type === "mc") {
    if (answered) { correct = st.choice === it.answer; userText = it.options[st.choice]; }
  } else if (it.type === "spell") {
    if (answered) { correct = it.accept.includes(normText(st.text)); userText = st.text.trim(); }
  } else if (it.type === "transform") {
    if (answered) { correct = it.accept.includes(normText(st.text)); userText = st.text.trim(); }
  } else if (it.type === "reorder") {
    if (answered) { const u = st.chosen.join(" "); correct = u === it.sentence; userText = u; }
  } else if (it.type === "match") {
    if (answered) {
      const wordOf = {};
      it.pairs.forEach(p => { wordOf[p.img] = p.w; });
      correct = true;
      const parts = [];
      Object.entries(st.linked).forEach(([li, rj]) => {
        const img = it.left[li], w = it.right[rj];
        const ok = wordOf[img] === w;
        if (!ok) correct = false;
        parts.push(`${img}→${w}${ok ? "✔" : "✘"}`);
      });
      userText = parts.join("  ");
    }
  }
  return { answered, correct, userText, correctText: correctTextOf(it) };
}

function correctTextOf(it) {
  if (it.type === "mc") return it.options[it.answer];
  if (it.type === "spell") return it.w;
  if (it.type === "transform") return it.answer;
  if (it.type === "reorder") return it.sentence;
  return it.pairs.map(p => `${p.img}→${p.w}`).join("  ");
}

function explainFor(it) {
  if (it.e) return it.e;
  if (it.type === "reorder") return `Câu đúng là "${it.sentence}".`;
  if (it.type === "spell") return `Từ đúng của hình ${it.img} là "${it.w}".`;
  if (it.type === "match") return "Các cặp đúng: " + it.pairs.map(p => `${p.img} → ${p.w}`).join(", ");
  return `Đáp án đúng là "${correctTextOf(it)}".`;
}

function questionLabel(it) {
  if (it.type === "mc") {
    if (it.kind === "odd") return "🔤 Chọn từ khác loại";
    if (it.kind === "error") return `🔎 Tìm lỗi sai: ${it.context}`;
    if (it.kind === "reading") return `📖 Đọc hiểu: ${it.q}`;
    return it.q;
  }
  if (it.type === "spell") return `${it.img} Nhìn hình viết từ`;
  if (it.type === "transform") return `✍️ Viết lại câu: ${it.original}`;
  if (it.type === "reorder") return "🔀 Sắp xếp câu";
  return "🧩 Nối hình với từ";
}

function statsLabel(it) {
  if (it.type === "mc") {
    if (it.kind === "odd") return "Chọn từ khác loại: " + it.options.join("/");
    if (it.kind === "error") return "Lỗi sai: " + it.context;
    if (it.kind === "reading") return "Đọc hiểu: " + it.q;
    return it.q;
  }
  if (it.type === "spell") return `${it.img} → ${it.w}`;
  if (it.type === "transform") return "Viết lại: " + it.original;
  if (it.type === "reorder") return it.sentence;
  return "Nối: " + it.pairs.map(p => `${p.img} ${p.w}`).join(", ");
}

function starsFor(score, total) {
  const pct = score / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.5) return 1;
  return 0;
}

function submitQuiz(auto) {
  if (!quiz) return;
  const unanswered = quiz.items.length - answeredCount();
  if (!auto) {
    const msg = unanswered > 0
      ? `Em còn ${unanswered} câu chưa làm. Em chắc chắn muốn nộp bài chứ?`
      : "Em chắc chắn muốn nộp bài chứ?";
    if (!confirm(msg)) return;
  }
  clearInterval(quiz.timerId);

  const results = quiz.items.map((it, i) => gradeItem(it, quiz.userAnswers[i], i));
  const score = results.filter(r => r.correct).length;
  const total = quiz.items.length;
  const stars = starsFor(score, total);
  const usedSeconds = Math.min(quiz.minutes * 60, Math.round((Date.now() - quiz.startedAt) / 1000));

  const wrong = load(LS.wrongCounts, {});
  results.forEach((r, i) => {
    if (!r.correct) {
      const k = statsLabel(quiz.items[i]);
      wrong[k] = (wrong[k] || 0) + 1;
    }
  });
  save(LS.wrongCounts, wrong);

  const history = load(LS.history, []);
  history.unshift({
    date: new Date().toISOString(),
    topic: selectedTopic, level: selectedLevel, mode: quiz.mode,
    score, total, stars, seconds: usedSeconds,
  });
  save(LS.history, history.slice(0, 100));

  const earned = load(LS.badges, []);
  const newOnes = BADGES.filter(b => !earned.includes(b.id) && b.check({ history }));
  if (newOnes.length) save(LS.badges, earned.concat(newOnes.map(b => b.id)));

  playFanfare();

  const examWord = quiz.mode === "exam" ? "đề thi thử" : "bài";
  $("result-title").textContent = auto ? "⏰ Hết giờ!"
    : quiz.mode === "exam" ? "🎓 Nộp đề thi thử!"
    : (stars >= 2 ? "🎉 Hoàn thành!" : "💪 Cố lên nhé!");
  $("result-stars").textContent = stars > 0 ? "⭐".repeat(stars) : "🌱";
  $("result-score").textContent = `Em đúng ${score}/${total} câu`;
  const m = Math.floor(usedSeconds / 60), s = usedSeconds % 60;
  $("result-time").textContent = `Thời gian làm ${examWord}: ${m} phút ${s} giây`;
  $("new-badges").textContent = newOnes.length
    ? "Huy hiệu mới: " + newOnes.map(b => `${b.icon} ${b.name}`).join(", ") : "";
  renderReview(results);
  $("review-list").classList.remove("hidden");
  showScreen("result");
}

function renderReview(results) {
  const list = $("review-list");
  list.innerHTML = `<h3 class="review-title">📋 Bảng đáp án chi tiết</h3>`;
  results.forEach((r, i) => {
    const it = quiz.items[i];
    const div = document.createElement("div");
    div.className = "review-item" + (r.correct ? "" : " wrong-item");
    let html = `<div class="rq">${i + 1}. ${questionLabel(it)}</div>`;
    if (r.correct) {
      html += `<div class="ra">✅ Em làm đúng: <span class="good-ans">${r.correctText}</span></div>`;
    } else if (r.answered) {
      html += `<div class="ra">❌ Em làm: <span class="bad-ans">${r.userText}</span><br>`
        + `Đáp án đúng: <span class="good-ans">${r.correctText}</span><br>`
        + `💡 <span class="explain">${explainFor(it)}</span></div>`;
    } else {
      html += `<div class="ra">⏳ Em chưa làm câu này.<br>`
        + `Đáp án đúng: <span class="good-ans">${r.correctText}</span><br>`
        + `💡 <span class="explain">${explainFor(it)}</span></div>`;
    }
    div.innerHTML = html;
    list.appendChild(div);
  });
}

function quitQuiz() {
  if (!confirm("Em có chắc muốn thoát không? Bài làm sẽ không được lưu.")) return;
  clearInterval(quiz.timerId);
  quiz = null;
  renderHome();
  showScreen("home");
}

// ---------- Tiến bộ ----------
function renderProgress() {
  const history = load(LS.history, []);
  const totalCorrect = history.reduce((n, h) => n + h.score, 0);
  const totalQ = history.reduce((n, h) => n + h.total, 0);
  const best = history.reduce((m, h) => Math.max(m, h.score), 0);
  $("progress-summary").innerHTML = `
    <div class="stat-box"><div class="num">${history.length}</div><div class="lbl">Bài đã làm</div></div>
    <div class="stat-box"><div class="num">${totalQ ? Math.round(totalCorrect / totalQ * 100) : 0}%</div><div class="lbl">Tỉ lệ đúng</div></div>
    <div class="stat-box"><div class="num">${best}</div><div class="lbl">Đúng nhiều nhất</div></div>
  `;

  const hl = $("history-list");
  hl.innerHTML = history.length ? "" : `<div class="empty-note">Chưa có bài nào. Làm bài đầu tiên nhé!</div>`;
  history.slice(0, 20).forEach(h => {
    const d = new Date(h.date);
    const tag = h.mode === "exam" ? "🎓 Đề thi thử"
      : h.topic === "all" ? "🎲 Tổng hợp"
      : `${TOPICS[h.topic]?.icon || ""} ${TOPICS[h.topic]?.name || ""}`;
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<span>${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} — ${tag}</span>
      <span class="h-score">${h.score}/${h.total} ${"⭐".repeat(h.stars)}</span>`;
    hl.appendChild(div);
  });

  const wrong = load(LS.wrongCounts, {});
  const entries = Object.entries(wrong).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const wl = $("weak-list");
  wl.innerHTML = entries.length ? "" : `<div class="empty-note">Chưa có câu nào sai. Tuyệt vời!</div>`;
  entries.forEach(([q, n]) => {
    const div = document.createElement("div");
    div.className = "weak-item";
    div.innerHTML = `${q} — <span class="w-count">sai ${n} lần</span>`;
    wl.appendChild(div);
  });
}

// ---------- Quản lý câu hỏi ----------
let editingIndex = -1;

function renderAdmin() {
  const sel = $("f-topic");
  if (!sel.options.length) {
    Object.entries(TOPICS).forEach(([key, t]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `${t.icon} ${t.name}`;
      sel.appendChild(opt);
    });
  }

  const custom = load(LS.customQuestions, []);
  $("custom-count").textContent = custom.length;
  const list = $("custom-list");
  list.innerHTML = custom.length ? "" : `<div class="empty-note">Chưa có câu hỏi tự thêm nào.</div>`;
  custom.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "custom-item";
    div.innerHTML = `<span class="ci-text">${TOPICS[q.t]?.icon || ""} ${q.q} <b>(Đáp án: ${q.o[q.a]})</b></span>`;
    const actions = document.createElement("span");
    actions.className = "ci-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-small btn-secondary";
    editBtn.textContent = "✏️";
    editBtn.onclick = () => startEdit(i);
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-small btn-danger";
    delBtn.textContent = "🗑️";
    delBtn.onclick = () => {
      if (!confirm("Xóa câu hỏi này?")) return;
      custom.splice(i, 1);
      save(LS.customQuestions, custom);
      renderAdmin();
    };
    actions.append(editBtn, delBtn);
    div.appendChild(actions);
    list.appendChild(div);
  });
}

function startEdit(i) {
  const q = load(LS.customQuestions, [])[i];
  editingIndex = i;
  $("f-topic").value = q.t;
  $("f-q").value = q.q;
  [0, 1, 2, 3].forEach(n => $("f-o" + n).value = q.o[n]);
  $("f-a").value = String(q.a);
  $("f-s").value = q.s || "";
  $("f-submit").textContent = "💾 Lưu chỉnh sửa";
  $("f-cancel").classList.remove("hidden");
  $("f-q").focus();
}

function resetForm() {
  editingIndex = -1;
  $("admin-form").reset();
  $("f-submit").textContent = "➕ Thêm câu hỏi";
  $("f-cancel").classList.add("hidden");
}

function submitQuestion(e) {
  e.preventDefault();
  const q = {
    t: $("f-topic").value,
    q: $("f-q").value.trim(),
    o: [0, 1, 2, 3].map(n => $("f-o" + n).value.trim()),
    a: Number($("f-a").value),
    s: $("f-s").value.trim() || undefined,
    d: 1,
  };
  const custom = load(LS.customQuestions, []);
  if (editingIndex >= 0) custom[editingIndex] = q;
  else custom.push(q);
  save(LS.customQuestions, custom);
  resetForm();
  renderAdmin();
}

// ---------- Bổ sung phần tử giao diện làm bài (tạo bằng JS) ----------
function ensureQuizElements() {
  const screen = $("screen-quiz");
  const card = screen.querySelector(".quiz-card");
  const track = screen.querySelector(".progress-track");

  if (!$("palette")) {
    const pal = document.createElement("div");
    pal.id = "palette";
    pal.className = "palette";
    track.insertAdjacentElement("afterend", pal);
  }
  if (!$("task-area")) {
    const div = document.createElement("div");
    div.id = "task-area";
    div.className = "task-area";
    card.insertBefore(div, $("feedback"));
  }
  if (!$("quiz-nav")) {
    const nav = document.createElement("div");
    nav.id = "quiz-nav";
    nav.className = "quiz-nav";
    nav.innerHTML = `
      <button id="btn-prev" class="btn btn-secondary">⬅ Câu trước</button>
      <button id="btn-skip" class="btn btn-secondary">Bỏ qua ➜</button>
    `;
    card.appendChild(nav);
    const submit = document.createElement("button");
    submit.id = "btn-submit";
    submit.className = "btn btn-big btn-primary";
    submit.textContent = "📤 Nộp bài";
    card.appendChild(submit);
  }
  $("btn-next").classList.add("hidden");
}

ensureQuizElements();
ensureHomeElements();

// ---------- Gắn sự kiện ----------
$("btn-start").onclick = () => startQuiz("practice");
$("btn-quit").onclick = quitQuiz;
$("btn-prev").onclick = () => { playTap(); prevQuestion(); };
$("btn-skip").onclick = () => { playTap(); nextQuestion(); };
$("btn-submit").onclick = () => submitQuiz(false);
$("btn-review").onclick = () => $("review-list").classList.toggle("hidden");
$("btn-again").onclick = () => startQuiz(lastMode);
$("btn-home1").onclick = () => { renderHome(); showScreen("home"); };
$("btn-home2").onclick = () => { renderHome(); showScreen("home"); };
$("btn-home3").onclick = () => { renderHome(); showScreen("home"); };
$("btn-progress").onclick = () => { renderProgress(); showScreen("progress"); };
$("btn-admin").onclick = () => { renderAdmin(); showScreen("admin"); };
$("admin-form").onsubmit = submitQuestion;
$("f-cancel").onclick = resetForm;

renderHome();
