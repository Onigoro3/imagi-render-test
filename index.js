// 必要な部品を読み込む
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// 'public' フォルダの中身を、Webサイトのルート（/）として提供する
app.use(express.static('public'));

// --- Supabaseの接続設定 ---
// Renderの環境変数からURLとキーを読み込む
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // <-- おそらくこの行が抜けていました

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseKey);
// -------------------------

// --- /products にアクセスが来たときの処理 ---
app.get('/products', async (req, res) => {
  try {
    // Supabaseの 'products' テーブルから全てのデータ (*) を選択 (select)
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      // もしエラーがあればエラー内容を返す
      res.status(500).json({ error: error.message });
      return;
    }

    // エラーがなければ、取得したデータをJSON形式で返す
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ----------------------------------------------------

// サーバーを起動する処理
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});