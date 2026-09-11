const STORAGE_KEY = "typingPracticeStats";
const DURATION_OPTIONS = [30, 60, 90, 120];
const DEFAULT_DURATION = 30;

const state = {
  category: "typing", // "typing" / "business" / "it" / "programming" / "lyrics" / "other"
  genre: "difficulty", // "difficulty": 難易度別セット / "business": よく使うビジネス用語50 / "js": JS構文あるある50 / "sql": SQL構文あるある50 / "lyrics": 歌詞
  difficulty: "easy",
  duration: DEFAULT_DURATION,
  conversionMode: "off", // "off": 変換なし(ローマ字を直接判定) / "on": 変換あり(実際のIMEで<input>に入力)
  punctuationMode: "on", // "on": ！？を含む問題も出題する / "off": ！？を含む問題を除外する
  furiganaMode: "on", // "on": furiganaデータがある問題にふりがなを表示する / "off": 表示しない
  currentItem: null,
  pool: [],
  queue: [],
  engine: null,
  unitEls: [],
  startTime: null,
  rafId: null,
  lastStatsRenderAt: 0,
  roundOver: false,
  roundStats: { correct: 0, miss: 0, itemsDone: 0, keyMissMap: {}, keyAttemptMap: {} },
  pendingRankingScore: null // 名前未登録の状態でラウンドが終わったとき、名前登録後に送信するスコアを一時保存する
};

const els = {
  setupScreen: document.getElementById("setup-screen"),
  practiceScreen: document.getElementById("practice-screen"),
  startBtn: document.getElementById("start-btn"),
  backBtn: document.getElementById("back-btn"),
  categoryButtons: document.querySelectorAll(".category-btn"),
  subgenreGroups: document.querySelectorAll(".subgenre-bar"),
  genreButtons: document.querySelectorAll(".subgenre-bar .genre-btn"),
  durationButtons: document.querySelectorAll(".duration-btn"),
  modeButtons: document.querySelectorAll(".mode-btn"),
  punctuationButtons: document.querySelectorAll(".punctuation-btn"),
  furiganaButtons: document.querySelectorAll(".furigana-btn"),
  displayLine: document.getElementById("display-line"),
  romajiLine: document.getElementById("romaji-line"),
  imeInput: document.getElementById("ime-input"),
  modeSettingBlock: document.getElementById("mode-setting-block"),
  progressLabel: document.getElementById("progress-label"),
  lyricsCredit: document.getElementById("lyrics-credit"),
  speedOut: document.getElementById("speed-out"),
  timeOut: document.getElementById("time-out"),
  missOut: document.getElementById("miss-out"),
  accuracyOut: document.getElementById("accuracy-out"),
  keyboardContainer: document.getElementById("keyboard"),
  statsGrid: document.getElementById("stats-grid"),
  timeLabel: document.getElementById("time-label"),
  timerBadge: document.getElementById("timer-badge"),
  weakKeyList: document.getElementById("weak-key-list"),
  resetStatsBtn: document.getElementById("reset-stats-btn"),
  restartBtn: document.getElementById("restart-btn"),
  resultPanel: document.getElementById("result-panel"),
  resultText: document.getElementById("result-text"),
  rankingNameSetup: document.getElementById("ranking-name-setup"),
  rankingNameInput: document.getElementById("ranking-name-input"),
  rankingNameSaveBtn: document.getElementById("ranking-name-save-btn"),
  rankingPanel: document.getElementById("ranking-panel"),
  rankingTitle: document.getElementById("ranking-title"),
  rankingList: document.getElementById("ranking-list"),
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

// 1問あたりの文字数がこれを超えたら「長文」とみなし、中央揃えをやめて
// 左揃え+自動スクロール追従に切り替える(ビジネス文書検定の速度問題など)。
const LONG_TEXT_THRESHOLD = 60;

function applyLongTextLayout(item) {
  const isLong = item.kana.length > LONG_TEXT_THRESHOLD;
  els.displayLine.classList.toggle("long-text", isLong);
  els.romajiLine.classList.toggle("long-text", isLong);
}

// お題が変わったタイミングで1回だけ、モーラごとの入れ物(span)を作る。
// 完了済み・未着手のモーラは以後書き換えないので、再描画コストがかからない。
// 実際に押すキーと、画面上のローマ字表示を変えたい文字の対応表。
// (判定は元のキーのまま行い、見た目だけこの表に差し替える)
// 例: 中黒「・」は「/」キーで入力するが、画面には「・」と表示する。
const ROMAJI_DISPLAY_OVERRIDES = { "/": "・" };

function romajiDisplayText(str) {
  return str
    .split("")
    .map(ch => ROMAJI_DISPLAY_OVERRIDES[ch] || ch)
    .join("");
}

function buildRomajiLine() {
  const engine = state.engine;
  const fragment = document.createDocumentFragment();
  state.unitEls = engine.units.map(unit => {
    const span = document.createElement("span");
    span.className = "romaji-pending";
    span.textContent = romajiDisplayText(unit.patterns[0]);
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
    .map((ch, i) => {
      // 「re」「mu」のようなローマ字2文字セット全体ではなく、
      // 次に打つべき1文字だけをハイライトする。
      const cls = i < typedLen ? "romaji-done" : i === typedLen ? "romaji-current" : "romaji-pending";
      return `<span class="${cls}">${romajiDisplayText(ch)}</span>`;
    })
    .join("");

  keyboard.highlightExpected(engine.nextExpectedKeys());

  // 長文では現在位置が画面外に出ることがあるため、追従スクロールする。
  // (短文では常に画面内に収まっているので実質何もしない)
  if (els.romajiLine.classList.contains("long-text")) {
    span.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

// 1モーラ打ち終えたタイミングで、そのモーラの表示を確定させ、次のモーラへ移る。
// typedText を渡すと、代表パターン(patterns[0])の代わりに実際に打った
// 文字列(例: きゃ→kixya)をそのまま表示に残す。
function completeCurrentUnitSpan(completedIdx, typedText) {
  const engine = state.engine;
  const span = state.unitEls[completedIdx];
  span.className = "romaji-done";
  span.textContent = romajiDisplayText(typedText || engine.units[completedIdx].patterns[0]);

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
  els.timerBadge.textContent = (isUnlimitedMode() ? "経過 " : "残り ") + remaining.toFixed(1) + "秒";
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

function buildQueue() {
  // 歌詞ジャンルだけはシャッフルせず、歌詞の上から順番に出題する。
  return state.genre.startsWith("lyrics") ? [...state.pool] : shuffle(state.pool);
}

function refillQueueIfNeeded() {
  if (state.queue.length === 0) {
    state.queue = buildQueue();
  }
}

// HTML特殊文字をエスケープする(rubyタグを差し込むのでinnerHTMLを使う都合上必要)
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// item.furigana(例: [["会議","かいぎ"], ["資料","しりょう"]])があり、
// かつふりがな表示がONのときだけ、該当する単語を<ruby>タグに置き換えて表示する。
// item.display自体(タイピング判定・ランキング等で使う生テキスト)は一切変更しない。
function renderDisplayLine(item) {
  if (state.furiganaMode !== "on" || !item.furigana || item.furigana.length === 0) {
    els.displayLine.textContent = item.display;
    return;
  }
  let html = escapeHtml(item.display);
  item.furigana.forEach(([word, reading]) => {
    // 同じ単語が複数回出てくる行にも対応するため、一致箇所すべてを置き換える。
    // ただし既に<ruby>化した箇所を二重に置き換えないよう、プレーンな単語のみを対象にする。
    html = html.split(escapeHtml(word)).join(`<ruby>${escapeHtml(word)}<rt>${escapeHtml(reading)}</rt></ruby>`);
  });
  els.displayLine.innerHTML = html;
}

function nextItem() {
  if (state.roundOver) return;
  refillQueueIfNeeded();
  const item = state.queue.shift();
  state.currentItem = item;
  els.progressLabel.textContent = `${state.roundStats.itemsDone + 1}問目`;

  renderDisplayLine(item);
  applyLongTextLayout(item);

  // 歌詞ジャンルのときだけ、その行がどの曲のものかを上部に表示する。
  if (state.genre.startsWith("lyrics") && item.songTitle) {
    const credit = `『${item.songTitle}』${item.artist ? " / " + item.artist : ""}` +
      (item.lyricist || item.composer ? `（作詞:${item.lyricist || "-"} 作曲:${item.composer || "-"}）` : "");
    els.lyricsCredit.textContent = credit;
    els.lyricsCredit.hidden = false;
  } else {
    els.lyricsCredit.hidden = true;
    els.lyricsCredit.textContent = "";
  }

  if (state.conversionMode === "on") {
    els.imeInput.value = "";
    els.imeInput.classList.remove("ime-wrong");
    els.imeInput.focus();
  } else {
    state.engine = new TypingEngine(item.kana, { caseSensitive: state.genre === "js" || state.genre === "sql" || state.genre === "vba" });
    buildRomajiLine();
  }
}

function startRound() {
  state.pool = state.genre === "business" ? BUSINESS_SENTENCES
    : state.genre === "js" ? JS_SENTENCES
    : state.genre === "sql" ? SQL_SENTENCES
    : state.genre === "vba" ? VBA_SENTENCES
    : state.genre === "it" ? IT_SENTENCES
    : state.genre === "itpass" ? ITPASS_SENTENCES
    : state.genre === "kihonjoho" ? KIHONJOHO_SENTENCES
    : state.genre === "email" ? EMAIL_SENTENCES
    : state.genre === "keigo" ? KEIGO_SENTENCES
    : state.genre === "dev" ? DEV_SENTENCES
    : state.genre.startsWith("lyrics") ? (LYRICS_SENTENCES_BY_GENRE[state.genre] || [])
    : state.genre === "maniawankatta" ? MANIAWANKATTA_SENTENCES
    : SENTENCE_SETS[state.difficulty];

  // 「！？を除く」設定の場合、感嘆符・疑問符を含む問題をプールから取り除く。
  // (対象ジャンル内に該当問題が1つもない場合はそのまま全件を使う)
  if (state.punctuationMode === "off") {
    const filtered = state.pool.filter(item => !/[！？]/.test(item.kana));
    if (filtered.length > 0) state.pool = filtered;
  }

  state.queue = buildQueue();
  state.startTime = null;
  state.roundOver = false;
  stopTicking();
  state.roundStats = { correct: 0, miss: 0, itemsDone: 0, keyMissMap: {}, keyAttemptMap: {} };
  els.resultPanel.style.display = "none";
  els.rankingNameSetup.style.display = "none";
  els.rankingPanel.style.display = "none";
  els.focusHint.style.display = "block";

  const isConversion = state.conversionMode === "on";
  els.displayLine.style.display = "block";
  els.imeInput.style.display = isConversion ? "block" : "none";
  els.romajiLine.style.display = !isConversion ? "block" : "none";
  els.keyboardContainer.style.display = !isConversion ? "flex" : "none";
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
  els.lyricsCredit.hidden = true;
  els.lyricsCredit.textContent = "";
  els.imeInput.value = "";
  els.imeInput.blur();
  els.progressLabel.textContent = "完了";
  keyboard.highlightExpected([]);
  els.resultPanel.style.display = "block";
  els.statsGrid.style.display = "";
  els.resultText.textContent = `${state.roundStats.itemsDone}問・平均速度 ${speed} 打/秒・ミス ${state.roundStats.miss} 回`;

  const totalKeys = state.roundStats.correct + state.roundStats.miss;
  const accuracy = totalKeys > 0 ? (state.roundStats.correct / totalKeys) * 100 : 100;
  submitRankingResult({
    speed: parseFloat(speed),
    accuracy: Math.round(accuracy * 10) / 10,
    miss: state.roundStats.miss,
  });
}

// --- ランキング送信・表示 ---
// ログイン中は public.users.name を毎回優先して使う。
// ログインしておらず、名前もまだ端末に保存されていない場合は先に名前入力フォームを出し、
// 登録ボタンが押されたタイミングで初めて送信する。2回目以降は自動送信。
async function submitRankingResult(scoreInfo) {
  const mode = buildRankingMode(state);
  const linkedName = await getLinkedRankingName();
  const existingName = linkedName || getRankingName();

  if (existingName) {
    els.rankingNameSetup.style.display = "none";
    const result = await saveScoreToRanking({ name: existingName, ...mode, ...scoreInfo });
    if (!result.success) {
      console.error("submitRankingResult: 記録に失敗しました", result.error);
      alert("ランキングへの記録に失敗しました。通信状況をご確認のうえ、もう一度プレイしてお試しください。");
    }
    renderRanking(mode, existingName);
    renderGenreRankingOverview();
  } else {
    state.pendingRankingScore = { mode, scoreInfo };
    els.rankingPanel.style.display = "none";
    els.rankingNameSetup.style.display = "block";
    els.rankingNameInput.value = "";
    els.rankingNameInput.focus();
  }
}

async function renderRanking(mode, myName) {
  els.rankingPanel.style.display = "block";
  els.rankingList.innerHTML = "<li>読み込み中...</li>";
  const rows = await fetchGenreBestRanking(mode.genre, mode.difficulty);

  if (rows.length === 0) {
    els.rankingList.innerHTML = "<li>まだ記録がありません(あなたが1位です!)</li>";
    return;
  }

  els.rankingList.innerHTML = rows
    .map((row, i) => {
      const isMe = row.name === myName;
      return `<li class="${isMe ? "is-me" : ""}"><span><span class="ranking-rank">${i + 1}位</span>${escapeHtml(row.name)}</span><span>${Number(row.speed).toFixed(1)} 打/秒</span></li>`;
    })
    .join("");
}

els.rankingNameSaveBtn.addEventListener("click", async () => {
  const name = els.rankingNameInput.value.trim();
  if (!name) {
    els.rankingNameInput.focus();
    return;
  }
  setRankingName(name);
  els.rankingNameSetup.style.display = "none";

  const pending = state.pendingRankingScore;
  if (pending) {
    const result = await saveScoreToRanking({ name, ...pending.mode, ...pending.scoreInfo });
    if (result.success) {
      renderRanking(pending.mode, name);
      renderGenreRankingOverview();
      state.pendingRankingScore = null;
    } else {
      // 失敗時はpendingRankingScoreを残しておき、名前入力欄を再表示して
      // 「保存」を押し直せば同じ記録を再送信できるようにする。
      console.error("rankingNameSaveBtn: 記録に失敗しました", result.error);
      alert("ランキングへの記録に失敗しました。通信状況をご確認のうえ、もう一度「保存」を押してください。");
      els.rankingNameSetup.style.display = "block";
    }
  }
});

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
    completeCurrentUnitSpan(completedIdx, result.completedText);
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
    els.imeInput.value = "";
    setTimeout(() => els.imeInput.classList.remove("ime-wrong"), 300);
    updateStatsDisplay();
  }
}

els.imeInput.addEventListener("input", handleImeInput);
els.imeInput.addEventListener("keydown", handleImeKeydown);

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// カテゴリ(タイピング/ビジネス系/IT系/プログラミング)を切り替える。
// 各カテゴリ内で最後に選ばれていた(なければ先頭の)サブジャンルを、
// そのまま出題内容として反映する。
els.categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // ロック中(未アンロックの有料パック)は unlocks.js 側の購入フローに任せ、
    // ここでは何もしない。
    if (btn.classList.contains("is-locked")) return;

    els.categoryButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const category = btn.dataset.category;
    state.category = category;

    els.subgenreGroups.forEach(group => {
      group.style.display = group.dataset.categoryGroup === category ? "flex" : "none";
    });

    const activeGroup = document.querySelector(`.subgenre-bar[data-category-group="${category}"]`);
    const subBtns = Array.from(activeGroup.querySelectorAll(".genre-btn"));
    // ロック中(未アンロックの有料サブジャンル)は自動選択の対象から外す。
    // 「activeクラス付き・未ロック」→「先頭の未ロック」→(全部ロック中なら仕方なく)先頭、の優先順で選ぶ。
    const activeSubBtn =
      subBtns.find(b => b.classList.contains("active") && !b.classList.contains("is-locked")) ||
      subBtns.find(b => !b.classList.contains("is-locked")) ||
      subBtns[0];
    if (activeSubBtn) {
      subBtns.forEach(b => b.classList.remove("active"));
      activeSubBtn.classList.add("active");
      // ロック中のボタンは見た目だけ選択状態にし、実際の出題内容(state.genre)は変えない。
      // (unlocks.js側のクリックハンドラが購入フローを担当する)
      if (!activeSubBtn.classList.contains("is-locked")) {
        state.genre = activeSubBtn.dataset.genre;
        if (activeSubBtn.dataset.difficulty) state.difficulty = activeSubBtn.dataset.difficulty;
      }
    }
  });
});

// サブジャンル(易しい/ふつう/難しい、ビジネス用語/メール、など)の選択。
// アクティブ状態の切り替えは同じグループ内だけで行う(他カテゴリの選択を消さない)。
els.genreButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // ロック中(未アンロックの有料パック)は unlocks.js 側の購入フローに任せ、
    // ここでは何もしない。
    if (btn.classList.contains("is-locked")) return;

    const group = btn.closest(".subgenre-bar");
    group.querySelectorAll(".genre-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.genre = btn.dataset.genre;
    if (btn.dataset.difficulty) {
      state.difficulty = btn.dataset.difficulty;
    }
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

els.punctuationButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    els.punctuationButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.punctuationMode = btn.dataset.punctuation;
  });
});

els.furiganaButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    els.furiganaButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.furiganaMode = btn.dataset.furigana;
    // 練習中に切り替えた場合、今表示中の問題文にもすぐ反映する
    if (state.currentItem) {
      renderDisplayLine(state.currentItem);
    }
  });
});

function showSetupScreen() {
  stopTicking();
  state.roundOver = true;
  els.practiceScreen.style.display = "none";
  els.setupScreen.style.display = "block";
  window.scrollTo(0, 0);
  renderWeakKeys();
}

function showPracticeScreen() {
  // 選択中のサブジャンルが未購入(ロック中)のまま「はじめる」が押された場合、
  // 無関係な別ジャンルで練習を始めてしまわないよう、購入フロー(unlocks.js側)に
  // 委ねて練習開始はしない。
  const activeGroup = document.querySelector(`.subgenre-bar[data-category-group="${state.category}"]`);
  const lockedActiveBtn = activeGroup && activeGroup.querySelector(".genre-btn.active.is-locked");
  if (lockedActiveBtn) {
    lockedActiveBtn.click();
    return;
  }

  els.setupScreen.style.display = "none";
  els.practiceScreen.style.display = "block";
  window.scrollTo(0, window.innerHeight / 2.2);
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
