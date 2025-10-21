// 必要な部品を読み込む
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer'); // multerを追加
const csv = require('csv-parser'); // csv-parserを追加
const stream = require('stream'); // ファイルを扱うための部品を追加

const app = express();
const PORT = process.env.PORT || 3000;

// 'public' フォルダの中身を、Webサイトのルート（/）として提供する
app.use(express.static('public'));

// Multerの設定（ファイルはメモリ上に一時保存する）
const upload = multer({ storage: multer.memoryStorage() });

// --- Supabaseの接続設定 ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
// -------------------------

// --- /products API (これは変更なし) ---
app.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ★★★ 新規追加：CSVアップロード処理の窓口 ★★★ ---
// POSTリクエストで /upload-csv にファイルが送られてきたときの処理
app.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  console.log('CSVアップロード処理が開始されました。');

  // 1. アップロードされたファイルが空かチェック
  if (!req.file) {
    return res.status(400).json({ error: 'ファイルが選択されていません。' });
  }

  // 2. アップロードされたファイル（バッファ）を読み取り可能なストリームに変換
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  const results = []; // CSVのデータを一時的に保存する配列

  // 3. CSVパーサーを使ってデータを読み取る
  bufferStream
    .pipe(csv()) // CSVを解析
    .on('data', (data) => {
      // CSVの1行ごとの処理
      results.push(data);
    })
    .on('end', async () => {
      // 4. CSVの読み取りがすべて完了した後の処理
      console.log('CSVの解析が完了しました。');
      console.log('--- 解析結果 (最初の5件) ---');
      console.log(results.slice(0, 5));
      console.log('-----------------------------');

      // ★★★ ここにSupabaseへの一括登録処理を追加していく（次のステップ） ★★★

      // とりあえず成功メッセージを返す
      res.json({
        message: 'CSVの解析に成功しました。',
        rowCount: results.length,
        data: results.slice(0, 5) // 確認用に最初の5件を返す
      });
    })
    .on('error', (err) => {
      // エラー処理
      console.error('CSV解析中にエラー:', err);
      res.status(500).json({ error: 'CSVの解析中にエラーが発生しました。' });
    });
});
// ----------------------------------------------------

// サーバーを起動する処理
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});