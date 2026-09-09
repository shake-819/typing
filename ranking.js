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

// public.users からそのユーザーの保有ポイント(score列)を取得する。
// ログインしていない・取得できない場合は null。
async function fetchMyScore() {
  if (!rankingClient) return null;
  try {
    const { data: userData } = await rankingClient.auth.getUser();
    const user = userData?.user;
    if (!user) return null;

    const { data, error } = await rankingClient
      .from("users")
      .select("score")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("ポイントの取得に失敗しました", error);
      return null;
    }
    return data?.score ?? null;
  } catch (err) {
    console.error("ポイントの取得に失敗しました", err);
    return null;
  }
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
//
// durationはランキングの区別に使わない方針にしたため、送信時は常に0固定にする。
// (submit_typing_score のシグネチャ・一意制約(name, genre, difficulty, duration)は
//  そのまま残っているが、duration列には常に0だけが入るようになるので、
//  実質「ジャンル・難易度ごとに1人1記録」として扱われる)
function buildRankingMode(state) {
  const genre = state.genre;
  const difficulty = genre === "difficulty" ? state.difficulty : "";
  return { genre, difficulty, duration: 0 };
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

// ラウンド終了後の即時ランキング表示・下部の「ジャンル別ランキング」表示、
// どちらもこの関数を使う。durationでは絞らず、名前ごとの最高speedだけを
// クライアント側で抜き出す(同じ人が複数の制限時間で打っていても、
// 一番速い記録だけを採用する)。
//
// 下部の「ジャンル別ランキング」は、出題内容選択(category-bar)と同じ
// カテゴリ単位でタブ分けする。サブジャンルは今後どんどん増える想定なので、
// フラットな一覧ではなくカテゴリごとにまとめておくことで、
// 1) カード数が増えても見失いにくい 2) 選択中のカテゴリの分だけ
// フェッチすればよく通信量も抑えられる、という2つの狙いがある。
// 新しいサブジャンルを追加するときは、対応するcategoryのgenresに
// 1行足すだけでよい(index.html側のカテゴリ追加とセットで行うこと)。
const RANKING_CATEGORIES = [
  {
    category: "typing",
    label: "タイピング",
    genres: [
      { genre: "difficulty", difficulty: "easy", label: "易しい" },
      { genre: "difficulty", difficulty: "normal", label: "ふつう" },
      { genre: "difficulty", difficulty: "hard", label: "難しい" },
    ],
  },
  {
    category: "business",
    label: "ビジネス系",
    genres: [
      { genre: "business", difficulty: "", label: "ビジネス用語" },
      { genre: "email", difficulty: "", label: "メール" },
    ],
  },
  {
    category: "it",
    label: "IT系",
    genres: [
      { genre: "it", difficulty: "", label: "IT用語" },
      { genre: "dev", difficulty: "", label: "実務会話" },
    ],
  },
  {
    category: "programming",
    label: "プログラミング",
    genres: [
      { genre: "js", difficulty: "", label: "JS" },
      { genre: "sql", difficulty: "", label: "SQL" },
      { genre: "vba", difficulty: "", label: "VBA(有料)" },
    ],
  },
];

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

// カード描画は1ラウンド終わるたびに呼ばれるが、呼び出しごとに
// fetchGenreBestRanking()が非同期で複数走るため、前回(古い)呼び出しの
// 取得が後から届くと新しいデータを上書きしてしまうことがある。
// そこで呼び出しごとに世代トークンを発行し、自分が最新の呼び出しでなければ
// 描画をせずに結果を捨てる。
let rankingCardsRenderToken = 0;

// 現在タブで選択中のカテゴリ。ページ内で1つだけ持つ単純な状態でよい。
let activeRankingCategory = RANKING_CATEGORIES[0].category;

// 選択中カテゴリぶんのサブジャンルだけをカードとして描画する。
// (全カテゴリぶんを一度にフェッチしないので、サブジャンルが増えても
//  タブを開くまでは通信が発生しない)
async function renderRankingCards() {
  const grid = document.getElementById("genre-ranking-grid");
  if (!grid || !rankingClient) return;

  const defs = RANKING_CATEGORIES.find(c => c.category === activeRankingCategory)?.genres || [];
  const myToken = ++rankingCardsRenderToken;

  // 先にカードの枠だけ全部出して、データはジャンルごとに届いた順に埋めていく
  grid.innerHTML = defs.map(
    (def, i) => `
      <div class="genre-ranking-card" id="genre-ranking-card-${i}">
        <h3>${escapeHtmlForRanking(def.label)}</h3>
        <ol><li class="is-empty">読み込み中...</li></ol>
      </div>`
  ).join("");

  defs.forEach(async (def, i) => {
    const rows = await fetchGenreBestRanking(def.genre, def.difficulty);

    // 自分が発行された後にさらに新しい呼び出し(ラウンド終了 or タブ切替)が
    // 始まっていたら、古い結果なので画面には反映せず捨てる。
    if (myToken !== rankingCardsRenderToken) return;

    const card = document.getElementById(`genre-ranking-card-${i}`);
    if (!card) return;
    const list = card.querySelector("ol");

    if (rows.length === 0) {
      list.innerHTML = `<li class="is-empty">まだ記録がありません(1位を狙えます)</li>`;
      return;
    }

    list.innerHTML = rows
      .map((row, i2) => {
        const place = i2 + 1;
        const medalClass = place <= 3 ? ` is-medal is-medal-${place}` : "";
        return `
          <li class="genre-ranking-row${medalClass}">
            <span class="genre-ranking-place">${place}</span>
            <span class="genre-ranking-name">${escapeHtmlForRanking(row.name)}</span>
            <span class="genre-ranking-speed">${Number(row.speed).toFixed(1)}<small>打/秒</small></span>
          </li>`;
      })
      .join("");
  });
}

// カテゴリタブ(初回のみ生成)とカードグリッドをまとめて用意する。
// 2回目以降(ラウンド終了ごと)の呼び出しではタブは作り直さず、
// 選択中カテゴリのカードだけ再描画する。
function renderGenreRankingOverview() {
  const tabBar = document.getElementById("genre-ranking-tabs");
  const grid = document.getElementById("genre-ranking-grid");
  if (!tabBar || !grid || !rankingClient) return;

  if (!tabBar.dataset.built) {
    tabBar.innerHTML = RANKING_CATEGORIES.map(
      cat => `<button type="button" class="ranking-tab-btn${cat.category === activeRankingCategory ? " active" : ""}" data-ranking-category="${cat.category}">${escapeHtmlForRanking(cat.label)}</button>`
    ).join("");
    tabBar.dataset.built = "1";

    tabBar.querySelectorAll(".ranking-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) return;
        activeRankingCategory = btn.dataset.rankingCategory;
        tabBar.querySelectorAll(".ranking-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderRankingCards();
      });
    });
  }

  renderRankingCards();
}

document.addEventListener("DOMContentLoaded", renderGenreRankingOverview);
