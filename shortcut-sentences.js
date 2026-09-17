// 「ショートカットキー」ジャンル用のお題データ(半角入力想定・有料パック/30pt)。
// display: 画面上部に表示する説明文(そのショートカットが何をする操作かの日本語)
// kana:    実際に入力・判定する対象の文字列(半角英数記号のショートカット表記そのもの。
//          「Ctrl+C」のように矢印キーや記号を含む表記もそのまま半角で打ち込む。
//          Windowsキーは "win" と表記する)
//
// JS/SQL/VBA構文セットと同様、TypingEngine の caseSensitive オプションを
// 有効にして使用する(app.js 側で genre === "shortcut" のときに指定する)。
// 表記はすべて小文字統一(Shiftキーを押す手間を増やさないため)。
//
// Windows PC・Chrome(Chromebook含む)のどちらでも実際に使えるものだけを収録。
// Mac専用(Cmdキー)のショートカットは含めない。
//
// unlocks.js経由の有料パック。Supabase側 sentence_packs テーブルに
// key="shortcut", cost=30 の行を登録しておくこと(costの実値はDB側が正)。
const SHORTCUT_SENTENCES = [
  // --- Windows共通(OS全般で使える基本操作) ---
  { display: "コピー", kana: "ctrl+c" },
  { display: "切り取り", kana: "ctrl+x" },
  { display: "貼り付け", kana: "ctrl+v" },
  { display: "元に戻す(アンドゥ)", kana: "ctrl+z" },
  { display: "やり直し(リドゥ)", kana: "ctrl+y" },
  { display: "すべて選択", kana: "ctrl+a" },
  { display: "上書き保存", kana: "ctrl+s" },
  { display: "新規作成", kana: "ctrl+n" },
  { display: "開く", kana: "ctrl+o" },
  { display: "印刷", kana: "ctrl+p" },
  { display: "検索", kana: "ctrl+f" },
  { display: "置換", kana: "ctrl+h" },
  { display: "太字にする", kana: "ctrl+b" },
  { display: "斜体にする", kana: "ctrl+i" },
  { display: "下線を引く", kana: "ctrl+u" },
  { display: "ウィンドウを閉じる", kana: "alt+f4" },
  { display: "アプリ間を切り替える", kana: "alt+tab" },
  { display: "タスクマネージャーを開く", kana: "ctrl+shift+esc" },
  { display: "デスクトップを表示する", kana: "win+d" },
  { display: "エクスプローラーを開く", kana: "win+e" },
  { display: "設定を開く", kana: "win+i" },
  { display: "画面をロックする", kana: "win+l" },
  { display: "アプリを最小化する", kana: "win+m" },
  { display: "スクリーンショット範囲を選択する", kana: "win+shift+s" },
  { display: "仮想デスクトップを新規作成する", kana: "win+ctrl+d" },
  { display: "仮想デスクトップを閉じる", kana: "win+ctrl+f4" },
  { display: "仮想デスクトップを切り替える", kana: "win+ctrl+right" },
  { display: "ウィンドウを画面半分にスナップする", kana: "win+left" },
  { display: "検索ボックスを開く", kana: "win+s" },
  { display: "ファイル名を指定して実行", kana: "win+r" },
  { display: "1つ前の操作を取り消す(全般)", kana: "esc" },
  { display: "ファイルの名前を変更する", kana: "f2" },
  { display: "ページを更新する", kana: "f5" },
  { display: "1つ前のフォルダ階層に戻る", kana: "backspace" },
  { display: "ファイルを完全に削除する", kana: "shift+delete" },
  { display: "テキストの先頭にカーソルを移動する", kana: "ctrl+home" },
  { display: "テキストの末尾にカーソルを移動する", kana: "ctrl+end" },
  { display: "1単語ずつ左に移動する", kana: "ctrl+left" },
  { display: "1単語ずつ右に移動する", kana: "ctrl+right" },

  // --- Chromeブラウザ ---
  { display: "新しいタブを開く", kana: "ctrl+t" },
  { display: "タブを閉じる", kana: "ctrl+w" },
  { display: "閉じたタブを開き直す", kana: "ctrl+shift+t" },
  { display: "次のタブに切り替える", kana: "ctrl+tab" },
  { display: "前のタブに切り替える", kana: "ctrl+shift+tab" },
  { display: "指定した番号のタブに移動する(1〜8番目)", kana: "ctrl+1" },
  { display: "新しいウィンドウを開く", kana: "ctrl+n" },
  { display: "シークレットウィンドウを開く", kana: "ctrl+shift+n" },
  { display: "アドレスバーにカーソルを移動する", kana: "ctrl+l" },
  { display: "ページ内を検索する", kana: "ctrl+f" },
  { display: "ページを再読み込みする", kana: "ctrl+r" },
  { display: "キャッシュを無視して再読み込みする", kana: "ctrl+shift+r" },
  { display: "ブックマークに追加する", kana: "ctrl+d" },
  { display: "ブックマークバーの表示を切り替える", kana: "ctrl+shift+b" },
  { display: "閲覧履歴を開く", kana: "ctrl+h" },
  { display: "ダウンロード履歴を開く", kana: "ctrl+j" },
  { display: "ページ内のリンク先を新しいタブで開く", kana: "ctrl+click" },
  { display: "拡大表示にする", kana: "ctrl+plus" },
  { display: "縮小表示にする", kana: "ctrl+minus" },
  { display: "表示倍率を100%に戻す", kana: "ctrl+0" },
  { display: "全画面表示に切り替える", kana: "f11" },
  { display: "デベロッパーツールを開く", kana: "ctrl+shift+i" },
  { display: "ページのソースを表示する", kana: "ctrl+u" },
];
