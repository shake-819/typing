// SQL構文の「あるある」パターンを集めたお題データ(半角入力想定)。
// display: 画面上部に表示する説明文(日本語、読んで意味を理解するためのもの)
// kana:    実際に入力・判定する対象の文字列(半角英数記号のSQL構文そのもの。
//          IME変換は行わず、表示されている文字を1文字ずつそのまま
//          半角で打ち込む。キーワードは大文字、テーブル名・カラム名は
//          小文字という一般的なSQLの書き方に合わせているため、
//          大文字部分は Shift を押しながら入力すること)
//
// JS構文セットと同様、TypingEngine の caseSensitive オプションを
// 有効にして使用する(app.js 側で genre === "sql" のときに指定する)。
const SQL_SENTENCES = [
  { display: "全カラムを取得する", kana: "SELECT * FROM users;" },
  { display: "特定のカラムだけ取得する", kana: "SELECT id, name FROM users;" },
  { display: "条件を指定して取得する", kana: "SELECT * FROM users WHERE age > 20;" },
  { display: "並び替えて取得する", kana: "SELECT * FROM users ORDER BY created_at DESC;" },
  { display: "件数を絞って取得する", kana: "SELECT * FROM users LIMIT 10;" },
  { display: "重複を除いて取得する", kana: "SELECT DISTINCT country FROM users;" },
  { display: "件数を数える", kana: "SELECT COUNT(*) FROM users;" },
  { display: "合計値を求める", kana: "SELECT SUM(price) FROM orders;" },
  { display: "平均値を求める", kana: "SELECT AVG(score) FROM exams;" },
  { display: "最大値を求める", kana: "SELECT MAX(price) FROM products;" },
  { display: "最小値を求める", kana: "SELECT MIN(price) FROM products;" },
  { display: "グループ化して集計する", kana: "SELECT status, COUNT(*) FROM orders GROUP BY status;" },
  { display: "集計結果を条件で絞り込む", kana: "SELECT status, COUNT(*) FROM orders GROUP BY status HAVING COUNT(*) > 5;" },
  { display: "複数条件をANDでつなぐ", kana: "SELECT * FROM users WHERE age > 20 AND country = 'JP';" },
  { display: "複数条件をORでつなぐ", kana: "SELECT * FROM users WHERE age < 18 OR age > 65;" },
  { display: "条件を否定する", kana: "SELECT * FROM users WHERE NOT active;" },
  { display: "NULLかどうかを調べる", kana: "SELECT * FROM users WHERE email IS NULL;" },
  { display: "NULLでないかを調べる", kana: "SELECT * FROM users WHERE email IS NOT NULL;" },
  { display: "範囲を指定して絞り込む", kana: "SELECT * FROM products WHERE price BETWEEN 100 AND 500;" },
  { display: "複数の値のいずれかに一致させる", kana: "SELECT * FROM users WHERE country IN ('JP', 'US');" },
  { display: "部分一致で検索する", kana: "SELECT * FROM users WHERE name LIKE '%tanaka%';" },
  { display: "カラムに別名をつける", kana: "SELECT name AS full_name FROM users;" },
  { display: "テーブルに別名をつける", kana: "SELECT u.name FROM users AS u;" },
  { display: "内部結合する", kana: "SELECT * FROM orders JOIN users ON orders.user_id = users.id;" },
  { display: "左外部結合する", kana: "SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id;" },
  { display: "サブクエリで絞り込む", kana: "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);" },
  { display: "新しい行を追加する", kana: "INSERT INTO users (name, age) VALUES ('Taro', 25);" },
  { display: "既存の行を更新する", kana: "UPDATE users SET age = 26 WHERE id = 1;" },
  { display: "行を削除する", kana: "DELETE FROM users WHERE id = 1;" },
  { display: "テーブルを新規作成する", kana: "CREATE TABLE users (id INT PRIMARY KEY, name TEXT);" },
  { display: "テーブルを削除する", kana: "DROP TABLE users;" },
  { display: "カラムを追加する", kana: "ALTER TABLE users ADD COLUMN age INT;" },
  { display: "カラムを削除する", kana: "ALTER TABLE users DROP COLUMN age;" },
  { display: "テーブルの中身を空にする", kana: "TRUNCATE TABLE logs;" },
  { display: "主キーを設定する", kana: "id INT PRIMARY KEY," },
  { display: "外部キーを設定する", kana: "FOREIGN KEY (user_id) REFERENCES users(id)," },
  { display: "NULLを許可しない制約をつける", kana: "name TEXT NOT NULL," },
  { display: "一意制約をつける", kana: "UNIQUE (email)," },
  { display: "デフォルト値を設定する", kana: "status TEXT DEFAULT 'active'," },
  { display: "インデックスを作成する", kana: "CREATE INDEX idx_users_email ON users(email);" },
  { display: "ビューを作成する", kana: "CREATE VIEW active_users AS SELECT * FROM users WHERE active;" },
  { display: "トランザクションを開始する", kana: "BEGIN TRANSACTION;" },
  { display: "変更を確定する", kana: "COMMIT;" },
  { display: "変更を取り消す", kana: "ROLLBACK;" },
  { display: "CASE文で条件分岐する", kana: "SELECT CASE WHEN age >= 20 THEN 'adult' ELSE 'minor' END FROM users;" },
  { display: "複数の結果をまとめて結合する", kana: "SELECT name FROM users UNION SELECT name FROM admins;" },
  { display: "存在するかどうかを調べる", kana: "SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id);" },
  { display: "文字列を連結する", kana: "SELECT first_name || ' ' || last_name FROM users;" },
  { display: "日付の範囲で絞り込む", kana: "SELECT * FROM orders WHERE created_at >= '2024-01-01';" },
  { display: "先頭の数件を飛ばして取得する", kana: "SELECT * FROM users LIMIT 10 OFFSET 20;" }
];
