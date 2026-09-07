const STORAGE_KEY = "typingPracticeStats";
const DURATION_OPTIONS = [30, 60, 90, 120];
const DEFAULT_DURATION = 30;

const state = {
  genre: "difficulty", // "difficulty": 難易度別セット / "business": よく使うビジネス用語50 / "js": JS構文あるある50 / "sql": SQL構文あるある50
  difficulty: "easy",
  duration: DEFAULT_DURATION,
  conversionMode: "off", // "off": 変換なし(ローマ字を直接判定) / "on": 変換あり(実際のIMEで<input>に入力)
  currentItem: null,
  pool: [],
  queue: [],
  engine: null,
  unitEls: [],
  startTime: null,
  rafId: null,
  lastStatsRenderAt: 0,
  roundOver: false,
  roundStats: { correct: 0, miss: 0, itemsDone: 0, keyMissMap: {}, keyAttemptMap: {} }
};

const els = {
  setupScreen: document.getElementById("setup-screen"),
  practiceScreen: document.getElementById("practice-screen"),
  startBtn: document.getElementById("start-btn"),
  backBtn: document.getElementById("back-btn"),
  difficultyButtons: document.querySelectorAll(".difficulty-btn"),
  difficultySettingBlock: document.getElementById("difficulty-setting-block"),
  genreButtons: document.querySelectorAll(".genre-btn"),
  durationButtons: document.querySelectorAll(".duration-btn"),
  modeButtons: document.querySelectorAll(".mode-btn"),
  displayLine: document.getElementById("display-line"),
  romajiLine: document.getElementById("romaji-line"),
  imeInput: document.getElementById("ime-input"),
  progressLabel: document.getElementById("progress-label"),
  speedOut: document.getElementById("speed-out"),
  timeOut: document.getElementById("time-out"),
  missOut: document.getElementById("miss-out"),
  accuracyOut: document.getElementById("accuracy-out"),
  keyboardContainer: document.getElementById("keyboard"),
  statsGrid: document.getElementById("stats-grid"),
  timeLabel: document.getElementById("time-label"),
  weakKeyList: document.getElementById("weak-key-list"),
  resetStatsBtn: document.getElementById("reset-stats-btn"),
  restartBtn: document.getElementById("restart-btn"),
  resultPanel: document.getElementById("result-panel"),
  resultText: document.getElementById("result-text"),
  focusHint: document.getElementById("focus-hint")
};

const keyboard = new Keyboard(els.keyboardContainer);

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { keyMissMap: {}, keyAttemptMap: {} };
  } catch (e) {
    return { keyMissMap: {}, keyAttemptMap: {} };
  }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function mergeKeyMaps(target, source) {
  Object.entries(source).forEach(([k, v]) => {
    target[k] = (target[k] || 0) + v;
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isUnlimitedMode() {
  return state.duration === Infinity;
}

function renderWeakKeys() {
  const stats = loadStats();
  const entries = Object.keys(stats.keyAttemptMap)
    .map(k => {
      const attempts = stats.keyAttemptMap[k] || 0;
      const misses = stats.keyMissMap[k] || 0;
      const rate = attempts > 0 ? misses / attempts : 0;
      return { key: k, attempts, misses, rate };
    })
    .filter(e => e.misses > 0)
    .sort((a, b) => b.rate - a.rate || b.misses - a.misses)
    .slice(0, 6);

  els.weakKeyList.innerHTML = "";
  if (entries.length === 0) {
    els.weakKeyList.innerHTML = '<p class="muted-text">まだミスの記録がありません</p>';
    return;
  }
  entries.forEach(e => {
    const row = document.createElement("div");
    row.className = "weak-key-row";
    row.innerHTML = `
      <span class="weak-key-label">${e.key.toUpperCase()}</span>
      <div class="weak-key-bar-track"><div class="weak-key-bar-fill" style="width:${Math.round(e.rate * 100)}%"></div></div>
      <span class="weak-key-count">${e.misses}回 / ${e.attempts}回中</span>
    `;
    els.weakKeyList.appendChild(row);
  });
}

// お題が変わったタイミングで1回だけ、モーラごとの入れ物(span)を作る。
// 完了済み・未着手のモーラは以後書き換えないので、再描画コストがかからない。
function buildRomajiLine() {
  const engine = state.engine;
  const fragment = document.createDocumentFragment();
  state.unitEls = engine.units.map(unit => {
    const span = document.createElement("span");
    span.className = "romaji-pending";
    span.textContent = unit.patterns[0];
    fragment.appendChild(span);
    return span;
  });
  els.romajiLine.innerHTML = "";
  els.romajiLine.appendChild(fragment);
  updateCurrentUnitSpan();
}

// 現在入力中のモーラ1つ分だけを更新する(打鍵のたびに呼ばれる軽量な処理)。
function updateCurrentUnitSpan() {
  const engine = state.engine;
  const idx = engine.currentUnitIndex;
  if (idx >= state.unitEls.length) return;

  const span = state.unitEls[idx];
  const pattern = engine.displayPatternForCurrentUnit();
  const typedLen = engine.typedBuffer.length;
  span.className = "romaji-unit";
  span.innerHTML = pattern
    .split("")
    .map((ch, i) => `<span class="${i < typedLen ? "romaji-done" : "romaji-pending"}">${ch}</span>`)
    .join("");

  keyboard.highlightExpected(engine.nextExpectedKeys());
}

// 1モーラ打ち終えたタイミングで、そのモーラの表示を確定させ、次のモーラへ移る。
function completeCurrentUnitSpan(completedIdx) {
  const engine = state.engine;
  const span = state.unitEls[completedIdx];
  span.className = "romaji-done";
  span.textContent = engine.units[completedIdx].patterns[0];

  if (!engine.isDone) {
    updateCurrentUnitSpan();
  } else {
    keyboard.highlightExpected([]);
  }
}

function updateStatsDisplay() {
  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  const remaining = isUnlimitedMode() ? elapsed : Math.max(state.duration - elapsed, 0);
  const speed = elapsed > 0 ? (state.roundStats.correct / Math.min(elapsed, isUnlimitedMode() ? elapsed : state.duration)) : 0;
  const totalKeys = state.roundStats.correct + state.roundStats.miss;
  const accuracy = totalKeys > 0 ? (state.roundStats.correct / totalKeys) * 100 : 100;

  els.speedOut.innerHTML = speed.toFixed(1) + '<span class="unit-label"> 打/秒</span>';
  els.timeOut.innerHTML = remaining.toFixed(1) + '<span class="unit-label"> 秒</span>';
  els.missOut.textContent = state.roundStats.miss;
  els.accuracyOut.innerHTML = accuracy.toFixed(0) + '<span class="unit-label">%</span>';
}

const STATS_UPDATE_INTERVAL_MS = 100;

function tick() {
  const elapsed = (Date.now() - state.startTime) / 1000;
  if (elapsed >= state.duration) {
    updateStatsDisplay();
    finishRound();
    return;
  }
  // DOM書き換え(innerHTML)は重いので、時間経過のチェックだけ軽く毎フレーム行い、
  // 実際の表示更新は100ms間隔に間引く。人の目には十分滑らかに見える頻度。
  const now = Date.now();
  if (now - state.lastStatsRenderAt >= STATS_UPDATE_INTERVAL_MS) {
    state.lastStatsRenderAt = now;
    updateStatsDisplay();
  }
  state.rafId = requestAnimationFrame(tick);
}

function startTicking() {
  cancelAnimationFrame(state.rafId);
  state.lastStatsRenderAt = 0;
  state.rafId = requestAnimationFrame(tick);
}

function stopTicking() {
  cancelAnimationFrame(state.rafId);
}

function refillQueueIfNeeded() {
  if (state.queue.length === 0) {
    state.queue = shuffle(state.pool);
  }
}

function nextItem() {
  if (state.roundOver) return;
  refillQueueIfNeeded();
  const item = state.queue.shift();
  state.currentItem = item;
  els.displayLine.textContent = item.display;
  els.progressLabel.textContent = `${state.roundStats.itemsDone + 1}問目`;

  if (state.conversionMode === "on") {
    els.imeInput.value = "";
    els.imeInput.classList.remove("ime-wrong");
    els.imeInput.focus();
  } else {
    state.engine = new TypingEngine(item.kana, { caseSensitive: state.genre === "js" || state.genre === "sql" });
    buildRomajiLine();
  }
}

function startRound() {
  state.pool = state.genre === "business" ? BUSINESS_SENTENCES
    : state.genre === "js" ? JS_SENTENCES
    : state.genre === "sql" ? SQL_SENTENCES
    : state.genre === "it" ? IT_SENTENCES
    : SENTENCE_SETS[state.difficulty];
  state.queue = shuffle(state.pool);
  state.startTime = null;
  state.roundOver = false;
  stopTicking();
  state.roundStats = { correct: 0, miss: 0, itemsDone: 0, keyMissMap: {}, keyAttemptMap: {} };
  els.resultPanel.style.display = "none";
  els.focusHint.style.display = "block";

  const isConversion = state.conversionMode === "on";
  els.imeInput.style.display = isConversion ? "block" : "none";
  els.romajiLine.style.display = isConversion ? "none" : "block";
  els.keyboardContainer.style.display = isConversion ? "none" : "flex";
  els.focusHint.textContent = isConversion
    ? "入力してEnterで確定してください(IMEで変換できます) / Escでホームに戻れます"
    : "キーボードで入力を開始してください / Escでホームに戻れます";

  updateStatsDisplay();
  els.statsGrid.style.display = "none";
  els.timeLabel.textContent = isUnlimitedMode() ? "経過時間" : "残り時間";
  els.timeOut.innerHTML = (isUnlimitedMode() ? "0.0" : state.duration.toFixed(1)) + '<span class="unit-label"> 秒</span>';
  nextItem();
}

function finishRound() {
  if (state.roundOver) return;
  state.roundOver = true;
  stopTicking();
  const stored = loadStats();
  mergeKeyMaps(stored.keyMissMap, state.roundStats.keyMissMap);
  mergeKeyMaps(stored.keyAttemptMap, state.roundStats.keyAttemptMap);
  saveStats(stored);
  renderWeakKeys();

  const elapsed = state.startTime ? Math.min((Date.now() - state.startTime) / 1000, state.duration) : 0;
  const speed = elapsed > 0 ? (state.roundStats.correct / elapsed).toFixed(1) : "0.0";
  els.romajiLine.innerHTML = "";
  els.displayLine.textContent = "";
  els.imeInput.value = "";
  els.imeInput.blur();
  els.progressLabel.textContent = "完了";
  keyboard.highlightExpected([]);
  els.resultPanel.style.display = "block";
  els.statsGrid.style.display = "";
  els.resultText.textContent = `${state.roundStats.itemsDone}問・平均速度 ${speed} 打/秒・ミス ${state.roundStats.miss} 回`;
}

// --- 変換なしモード: ローマ字を1キーずつモーラ単位で判定する ---
function handleKeydown(e) {
  if (state.conversionMode !== "off") return;
  if (!state.engine || state.engine.isDone || state.roundOver) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const key = e.key;
  if (!isTypableKey(key)) return;
  e.preventDefault();

  if (!state.startTime) {
    state.startTime = Date.now();
    startTicking();
  }

  const result = state.engine.handleKey(key);
  if (result.result === "ignored") return;

  const completedIdx = state.engine.currentUnitIndex - 1;

  if (result.result === "miss") {
    state.roundStats.miss++;
    state.roundStats.keyMissMap[result.key] = (state.roundStats.keyMissMap[result.key] || 0) + 1;
    state.roundStats.keyAttemptMap[result.key] = (state.roundStats.keyAttemptMap[result.key] || 0) + 1;
    keyboard.flashMiss(result.key);
  } else {
    state.roundStats.correct++;
    state.roundStats.keyAttemptMap[result.key] = (state.roundStats.keyAttemptMap[result.key] || 0) + 1;
  }

  updateStatsDisplay();

  if (result.result === "unit-complete") {
    completeCurrentUnitSpan(completedIdx);
    if (state.engine.isDone) {
      state.roundStats.itemsDone++;
      setTimeout(nextItem, 150);
    }
  } else if (result.result === "progress") {
    updateCurrentUnitSpan();
  }
}

// --- 変換ありモード: 実際のIME入力を<input>にそのまま任せ、
//     Enterが押された時点(IMEの変換確定中でないとき)に答え合わせをする ---
function handleImeInput() {
  if (!state.startTime && !state.roundOver) {
    state.startTime = Date.now();
    startTicking();
  }
}

function handleImeKeydown(e) {
  if (state.conversionMode !== "on" || state.roundOver) return;
  if (e.key !== "Enter") return;
  // IMEで変換候補を確定させるためのEnter(変換中)は無視し、
  // 完全に確定した状態でのEnterだけを「答え合わせ」として扱う。
  if (e.isComposing || e.keyCode === 229) return;

  e.preventDefault();
  const typed = els.imeInput.value.trim();
  if (!typed) return;

  if (typed === state.currentItem.display) {
    state.roundStats.correct += typed.length;
    state.roundStats.itemsDone++;
    els.imeInput.classList.remove("ime-wrong");
    updateStatsDisplay();
    setTimeout(nextItem, 150);
  } else {
    state.roundStats.miss++;
    els.imeInput.classList.add("ime-wrong");
    setTimeout(() => els.imeInput.classList.remove("ime-wrong"), 300);
    updateStatsDisplay();
  }
}

els.imeInput.addEventListener("input", handleImeInput);
els.imeInput.addEventListener("keydown", handleImeKeydown);

els.difficultyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    els.difficultyButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.difficulty = btn.dataset.difficulty;
  });
});

els.genreButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    els.genreButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.genre = btn.dataset.genre;
    els.difficultySettingBlock.style.display = (state.genre === "business" || state.genre === "js" || state.genre === "sql" || state.genre === "it") ? "none" : "block";
  });
});

els.durationButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    els.durationButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.duration = btn.dataset.duration === "unlimited" ? Infinity : parseInt(btn.dataset.duration, 10);
  });
});

els.modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    els.modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.conversionMode = btn.dataset.mode;
  });
});

function showSetupScreen() {
  stopTicking();
  state.roundOver = true;
  els.practiceScreen.style.display = "none";
  els.setupScreen.style.display = "block";
  renderWeakKeys();
}

function showPracticeScreen() {
  els.setupScreen.style.display = "none";
  els.practiceScreen.style.display = "block";
  startRound();
}

els.startBtn.addEventListener("click", showPracticeScreen);
els.backBtn.addEventListener("click", showSetupScreen);

els.restartBtn.addEventListener("click", startRound);

els.resetStatsBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderWeakKeys();
});

window.addEventListener("keydown", handleKeydown);
window.addEventListener("keydown", () => {
  // 既に非表示なら何もしない(打鍵のたびに毎回同じ値を書き込むだけの無駄を防ぐ)
  if (els.focusHint.style.display !== "none") {
    els.focusHint.style.display = "none";
  }
});

// Escキー: 通常モードは即ホームへ。無制限モードは1回目で結果表示、2回目でホームへ。
function handleEscKey(e) {
  if (e.key !== "Escape") return;
  if (els.practiceScreen.style.display === "none") return;
  e.preventDefault();

  if (isUnlimitedMode()) {
    if (!state.roundOver) {
      finishRound();
    } else {
      showSetupScreen();
    }
  } else {
    showSetupScreen();
  }
}
window.addEventListener("keydown", handleEscKey);

renderWeakKeys();
