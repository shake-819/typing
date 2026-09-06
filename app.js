const ITEMS_PER_ROUND = 5;
const STORAGE_KEY = "typingPracticeStats";

const state = {
  difficulty: "easy",
  queue: [],
  engine: null,
  startTime: null,
  timerId: null,
  roundStats: { correct: 0, miss: 0, itemsDone: 0, keyMissMap: {}, keyAttemptMap: {} }
};

const els = {
  difficultyButtons: document.querySelectorAll(".difficulty-btn"),
  kanaLine: document.getElementById("kana-line"),
  romajiLine: document.getElementById("romaji-line"),
  progressLabel: document.getElementById("progress-label"),
  speedOut: document.getElementById("speed-out"),
  timeOut: document.getElementById("time-out"),
  missOut: document.getElementById("miss-out"),
  accuracyOut: document.getElementById("accuracy-out"),
  keyboardContainer: document.getElementById("keyboard"),
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

function renderKanaLine() {
  const engine = state.engine;
  els.kanaLine.innerHTML = "";
  engine.units.forEach((unit, idx) => {
    const span = document.createElement("span");
    span.textContent = unit.display;
    if (idx < engine.currentUnitIndex) span.className = "kana-done";
    else if (idx === engine.currentUnitIndex) span.className = "kana-current";
    else span.className = "kana-pending";
    els.kanaLine.appendChild(span);
  });

  const pattern = engine.displayPatternForCurrentUnit();
  const typedLen = engine.typedBuffer.length;
  let html = "";
  for (let i = 0; i < pattern.length; i++) {
    html += `<span class="${i < typedLen ? "romaji-done" : "romaji-pending"}">${pattern[i]}</span>`;
  }
  els.romajiLine.innerHTML = html;

  keyboard.highlightExpected(engine.nextExpectedKeys());
}

function updateStatsDisplay() {
  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  const speed = elapsed > 0 ? (state.roundStats.correct / elapsed) : 0;
  const totalKeys = state.roundStats.correct + state.roundStats.miss;
  const accuracy = totalKeys > 0 ? (state.roundStats.correct / totalKeys) * 100 : 100;

  els.speedOut.innerHTML = speed.toFixed(1) + '<span class="unit-label"> 打/秒</span>';
  els.timeOut.innerHTML = elapsed.toFixed(1) + '<span class="unit-label"> 秒</span>';
  els.missOut.textContent = state.roundStats.miss;
  els.accuracyOut.innerHTML = accuracy.toFixed(0) + '<span class="unit-label">%</span>';
}

function tick() {
  updateStatsDisplay();
}

function nextItem() {
  if (state.queue.length === 0) {
    finishRound();
    return;
  }
  const kana = state.queue.shift();
  state.engine = new TypingEngine(kana);
  els.progressLabel.textContent = `${state.roundStats.itemsDone + 1} / ${ITEMS_PER_ROUND}問目`;
  renderKanaLine();
}

function startRound() {
  const pool = shuffle(SENTENCE_SETS[state.difficulty]);
  state.queue = pool.slice(0, ITEMS_PER_ROUND);
  state.startTime = null;
  clearInterval(state.timerId);
  state.roundStats = { correct: 0, miss: 0, itemsDone: 0, keyMissMap: {}, keyAttemptMap: {} };
  els.resultPanel.style.display = "none";
  els.focusHint.style.display = "block";
  updateStatsDisplay();
  nextItem();
}

function finishRound() {
  clearInterval(state.timerId);
  const stored = loadStats();
  mergeKeyMaps(stored.keyMissMap, state.roundStats.keyMissMap);
  mergeKeyMaps(stored.keyAttemptMap, state.roundStats.keyAttemptMap);
  saveStats(stored);
  renderWeakKeys();

  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  const speed = elapsed > 0 ? (state.roundStats.correct / elapsed).toFixed(1) : "0.0";
  els.kanaLine.innerHTML = "";
  els.romajiLine.innerHTML = "";
  els.progressLabel.textContent = "完了";
  keyboard.highlightExpected([]);
  els.resultPanel.style.display = "block";
  els.resultText.textContent = `平均速度 ${speed} 打/秒・ミス ${state.roundStats.miss} 回`;
}

function handleKeydown(e) {
  if (!state.engine || state.engine.isDone) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const key = e.key;
  if (!/^[a-zA-Z\-']$/.test(key)) return;
  e.preventDefault();

  if (!state.startTime) {
    state.startTime = Date.now();
    state.timerId = setInterval(tick, 100);
  }

  const result = state.engine.handleKey(key);
  if (result.result === "ignored") return;

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

  if (state.engine.isDone) {
    state.roundStats.itemsDone++;
    setTimeout(nextItem, 150);
  } else {
    renderKanaLine();
  }
}

els.difficultyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    els.difficultyButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.difficulty = btn.dataset.difficulty;
    startRound();
  });
});

els.restartBtn.addEventListener("click", startRound);

els.resetStatsBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderWeakKeys();
});

window.addEventListener("keydown", handleKeydown);
window.addEventListener("keydown", () => { els.focusHint.style.display = "none"; }, { once: false });

renderWeakKeys();
startRound();
