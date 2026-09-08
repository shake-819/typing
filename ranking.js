// --- ランキング機能(Supabase連携) ---
// テーブル: public.typing_rankings (name, category, genre, difficulty, duration, speed, accuracy, miss, created_at)
// 一意制約: (name, genre, difficulty, duration) で1人1モースあたり1行に固定。
// 方針: 送信は必ず submit_typing_score という関数(RPC)経由で行う。
//       関数側で「今の記録より速いときだけ上書き」を判定するので、行が無限に増えない。

const SUPABASE_URL = "https://rzqhvomycxqqzudhpzen.supabase.co";
const SUPABASE_KEY = "sb_publishable_8p4zhhVZ1qavPtPSi595WQ_1ZtblEBi";

const RANKING_NAME_KEY = "typingRankingName";

const rankingClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

function getRankingName() {
  return localStorage.getItem(RANKING_NAME_KEY) || "";
}

function setRankingName(name) {
  localStorage.setItem(RANKING_NAME_KEY, name);
}

// 別サイト(クイズサイト)と同じSupabaseプロジェクトのアカウントでログインしていれば、
// そのユーザーIDを記録に紐付ける。ログインしていなければ null(=匿名プレイ)。
async function getLinkedUserId() {
  if (!rankingClient) return null;
  try {
    const { data } = await rankingClient.auth.getUser();
    return data?.user?.id || null;
  } catch (err) {
    console.error("ログイン状態の確認に失敗しました", err);
    return null;
  }
}

// public.users からそのユーザーの表示名(name列)を取得する。無ければnull。
// (auth.jsのヘッダー表示からも呼ばれる共通ヘルパー)
async function fetchProfileName(userId) {
  if (!rankingClient) return null;
  try {
    const { data, error } = await rankingClient
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();
    if (!error && data?.name) return data.name;
  } catch (err) {
    console.error("プロフィール名の取得に失敗しました", err);
  }
  return null;
}

// ログイン中なら、ランキングに使う名前として public.users.name を毎回取り直す。
// (localStorageの古い名前より、そのときのプロフィール名を優先する)
// ログインしていない・名前が取れない場合は null(呼び出し側で手入力にフォールバック)。
async function getLinkedRankingName() {
  if (!rankingClient) return null;
  try {
    const { data } = await rankingClient.auth.getUser();
    const user = data?.user;
    if (!user) return null;
    return await fetchProfileName(user.id);
  } catch (err) {
    console.error("ログイン中の名前取得に失敗しました", err);
    return null;
  }
}

// genre="difficulty"(通常のひらがな/ローマ字打ち)のときだけdifficultyの区別が意味を持つ。
// それ以外のジャンルは全員共通の問題セットなのでdifficultyは空文字にしておく(DB側もNOT NULL・空文字運用)。
function buildRankingMode(state) {
  const genre = state.genre;
  const difficulty = genre === "difficulty" ? state.difficulty : "";
  const duration = state.duration === Infinity ? 0 : Math.round(state.duration);
  return { genre, difficulty, duration };
}

// submit_typing_score(SQL側の関数)を呼ぶだけ。
// 「今の自己ベストより速いか」の判定はDB側で行うので、ここでは常に呼び出してよい。
async function saveScoreToRanking({ name, genre, difficulty, duration, speed, accuracy, miss }) {
  if (!rankingClient) return;
  try {
    const { error } = await rankingClient.rpc("submit_typing_score", {
      p_name: name,
      p_genre: genre,
      p_difficulty: difficulty,
      p_duration: duration,
      p_speed: speed,
      p_accuracy: accuracy,
      p_miss: miss,
      p_user_id: await getLinkedUserId(),
    });
    if (error) throw error;
  } catch (err) {
    console.error("ランキング送信に失敗しました", err);
  }
}

// 1人1モース1行しかないので、そのまま速度順にlimit件取得すればランキングになる。
async function fetchRanking({ genre, difficulty, duration, limit = 5 }) {
  if (!rankingClient) return [];
  try {
    const { data, error } = await rankingClient
      .from("typing_rankings")
      .select("name, speed, accuracy, miss, created_at")
      .eq("genre", genre)
      .eq("difficulty", difficulty)
      .eq("duration", duration)
      .order("speed", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("ランキング取得に失敗しました", err);
    return [];
  }
}

// --- ページ最下部の「ジャンル別ランキング」セクション ---
// こちらは制限時間(duration)を区別せず、そのジャンル(・難易度)の中で
// 一番速い自己ベストだけを人ごとに集めて上位を出す。
const GENRE_RANKING_DEFS = [
  { genre: "difficulty", difficulty: "easy", label: "基本タイピング(易しい)" },
  { genre: "difficulty", difficulty: "normal", label: "基本タイピング(ふつう)" },
  { genre: "difficulty", difficulty: "hard", label: "基本タイピング(難しい)" },
  { genre: "business", difficulty: "", label: "ビジネス用語" },
  { genre: "email", difficulty: "", label: "メール" },
  { genre: "it", difficulty: "", label: "IT用語" },
  { genre: "dev", difficulty: "", label: "実務会話" },
  { genre: "js", difficulty: "", label: "JS" },
  { genre: "sql", difficulty: "", label: "SQL" },
];

// durationで絞らず全件から、名前ごとの最高speedだけをクライアント側で抜き出す
// (同じ人が複数の制限時間で打っていても、一番速い記録だけを採用する)
async function fetchGenreBestRanking(genre, difficulty, limit = 5) {
  if (!rankingClient) return [];
  try {
    const { data, error } = await rankingClient
      .from("typing_rankings")
      .select("name, speed")
      .eq("genre", genre)
      .eq("difficulty", difficulty)
      .order("speed", { ascending: false })
      .limit(200);

    if (error) throw error;

    const seen = new Set();
    const best = [];
    for (const row of data || []) {
      if (seen.has(row.name)) continue;
      seen.add(row.name);
      best.push(row);
      if (best.length >= limit) break;
    }
    return best;
  } catch (err) {
    console.error("ジャンル別ランキング取得に失敗しました", err);
    return [];
  }
}

function escapeHtmlForRanking(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function renderGenreRankingOverview() {
  const grid = document.getElementById("genre-ranking-grid");
  if (!grid || !rankingClient) return;

  // 先にカードの枠だけ全部出して、データはジャンルごとに届いた順に埋めていく
  grid.innerHTML = GENRE_RANKING_DEFS.map(
    (def, i) => `
      <div class="genre-ranking-card" id="genre-ranking-card-${i}">
        <h3>${escapeHtmlForRanking(def.label)}</h3>
        <ol><li class="is-empty">読み込み中...</li></ol>
      </div>`
  ).join("");

  GENRE_RANKING_DEFS.forEach(async (def, i) => {
    const rows = await fetchGenreBestRanking(def.genre, def.difficulty);
    const card = document.getElementById(`genre-ranking-card-${i}`);
    if (!card) return;
    const list = card.querySelector("ol");

    if (rows.length === 0) {
      list.innerHTML = `<li class="is-empty">まだ記録がありません</li>`;
      return;
    }

    list.innerHTML = rows
      .map(
        (row, rank) =>
          `<li><span>${rank + 1}位 ${escapeHtmlForRanking(row.name)}</span><span>${Number(row.speed).toFixed(1)} 打/秒</span></li>`
      )
      .join("");
  });
}

document.addEventListener("DOMContentLoaded", renderGenreRankingOverview);
