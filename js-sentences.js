// JavaScript構文の「あるある」パターンを集めたお題データ(半角入力想定)。
// display: 画面上部に表示する説明文(日本語、読んで意味を理解するためのもの)
// kana:    実際に入力・判定する対象の文字列(半角英数記号のJS構文そのもの。
//          IME変換は行わず、表示されている文字を1文字ずつそのまま
//          半角で打ち込む。大文字・小文字も区別されるので、
//          英大文字は Shift を押しながら入力すること)
//
// 変換なしモードでも判定できるよう、TypingEngine 側で大文字小文字を
// 区別する caseSensitive オプションを有効にして使用する。
const JS_SENTENCES = [
  { display: "変数を定義する(再代入不可)", kana: 'const name = "Alice";' },
  { display: "再代入できる変数を定義する", kana: "let count = 0;" },
  { display: "アロー関数を定義する", kana: "const add = (a, b) => a + b;" },
  { display: "テンプレートリテラルで文字列を埋め込む", kana: "`Hello, ${name}!`" },
  { display: "配列の分割代入", kana: "const [a, b] = [1, 2];" },
  { display: "オブジェクトの分割代入", kana: "const { id, name } = user;" },
  { display: "スプレッド構文で配列をコピーする", kana: "const copy = [...arr];" },
  { display: "スプレッド構文でオブジェクトをマージする", kana: "const merged = { ...a, ...b };" },
  { display: "残余引数を受け取る関数を定義する", kana: "function sum(...nums) {}" },
  { display: "配列の各要素を2倍にする", kana: "arr.map(x => x * 2);" },
  { display: "条件に合う要素だけ抽出する", kana: "arr.filter(x => x > 0);" },
  { display: "配列を1つの値に集約する", kana: "arr.reduce((a, b) => a + b, 0);" },
  { display: "配列の要素を順番に処理する", kana: "arr.forEach(item => console.log(item));" },
  { display: "条件に合う最初の要素を探す", kana: "arr.find(x => x.id === 1);" },
  { display: "いずれかが条件を満たすか調べる", kana: "arr.some(x => x > 10);" },
  { display: "すべてが条件を満たすか調べる", kana: "arr.every(x => x > 0);" },
  { display: "オプショナルチェイニングで安全に参照する", kana: "user?.profile?.age;" },
  { display: "Null合体演算子でデフォルト値を設定する", kana: 'const val = input ?? "default";' },
  { display: "三項演算子で条件分岐する", kana: 'const msg = ok ? "yes" : "no";' },
  { display: "引数にデフォルト値を設定する", kana: 'function greet(name = "guest") {}' },
  { display: "async関数を定義する", kana: "async function fetchData() {}" },
  { display: "Promiseの結果をawaitで待つ", kana: "const data = await fetch(url);" },
  { display: "try-catchで例外を処理する", kana: "try { risky(); } catch (e) {}" },
  { display: "Promiseをthenでつなげる", kana: "fetch(url).then(res => res.json());" },
  { display: "クラスを定義する", kana: "class Animal { constructor() {} }" },
  { display: "クラスを継承する", kana: "class Dog extends Animal {}" },
  { display: "for-ofで配列を反復処理する", kana: "for (const item of arr) {}" },
  { display: "for-inでオブジェクトのキーを反復する", kana: "for (const key in obj) {}" },
  { display: "オブジェクトのキー一覧を取得する", kana: "Object.keys(obj);" },
  { display: "オブジェクトの値一覧を取得する", kana: "Object.values(obj);" },
  { display: "キーと値のペア一覧を取得する", kana: "Object.entries(obj);" },
  { display: "オブジェクトをJSON文字列に変換する", kana: "JSON.stringify(obj);" },
  { display: "JSON文字列をオブジェクトに変換する", kana: "JSON.parse(text);" },
  { display: "配列かどうかを判定する", kana: "Array.isArray(value);" },
  { display: "値の型を確認する", kana: 'typeof value === "string";' },
  { display: "インスタンスかどうかを判定する", kana: "value instanceof Array;" },
  { display: "厳密等価演算子で比較する", kana: "a === b;" },
  { display: "厳密不等価演算子で比較する", kana: "a !== b;" },
  { display: "論理積で条件をつなげる", kana: "a && b;" },
  { display: "論理和で条件をつなげる", kana: "a || b;" },
  { display: "デフォルトエクスポートする", kana: "export default App;" },
  { display: "名前付きエクスポートする", kana: "export const PI = 3.14;" },
  { display: "デフォルトインポートする", kana: 'import React from "react";' },
  { display: "名前付きインポートする", kana: 'import { useState } from "react";' },
  { display: "指定ミリ秒だけ待つPromiseを作る", kana: "const wait = ms => new Promise(r => setTimeout(r, ms));" },
  { display: "連番の配列を生成する", kana: "Array.from({ length: 5 }, (_, i) => i);" },
  { display: "配列の中の最大値を求める", kana: "Math.max(...numbers);" },
  { display: "値がnullなら代わりの文字列を使う", kana: "const name = user ? user.name : \"unknown\";" },
  { display: "即時実行関数を書く", kana: '(function () { console.log("run"); })();' },
  { display: "オブジェクトのメソッドを省略記法で書く", kana: 'const obj = { greet() { return "hi"; } };' }
];
