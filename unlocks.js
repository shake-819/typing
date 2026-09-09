// --- センテンスパックのアンロック(ポイント制) ---
// 使い方: 有料にしたいカテゴリ/サブジャンルのボタンに
//   class="... is-locked"
//   data-locked-pack="パックのkey"
// を付けておく(is-lockedは念のため最初から付けておく = データ取得前は安全側で「買えない」扱い)。
//
// public.sentence_packs (key, label, cost) …売っているパック一覧
// public.sentence_unlocks (user_id, pack_key) …買った記録
// ポイントの消費・付与は必ず unlock_sentence_pack という関数(RPC)経由で行う。
// クライアント側で持っているcostは表示用でしかなく、実際にいくら引かれるかは
// DB側(sentence_packs.cost)の値で決まるので、画面をいじっても安く買えたりはしない。

let sentencePacksCache = null;

async function fetchSentencePacks() {
  if (!rankingClient) return [];
  if (sentencePacksCache) return sentencePacksCache;

  const { data, error } = await rankingClient
    .from("sentence_packs")
    .select("key, label, cost");

  if (error) {
    console.error("センテンスパック一覧の取得に失敗しました", error);
    return [];
  }
  sentencePacksCache = data || [];
  return sentencePacksCache;
}

async function fetchMyUnlockedKeys() {
  if (!rankingClient) return [];

  const { data: userData } = await rankingClient.auth.getUser();
  const user = userData?.user;
  if (!user) return [];

  const { data, error } = await rankingClient
    .from("sentence_unlocks")
    .select("pack_key")
    .eq("user_id", user.id);

  if (error) {
    console.error("アンロック済みパックの取得に失敗しました", error);
    return [];
  }
  return (data || []).map((row) => row.pack_key);
}

// パックをアンロックする。実際の判定・ポイント消費はDB側(RPC)で行う。
async function unlockSentencePack(packKey) {
  if (!rankingClient) {
    return { success: false, message: "接続できませんでした" };
  }

  const { data, error } = await rankingClient.rpc("unlock_sentence_pack", {
    p_pack_key: packKey,
  });

  if (error) {
    console.error("アンロックに失敗しました", error);
    return { success: false, message: error.message };
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    success: !!result?.success,
    message: result?.message || "",
    newScore: result?.new_score ?? null,
  };
}

// data-locked-pack を持つボタンを、実際の購入状況に合わせて描画し直す。
// (ロックバッジの表示・is-lockedクラスの付け外しだけ担当。切り替え自体はapp.js側)
async function refreshLockedButtons() {
  const lockedButtons = document.querySelectorAll("[data-locked-pack]");
  if (lockedButtons.length === 0) return;

  const [packs, unlockedKeys] = await Promise.all([
    fetchSentencePacks(),
    fetchMyUnlockedKeys(),
  ]);

  lockedButtons.forEach((btn) => {
    const key = btn.dataset.lockedPack;
    const pack = packs.find((p) => p.key === key);
    const isUnlocked = unlockedKeys.includes(key);

    btn.classList.toggle("is-locked", !isUnlocked);

    let badge = btn.querySelector(".lock-badge");
    if (!isUnlocked && pack) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "lock-badge";
        btn.appendChild(badge);
      }
      badge.textContent = `🔒 ${pack.cost}pt`;
    } else if (badge) {
      badge.remove();
    }
  });
}

// ロック中のボタンが押されたときだけ購入フローを出す。
// (アンロック済みのボタンは何もしないので、通常のカテゴリ切り替えがそのまま動く)
document.querySelectorAll("[data-locked-pack]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!btn.classList.contains("is-locked")) return;

    const key = btn.dataset.lockedPack;
    const packs = await fetchSentencePacks();
    const pack = packs.find((p) => p.key === key);
    if (!pack) return;

    const { data: userData } = await rankingClient.auth.getUser();
    if (!userData?.user) {
      alert("アンロックするにはログインが必要です。上部の「ログイン」からログインしてください。");
      return;
    }

    const ok = confirm(`「${pack.label}」を ${pack.cost}pt 消費してアンロックしますか?`);
    if (!ok) return;

    const result = await unlockSentencePack(key);

    if (result.success) {
      alert(result.message || "アンロックしました");
      await refreshLockedButtons();
      await refreshAuthUi(); // ヘッダーの保有ポイント表示を更新
      if (!btn.classList.contains("is-locked")) {
        btn.click(); // アンロック直後、そのまま選択させる
      }
    } else {
      alert(result.message || "アンロックできませんでした");
    }
  });
});

refreshLockedButtons();
if (rankingClient) {
  rankingClient.auth.onAuthStateChange(() => {
    sentencePacksCache = null;
    refreshLockedButtons();
  });
}
