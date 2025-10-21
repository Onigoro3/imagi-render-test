// 必要な部品を読み込む
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// --- この行を追加 ---
// 'public' フォルダの中身を、Webサイトのルート（/）として提供する
app.use(express.static('public')); 
// --------------------

// --- Supabaseの接続設定 ---
const supabaseUrl = process.env.SUPABASE_URL;
// ... (中略) ...
const supabase = createClient(supabaseUrl, supabaseKey);


// --- 以前のメインページ ( / ) の処理をコメントアウト（または削除） ---
// app.get('/', (req, res) => {
//   res.send('こんにちは！Renderでのデプロイテスト成功です！');
// });
// ----------------------------------------------------

// --- /products にアクセスが来たときの処理 ---
app.get('/products', async (req, res) => {
// ... (ここはそのまま) ...
});

// サーバーを起動する処理
app.listen(PORT, () => {
// ... (ここはそのまま) ...
});