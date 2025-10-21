// 必要な部品を読み込む
const express = require('express');
const app = express();

// Renderが指定するポート番号、またはローカル用の3000番ポートを使う
const PORT = process.env.PORT || 3000;

// メインページ ( / ) にアクセスが来たときの処理
app.get('/', (req, res) => {
  res.send('こんにちは！Renderでのデプロイテスト成功です！');
});

// サーバーを起動する処理
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});