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

// --- CSVアップロード処理の窓口 ---
app.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  console.log('CSVアップロード処理が開始されました。');

  // 1. アップロードされたファイルが空かチェック
  if (!req.file) {
    return res.status(400).json({ error: 'ファイルが選択されていません。' });
  }

  // 2. アップロードされたファイル（バッファ）を読み取り可能なストリームに変換
  // ★★★ 文字化け対策 ★★★
  // バッファを明示的に 'utf-8' 文字列としてストリームに渡す
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer.toString('utf-8'));
  // ★★★ ここまで ★★★

  const results = []; // CSVのデータを一時的に保存する配列

  // 3. CSVパーサーを使ってデータを読み取る
  bufferStream
    .pipe(csv()) // CSVを解析
    .on('data', (data) => {
      // CSVの1行ごとの処理
      results.push(data);
    })
    // 4. CSVの読み取りがすべて完了した後の処理
    .on('end', async () => {
      console.log('CSVの解析が完了しました。');
      
      if (results.length === 0) {
        console.log('CSVデータが空でした。');
        return res.json({ message: 'CSVデータが空です。', rowCount: 0 });
      }
      
      console.log(`データベースへの登録処理を開始します。件数: ${results.length}`);
      
      try {
        // 5. Supabase用にデータを整形 (image_url を作成)
        const dataToInsert = results.map(row => {
          // CSVの 'sku' (例: DM-25EX2-DMR3) から画像URLを生成
          const sku = row.sku;
          const imageName = `${sku}.jpg`; // .jpgを自動で付与
          
          // Supabase Storageの公開URLを組み立てる
          // 形式: [SUPABASE_URL]/storage/v1/object/public/[BUCKET_NAME]/[FILE_NAME]
          const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${imageName}`;

          return {
            sku: sku,
            name: row.name,
            image_url: imageUrl // 生成したURLを追加
          };
        });

        console.log('--- 登録データ (最初の5件) ---');
        console.log(dataToInsert.slice(0, 5));
        console.log('-----------------------------');

        // 6. Supabaseの 'products' テーブルに一括登録 (upsert)
        // upsert: skuが競合(conflict)したら、nameとimage_urlを更新(update)する
        const { data, error } = await supabase
          .from('products')
          .upsert(dataToInsert, {
            onConflict: 'sku', // 'sku' 列をキーにして重複をチェック
          })
          .select(); // 登録/更新した結果を返す

        if (error) {
          // Supabaseエラー
          console.error('Supabaseエラー:', error);
          return res.status(500).json({ error: 'DB登録エラー: ' + error.message });
        }

        console.log('データベースへの登録が完了しました。');
        
        // 7. 成功メッセージを返す
        res.json({
          message: `成功！ ${data.length} 件の商品を登録/更新しました。`,
          rowCount: data.length,
        });

      } catch (dbErr) {
        // 予期せぬエラー
        console.error('DB処理エラー:', dbErr);
        res.status(500).json({ error: 'DB処理中にエラーが発生しました。' + dbErr.message });
      }
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