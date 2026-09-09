// VBA基本構文の「あるある」パターンを集めたお題データ(半角入力想定・有料パック)。
// display: 画面上部に表示する説明文(日本語、読んで意味を理解するためのもの)
// kana:    実際に入力・判定する対象の文字列(半角英数記号のVBA構文そのもの。
//          IME変換は行わず、表示されている文字を1文字ずつそのまま
//          半角で打ち込む。Dim/Sub/If Then などのキーワードは
//          先頭が大文字という一般的なVBAの書き方に合わせているため、
//          大文字部分は Shift を押しながら入力すること)
//
// JS/SQL構文セットと同様、TypingEngine の caseSensitive オプションを
// 有効にして使用する(app.js 側で genre === "vba" のときに指定する)。
//
// unlocks.js経由の有料パック。Supabase側 sentence_packs テーブルに
// key="vba", cost=50 の行を登録しておくこと(costの実値はDB側が正)。
const VBA_SENTENCES = [
  { display: "整数型の変数を宣言する", kana: "Dim x As Integer" },
  { display: "文字列型の変数を宣言する", kana: "Dim s As String" },
  { display: "変数に数値を代入する", kana: "x = 10" },
  { display: "変数に文字列を代入する", kana: 's = "Hello"' },
  { display: "定数を宣言する", kana: "Const PI As Double = 3.14" },
  { display: "コメントを書く", kana: "' Sample comment" },
  { display: "メッセージボックスを表示する", kana: 'MsgBox "Hello"' },
  { display: "Subプロシージャを定義する", kana: "Sub MyMacro()" },
  { display: "Subプロシージャを終了する", kana: "End Sub" },
  { display: "引数付きのSubを定義する", kana: "Sub Greet(name As String)" },
  { display: "Functionプロシージャを定義する", kana: "Function Add(a As Integer, b As Integer) As Integer" },
  { display: "戻り値を設定する", kana: "Add = a + b" },
  { display: "Functionプロシージャを終了する", kana: "End Function" },
  { display: "If文で条件分岐する", kana: "If x > 10 Then" },
  { display: "If文を終了する", kana: "End If" },
  { display: "Else節を書く", kana: "Else" },
  { display: "ElseIfで複数条件を書く", kana: "ElseIf x = 5 Then" },
  { display: "1行で終わるIf文を書く", kana: 'If x = 0 Then MsgBox "zero"' },
  { display: "For文で繰り返す", kana: "For i = 1 To 10" },
  { display: "For文を終了する", kana: "Next i" },
  { display: "ステップを指定したFor文を書く", kana: "For i = 10 To 1 Step -1" },
  { display: "For Eachでセル範囲を反復する", kana: 'For Each cell In Range("A1:A10")' },
  { display: "For Eachを終了する", kana: "Next cell" },
  { display: "Do While文で繰り返す", kana: "Do While x < 10" },
  { display: "Do While文を終了する", kana: "Loop" },
  { display: "Do Until文で繰り返す", kana: "Do Until x = 10" },
  { display: "セルの値を取得する", kana: 'Range("A1").Value' },
  { display: "セルに値を設定する", kana: 'Range("A1").Value = 100' },
  { display: "行列番号でセルを指定する", kana: "Cells(1, 1).Value = 100" },
  { display: "セル範囲を選択する", kana: 'Range("A1:B10").Select' },
  { display: "アクティブシート名を取得する", kana: "ActiveSheet.Name" },
  { display: "シートを指定してアクティブにする", kana: 'Worksheets("Sheet1").Activate' },
  { display: "このブック自身を参照する", kana: "ThisWorkbook.Name" },
  { display: "データの最終行を取得する", kana: "Range(\"A1\").End(xlDown).Row" },
  { display: "オブジェクト型の変数を宣言する", kana: "Dim ws As Worksheet" },
  { display: "オブジェクトを変数に代入する", kana: 'Set ws = Worksheets("Sheet1")' },
  { display: "固定長の配列を宣言する", kana: "Dim arr(9) As Integer" },
  { display: "配列の要素に値を代入する", kana: "arr(0) = 100" },
  { display: "動的配列を宣言する", kana: "Dim arr() As Integer" },
  { display: "動的配列のサイズを変更する", kana: "ReDim arr(19)" },
  { display: "Select Case文で分岐を始める", kana: "Select Case x" },
  { display: "Caseで値を指定する", kana: "Case 1" },
  { display: "Case Elseでそれ以外を処理する", kana: "Case Else" },
  { display: "Select Case文を終了する", kana: "End Select" },
  { display: "エラー発生時に次の行へ進める", kana: "On Error Resume Next" },
  { display: "エラー処理を元に戻す", kana: "On Error GoTo 0" },
  { display: "イミディエイトウィンドウに出力する", kana: "Debug.Print x" },
  { display: "はい/いいえのダイアログを判定する", kana: 'If MsgBox("OK?", vbYesNo) = vbYes Then' },
  { display: "論理演算子Andでつなぐ", kana: "If x > 0 And x < 10 Then" },
  { display: "論理演算子Orでつなぐ", kana: "If x = 1 Or x = 2 Then" }
];
