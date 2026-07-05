// ===== Toán Vui 3 — logic chính =====
// 4 chế độ: Tính nhanh (đếm giờ) / Trắc nghiệm theo chủ đề / Đố vui logic / Thử thách mỗi ngày
// Câu tính toán do máy tự sinh (gần như không lặp), câu đố chữ lấy từ kho soạn sẵn.

const MLS = {
  history: "mt3_history",
  badges: "mt3_badges",
  bestDrill: "mt3_best_drill",
  daily: "mt3_daily",
  wrongCounts: "mt3_wrong_counts",
  seen: "mt3_seen_counts",
};

const mload = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const msave = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const $ = (id) => document.getElementById(id);

// ---------- Số ngẫu nhiên (có thể gieo hạt cho Thử thách mỗi ngày) ----------
let RNG = Math.random;
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (a, b) => Math.floor(RNG() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(RNG() * arr.length)];
const mshuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(RNG() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- Âm thanh (Web Audio, giống English Fun 4) ----------
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
function playCorrect() { beep(660, .12, 0); beep(880, .2, .12); }
function playWrong() { beep(220, .25, 0, "square", .1); }
function playFanfare() {
  beep(523, .15, 0); beep(659, .15, .15); beep(784, .15, .3);
  beep(1047, .35, .45); beep(784, .15, .85); beep(1047, .6, 1.0);
}

// ---------- Tiện ích số học ----------
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Đọc số bằng chữ (tới 100 000) — theo cách đọc SGK
function docSo(n) {
  const dv = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  function doc3(x, full) {
    const tr = Math.floor(x / 100), ch = Math.floor(x / 10) % 10, d = x % 10;
    const s = [];
    if (tr > 0 || full) s.push(dv[tr] + " trăm");
    if (ch > 1) {
      s.push(dv[ch] + " mươi");
      if (d === 1) s.push("mốt");
      else if (d === 5) s.push("lăm");
      else if (d > 0) s.push(dv[d]);
    } else if (ch === 1) {
      s.push("mười");
      if (d === 5) s.push("lăm");
      else if (d > 0) s.push(dv[d]);
    } else if (d > 0) {
      if (tr > 0 || full) s.push("linh " + dv[d]);
      else s.push(dv[d]);
    }
    return s.join(" ");
  }
  if (n === 0) return "không";
  if (n < 1000) return doc3(n, false);
  const ngh = Math.floor(n / 1000), rest = n % 1000;
  let s = (ngh < 1000 ? doc3(ngh, false) : "") + " nghìn";
  s = s.trim();
  if (rest > 0) s += " " + doc3(rest, true);
  return s;
}
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Tạo 4 đáp án: 1 đúng + 3 nhiễu gần đúng, không trùng nhau
function makeOptions(correct, candidates, fmtFn) {
  const f = fmtFn || ((x) => fmt(x));
  const set = new Set([correct]);
  const pool = mshuffle(candidates.filter(c => c !== correct && c >= 0));
  for (const c of pool) { if (set.size >= 4) break; set.add(c); }
  let bump = 1;
  while (set.size < 4) {
    const c = correct + bump;
    if (c >= 0 && !set.has(c)) set.add(c);
    bump = bump > 0 ? -bump : -bump + 1;
  }
  const opts = mshuffle([...set]);
  return { o: opts.map(f), a: opts.indexOf(correct) };
}

// ---------- Đồng hồ SVG ----------
function clockSVG(h, m) {
  const cx = 70, cy = 70, R = 64;
  let marks = "";
  for (let i = 1; i <= 12; i++) {
    const ang = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const x = cx + Math.cos(ang) * (R - 13), y = cy + Math.sin(ang) * (R - 13);
    marks += `<text x="${x.toFixed(1)}" y="${(y + 4.5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#4a3b78">${i}</text>`;
  }
  const mAng = (m / 60) * 2 * Math.PI - Math.PI / 2;
  const hAng = (((h % 12) + m / 60) / 12) * 2 * Math.PI - Math.PI / 2;
  const hx = cx + Math.cos(hAng) * 30, hy = cy + Math.sin(hAng) * 30;
  const mx = cx + Math.cos(mAng) * 46, my = cy + Math.sin(mAng) * 46;
  return `<svg class="clock-svg" viewBox="0 0 140 140" width="140" height="140" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#fffbea" stroke="#7c5cff" stroke-width="6"/>
    ${marks}
    <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#333" stroke-width="6" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#ff5d8f" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#333"/>
  </svg>`;
}

// ========== CÁC MÁY SINH CÂU HỎI ==========
// Mỗi máy trả về { t, q (có thể chứa HTML), o[4], a, e }

function gAddSub() {
  const kind = pick(["a100", "s100", "a1000", "s1000", "aBig", "sBig"]);
  let x, y, ans, op;
  if (kind === "a100") { x = ri(15, 89); y = ri(15, 99 - x); op = "+"; ans = x + y; }
  else if (kind === "s100") { x = ri(30, 99); y = ri(11, x - 5); op = "−"; ans = x - y; }
  else if (kind === "a1000") { x = ri(120, 850); y = ri(100, 999 - x); op = "+"; ans = x + y; }
  else if (kind === "s1000") { x = ri(300, 999); y = ri(100, x - 50); op = "−"; ans = x - y; }
  else if (kind === "aBig") { x = ri(1200, 60000); y = ri(1000, 99999 - x); op = "+"; ans = x + y; }
  else { x = ri(20000, 99999); y = ri(1000, x - 1000); op = "−"; ans = x - y; }
  const near = [ans + 10, ans - 10, ans + 100, ans - 100, ans + 1, ans - 1, ans + 1000, ans - 1000];
  return { t: "contru", q: `${fmt(x)} ${op} ${fmt(y)} = ?`, ...makeOptions(ans, near),
    e: `${fmt(x)} ${op} ${fmt(y)} = ${fmt(ans)}.` };
}

function gMulTable() {
  const a = ri(2, 9), b = ri(2, 9);
  if (RNG() < 0.5) {
    const ans = a * b;
    return { t: "bangnc", q: `${a} × ${b} = ?`, ...makeOptions(ans, [ans + a, ans - a, ans + b, ans - b, ans + 1]),
      e: `${a} × ${b} = ${ans} (bảng nhân ${a}).` };
  }
  const c = a * b;
  return { t: "bangnc", q: `${c} : ${a} = ?`, ...makeOptions(b, [b + 1, b - 1, b + 2, a]),
    e: `${c} : ${a} = ${b} vì ${a} × ${b} = ${c}.` };
}

function gMulDivBig() {
  if (RNG() < 0.5) {
    const a = ri(12, 320), b = ri(2, 9), ans = a * b;
    return { t: "nhanchia", q: `${fmt(a)} × ${b} = ?`, ...makeOptions(ans, [ans + b, ans - b, ans + 10, ans - 10, ans + 100]),
      e: `${fmt(a)} × ${b} = ${fmt(ans)} (đặt tính rồi nhân lần lượt từ phải sang trái).` };
  }
  const b = ri(2, 9), q2 = ri(12, 150), a = b * q2;
  return { t: "nhanchia", q: `${fmt(a)} : ${b} = ?`, ...makeOptions(q2, [q2 + 1, q2 - 1, q2 + 10, q2 - 10]),
    e: `${fmt(a)} : ${b} = ${q2} vì ${q2} × ${b} = ${fmt(a)}.` };
}

function gGapGiam() {
  const kind = pick(["gap", "giam", "phan", "honkem"]);
  if (kind === "gap") {
    const a = ri(3, 12), k = ri(2, 8), ans = a * k;
    return { t: "gapgiam", q: `Gấp ${a} lên ${k} lần ta được:`, ...makeOptions(ans, [a + k, ans + a, ans - a, ans + k]),
      e: `Gấp lên một số lần thì làm phép NHÂN: ${a} × ${k} = ${ans}.` };
  }
  if (kind === "giam") {
    const k = ri(2, 8), ans = ri(3, 12), a = ans * k;
    return { t: "gapgiam", q: `Giảm ${a} đi ${k} lần ta được:`, ...makeOptions(ans, [a - k, ans + 1, ans - 1, ans + k]),
      e: `Giảm đi một số lần thì làm phép CHIA: ${a} : ${k} = ${ans}.` };
  }
  if (kind === "phan") {
    const k = pick([2, 3, 4, 5, 6, 7, 8, 9]), ans = ri(4, 12), a = ans * k;
    return { t: "gapgiam", q: `Tìm 1/${k} của ${a}:`, ...makeOptions(ans, [ans + 1, ans - 1, a - k, ans + k]),
      e: `Muốn tìm 1/${k} của một số, ta lấy số đó chia cho ${k}: ${a} : ${k} = ${ans}.` };
  }
  const a = ri(15, 80), k = ri(5, 30), more = RNG() < 0.5;
  const ans = more ? a + k : a - k;
  return { t: "gapgiam",
    q: `Số ${more ? "nhiều hơn" : "ít hơn"} ${a} là ${k} đơn vị. Số đó là:`,
    ...makeOptions(ans, [more ? a - k : a + k, ans + 1, ans - 1, a]),
    e: `${more ? "Nhiều hơn thì cộng" : "Ít hơn thì trừ"}: ${a} ${more ? "+" : "−"} ${k} = ${ans}.` };
}

function gBieuThuc() {
  const kind = pick(["mulAdd", "addMul", "paren", "divAdd"]);
  if (kind === "mulAdd") {
    const a = ri(2, 9), b = ri(2, 9), c = ri(10, 90), ans = c + a * b;
    return { t: "bieuthuc", q: `${c} + ${a} × ${b} = ?`, ...makeOptions(ans, [(c + a) * b, ans + a, ans - b, ans + 10]),
      e: `Làm phép nhân trước: ${a} × ${b} = ${a * b}, rồi ${c} + ${a * b} = ${ans}.` };
  }
  if (kind === "addMul") {
    const a = ri(2, 9), b = ri(2, 9), c = ri(20, 90), ans = c - a * b;
    if (ans < 0) return gBieuThuc();
    return { t: "bieuthuc", q: `${c} − ${a} × ${b} = ?`, ...makeOptions(ans, [Math.abs((c - a) * b), ans + a, ans + b, ans - 1]),
      e: `Làm phép nhân trước: ${a} × ${b} = ${a * b}, rồi ${c} − ${a * b} = ${ans}.` };
  }
  if (kind === "paren") {
    const a = ri(3, 20), b = ri(2, 15), c = ri(2, 5), ans = (a + b) * c;
    return { t: "bieuthuc", q: `(${a} + ${b}) × ${c} = ?`, ...makeOptions(ans, [a + b * c, ans + c, ans - c, ans + 10]),
      e: `Có dấu ngoặc thì tính trong ngoặc trước: ${a} + ${b} = ${a + b}, rồi ${a + b} × ${c} = ${ans}.` };
  }
  const b = ri(2, 9), q2 = ri(3, 12), a = b * q2, c = ri(10, 60), ans = c + q2;
  return { t: "bieuthuc", q: `${c} + ${a} : ${b} = ?`, ...makeOptions(ans, [Math.floor((c + a) / b), ans + 1, ans - 1, ans + b]),
    e: `Làm phép chia trước: ${a} : ${b} = ${q2}, rồi ${c} + ${q2} = ${ans}.` };
}

function gTimX() {
  const kind = pick(["addX", "subX1", "subX2", "mulX", "divX"]);
  if (kind === "addX") {
    const x = ri(12, 400), a = ri(10, 300);
    return { t: "timx", q: `Tìm x, biết:  x + ${a} = ${x + a}`, ...makeOptions(x, [x + a + a, x + 1, x - 1, x + 10]),
      e: `Muốn tìm số hạng chưa biết, lấy tổng trừ số hạng kia: x = ${x + a} − ${a} = ${x}.` };
  }
  if (kind === "subX1") {
    const x = ri(50, 500), a = ri(10, x - 10);
    return { t: "timx", q: `Tìm x, biết:  x − ${a} = ${x - a}`, ...makeOptions(x, [x - a - a, x + 1, x - 10, x + 10]),
      e: `Muốn tìm số bị trừ, lấy hiệu cộng số trừ: x = ${x - a} + ${a} = ${x}.` };
  }
  if (kind === "subX2") {
    const a = ri(100, 600), x = ri(10, a - 10);
    return { t: "timx", q: `Tìm x, biết:  ${a} − x = ${a - x}`, ...makeOptions(x, [a + (a - x), x + 1, x - 1, x + 10]),
      e: `Muốn tìm số trừ, lấy số bị trừ trừ đi hiệu: x = ${a} − ${a - x} = ${x}.` };
  }
  if (kind === "mulX") {
    const a = ri(2, 9), x = ri(3, 9);
    return { t: "timx", q: `Tìm x, biết:  x × ${a} = ${x * a}`, ...makeOptions(x, [x * a * a, x + 1, x - 1, a]),
      e: `Muốn tìm thừa số chưa biết, lấy tích chia thừa số kia: x = ${x * a} : ${a} = ${x}.` };
  }
  const a = ri(2, 9), q2 = ri(3, 12), x = a * q2;
  return { t: "timx", q: `Tìm x, biết:  x : ${a} = ${q2}`, ...makeOptions(x, [q2 + a, x + a, x - a, q2]),
    e: `Muốn tìm số bị chia, lấy thương nhân số chia: x = ${q2} × ${a} = ${x}.` };
}

function gSoSanh() {
  const kind = pick(["cmp", "round", "lienke", "doc", "hang"]);
  if (kind === "cmp") {
    const nums = mshuffle([ri(1000, 99999), ri(1000, 99999), ri(1000, 99999), ri(1000, 99999)]);
    const ans = Math.max(...nums);
    return { t: "sosanh", q: "Số nào LỚN NHẤT?", o: nums.map(fmt), a: nums.indexOf(ans),
      e: `So sánh số các chữ số trước, rồi so từng hàng từ trái sang phải → ${fmt(ans)} lớn nhất.` };
  }
  if (kind === "round") {
    const toChuc = RNG() < 0.5;
    if (toChuc) {
      const n = ri(101, 9999);
      const ans = Math.round(n / 10) * 10;
      return { t: "sosanh", q: `Làm tròn số ${fmt(n)} đến hàng chục ta được:`,
        ...makeOptions(ans, [ans + 10, ans - 10, Math.round(n / 100) * 100]),
        e: `Chữ số hàng đơn vị là ${n % 10} (${n % 10 < 5 ? "bé hơn 5 → giữ nguyên hàng chục" : "từ 5 trở lên → thêm 1 vào hàng chục"}) → ${fmt(ans)}.` };
    }
    const n = ri(1010, 99999);
    const ans = Math.round(n / 1000) * 1000;
    return { t: "sosanh", q: `Làm tròn số ${fmt(n)} đến hàng nghìn ta được:`,
      ...makeOptions(ans, [ans + 1000, ans - 1000, Math.round(n / 100) * 100]),
      e: `Nhìn chữ số hàng trăm là ${Math.floor(n / 100) % 10} (${Math.floor(n / 100) % 10 < 5 ? "bé hơn 5 → giữ nguyên hàng nghìn" : "từ 5 trở lên → thêm 1 vào hàng nghìn"}) → ${fmt(ans)}.` };
  }
  if (kind === "lienke") {
    const n = ri(999, 99998);
    const after = RNG() < 0.5;
    const ans = after ? n + 1 : n - 1;
    return { t: "sosanh", q: `Số liền ${after ? "sau" : "trước"} của ${fmt(n)} là:`,
      ...makeOptions(ans, [after ? n - 1 : n + 1, ans + 10, ans - 10]),
      e: `Số liền ${after ? "sau hơn" : "trước kém"} số đã cho 1 đơn vị: ${fmt(n)} ${after ? "+" : "−"} 1 = ${fmt(ans)}.` };
  }
  if (kind === "doc") {
    const n = pick([ri(1000, 9999), ri(10000, 99999), ri(101, 999)]);
    const wrong = [n + 10, n - 10, n + 100, n - 100, n + 1000, n - 1000, n + 1, n - 1].filter(x => x > 0);
    const chosen = new Set([n]);
    for (const w of mshuffle(wrong)) { if (chosen.size >= 4) break; chosen.add(w); }
    const opts = mshuffle([...chosen]);
    return { t: "sosanh", q: `Số "${capFirst(docSo(n))}" viết là:`, o: opts.map(fmt), a: opts.indexOf(n),
      e: `${capFirst(docSo(n))} viết là ${fmt(n)}.` };
  }
  const n = ri(1000, 99999);
  const hangs = [["đơn vị", n % 10], ["chục", Math.floor(n / 10) % 10], ["trăm", Math.floor(n / 100) % 10], ["nghìn", Math.floor(n / 1000) % 10]];
  const [hname, hval] = pick(hangs);
  return { t: "sosanh", q: `Chữ số hàng ${hname} của số ${fmt(n)} là:`,
    ...makeOptions(hval, [(hval + 1) % 10, (hval + 9) % 10, (hval + 2) % 10, (hval + 5) % 10], String),
    e: `Trong số ${fmt(n)}, chữ số hàng ${hname} là ${hval}.` };
}

function gClock() {
  const h = ri(1, 12);
  const m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const label = (hh, mm) => mm === 0 ? `${hh} giờ đúng`
    : mm === 30 ? `${hh} giờ rưỡi`
    : mm > 30 ? `${hh === 12 ? 1 : hh + 1} giờ kém ${60 - mm}`
    : `${hh} giờ ${mm} phút`;
  const correct = label(h, m);
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < 4 && guard++ < 40) {
    const dh = Math.max(1, ((h + ri(-1, 1) + 11) % 12) + 1);
    const dm = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    set.add(label(dh, dm));
  }
  const opts = mshuffle([...set]);
  return { t: "thoigian", q: `${clockSVG(h, m)}<div class="q-line">Đồng hồ chỉ mấy giờ?</div>`,
    o: opts, a: opts.indexOf(correct),
    e: `Kim ngắn chỉ giờ, kim dài chỉ phút → đồng hồ chỉ ${correct}.` };
}

function gPeriArea() {
  const kind = pick(["cvHCN", "cvHV", "dtHCN", "dtHV"]);
  if (kind === "cvHCN") {
    const d = ri(5, 20), r = ri(2, d - 1), ans = (d + r) * 2;
    return { t: "hinhhoc", q: `Hình chữ nhật có chiều dài ${d}cm, chiều rộng ${r}cm. Chu vi hình đó là:`,
      ...makeOptions(ans, [d + r, d * r, ans + 2, ans - 2], x => fmt(x) + "cm"),
      e: `Chu vi = (dài + rộng) × 2 = (${d} + ${r}) × 2 = ${ans} (cm).` };
  }
  if (kind === "cvHV") {
    const c = ri(3, 25), ans = c * 4;
    return { t: "hinhhoc", q: `Hình vuông có cạnh ${c}cm. Chu vi hình đó là:`,
      ...makeOptions(ans, [c * c, c * 2, ans + 4, ans - 4], x => fmt(x) + "cm"),
      e: `Chu vi hình vuông = cạnh × 4 = ${c} × 4 = ${ans} (cm).` };
  }
  if (kind === "dtHCN") {
    const d = ri(4, 12), r = ri(2, 9), ans = d * r;
    return { t: "hinhhoc", q: `Hình chữ nhật có chiều dài ${d}cm, chiều rộng ${r}cm. Diện tích hình đó là:`,
      ...makeOptions(ans, [(d + r) * 2, d + r, ans + d, ans - r], x => fmt(x) + "cm²"),
      e: `Diện tích = dài × rộng = ${d} × ${r} = ${ans} (cm²).` };
  }
  const c = ri(2, 10), ans = c * c;
  return { t: "hinhhoc", q: `Hình vuông có cạnh ${c}cm. Diện tích hình đó là:`,
    ...makeOptions(ans, [c * 4, c * 2, ans + c, ans - c], x => fmt(x) + "cm²"),
    e: `Diện tích hình vuông = cạnh × cạnh = ${c} × ${c} = ${ans} (cm²).` };
}

function gConvert() {
  const units = [
    { big: "km", small: "m", k: 1000, max: 9 },
    { big: "m", small: "cm", k: 100, max: 9 },
    { big: "m", small: "mm", k: 1000, max: 9 },
    { big: "cm", small: "mm", k: 10, max: 90 },
    { big: "kg", small: "g", k: 1000, max: 9 },
    { big: "l", small: "ml", k: 1000, max: 9 },
    { big: "dm", small: "cm", k: 10, max: 90 },
    { big: "m", small: "dm", k: 10, max: 90 },
  ];
  const u = pick(units);
  const n = ri(2, u.max);
  const ans = n * u.k;
  return { t: "doluong", q: `${n}${u.big} = ... ${u.small}. Số cần điền là:`,
    ...makeOptions(ans, [ans * 10, Math.floor(ans / 10), ans + u.k, ans - u.k]),
    e: `1${u.big} = ${fmt(u.k)}${u.small} nên ${n}${u.big} = ${n} × ${fmt(u.k)} = ${fmt(ans)}${u.small}.` };
}

function gMoney() {
  const kind = pick(["change", "total", "mul"]);
  if (kind === "change") {
    const items = ["cái bút", "quyển vở", "cục tẩy", "gói kẹo", "cái thước", "hộp bút chì màu"];
    const paid = pick([10, 20, 50]) * 1000;
    const price = ri(2, paid / 1000 - 1) * 1000;
    const ans = paid - price;
    return { t: "tien", q: `Em mua một ${pick(items)} giá ${fmt(price)} đồng, đưa cô bán hàng tờ ${fmt(paid)} đồng. Cô trả lại em:`,
      ...makeOptions(ans, [ans + 1000, ans - 1000, paid + price], x => fmt(x) + " đồng"),
      e: `${fmt(paid)} − ${fmt(price)} = ${fmt(ans)} (đồng).` };
  }
  if (kind === "total") {
    const a = ri(3, 30) * 1000, b = ri(3, 30) * 1000, ans = a + b;
    return { t: "tien", q: `Một hộp sữa giá ${fmt(a)} đồng, một gói bánh giá ${fmt(b)} đồng. Mua cả hai thứ hết:`,
      ...makeOptions(ans, [ans + 1000, ans - 1000, Math.abs(a - b)], x => fmt(x) + " đồng"),
      e: `${fmt(a)} + ${fmt(b)} = ${fmt(ans)} (đồng).` };
  }
  const price = ri(2, 15) * 1000, n = ri(2, 5), ans = price * n;
  return { t: "tien", q: `Một quyển truyện giá ${fmt(price)} đồng. Mua ${n} quyển như thế hết:`,
    ...makeOptions(ans, [price + n * 1000, ans + 1000, ans - 1000], x => fmt(x) + " đồng"),
    e: `${fmt(price)} × ${n} = ${fmt(ans)} (đồng).` };
}

// Toán đố sinh tự động theo mẫu
function gWordProblem() {
  const kind = pick(["mul", "div", "more", "less", "phan"]);
  if (kind === "mul") {
    const [thing, unit, box] = pick([["cái bánh", "cái", "hộp"], ["quả trứng", "quả", "khay"], ["viên bi", "viên", "túi"], ["quyển vở", "quyển", "chồng"], ["bông hoa", "bông", "lọ"]]);
    const a = ri(3, 9), b = ri(3, 9), ans = a * b;
    return { t: "toando", q: `Mỗi ${box} có ${a} ${thing}. Hỏi ${b} ${box} như thế có bao nhiêu ${thing}?`,
      ...makeOptions(ans, [a + b, ans + a, ans - b], x => `${x} ${unit}`),
      e: `${a} × ${b} = ${ans} (${unit}).` };
  }
  if (kind === "div") {
    const [thing, unit] = pick([["quả cam", "quả"], ["cái kẹo", "cái"], ["viên bi", "viên"], ["quyển truyện", "quyển"]]);
    const b = ri(2, 9), q2 = ri(3, 9), a = b * q2;
    return { t: "toando", q: `Có ${a} ${thing} chia đều cho ${b} bạn. Hỏi mỗi bạn được mấy ${thing}?`,
      ...makeOptions(q2, [q2 + 1, q2 - 1, a - b], x => `${x} ${unit}`),
      e: `${a} : ${b} = ${q2} (${unit}).` };
  }
  if (kind === "more") {
    const [n1, n2] = pick([["An", "Bình"], ["Hoa", "Lan"], ["Nam", "Tùng"], ["Mai", "Cúc"]]);
    const a = ri(15, 60), k = ri(5, 25), ans = a + k;
    return { t: "toando", q: `${n1} có ${a} nhãn vở, ${n2} có nhiều hơn ${n1} ${k} nhãn vở. Hỏi ${n2} có bao nhiêu nhãn vở?`,
      ...makeOptions(ans, [a - k, ans + 1, ans - 1], x => `${x} nhãn vở`),
      e: `"Nhiều hơn" thì làm phép cộng: ${a} + ${k} = ${ans} (nhãn vở).` };
  }
  if (kind === "less") {
    const a = ri(30, 95), k = ri(5, 25), ans = a - k;
    return { t: "toando", q: `Mẹ hái được ${a} quả cam, chị hái được ít hơn mẹ ${k} quả. Hỏi chị hái được bao nhiêu quả cam?`,
      ...makeOptions(ans, [a + k, ans + 1, ans - 1], x => `${x} quả`),
      e: `"Ít hơn" thì làm phép trừ: ${a} − ${k} = ${ans} (quả cam).` };
  }
  const k = pick([2, 3, 4, 5, 6]), q2 = ri(4, 15), a = k * q2;
  return { t: "toando", q: `Một cửa hàng có ${a}kg gạo, đã bán 1/${k} số gạo đó. Hỏi cửa hàng đã bán bao nhiêu ki-lô-gam gạo?`,
    ...makeOptions(q2, [a - k, q2 + 1, q2 + k], x => `${x}kg`),
    e: `1/${k} của ${a} là: ${a} : ${k} = ${q2} (kg).` };
}

// Dãy số tìm quy luật (cho phần logic)
function gSequence() {
  const kind = pick(["arith", "arithDown", "double", "mulstep"]);
  let seq, ans, rule;
  if (kind === "arith") {
    const start = ri(1, 20), d = pick([2, 3, 4, 5, 10, 100]);
    seq = [0, 1, 2, 3].map(i => start + d * i);
    ans = start + d * 4;
    rule = `mỗi số hơn số trước ${d} đơn vị`;
  } else if (kind === "arithDown") {
    const d = pick([2, 3, 4, 5, 10]);
    const start = ri(d * 5, d * 5 + 60);
    seq = [0, 1, 2, 3].map(i => start - d * i);
    ans = start - d * 4;
    rule = `mỗi số kém số trước ${d} đơn vị`;
  } else if (kind === "double") {
    const start = pick([1, 2, 3, 4, 5]);
    seq = [start, start * 2, start * 4, start * 8];
    ans = start * 16;
    rule = "mỗi số gấp đôi số trước";
  } else {
    const k = pick([3, 5]), start = pick([1, 2]);
    seq = [start, start * k, start * k * k];
    ans = start * k * k * k;
    rule = `mỗi số gấp ${k} lần số trước`;
  }
  return { t: "logic", q: `Tìm số tiếp theo của dãy:  ${seq.map(fmt).join(", ")}, ...?`,
    ...makeOptions(ans, [ans + 1, ans - 1, ans + 2, seq[seq.length - 1] + 1, ans + 10]),
    e: `Quy luật: ${rule} → số tiếp theo là ${fmt(ans)}.` };
}

// ---------- Bảng chọn máy sinh theo chủ đề ----------
const MGEN = {
  contru: [gAddSub],
  bangnc: [gMulTable],
  nhanchia: [gMulDivBig],
  gapgiam: [gGapGiam],
  bieuthuc: [gBieuThuc],
  timx: [gTimX],
  sosanh: [gSoSanh],
  hinhhoc: [gPeriArea],
  doluong: [gConvert],
  thoigian: [gClock],
  tien: [gMoney],
  toando: [gWordProblem],
};
const MBANKS = {
  hinhhoc: () => MHINH_BANK,
  doluong: () => MDOLUONG_BANK,
  thoigian: () => MTHOIGIAN_BANK,
  tien: () => MTIEN_BANK,
  toando: () => MTOANDO_BANK,
};
const ALL_GENS = Object.values(MGEN).flat();
const ALL_BANKS = () => [...MHINH_BANK, ...MDOLUONG_BANK, ...MTHOIGIAN_BANK, ...MTIEN_BANK, ...MTOANDO_BANK];

function pickCurated(bank, n) {
  const seen = mload(MLS.seen, {});
  const chosen = mshuffle(bank)
    .sort((a, b) => (seen[a.q] || 0) - (seen[b.q] || 0))
    .slice(0, n);
  chosen.forEach(c => { seen[c.q] = (seen[c.q] || 0) + 1; });
  msave(MLS.seen, seen);
  return chosen.map(c => ({ ...c }));
}

function genUnique(gens, n, usedQs) {
  const items = [];
  let guard = 0;
  while (items.length < n && guard++ < n * 30) {
    const it = pick(gens)();
    if (usedQs.has(it.q)) continue;
    usedQs.add(it.q);
    items.push(it);
  }
  return items;
}

// Dựng bộ câu hỏi cho một lượt trắc nghiệm chủ đề / logic / hằng ngày
function buildTopicQuiz(topic, n) {
  const usedQs = new Set();
  let items = [];
  if (topic === "all") {
    items = genUnique(ALL_GENS, n - 3, usedQs).concat(pickCurated(ALL_BANKS(), 3));
  } else if (topic === "logic") {
    const curated = pickCurated(MLOGIC_BANK, Math.min(6, n));
    curated.forEach(c => usedQs.add(c.q));
    items = curated.concat(genUnique([gSequence], n - curated.length, usedQs));
  } else {
    const bank = MBANKS[topic] ? MBANKS[topic]() : null;
    const nCurated = bank ? Math.min(Math.ceil(n / 2), bank.length) : 0;
    const curated = bank ? pickCurated(bank, nCurated) : [];
    curated.forEach(c => usedQs.add(c.q));
    items = curated.concat(genUnique(MGEN[topic], n - curated.length, usedQs));
  }
  return mshuffle(items).slice(0, n);
}

function buildDailyQuiz(dateStr, n) {
  let seed = 0;
  for (const ch of dateStr) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  RNG = mulberry32(seed);
  const usedQs = new Set();
  const gens = genUnique(ALL_GENS.concat([gSequence]), n - 4, usedQs);
  const curatedPool = mshuffle(ALL_BANKS().concat(MLOGIC_BANK));
  const curated = curatedPool.slice(0, 4).map(c => ({ ...c }));
  const items = mshuffle(gens.concat(curated)).slice(0, n);
  RNG = Math.random;
  return items;
}

// ========== HUY HIỆU ==========
const MBADGES = [
  { id: "mfirst",  icon: "🎈", name: "Bài toán đầu tiên",   check: (s) => s.history.length >= 1 },
  { id: "mstar3",  icon: "🌟", name: "Đạt 3 sao",            check: (s) => s.history.some(h => h.stars === 3) },
  { id: "mperfect",icon: "🏆", name: "Đúng hết cả bài",      check: (s) => s.history.some(h => h.score === h.total) },
  { id: "mfive",   icon: "🔥", name: "Hoàn thành 5 bài",     check: (s) => s.history.length >= 5 },
  { id: "mten",    icon: "💎", name: "Hoàn thành 10 bài",    check: (s) => s.history.length >= 10 },
  { id: "mdrill",  icon: "⚡", name: "150 điểm Tính nhanh",  check: (s) => s.bestDrill >= 150 },
  { id: "mdaily3", icon: "🗓️", name: "3 ngày thử thách liền", check: (s) => s.dailyStreak >= 3 },
  { id: "mlogic",  icon: "🧠", name: "Vua logic (làm 3 bài logic)", check: (s) => s.history.filter(h => h.topic === "logic").length >= 3 },
  { id: "mc200",   icon: "🚀", name: "200 câu trả lời đúng", check: (s) => s.history.reduce((t, h) => t + h.score, 0) >= 200 },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dailyStreak() {
  const daily = mload(MLS.daily, {});
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (daily[key] !== undefined) { streak++; d.setDate(d.getDate() - 1); }
    else if (streak === 0 && key === todayStr()) { d.setDate(d.getDate() - 1); } // hôm nay chưa làm vẫn tính chuỗi cũ
    else break;
  }
  return streak;
}
function badgeState() {
  return { history: mload(MLS.history, []), bestDrill: mload(MLS.bestDrill, 0), dailyStreak: dailyStreak() };
}
function checkNewBadges() {
  const earned = mload(MLS.badges, []);
  const s = badgeState();
  const newOnes = MBADGES.filter(b => !earned.includes(b.id) && b.check(s));
  if (newOnes.length) msave(MLS.badges, earned.concat(newOnes.map(b => b.id)));
  return newOnes;
}

// ========== GIAO DIỆN ==========
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
  window.scrollTo(0, 0);
}

// ---------- Trang chính ----------
function renderHome() {
  const history = mload(MLS.history, []);
  const totalStars = history.reduce((n, h) => n + h.stars, 0);
  $("m-total-stars").textContent = `⭐ ${totalStars}`;
  $("m-total-quizzes").textContent = `📝 ${history.length} bài`;
  $("m-best-drill").textContent = `⚡ ${mload(MLS.bestDrill, 0)}`;

  // lưới chủ đề
  const grid = $("m-topic-grid");
  grid.innerHTML = "";
  const chips = [{ key: "all", name: "Tổng hợp", icon: "🎲" }]
    .concat(Object.entries(MTOPICS).map(([key, t]) => ({ key, ...t })));
  chips.forEach(c => {
    const div = document.createElement("div");
    div.className = "topic-chip" + (mState.topic === c.key ? " selected" : "");
    div.innerHTML = `<span class="icon">${c.icon}</span>${c.name}`;
    div.onclick = () => { playTap(); mState.topic = c.key; renderHome(); };
    grid.appendChild(div);
  });

  // thử thách hôm nay
  const daily = mload(MLS.daily, {});
  const today = daily[todayStr()];
  $("m-daily-status").innerHTML = today !== undefined
    ? `Hôm nay em đã đạt <b>${today.score}/${today.total}</b> câu đúng. Làm lại để phá kỷ lục nhé!`
    : `Hôm nay em chưa làm thử thách. Cố lên nào! 🔥 Chuỗi: <b>${dailyStreak()}</b> ngày`;

  // huy hiệu
  const earned = mload(MLS.badges, []);
  const list = $("m-badge-list");
  list.innerHTML = "";
  MBADGES.forEach(b => {
    const div = document.createElement("div");
    div.className = "badge" + (earned.includes(b.id) ? "" : " locked");
    div.textContent = `${b.icon} ${b.name}`;
    list.appendChild(div);
  });
}

// ---------- Trắc nghiệm (phản hồi ngay từng câu) ----------
const mState = { topic: "all" };
let mQuiz = null;

function startQuiz(mode) {
  let items, label;
  if (mode === "daily") {
    items = buildDailyQuiz(todayStr(), 12);
    label = "🗓️ Thử thách hôm nay";
  } else if (mode === "logic") {
    items = buildTopicQuiz("logic", 10);
    label = "🧩 Đố vui logic";
  } else {
    items = buildTopicQuiz(mState.topic, 10);
    label = mState.topic === "all" ? "🎲 Tổng hợp" : `${MTOPICS[mState.topic].icon} ${MTOPICS[mState.topic].name}`;
  }
  if (!items.length) return;
  mQuiz = { mode, label, items, index: 0, score: 0, wrongs: [], answered: false, startedAt: Date.now() };
  $("mq-label").textContent = label;
  showScreen("quiz");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const it = mQuiz.items[mQuiz.index];
  mQuiz.answered = false;
  $("mq-progress").textContent = `Câu ${mQuiz.index + 1}/${mQuiz.items.length}`;
  $("mq-fill").style.width = `${(mQuiz.index / mQuiz.items.length) * 100}%`;
  $("mq-question").innerHTML = it.q;
  $("mq-feedback").className = "feedback";
  $("mq-feedback").innerHTML = "";
  $("mq-next").classList.add("hidden");
  const box = $("mq-options");
  box.innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  it.options = it.o;
  it.o.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML = `<span class="letter">${letters[i]}</span><span>${opt}</span>`;
    btn.onclick = () => answerQuiz(i, btn);
    box.appendChild(btn);
  });
}

function answerQuiz(i, btn) {
  if (mQuiz.answered) return;
  mQuiz.answered = true;
  const it = mQuiz.items[mQuiz.index];
  const correct = i === it.a;
  const box = $("mq-options");
  [...box.children].forEach((b, j) => {
    b.disabled = true;
    if (j === it.a) b.classList.add("correct");
    else if (j === i) b.classList.add("wrong");
  });
  const fb = $("mq-feedback");
  if (correct) {
    playCorrect();
    mQuiz.score++;
    fb.className = "feedback good";
    fb.innerHTML = pick(["🎉 Đúng rồi, giỏi quá!", "👍 Chính xác!", "🌟 Tuyệt vời!", "💪 Quá đỉnh!"]);
  } else {
    playWrong();
    mQuiz.wrongs.push(it);
    const wrong = mload(MLS.wrongCounts, {});
    const key = it.q.replace(/<[^>]*>/g, " ").trim().slice(0, 80);
    wrong[key] = (wrong[key] || 0) + 1;
    msave(MLS.wrongCounts, wrong);
    fb.className = "feedback bad";
    fb.innerHTML = `❌ Chưa đúng. Đáp án đúng: <b>${it.o[it.a]}</b><br>💡 ${it.e || ""}`;
  }
  $("mq-next").textContent = mQuiz.index + 1 < mQuiz.items.length ? "Câu tiếp theo ➜" : "Xem kết quả 🎉";
  $("mq-next").classList.remove("hidden");
}

function nextQuizQuestion() {
  playTap();
  if (mQuiz.index + 1 < mQuiz.items.length) {
    mQuiz.index++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function starsFor(score, total) {
  const pct = score / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.5) return 1;
  return 0;
}

function finishQuiz() {
  const { score, items, mode, label } = mQuiz;
  const total = items.length;
  const stars = starsFor(score, total);
  const seconds = Math.round((Date.now() - mQuiz.startedAt) / 1000);

  const history = mload(MLS.history, []);
  history.unshift({ date: new Date().toISOString(), topic: mode === "practice" ? mState.topic : mode, label, score, total, stars, seconds });
  msave(MLS.history, history.slice(0, 100));

  if (mode === "daily") {
    const daily = mload(MLS.daily, {});
    const prev = daily[todayStr()];
    if (!prev || score > prev.score) daily[todayStr()] = { score, total };
    msave(MLS.daily, daily);
  }

  const newOnes = checkNewBadges();
  playFanfare();

  $("mr-title").textContent = stars >= 2 ? "🎉 Hoàn thành!" : "💪 Cố lên nhé!";
  $("mr-stars").textContent = stars > 0 ? "⭐".repeat(stars) : "🌱";
  $("mr-score").textContent = `Em đúng ${score}/${total} câu — ${label}`;
  const m = Math.floor(seconds / 60), s = seconds % 60;
  $("mr-time").textContent = `Thời gian: ${m} phút ${s} giây`;
  $("mr-badges").textContent = newOnes.length
    ? "Huy hiệu mới: " + newOnes.map(b => `${b.icon} ${b.name}`).join(", ") : "";

  const list = $("mr-review");
  if (mQuiz.wrongs.length) {
    list.innerHTML = `<h3 class="review-title">📋 Những câu cần ôn lại</h3>`;
    mQuiz.wrongs.forEach(it => {
      const div = document.createElement("div");
      div.className = "review-item wrong-item";
      div.innerHTML = `<div class="rq">${it.q}</div>
        <div class="ra">Đáp án đúng: <span class="good-ans">${it.o[it.a]}</span><br>💡 <span class="explain">${it.e || ""}</span></div>`;
      list.appendChild(div);
    });
  } else {
    list.innerHTML = `<div class="review-item"><div class="ra">🏆 Em làm đúng hết, không có câu nào cần ôn lại!</div></div>`;
  }
  showScreen("result");
}

// ---------- Tính nhanh (đếm giờ) ----------
let drill = null;
const DRILL_GENS = {
  addsub: () => {
    if (RNG() < 0.5) { const x = ri(3, 60), y = ri(3, 99 - x); return { q: `${x} + ${y}`, ans: x + y }; }
    const x = ri(10, 99), y = ri(2, x - 1); return { q: `${x} − ${y}`, ans: x - y };
  },
  muldiv: () => {
    const a = ri(2, 9), b = ri(2, 9);
    if (RNG() < 0.5) return { q: `${a} × ${b}`, ans: a * b };
    return { q: `${a * b} : ${a}`, ans: b };
  },
  mix: () => (RNG() < 0.5 ? DRILL_GENS.addsub() : DRILL_GENS.muldiv()),
};

function startDrill() {
  const op = document.querySelector(".op-chip.selected")?.dataset.op || "mix";
  const secs = Number(document.querySelector(".time-chip.selected")?.dataset.secs || 60);
  drill = {
    op, secondsLeft: secs, total: secs,
    score: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0,
    current: null, lastQ: "",
    timerId: setInterval(drillTick, 1000),
  };
  showScreen("drill");
  renderDrillHUD();
  nextDrillQuestion();
}

function drillTick() {
  drill.secondsLeft--;
  renderDrillHUD();
  if (drill.secondsLeft <= 3 && drill.secondsLeft > 0) beep(880, .1, 0, "square", .08);
  if (drill.secondsLeft <= 0) endDrill();
}

function renderDrillHUD() {
  $("md-timer").textContent = `⏱ ${drill.secondsLeft}s`;
  $("md-timer").classList.toggle("warning", drill.secondsLeft <= 10);
  $("md-score").textContent = `🏅 ${drill.score}`;
  $("md-streak").textContent = drill.streak >= 3 ? `🔥 ${drill.streak}` : "";
  $("md-fill").style.width = `${(drill.secondsLeft / drill.total) * 100}%`;
}

function nextDrillQuestion() {
  let item, guard = 0;
  do { item = DRILL_GENS[drill.op](); } while (item.q === drill.lastQ && guard++ < 10);
  drill.lastQ = item.q;
  drill.current = item;
  $("md-question").textContent = item.q + " = ?";
  const { o, a } = makeOptions(item.ans, [item.ans + 1, item.ans - 1, item.ans + 2, item.ans - 2, item.ans + 10, item.ans - 10], String);
  drill.answerIndex = a;
  const box = $("md-options");
  box.innerHTML = "";
  o.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "drill-option";
    btn.textContent = opt;
    btn.onclick = () => answerDrill(i, btn);
    box.appendChild(btn);
  });
}

function answerDrill(i, btn) {
  if (!drill || drill.secondsLeft <= 0) return;
  if (i === drill.answerIndex) {
    drill.correct++;
    drill.streak++;
    drill.bestStreak = Math.max(drill.bestStreak, drill.streak);
    drill.score += 10 + (drill.streak >= 3 ? 5 : 0);
    playCorrect();
    nextDrillQuestion();
  } else {
    drill.wrong++;
    drill.streak = 0;
    playWrong();
    btn.classList.add("wrong");
    [...$("md-options").children].forEach((b, j) => { if (j === drill.answerIndex) b.classList.add("correct"); b.disabled = true; });
    setTimeout(() => { if (drill && drill.secondsLeft > 0) nextDrillQuestion(); }, 900);
  }
  renderDrillHUD();
}

function endDrill() {
  clearInterval(drill.timerId);
  const best = mload(MLS.bestDrill, 0);
  const isRecord = drill.score > best;
  if (isRecord) msave(MLS.bestDrill, drill.score);
  const newOnes = checkNewBadges();
  playFanfare();
  $("mdr-title").textContent = isRecord ? "🏆 KỶ LỤC MỚI!" : "⚡ Hết giờ!";
  $("mdr-score").textContent = `${drill.score} điểm`;
  $("mdr-detail").innerHTML =
    `✅ Đúng: <b>${drill.correct}</b> câu &nbsp; ❌ Sai: <b>${drill.wrong}</b> câu<br>` +
    `🔥 Chuỗi đúng dài nhất: <b>${drill.bestStreak}</b><br>` +
    `🥇 Điểm cao nhất của em: <b>${Math.max(best, drill.score)}</b>`;
  $("mdr-badges").textContent = newOnes.length
    ? "Huy hiệu mới: " + newOnes.map(b => `${b.icon} ${b.name}`).join(", ") : "";
  const d = drill;
  drill = null;
  clearInterval(d.timerId);
  showScreen("drillresult");
}

function quitDrill() {
  if (drill) clearInterval(drill.timerId);
  drill = null;
  renderHome();
  showScreen("home");
}

// ---------- Kết quả của em ----------
function renderProgress() {
  const history = mload(MLS.history, []);
  const totalCorrect = history.reduce((n, h) => n + h.score, 0);
  const totalQ = history.reduce((n, h) => n + h.total, 0);
  $("mp-summary").innerHTML = `
    <div class="stat-box"><div class="num">${history.length}</div><div class="lbl">Bài đã làm</div></div>
    <div class="stat-box"><div class="num">${totalQ ? Math.round(totalCorrect / totalQ * 100) : 0}%</div><div class="lbl">Tỉ lệ đúng</div></div>
    <div class="stat-box"><div class="num">${mload(MLS.bestDrill, 0)}</div><div class="lbl">Kỷ lục tính nhanh</div></div>
    <div class="stat-box"><div class="num">${dailyStreak()}</div><div class="lbl">Chuỗi ngày 🔥</div></div>
  `;
  const hl = $("mp-history");
  hl.innerHTML = history.length ? "" : `<div class="empty-note">Chưa có bài nào. Làm bài đầu tiên nhé!</div>`;
  history.slice(0, 20).forEach(h => {
    const d = new Date(h.date);
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<span>${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} — ${h.label || ""}</span>
      <span class="h-score">${h.score}/${h.total} ${"⭐".repeat(h.stars)}</span>`;
    hl.appendChild(div);
  });
  const wrong = mload(MLS.wrongCounts, {});
  const entries = Object.entries(wrong).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const wl = $("mp-weak");
  wl.innerHTML = entries.length ? "" : `<div class="empty-note">Chưa có câu nào sai. Tuyệt vời!</div>`;
  entries.forEach(([q, n]) => {
    const div = document.createElement("div");
    div.className = "weak-item";
    div.innerHTML = `${q} — <span class="w-count">sai ${n} lần</span>`;
    wl.appendChild(div);
  });
}

// ---------- Gắn sự kiện ----------
document.querySelectorAll(".op-chip").forEach(ch => ch.onclick = () => {
  playTap();
  document.querySelectorAll(".op-chip").forEach(c => c.classList.remove("selected"));
  ch.classList.add("selected");
});
document.querySelectorAll(".time-chip").forEach(ch => ch.onclick = () => {
  playTap();
  document.querySelectorAll(".time-chip").forEach(c => c.classList.remove("selected"));
  ch.classList.add("selected");
});

$("m-btn-drill").onclick = () => startDrill();
$("m-btn-topic").onclick = () => startQuiz("practice");
$("m-btn-logic").onclick = () => startQuiz("logic");
$("m-btn-daily").onclick = () => startQuiz("daily");
$("mq-next").onclick = nextQuizQuestion;
$("mq-quit").onclick = () => {
  if (!confirm("Em có chắc muốn thoát không? Bài làm sẽ không được lưu.")) return;
  mQuiz = null; renderHome(); showScreen("home");
};
$("md-quit").onclick = quitDrill;
$("mr-again").onclick = () => startQuiz(mQuiz ? mQuiz.mode : "practice");
$("mr-home").onclick = () => { renderHome(); showScreen("home"); };
$("mdr-again").onclick = () => startDrill();
$("mdr-home").onclick = () => { renderHome(); showScreen("home"); };
$("m-btn-progress").onclick = () => { renderProgress(); showScreen("progress"); };
$("mp-home").onclick = () => { renderHome(); showScreen("home"); };

renderHome();
