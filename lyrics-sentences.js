// 「歌詞」ジャンルのお題データ。
//
// 曲を追加する手順(3箇所を触ります):
//   1. このファイル: LYRICS_SONGS に曲オブジェクトを1つ追加する。
//      genre は他の曲と重複しない一意な値にし、必ず "lyrics" で始める
//      (例: "lyrics-newsong")。曲ごとに個別課金する方針のため、
//      このgenreがそのままDB(sentence_packs.key)・購入ボタンのkeyになる。
//      ※最初の曲だけ genre が "lyrics"(ハイフンなし)なのは、
//        既にこのkeyで購入済みのユーザーがいるため変更しないこと。
//   2. index.html: 歌詞のsubgenre-bar内にボタンを1つ追加する。
//      data-genre と data-locked-pack は、1.で決めたgenreと同じ値にする。
//   3. Supabase: public.sentence_packs に (key, label, cost) を1行追加する。
//      keyは1./2.と同じ値にする。
//
// ranking.jsのジャンル別ランキングカードはLYRICS_SONGSから自動生成されるので、
// ranking.js側の編集は不要。
//
// 各曲のフィールド:
//   genre:    このジャンルのID(上記の通り一意にする)
//   title:    曲名
//   artist:   アーティスト名
//   lyricist: 作詞者
//   composer: 作曲者
//   lines:    歌詞を1行(またはフレーズ)ずつに分けた配列。
//             display: 画面に表示する文章(漢字混じり)
//             kana:    入力判定に使うひらがな読み
const LYRICS_SONGS = [
  {
    genre: "lyrics",
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
  {
    genre: "lyrics-yorunoodoriko",
    title: "夜の踊り子",
    artist: "サカナクション",
    lyricist: "Ichiro Yamaguchi",
    composer: "Ichiro Yamaguchi",
    lines: [
      { display: "跳ねた跳ねた", kana: "はねたはねた" },
      { display: "僕は跳ねた", kana: "ぼくははねた" },
      { display: "小学生みたいに", kana: "しょうがくせいみたいに" },
      { display: "雨上がりの夜に跳ねた", kana: "あめあがりのよるにはねた" },
      { display: "水切りみたいに", kana: "みずきりみたいに" },
      { display: "(ミテイタフリシテ)", kana: "(みていたふりして)" },
      { display: "明日を素通り", kana: "あすをすどおり" },
      { display: "(ヨルニニゲタダケ)", kana: "(よるににげただけ)" },
      { display: "朝を素通り", kana: "あさをすどおり" },
      { display: "跳ねた跳ねた 君も跳ねた", kana: "はねたはねた きみもはねた" },
      { display: "女学生みたいに", kana: "じょがくせいみたいに" },
      { display: "水たまりの上で跳ねた", kana: "みずたまりのうえではねた" },
      { display: "あめんぼみたいに", kana: "あめんぼみたいに" },
      { display: "(ワスレタフリシテ)", kana: "(わすれたふりして)" },
      { display: "それはつまり", kana: "それはつまり" },
      { display: "(ヨルニニゲタダケ)", kana: "(よるににげただけ)" },
      { display: "どこへ行こう どこへ行こう", kana: "どこへいこう どこへいこう" },
      { display: "ここに居ようとしてる?", kana: "ここにいようとしてる?" },
      { display: "逃げるよ 逃げるよ", kana: "にげるよ にげるよ" },
      { display: "あと少しだけ", kana: "あとすこしだけ" },
      { display: "消えた消えた 君が消えた", kana: "きえたきえた きみがきえた" },
      { display: "蜃気楼みたいに", kana: "しんきろうみたいに" },
      { display: "にわか雨の音も消えた", kana: "にわかあめのおともきえた" },
      { display: "さよなら言うように", kana: "さよならいうように" },
      { display: "(キコエタフリシテ)", kana: "(きこえたふりして)" },
      { display: "君の言う通り", kana: "きみのいうとおり" },
      { display: "(ヨルニニゲタダケ)", kana: "(よるににげただけ)" },
      { display: "どこへ行こう どこへ行こう", kana: "どこへいこう どこへいこう" },
      { display: "ここに居ようとしてる?", kana: "ここにいようとしてる?" },
      { display: "逃げても 逃げても", kana: "にげても にげても" },
      { display: "音はもうしなくて", kana: "おとはもうしなくて" },
      { display: "雨になって何分か後に行く", kana: "あめになってなんぷんかあとにいく" },
      { display: "今泣いて何分か後に行く", kana: "いまないてなんぷんかあとにいく" },
      { display: "今泣いて何分か後の自分", kana: "いまないてなんぷんかあとのじぶん" },
      { display: "今泣いて何分か後に行く", kana: "いまないてなんぷんかあとにいく" },
      { display: "今泣いて何分か後に言う", kana: "いまないてなんぷんかあとにいう" },
      { display: "今泣いて何年か後の自分", kana: "いまないてなんねんかあとのじぶん" },
      { display: "行けるよ 行けるよ", kana: "いけるよ いけるよ" },
      { display: "遠くへ行こうとしてる", kana: "とおくへいこうとしてる" },
      { display: "イメージしよう イメージしよう", kana: "いめーじしよう いめーじしよう" },
      { display: "自分が思うほうへ", kana: "じぶんがおもうほうへ" },
      { display: "雨になって何分か後に行く", kana: "あめになってなんぷんかあとにいく" },
      { display: "今泣いて何分か後に行く", kana: "いまないてなんぷんかあとにいく" },
      { display: "今泣いて何分か後の自分", kana: "いまないてなんぷんかあとのじぶん" },
      { display: "今泣いて何分か後に言う", kana: "いまないてなんぷんかあとにいう" },
      { display: "今泣いて何年か後の自分", kana: "いまないてなんねんかあとのじぶん" },
      { display: "笑っていたいだろう？", kana: "わらっていたいだろう?" }
    ]
  },
  {
    genre: "lyrics-sukisugitemetu",
    title: "好きすぎて滅！",
    artist: "M!LK",
    lyricist: "MUTEKI DEAD SNAKE",
    composer: "浅野尚志",
    lines: [
      { display: "マジ ぎゅんぎゅんぎゅん", kana: "まじ ぎゅんぎゅんぎゅん" },
      { display: "好きすぎて滅！", kana: "すきすぎてめつ！" },
      { display: "Crazy Crazy", kana: "crazy crazy" },
      { display: "この愛は Crazy", kana: "このあいは crazy" },
      { display: "「ごめん、もう我慢できねえ。」", kana: "(ごめん、もうがまんできねえ。)" },
      { display: "Crazy Crazy", kana: "くれいじー くれいじー" },
      { display: "過去イチ Crazy", kana: "かこいち くれいじー" },
      { display: "「夢じゃないって、証明して？」", kana: "(ゆめじゃないって、しょうめいして？)" },
      { display: "現世に生まれ変わった", kana: "げんせにうまれかわった" },
      { display: "牛若丸 楊貴妃", kana: "うしわかまる ようきひ" },
      { display: "頭ん中 埋め尽くす", kana: "あたまんなか うめつくす" },
      { display: "その笑顔が海馬をジャックする", kana: "そのえがおがかいばをじゃっくする" },
      { display: "恋なんぞ単純な言葉では", kana: "こいなんぞたんじゅんなことばでは" },
      { display: "片付けられない This feeling", kana: "かたづけられない this feeling" },
      { display: "持てる全部 差し出そう", kana: "もてるぜんぶ さしだそう" },
      { display: "キミが喜ぶのなら  ", kana: "きみがよろこぶのなら  " },
      { display: "こんな僕がいるって", kana: "こんなぼくがいるって" },
      { display: "今日まで知らなかった", kana: "きょうまでしらなかった" },
      { display: "キミは神秘 キミは神秘", kana: "きみはしんぴ きみはしんぴ" },
      { display: "ずっとそばにいて", kana: "ずっとそばにいて" },
      { display: "「え、好き。」", kana: "(え、すき。)" },
      { display: "マジ ぎゅんぎゅんぎゅん", kana: "まじ ぎゅんぎゅんぎゅん" },
      { display: "好きすぎて滅！", kana: "すきすぎてめつ！" },
      { display: "心拍数はみるみる上昇中", kana: "しんぱくすうはみるみるじょうしょうちゅう" },
      { display: "ただ健やかに 生きていてね", kana: "ただすこやかに いきていてね" },
      { display: "それだけで幸せ", kana: "それだけでしあわせ" },
      { display: "マジぎゅんぎゅんぎゅん", kana: "まじぎゅんぎゅんぎゅん" },
      { display: "好きすぎて滅！", kana: "すきすぎてめつ！" },
      { display: "どこまで惚れさせる気なの？", kana: "どこまでほれさせるきなの？" },
      { display: "ああ キミがノンフィクションだなんてさ", kana: "ああ きみがのんふぃくしょんだなんてさ" },
      { display: "理性持たない 心臓持たない", kana: "りせいもたない しんぞうもたない" },
      { display: "四六時中 ゾッコン中", kana: "しろくじちゅう ぞっこんちゅう" },
      { display: "キミだけを見つめてたい", kana: "きみだけをみつめてたい" },
      { display: "いっさいがっさい 投げ捨てても問題ない", kana: "いっさいがっさい なげすててももんだいない" },
      { display: "実際問題 この気持ちは止めらんない", kana: "じっさいもんだい このきもちはとめらんない" },
      { display: "一体全体 僕はどうしちゃったんだい？", kana: "いったいぜんたい ぼくはどうしちゃったんだい？" },
      { display: "現在 未来 好きでいさせてくんない？", kana: "げんざい みらい すきでいさせてくんない？" },
      { display: "宇宙の果ての果て", kana: "うちゅうのはてのはて" },
      { display: "僕らは巡り合い", kana: "ぼくらはめぐりあい" },
      { display: "星がキラリ 愛はメラリ", kana: "ほしがきらり あいはめらり" },
      { display: "混ざり合ってゆく まさに LOVE", kana: "まざりあってゆく まさに love" },
      { display: "どんなキミも見逃さない", kana: "どんなきみもみのがさない" },
      { display: "どんなキミも瞳に収めたい", kana: "どんなきみもひとみにおさめたい" },
      { display: "僕だけのカメラロール", kana: "ぼくだけのかめらろーる" },
      { display: "独り占めさせて欲しい", kana: "ひとりじめさせてほしい" },
      { display: "タカラモノ 渡したくない", kana: "たからもの わたしたくない" },
      { display: "「だめ かな？」", kana: "(だめ かな？)" },
      { display: "80億分の1の奇跡", kana: "はちじゅうおくぶんのいちのきせき" },
      { display: "愛の雫が 大地濡らし", kana: "あいのしずくが だいちぬらし" },
      { display: "花も鳥も風も月も", kana: "はなもとりもかぜもつきも" },
      { display: "キミの名を呼んでる", kana: "きみのなをよんでる" },
      { display: "好きだ 好きだ", kana: "すきだ すきだ" },
      { display: "好きだ 好きだ", kana: "すきだ すきだ" },
      { display: "マジ ぎゅんぎゅんぎゅん", kana: "まじ ぎゅんぎゅんぎゅん" },
      { display: "好きすぎて滅！", kana: "すきすぎてめつ！" },
      { display: "どこまで惚れさせる気なの？", kana: "どこまでほれさせるきなの？" },
      { display: "ああ キミがノンフィクションだなんてさ", kana: "ああ きみがのんふぃくしょんだなんてさ" },
      { display: "夢に出てきて キスで目覚めて", kana: "ゆめにでてきて きすでめざめて" },
      { display: "「離さない。」", kana: "(はなさない。)" },
      { display: "「守るから。」", kana: "(まもるから。)" },
      { display: "今ここに永遠を誓おう", kana: "いまここにえいえんをちかおう" }
    ]
  },
];

// ジャンルID(曲)ごとの出題プール。
// 曲名・アーティスト・作詞・作曲の情報も各行に持たせておく
// (app.js側で歌詞ジャンルのときだけこの情報を画面上部に表示する)。
// LYRICS_SONGSに曲を追加すると、ここは自動的に増える。
const LYRICS_SENTENCES_BY_GENRE = {};
LYRICS_SONGS.forEach(song => {
  LYRICS_SENTENCES_BY_GENRE[song.genre] = song.lines.map(line => ({
    display: line.display,
    kana: line.kana,
    songTitle: song.title,
    artist: song.artist,
    lyricist: song.lyricist,
    composer: song.composer
  }));
});
