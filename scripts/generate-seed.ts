import * as fs from 'fs';
import * as path from 'path';
import { LOCAL_IMAGES } from '../src/data/imageMetadata.ts';
import { toDeterministicUUID } from '../src/lib/uuid';

const main = () => {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');

  let sql = `-- seed.sql - 自動生成された画像メタデータ初期データの投入\n`;
  sql += `-- 生成日時: ${new Date().toISOString()}\n\n`;
  sql += `TRUNCATE TABLE public.images RESTART IDENTITY CASCADE;\n\n`;

  sql += `INSERT INTO public.images (\n`;
  sql += `  id, image_url, style_group, tags, regional_style, body_silhouette, bust_impression, height_impression, popularity_score, active, safety_status\n`;
  sql += `) VALUES\n`;

  const valueStrings = LOCAL_IMAGES.map((img, idx) => {
    const uuid = toDeterministicUUID(img.id);
    const url = img.image_url;
    const style = img.style_group;

    // tags を SQL の ARRAY 形式に変換
    const tagsSql = `ARRAY[` + img.tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(', ') + `]`;

    const reg = img.regional_style ? `'${img.regional_style}'` : 'NULL';
    const body = img.body_silhouette ? `'${img.body_silhouette}'` : 'NULL';
    const bust = img.bust_impression ? `'${img.bust_impression}'` : 'NULL';
    const height = img.height_impression ? `'${img.height_impression}'` : 'NULL';
    const pop = img.popularity_score || 50;

    const isLast = idx === LOCAL_IMAGES.length - 1;
    const suffix = isLast ? ';' : ',';

    return (
      `  (\n` +
      `    '${uuid}',\n` +
      `    '${url}',\n` +
      `    '${style}',\n` +
      `    ${tagsSql},\n` +
      `    ${reg},\n` +
      `    ${body},\n` +
      `    ${bust},\n` +
      `    ${height},\n` +
      `    ${pop},\n` +
      `    true,\n` +
      `    'approved'\n` +
      `  )${suffix}`
    );
  });

  sql += valueStrings.join('\n') + '\n';

  fs.writeFileSync(seedPath, sql, 'utf8');
  console.log(`Successfully generated seed.sql with ${LOCAL_IMAGES.length} images at ${seedPath}`);
};

main();
