// 「歌詞」ジャンルのお題データ。
//
// 曲ごとに LYRICS_SONGS へ1つオブジェクトを追加する。
//   title:    曲名
//   artist:   アーティスト名
//   lyricist: 作詞者
//   composer: 作曲者
//   lines:    歌詞を1行(またはフレーズ)ずつに分けた配列。
//             display: 画面に表示する文章(漢字混じり)
//             kana:    入力判定に使うひらがな読み
//
// 記入例(コピーして使う場合はコメントを外して書き換えてください):
const LYRICS_SONGS = [
  {
    title: "盛れ！ミ・アモーレ",
    artist: "Juice=Juice",
    lyricist: "山崎あおい",
    composer: "山崎あおい",
    lines: [
      { display: "盛れ！　ミ・アモーレ", kana: "もれ！ み・あもーれ" },
      { display: "盛れ！　ミ・アモーレ", kana: "もれ！ み・あもーれ" },
      { display: "盛れ！　盛れ！　盛れ！", kana: "もれ！ もれ！ もれ！" },
      { display: "アモーレ　ミ・アモーレ", kana: "あもーれ み・あもーれ" },
      { display: "一番の私を見て", kana: "いちばんのわたしをみて" },
      { display: "ありのままなんて", kana: "ありのままなんて" },
      { display: "愛させたげない", kana: "あいさせたげない" },
      { display: "火花みたいな今を……", kana: "ひばなみたいないまを" },
      { display: "盛れ！！！", kana: "もれ！！！" },
      { display: "あなたの瞳はフィルター", kana: "あなたのひとみはふぃるたー" },
      { display: "燃えてゆく恋は刹那", kana: "もえてゆくこいはせつな" },
      { display: "思い出なら　綺麗なまま", kana: "おもいでなら きれいなまま" },
      { display: "笑っていられるの", kana: "わらっていられるの" },
      { display: "何気ないその一瞬", kana: "なにげないそのいっしゅん" },
      { display: "素顔のままも So cute", kana: "すがおのままも so cute" },
      { display: "だけどあなたにこそ", kana: "だけどあなたにこそ" },
      { display: "本気だけ", kana: "ほんきだけ" },
      { display: "こだわりの角度で", kana: "こだわりのかくどで" },
      { display: "あくまでも味付け", kana: "あくまでもあじつけ" },
      { display: "美しさのベスト", kana: "うつくしさのべすと" },
      { display: "焼き付けて", kana: "やきつけて" },
      { display: "油断できないわ", kana: "ゆだんできないわ" },
      { display: "シャッターチャンス", kana: "しゃったーちゃんす" },
      { display: "アモーレ　ミ・アモーレ", kana: "あもーれ み・あもーれ" },
      { display: "私を好きでいさせて", kana: "わたしをすきでいさせて" },
      { display: "ありのままなんて", kana: "ありのままなんて" },
      { display: "残させたくない", kana: "のこさせたくない" },
      { display: "現実以上　でいいの", kana: "げんじついじょう でいいの" },
      { display: "盛れ！　ミ・アモーレ", kana: "もれ！ み・あもーれ" },
      { display: "一番の私を見て", kana: "いちばんのわたしをみて" },
      { display: "ありのままなんて", kana: "ありのままなんて" },
      { display: "愛させたげない", kana: "あいさせたげない" },
      { display: "火花みたいな今を……", kana: "ひばなみたいないまを" },
      { display: "盛れ！！！", kana: "もれ！！！" },
      { display: "街角の明かり　フラッシュ", kana: "まちかどのあかり ふらっしゅ" },
      { display: "照らし出されちゃ　スキャンダル", kana: "てらしだされちゃ すきゃんだる" },
      { display: "乾いた唇が　気になるから", kana: "かわいたくちびるが きになるから" },
      { display: "見つめたりしないで", kana: "みつめたりしないで" },
      { display: "だれにでもある一瞬", kana: "だれにでもあるいっしゅん" },
      { display: "ナチュラル主義のBaby", kana: "なちゅらるしゅぎのbaby" },
      { display: "欺けるレベルの", kana: "あざむけるれべるの" },
      { display: "本気のベール", kana: "ほんきのべーる" },
      { display: "そこにある奇跡は", kana: "そこにあるきせきは" },
      { display: "あくまでも私よ", kana: "あくまでもわたしよ" },
      { display: "会えない日は写真", kana: "あえないひはしゃしん" },
      { display: "抱きしめて", kana: "だきしめて" },
      { display: "油断できないわ", kana: "ゆだんできないわ" },
      { display: "シャッターチャンス", kana: "しゃったーちゃんす" },
      { display: "アモーレ　ミ・アモーレ", kana: "あもーれ み・あもーれ" },
      { display: "私を好きでいさせて", kana: "わたしをすきでいさせて" },
      { display: "ありのままなんて", kana: "ありのままなんて" },
      { display: "残させたくない", kana: "のこさせたくない" },
      { display: "現実以上　でいいの", kana: "げんじついじょう でいいの" },
      { display: "盛れ！　ミ・アモーレ", kana: "もれ！ み・あもーれ" },
      { display: "一番の私を見て", kana: "いちばんのわたしをみて" },
      { display: "ありのままなんて", kana: "ありのままなんて" },
      { display: "愛させたげない", kana: "あいさせたげない" },
      { display: "火花みたいな今を……", kana: "ひばなみたいないまを" },
      { display: "盛れ！！！", kana: "もれ！！！" },
      { display: "アモーレ　ミ・アモーレ", kana: "あもーれ み・あもーれ" },
      { display: "あなたを好きでいさせて", kana: "あなたをすきでいさせて" },
      { display: "愛してゆくのと", kana: "あいしてゆくのと" },
      { display: "無防備さなら", kana: "むぼうびさなら" },
      { display: "比例しないわ　だけど", kana: "ひれいしないわ だけど" },
      { display: "盛れ！　ミ・アモーレ", kana: "もれ！ み・あもーれ" },
      { display: "私のもとを　去るのね", kana: "わたしのもとを さるのね" },
      { display: "悲しいエピソードって", kana: "かなしいえぴそーどって" },
      { display: "後味が悪い", kana: "あとあじがわるい" },
      { display: "めちゃくちゃにして話そう", kana: "めちゃくちゃにしてはなそう" },
      { display: "盛れ！！！", kana: "もれ！！！" },
      { display: "盛れ！！！", kana: "もれ！！！" }
    ]
  },
];

// 出題プール本体。曲ごとの行を1つの配列に展開し、
// どの曲の行かが分かるよう曲名・アーティスト・作詞・作曲の情報も各行に持たせておく
// (app.js側で歌詞ジャンルのときだけこの情報を画面上部に表示する)。
const LYRICS_SENTENCES = LYRICS_SONGS.flatMap(song =>
  song.lines.map(line => ({
    display: line.display,
    kana: line.kana,
    songTitle: song.title,
    artist: song.artist,
    lyricist: song.lyricist,
    composer: song.composer
  }))
);
