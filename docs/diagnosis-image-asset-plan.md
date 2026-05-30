# Diagnosis Image Asset Plan

This plan defines a production-scale set of 500 generated diagnosis images for the Expo 56 app. It is aligned to the image metadata concepts in `src/types/image.ts` without changing source code.

Expo 56 documentation checked before preparing this artifact: `https://docs.expo.dev/versions/v56.0.0/`.

## Scope

- Total assets: 500.
- Batch structure: 50 batches x 10 images.
- Format: 1024x1024 WebP source images, generated from square photorealistic prompts.
- Subject rule: fictional adult women only.
- Use case: diagnosis cards for style preference selection, not attractiveness ranking.
- Metadata compatibility: use `style_group`, `regional_style`, `age_impression`, `hair_style`, `skin_tone`, `makeup_level`, `tags`, `popularity_score`, and `image_url` concepts from `ImageMetadata`.

## Naming

- Image id: `tc_diag_b{batch}_s{slot}`.
- Batch format: two digits, `01` through `50`.
- Slot format: two digits, `01` through `10`.
- Source file path: `public/images/diagnosis/b{batch}/tc_diag_b{batch}_s{slot}.webp`.
- App `image_url`: `/images/diagnosis/b{batch}/tc_diag_b{batch}_s{slot}.webp`.
- Example: `tc_diag_b07_s04` maps to `public/images/diagnosis/b07/tc_diag_b07_s04.webp` and `/images/diagnosis/b07/tc_diag_b07_s04.webp`.

## Safety Rules

Every generation prompt must include:

- Fictional adult woman, clearly age 20 or older.
- No real person, celebrity, influencer, public figure, or lookalike resemblance.
- Modest clothing, ordinary lifestyle styling.
- No sexualization, erotic pose, swimsuit, lingerie, cleavage emphasis, fetish styling, or body-rating framing.
- No school uniform, childlike styling, juvenile props, or teen-coded language.
- 1024x1024 photorealistic lifestyle portrait/card image.
- Neutral, respectful descriptors only.

Avoid these source enum values in the generated set even if available in `src/types/image.ts`:

- `style_group: sexy`
- `age_impression: teens`
- `vibe_type: sexy`

## Prompt Template

Use this structure for every image:

```text
1024x1024 photorealistic lifestyle portrait/card image of a fictional adult woman aged 20 or older.
No real person, no celebrity resemblance, no influencer likeness.
Modest {outfit} in a {background} setting, {regional_style} inspired styling, {style_group} fashion direction.
{hair_style} hair, {skin_tone} skin tone, {makeup_level} makeup, relaxed natural posture.
Editorial app card composition, clean lighting, respectful and non-sexualized, not a beauty contest, no text, no logo.
```

Negative prompt:

```text
real person, celebrity, public figure, lookalike, child, teenager, school uniform, swimsuit, lingerie, cleavage emphasis, sexualized pose, erotic, body rating, beauty score, ranking text, watermark, logo, distorted hands, extra fingers, heavy retouching
```

## Balanced Taxonomy

The seed plan in `scripts/diagnosis-image-seed-plan.ts` uses exact count distributions. It intentionally avoids underage or sexualized categories while keeping broad style coverage.

### Style Group

| Value            | Count |
| ---------------- | ----: |
| `natural`        |    36 |
| `korean`         |    36 |
| `cool`           |    36 |
| `casual`         |    36 |
| `feminine`       |    36 |
| `mature`         |    36 |
| `office`         |    36 |
| `simple`         |    36 |
| `gyaru`          |    36 |
| `cute`           |    36 |
| `sporty`         |    35 |
| `elegant`        |    35 |
| `mode`           |    35 |
| `global_elegant` |    35 |

### Regional Style

Each regional style gets 50 assets:

- `japanese_style`
- `korean_style`
- `chinese_style`
- `western_style`
- `southeast_asian_style`
- `south_asian_style`
- `latina_style`
- `black_style`
- `middle_eastern_style`
- `global_mixed`

### Age Impression

Only adult-coded categories are used:

| Value      | Count |
| ---------- | ----: |
| `early20s` |   100 |
| `mid20s`   |   100 |
| `late20s`  |   100 |
| `thirties` |   100 |
| `forties`  |   100 |

### Hair Style

| Value           | Count |
| --------------- | ----: |
| `long_straight` |    56 |
| `long_wave`     |    56 |
| `medium`        |    56 |
| `bob`           |    56 |
| `short`         |    56 |
| `pony`          |    55 |
| `twin`          |    55 |
| `updo`          |    55 |
| `curly`         |    55 |

`twin` must be styled as adult fashion buns or mature twin-tail variation, never schoolgirl-coded.

### Skin Tone

| Value    | Count |
| -------- | ----: |
| `fair`   |   125 |
| `medium` |   125 |
| `tan`    |   125 |
| `dark`   |   125 |

### Makeup Level

| Value      | Count |
| ---------- | ----: |
| `natural`  |   125 |
| `moderate` |   125 |
| `heavy`    |   125 |
| `gyaru`    |   125 |

`heavy` and `gyaru` should mean visible cosmetic style, not sexualized styling.

### Backgrounds

Each background gets 50 assets:

- `city_street`
- `cafe`
- `office_lounge`
- `gallery`
- `park_daylight`
- `bookstore`
- `station_concourse`
- `studio_soft_light`
- `resort_walkway`
- `home_interior`

## Batch QA

Each batch of 10 should pass these checks before import:

- Exactly 10 generated images exist for the batch.
- All images are square 1024x1024.
- Every subject appears clearly adult.
- No image resembles a known real person.
- Clothing remains modest and non-sexualized.
- No text, logo, watermark, or ranking language appears in the image.
- The batch includes a visible mix of style, region, age, hair, skin tone, makeup, and background.
- File names match the id convention exactly.
- Metadata contains only values accepted by the current app type plan.

## Import Notes

The current `scripts/metadata.json` uses some older field names such as `hair_texture` and `fashion_culture`. This plan targets the app-facing concepts in `src/types/image.ts`; a later metadata generator should either emit app-ready `ImageMetadata` or provide an explicit adapter from the older script schema.

Recommended generated metadata shape:

```json
{
  "id": "tc_diag_b01_s01",
  "image_url": "/images/diagnosis/b01/tc_diag_b01_s01.webp",
  "style_group": "natural",
  "regional_style": "japanese_style",
  "vibe_type": "natural",
  "body_silhouette": null,
  "bust_impression": null,
  "butt_impression": null,
  "height_impression": null,
  "age_impression": "early20s",
  "hair_style": "long_straight",
  "skin_tone": "fair",
  "makeup_level": "natural",
  "tags": ["natural", "japanese_style", "early20s", "long_straight", "fair", "city_street"],
  "popularity_score": 50
}
```
