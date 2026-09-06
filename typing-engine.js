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
      const basePatterns = KANA_TABLE[key] || [key];
      const doubled = basePatterns.map(p => p[0] + p);
      units.push({ display: "っ" + key, patterns: doubled });
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
      const patterns = needsDouble ? ["nn", "n'"] : ["n", "nn"];
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
  constructor(kanaStr) {
    this.units = segmentKana(kanaStr);
    this.currentUnitIndex = 0;
    this.typedBuffer = "";
    this.correctKeystrokes = 0;
    this.missKeystrokes = 0;
    this.keyMissMap = {};
    this.keyAttemptMap = {};
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
    const key = rawKey.toLowerCase();
    if (!/^[a-z\-']$/.test(key)) return { result: "ignored" };
    if (this.isDone) return { result: "ignored" };

    const unit = this.currentUnit;
    const candidate = this.typedBuffer + key;
    this.keyAttemptMap[key] = (this.keyAttemptMap[key] || 0) + 1;

    if (unit.patterns.includes(candidate)) {
      this.typedBuffer = "";
      this.correctKeystrokes++;
      this.currentUnitIndex++;
      return { result: "unit-complete", key };
    }

    if (unit.patterns.some(p => p.startsWith(candidate))) {
      this.typedBuffer = candidate;
      this.correctKeystrokes++;
      return { result: "progress", key };
    }

    this.missKeystrokes++;
    this.keyMissMap[key] = (this.keyMissMap[key] || 0) + 1;
    return { result: "miss", key };
  }
}
