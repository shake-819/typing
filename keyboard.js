// キーボードの見た目上の配列(JIS配列に近い形)。
// key: 実際にそのキーを押したときにブラウザから渡される文字(判定に使う値)
// label: 見た目に表示する文字(省略時は key をそのまま大文字化して表示)
// wide: 幅広キー(Enter/Shift/BSなど)
// blank: 見た目だけのダミーキー(Tab/CapsLock位置などの空白)
const KEYBOARD_LAYOUT = [
  [
    { blank: true },
    { key: "1" }, { key: "2" }, { key: "3" }, { key: "4" }, { key: "5" },
    { key: "6" }, { key: "7" }, { key: "8" }, { key: "9" }, { key: "0" },
    { key: "-" }, { key: "^", ignore: true }, { key: "¥", ignore: true },
    { key: "Backspace", label: "BS", wide: true, ignore: true }
  ],
  [
    { blank: true },
    { key: "q" }, { key: "w" }, { key: "e" }, { key: "r" }, { key: "t" },
    { key: "y" }, { key: "u" }, { key: "i" }, { key: "o" }, { key: "p" },
    { key: "@", ignore: true }, { key: "[", ignore: true },
    { key: "Enter", label: "Enter", wide: true, ignore: true }
  ],
  [
    { blank: true },
    { key: "a" }, { key: "s" }, { key: "d" }, { key: "f" }, { key: "g" },
    { key: "h" }, { key: "j" }, { key: "k" }, { key: "l" },
    { key: ";", ignore: true }, { key: ":", ignore: true }, { key: "]", ignore: true }
  ],
  [
    { key: "Shift", label: "Shift", wide: true, ignore: true },
    { key: "z" }, { key: "x" }, { key: "c" }, { key: "v" }, { key: "b" },
    { key: "n" }, { key: "m" },
    { key: ",", ignore: true }, { key: ".", ignore: true },
    { key: "/" }, { key: "\\", ignore: true },
    { key: "Shift", label: "Shift", wide: true, ignore: true }
  ]
];

// エンジンが要求する文字(!や?)が、実機ではどのキー+Shiftで入力されるかの対応表。
// 例: "!" は "1" キーをShiftと一緒に押すことで入力する。
const SHIFT_KEY_MAP = {
  "!": "1",
  "?": "/"
};

class Keyboard {
  constructor(containerEl) {
    this.container = containerEl;
    this.keyEls = {};       // key(小文字) -> 通常キーのDOM要素の配列
    this.shiftEls = [];     // Shiftキー自体のDOM要素
    this._render();
  }

  _render() {
    this.container.innerHTML = "";
    this.container.className = "keyboard-jis";

    KEYBOARD_LAYOUT.forEach(row => {
      const rowEl = document.createElement("div");
      rowEl.className = "kb-row";

      row.forEach(def => {
        const keyEl = document.createElement("div");

        if (def.blank) {
          keyEl.className = "kb-key kb-key-blank";
          rowEl.appendChild(keyEl);
          return;
        }

        const isWide = !!def.wide;
        keyEl.className = "kb-key" + (isWide ? " kb-key-wide" : "");
        keyEl.textContent = def.label || def.key.toUpperCase();

        if (def.key === "Shift") {
          this.shiftEls.push(keyEl);
        } else if (!def.ignore) {
          const k = def.key.toLowerCase();
          if (!this.keyEls[k]) this.keyEls[k] = [];
          this.keyEls[k].push(keyEl);
        }

        rowEl.appendChild(keyEl);
      });

      this.container.appendChild(rowEl);
    });
  }

  _resolveKeyEls(rawKey) {
    const mapped = SHIFT_KEY_MAP[rawKey] || rawKey;
    return { els: this.keyEls[mapped.toLowerCase()] || [], needsShift: !!SHIFT_KEY_MAP[rawKey] };
  }

  highlightExpected(keys) {
    if (this._lastExpectedEls) {
      this._lastExpectedEls.forEach(el => el.classList.remove("kb-key-expected"));
    }
    if (this._lastShiftHinted) {
      this.shiftEls.forEach(el => el.classList.remove("kb-key-shift-hint"));
    }

    const expectedEls = [];
    let needsShiftHint = false;
    keys.forEach(rawKey => {
      const { els, needsShift } = this._resolveKeyEls(rawKey);
      els.forEach(el => {
        el.classList.add("kb-key-expected");
        expectedEls.push(el);
      });
      if (needsShift) needsShiftHint = true;
    });
    if (needsShiftHint) this.shiftEls.forEach(el => el.classList.add("kb-key-shift-hint"));

    this._lastExpectedEls = expectedEls;
    this._lastShiftHinted = needsShiftHint;
  }

  flashMiss(rawKey) {
    const { els } = this._resolveKeyEls(rawKey);
    els.forEach(el => {
      el.classList.add("kb-key-miss");
      setTimeout(() => el.classList.remove("kb-key-miss"), 200);
    });
  }
}
