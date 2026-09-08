// エンジンが受け付ける1キー分の入力かどうかを判定する。
// スペース(0x20)〜チルダ(0x7e)の印字可能なASCII文字全体を許可することで、
// ローマ字(かな入力)だけでなく、JS構文のような半角記号・数字・大文字を
// 含む文字列もそのまま入力対象にできる。
function isTypableKey(key) {
  return typeof key === "string" && key.length === 1 && key >= " " && key <= "~";
}

// かな文字列を「入力単位(モーラ)」の配列に分解する。
// っ(促音)は次のモーラの子音を重ねたパターンに変換し、
// ん は次の文字に応じて "n" 単独が使えるかどうかを切り替える。
function segmentKana(kanaStr) {
  const chars = Array.from(kanaStr);
  const units = [];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    // 促音(っ)
    if (ch === "っ") {
      let j = i + 1;
      let key = chars[j];
      if (chars[j + 1] && YOUON_SECOND.includes(chars[j + 1])) {
        key = chars[j] + chars[j + 1];
      }
      // 標準的な「次の子音を重ねる」形式(例: って→tte)に加えて、
      // 促音そのものを xtu/ltu の3打鍵で単独入力する形式も受け付ける
      // (例: って→xtute / ltute)。文末が「っ」で終わる(次に文字がない)
      // ような例外的なケースでは、xtu/ltu 単独のみを受け付ける。
      if (key === undefined) {
        units.push({ display: "っ", patterns: ["xtu", "ltu"] });
        i = j;
        continue;
      }
      const basePatterns = KANA_TABLE[key] || [key];
      const doubled = basePatterns.map(p => p[0] + p);
      const xtuForm = basePatterns.map(p => "xtu" + p);
      const ltuForm = basePatterns.map(p => "ltu" + p);
      units.push({ display: "っ" + key, patterns: [...doubled, ...xtuForm, ...ltuForm] });
      i = j + (key.length === 2 ? 2 : 1);
      continue;
    }

    // 拗音(きゃ、しゅ など)
    if (chars[i + 1] && YOUON_SECOND.includes(chars[i + 1]) && KANA_TABLE[ch + chars[i + 1]]) {
      const key = ch + chars[i + 1];
      units.push({ display: key, patterns: [...KANA_TABLE[key]] });
      i += 2;
      continue;
    }

    // ん
    if (ch === "ん") {
      const next = chars[i + 1];
      const needsDouble = next && "あいうえおやゆよ".includes(next);
      const isWordFinal = next === undefined;
      // 単語末尾の「ん」は実際の入力としては n 一回でも確定できるが、
      // 表示上は「最後の一文字だけ n では終われない」という誤解を避けるため
      // nn を優先パターンとして表示する(受理は従来通り n / nn どちらも可)。
      // "n"/"nn"/"n'" に加え、"xn" での単独入力も常に受け付ける。
      const patterns = needsDouble ? ["nn", "n'", "xn"]
        : isWordFinal ? ["nn", "n", "xn"]
        : ["n", "nn", "xn"];
      units.push({ display: "ん", patterns });
      i++;
      continue;
    }

    // 通常の1文字
    const patterns = KANA_TABLE[ch] || [ch];
    units.push({ display: ch, patterns: [...patterns] });
    i++;
  }

  return units;
}

class TypingEngine {
  // options.caseSensitive: true にすると大文字・小文字を区別して判定する
  // (JS構文モードなど)。false(既定値)ではローマ字入力と同様、
  // 常に小文字に変換してから判定する。
  constructor(kanaStr, options = {}) {
    this.units = segmentKana(kanaStr);
    this.currentUnitIndex = 0;
    this.typedBuffer = "";
    this.correctKeystrokes = 0;
    this.missKeystrokes = 0;
    this.keyMissMap = {};
    this.keyAttemptMap = {};
    this.caseSensitive = !!options.caseSensitive;
  }

  get isDone() {
    return this.currentUnitIndex >= this.units.length;
  }

  get currentUnit() {
    return this.units[this.currentUnitIndex];
  }

  // 現在の単位で、次に押すべきキー候補(表示・ハイライト用)
  nextExpectedKeys() {
    if (this.isDone) return [];
    const unit = this.currentUnit;
    const pos = this.typedBuffer.length;
    const keys = unit.patterns.map(p => p[pos]).filter(Boolean);
    return [...new Set(keys)];
  }

  // 現在の単位を表示する際、最も自然なローマ字パターンを選ぶ
  displayPatternForCurrentUnit() {
    if (this.isDone) return "";
    const unit = this.currentUnit;
    return unit.patterns.find(p => p.startsWith(this.typedBuffer)) || unit.patterns[0];
  }

  // 1キー入力を処理する。戻り値: "progress" | "unit-complete" | "miss" | "ignored"
  handleKey(rawKey) {
    if (!isTypableKey(rawKey)) return { result: "ignored" };
    const key = this.caseSensitive ? rawKey : rawKey.toLowerCase();
    if (this.isDone) return { result: "ignored" };

    // 打鍵の集計(ミス率など)は実際に押されたキー1つにつき1回だけ数える。
    // 「ん」の n/nn のように、内部的に前の単位へ確定処理を再帰させるケースが
    // あるため、集計はここで一度だけ行い、判定本体は _processKey に任せる。
    this.keyAttemptMap[key] = (this.keyAttemptMap[key] || 0) + 1;
    return this._processKey(key);
  }

  // 実際の一致判定。「ん」の n のように、それ単体で完全一致しつつ
  // さらに長いパターン(nn など)にも伸びうる場合は、即座に確定させず
  // 一旦保留(progress)にする。次のキーがその保留を裏切ったときは、
  // 保留していた分を確定させたうえで、同じキーを次の単位への入力として
  // 再評価する(「n」+「き」→「ん」確定 → 「き」への入力として処理、など)。
  _processKey(key) {
    const unit = this.currentUnit;
    const candidate = this.typedBuffer + key;

    const isExactMatch = unit.patterns.includes(candidate);
    const canExtend = unit.patterns.some(p => p.length > candidate.length && p.startsWith(candidate));

    if (isExactMatch && !canExtend) {
      this.typedBuffer = "";
      this.correctKeystrokes++;
      this.currentUnitIndex++;
      return { result: "unit-complete", key };
    }

    if (isExactMatch && canExtend) {
      // 例: 「ん」で "n" を打った直後。"nn" になる可能性がまだ残っているので保留する。
      this.typedBuffer = candidate;
      this.correctKeystrokes++;
      return { result: "progress", key };
    }

    if (unit.patterns.some(p => p.startsWith(candidate))) {
      this.typedBuffer = candidate;
      this.correctKeystrokes++;
      return { result: "progress", key };
    }

    // 保留中だった入力(typedBuffer)がそれ単体で完全一致するパターンだった場合、
    // ここで確定させ、今回のキーは次の単位への入力として再評価する。
    if (this.typedBuffer && unit.patterns.includes(this.typedBuffer)) {
      this.typedBuffer = "";
      this.currentUnitIndex++;
      if (this.isDone) {
        this.missKeystrokes++;
        this.keyMissMap[key] = (this.keyMissMap[key] || 0) + 1;
        return { result: "miss", key };
      }
      return this._processKey(key);
    }

    this.missKeystrokes++;
    this.keyMissMap[key] = (this.keyMissMap[key] || 0) + 1;
    return { result: "miss", key };
  }
}
