import { LOCAL_IMAGES } from './../src/data/imageMetadata';

const total = LOCAL_IMAGES.length;
console.log(`Total images: ${total}`);

const styles: Record<string, number> = {};
const regions: Record<string, number> = {};
const ages: Record<string, number> = {};
const vibes: Record<string, number> = {};
const bodySilhouettes: Record<string, number> = {};

LOCAL_IMAGES.forEach((img: any) => {
  if (img.style_group) styles[img.style_group] = (styles[img.style_group] || 0) + 1;
  if (img.regional_style) regions[img.regional_style] = (regions[img.regional_style] || 0) + 1;
  if (img.age_impression) ages[img.age_impression] = (ages[img.age_impression] || 0) + 1;
  if (img.vibe_type) vibes[img.vibe_type] = (vibes[img.vibe_type] || 0) + 1;
  if (img.body_silhouette)
    bodySilhouettes[img.body_silhouette] = (bodySilhouettes[img.body_silhouette] || 0) + 1;
});

console.log('\n--- Style Groups ---');
Object.entries(styles)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => {
    console.log(`${k.padEnd(20)}: ${v} (${((v / total) * 100).toFixed(1)}%)`);
  });

console.log('\n--- Regional Styles ---');
Object.entries(regions)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => {
    console.log(`${k.padEnd(25)}: ${v} (${((v / total) * 100).toFixed(1)}%)`);
  });

console.log('\n--- Age Impressions ---');
Object.entries(ages)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => {
    console.log(`${k.padEnd(20)}: ${v} (${((v / total) * 100).toFixed(1)}%)`);
  });

console.log('\n--- Vibe Types ---');
Object.entries(vibes)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => {
    console.log(`${k.padEnd(20)}: ${v} (${((v / total) * 100).toFixed(1)}%)`);
  });

console.log('\n--- Body Silhouettes ---');
Object.entries(bodySilhouettes)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => {
    console.log(`${k.padEnd(20)}: ${v} (${((v / total) * 100).toFixed(1)}%)`);
  });
