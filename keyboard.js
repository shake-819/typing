const KEYBOARD_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", "!", "?"]
];

class Keyboard {
  constructor(containerEl) {
    this.container = containerEl;
    this.keyEls = {};
    this._render();
  }

  _render() {
    this.container.innerHTML = "";
    KEYBOARD_ROWS.forEach(row => {
      const rowEl = document.createElement("div");
      rowEl.className = "kb-row";
      row.forEach(k => {
        const keyEl = document.createElement("div");
        keyEl.className = "kb-key";
        keyEl.textContent = k;
        keyEl.dataset.key = k;
        rowEl.appendChild(keyEl);
        this.keyEls[k] = keyEl;
      });
      this.container.appendChild(rowEl);
    });
  }

  highlightExpected(keys) {
    Object.values(this.keyEls).forEach(el => el.classList.remove("kb-key-expected"));
    keys.forEach(k => {
      if (this.keyEls[k]) this.keyEls[k].classList.add("kb-key-expected");
    });
  }

  flashMiss(key) {
    const el = this.keyEls[key];
    if (!el) return;
    el.classList.add("kb-key-miss");
    setTimeout(() => el.classList.remove("kb-key-miss"), 200);
  }
}
