// --- ログイン機能(任意) ---
// クイズサイトと同じSupabaseプロジェクトのアカウントでログインできる。
// 新規登録はクイズサイト側で行う前提なので、ここではログインのみ扱う。
// ログインしなくても、今まで通り名前だけで練習・ランキング参加できる。

const authStatusEl = document.getElementById("auth-status");
const authFormEl = document.getElementById("auth-form");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authLoginBtn = document.getElementById("auth-login-btn");
const authLogoutBtn = document.getElementById("auth-logout-btn");
const authMessageEl = document.getElementById("auth-message");

// public.users からその人の表示名(name列)を取ってくる。取れなければメールアドレスで代用。
// (ヘッダーの状態表示専用。ランキングのnameにはメールを使わない = getLinkedRankingName側で別途判定)
async function fetchDisplayName(user) {
  const name = await fetchProfileName(user.id);
  return name || user.email;
}

async function refreshAuthUi() {
  if (!rankingClient || !authStatusEl) return;

  const { data } = await rankingClient.auth.getUser();
  const user = data?.user || null;

  if (user) {
    const displayName = await fetchDisplayName(user);
    authStatusEl.textContent = `${displayName} としてログイン中(記録が連携されます)`;
    authFormEl?.setAttribute("hidden", "");
    authLogoutBtn?.removeAttribute("hidden");
  } else {
    authStatusEl.textContent = "ログインしていません(名前だけでも練習できます)";
    authFormEl?.removeAttribute("hidden");
    authLogoutBtn?.setAttribute("hidden", "");
  }
}

async function handleLogin() {
  if (!rankingClient) return;

  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  if (!email || !password) {
    if (authMessageEl) authMessageEl.textContent = "メールアドレスとパスワードを入力してください";
    return;
  }

  authLoginBtn.disabled = true;
  const { error } = await rankingClient.auth.signInWithPassword({ email, password });
  authLoginBtn.disabled = false;

  if (error) {
    if (authMessageEl) authMessageEl.textContent = error.message;
    return;
  }

  if (authMessageEl) authMessageEl.textContent = "";
  authPasswordInput.value = "";
  await refreshAuthUi();
}

async function handleLogout() {
  if (!rankingClient) return;
  await rankingClient.auth.signOut();
  await refreshAuthUi();
}

authLoginBtn?.addEventListener("click", handleLogin);
authLogoutBtn?.addEventListener("click", handleLogout);
authPasswordInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

if (rankingClient) {
  rankingClient.auth.onAuthStateChange(() => {
    refreshAuthUi();
  });
}

refreshAuthUi();
