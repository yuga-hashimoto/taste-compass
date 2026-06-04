import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const TMP_DIR = path.resolve(__dirname, '../public/images/tmp_craiyon');
const DEST_DIR = path.resolve(__dirname, '../public/images/diagnosis/b30');
const METADATA_PATH = path.resolve(__dirname, '../src/data/imageMetadata.ts');

// 必要なディレクトリの作成
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// 静的ファイルの配信
app.use('/images/tmp_craiyon', express.static(TMP_DIR));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'viewer.html'));
});

// 画像生成の状態管理
const generationState = {
  isRunning: false,
  total: 0,
  current: 0,
  error: null as string | null
};

// 一時画像一覧の取得
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(TMP_DIR)
      .filter(file => /\.(png|webp|jpg|jpeg)$/i.test(file))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(TMP_DIR, a));
        const statB = fs.statSync(path.join(TMP_DIR, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 画像の却下（削除）
app.post('/api/reject', (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }

  const filePath = path.join(TMP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Rejected and deleted: ${filename}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 画像の承認（WebP変換、b30配置、メタデータ追記）
app.post('/api/approve', async (req, res) => {
  const { filename, style_group, vibe_type, hair_style, age_impression, tags } = req.body;

  if (!filename || !style_group) {
    return res.status(400).json({ error: 'filename and style_group are required' });
  }

  const srcPath = path.join(TMP_DIR, filename);
  if (!fs.existsSync(srcPath)) {
    return res.status(404).json({ error: 'Source file not found' });
  }

  try {
    // 1. 次のシリアル番号（ID）を決定
    const files = fs.readdirSync(DEST_DIR);
    let maxNum = 0;
    const idRegex = /^tc_diag_b30_s(\d+)\.webp$/;
    
    files.forEach(f => {
      const match = f.match(idRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    const nextNumStr = String(nextNum).padStart(3, '0');
    const newId = `tc_diag_b30_s${nextNumStr}`;
    const destFilename = `${newId}.webp`;
    const destPath = path.join(DEST_DIR, destFilename);

    // 2. WebPに変換して保存
    await sharp(srcPath)
      .resize(1024, 1024, { fit: 'inside' })
      .webp({ quality: 80 })
      .toFile(destPath);
    console.log(`✅ WebP converted: ${destFilename}`);

    // 3. メタデータファイルの読み込みと追記
    if (fs.existsSync(METADATA_PATH)) {
      let metadataContent = fs.readFileSync(METADATA_PATH, 'utf8');
      
      if (metadataContent.includes(`id: '${newId}'`)) {
        return res.status(500).json({ error: `ID ${newId} is already registered in imageMetadata.ts` });
      }

      const formattedTags = Array.isArray(tags) ? tags : [];

      const addString = `  {\n` +
        `    id: '${newId}',\n` +
        `    image_url: '/images/diagnosis/b30/${destFilename}',\n` +
        `    style_group: '${style_group}',\n` +
        `    regional_style: 'japanese_style',\n` +
        `    body_silhouette: 'balanced',\n` +
        `    bust_impression: 'average',\n` +
        `    butt_impression: 'average',\n` +
        `    height_impression: 'average',\n` +
        `    age_impression: '${age_impression || 'early20s'}',\n` +
        `    vibe_type: '${vibe_type || 'pure'}',\n` +
        `    hair_style: '${hair_style || 'long_straight'}',\n` +
        `    skin_tone: 'fair',\n` +
        `    makeup_level: 'natural',\n` +
        `    tags: [${formattedTags.map(t => `'${t}'`).join(', ')}],\n` +
        `    popularity_score: 55,\n` +
        `  },\n`;

      const lastIndex = metadataContent.lastIndexOf('];');
      if (lastIndex === -1) {
        throw new Error('Could not find the end of LOCAL_IMAGES array (];) in imageMetadata.ts');
      }

      const updatedContent = metadataContent.substring(0, lastIndex) + addString + metadataContent.substring(lastIndex);
      fs.writeFileSync(METADATA_PATH, updatedContent, 'utf8');
      console.log(`📝 Added metadata for ${newId} to imageMetadata.ts`);
    } else {
      console.warn(`⚠️ imageMetadata.ts not found at ${METADATA_PATH}`);
    }

    // 4. 元ファイル削除
    fs.unlinkSync(srcPath);
    console.log(`🗑️ Deleted temporary file: ${filename}`);

    res.json({ success: true, id: newId });
  } catch (err: any) {
    console.error(`❌ Approval error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// プロンプト多様化のためのランダム要素
const HAIRSTYLES = ['ボブカットの髪型', 'ストレートロングヘア', 'ウェーブのかかったロングヘア', 'ポニーテール', 'ショートカット', 'ハーフアップスタイル'];
const EXPRESSIONS = ['笑顔', '優しい微笑み', '楽しそうな笑顔', 'カメラを見つめる自然な表情', 'いたずらっぽいウインク'];
const OUTFITS = ['カジュアルなTシャツ', 'ニットのセーター', 'デニムジャケット', 'サマードレス', 'オフィス風の白ブラウス'];
const BACKGROUNDS = ['おしゃれなカフェの中', '日当たりの良い公園の中', '都会のストリート', '本に囲まれた図書館の中', '窓から光が差し込む明るい部屋'];
const AGES = ['21歳前後', '24歳前後', '27歳前後'];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const generatePrompt = (basePrompt: string): string => {
  if (basePrompt !== "可愛い日本人") {
    return basePrompt;
  }
  const age = getRandomElement(AGES);
  const expression = getRandomElement(EXPRESSIONS);
  const outfit = getRandomElement(OUTFITS);
  const hairstyle = getRandomElement(HAIRSTYLES);
  const background = getRandomElement(BACKGROUNDS);

  return `${basePrompt}、年齢は${age}、表情は${expression}、服装は${outfit}、髪型は${hairstyle}、場所は${background}。写実的な写真風、傑作、極めて詳細な質感、自然な光`;
};

// 画像生成API（Qwen Chat Gateway連携）
app.post('/api/generate', (req, res) => {
  const { count, prompt } = req.body;
  const targetCount = parseInt(count, 10) || 10;
  const searchPrompt = prompt || "可愛い日本人";

  if (generationState.isRunning) {
    return res.status(400).json({ error: '画像生成タスクが既に実行中です。' });
  }

  generationState.isRunning = true;
  generationState.total = targetCount;
  generationState.current = 0;
  generationState.error = null;

  res.json({ success: true, message: 'Qwen Gatewayを用いた画像生成を開始しました。' });

  // バックグラウンド実行
  (async () => {
    console.log(`🚀 Qwen Chat Gatewayを用いた画像生成開始 (目標: ${targetCount}枚)`);
    const GATEWAY_URL = 'http://127.0.0.1:8787/v1/images/generations';
    
    for (let i = 0; i < targetCount; i++) {
      if (!generationState.isRunning) break;

      try {
        const finalPrompt = generatePrompt(searchPrompt);
        console.log(`[${i + 1}/${targetCount}] Qwenで画像生成中...`);
        console.log(`📝 Prompt: "${finalPrompt}"`);

        const response = await axios.post(GATEWAY_URL, {
          prompt: finalPrompt
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 180000 // 3分タイムアウト (Qwenの画像生成に余裕を持たせる)
        });

        const imageUrl = response.data?.data?.[0]?.url;
        if (!imageUrl) {
          throw new Error('Qwen Gatewayから画像URLが返されませんでした。');
        }

        console.log(`🔗 画像生成成功: ${imageUrl} (ダウンロード開始)`);
        const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imgRes.data);

        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
        const filename = `qwen_${timestamp}_${Math.floor(100 + Math.random() * 900)}.png`;
        const filepath = path.join(TMP_DIR, filename);

        fs.writeFileSync(filepath, buffer);
        console.log(`✅ 保存完了: ${filename}`);

        generationState.current = i + 1;
      } catch (err: any) {
        console.error(`❌ 生成失敗 [${i + 1}枚目]:`, err.message || err);
        generationState.error = `生成失敗 (${i + 1}枚目): ${err.message || err}`;
        
        // Qwen Gatewayに何かしらのエラー（タイムアウト等）が発生した場合、少し長めに待機
        await new Promise(resolve => setTimeout(resolve, 8000));
      }

      // 生成後のインターバル (Qwenアカウント保護のため5秒待機)
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`🏁 Qwen画像生成タスク終了 (完了: ${generationState.current}/${targetCount}枚)`);
    generationState.isRunning = false;
  })().catch(err => {
    console.error('致命的な生成エラー:', err);
    generationState.isRunning = false;
    generationState.error = err.message;
  });
});

// 生成状態の取得
app.get('/api/generate/status', (req, res) => {
  res.json(generationState);
});

// 生成の停止
app.post('/api/generate/stop', (req, res) => {
  if (generationState.isRunning) {
    generationState.isRunning = false;
    res.json({ success: true, message: '生成タスクを停止しました。' });
  } else {
    res.status(400).json({ error: '実行中の生成タスクはありません。' });
  }
});

app.listen(PORT, () => {
  console.log(`====================================`);
  console.log(`📺 Review Viewer Server started!`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`====================================`);
});
