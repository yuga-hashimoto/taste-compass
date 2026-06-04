// Usage: node scripts/convert-batch.js <brainDir> <batchNum> <count>
// Converts tc_diag_bNN_sXX_*.png from brainDir to webp in public/images/diagnosis/bNN/
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const brainDir = process.argv[2];
const batchNum = process.argv[3]; // e.g. "15"
const count = parseInt(process.argv[4] || '10');
const destDir = path.join(__dirname, '..', 'public', 'images', 'diagnosis', `b${batchNum}`);

fs.mkdirSync(destDir, { recursive: true });

async function main() {
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(2, '0');
    const prefix = `tc_diag_b${batchNum}_s${num}_`;
    const files = fs.readdirSync(brainDir).filter(f => f.startsWith(prefix) && f.endsWith('.png'));
    if (files.length === 0) {
      console.log(`SKIP: ${prefix}*.png not found`);
      continue;
    }
    const src = path.join(brainDir, files[0]);
    const dest = path.join(destDir, `tc_diag_b${batchNum}_s${num}.webp`);
    try {
      await sharp(src).resize(1024, 1024, { fit: 'inside' }).webp({ quality: 80 }).toFile(dest);
      console.log(`OK: tc_diag_b${batchNum}_s${num}.webp`);
    } catch (e) {
      console.error(`FAIL: ${e.message}`);
    }
  }
}
main();
