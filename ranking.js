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
