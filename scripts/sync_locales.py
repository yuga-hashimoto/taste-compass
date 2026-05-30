import os
import re

locales_dir = "/Volumes/MOVESPEED/Documents/GitHub/taste-compass/src/i18n/locales"
target_files = [
    "ko.ts", "zh-CN.ts", "zh-TW.ts", "es.ts", "pt.ts", "fr.ts", 
    "de.ts", "id.ts", "th.ts", "vi.ts", "ar.ts", "hi.ts"
]

# en.ts から追加するテキストブロックを取得
with open(os.path.join(locales_dir, "en.ts"), "r", encoding="utf-8") as f:
    en_content = f.read()

# settings の追加キーの抽出
settings_match = re.search(r"settings:\s*\{(.*?)\n\s*\},", en_content, re.DOTALL)
if not settings_match:
    print("Error: Could not find settings in en.ts")
    exit(1)

en_settings_body = settings_match.group(1)
settings_added_match = re.search(r"(anonymousInfo:.*)", en_settings_body, re.DOTALL)
if not settings_added_match:
    print("Error: Could not find anonymousInfo in en.ts settings")
    exit(1)
added_settings_text = settings_added_match.group(1)

# history, stats, contact, documents のセクション全体を抽出
added_sections_match = re.search(r"(\s*history:\s*\{.*)", en_content, re.DOTALL)
if not added_sections_match:
    print("Error: Could not find new sections in en.ts")
    exit(1)
added_sections_text = added_sections_match.group(1)
added_sections_text = re.sub(r"\s*\};\s*$", "", added_sections_text)

# 各対象ファイルに対してマージを実行
for fname in target_files:
    fpath = os.path.join(locales_dir, fname)
    if not os.path.exists(fpath):
        print(f"Skipping {fname} (not found)")
        continue

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. settings の末尾に added_settings_text を追加
    settings_block_match = re.search(r"(settings:\s*\{.*?\n\s*\})", content, re.DOTALL)
    if not settings_block_match:
        print(f"Error: settings block not found in {fname}")
        continue
    
    settings_block = settings_block_match.group(1)
    
    # カンマの有無を確認して補正
    if not re.search(r",\s*\n\s*\}$", settings_block):
        settings_block_with_comma = re.sub(r"(\n\s*\})$", r",\1", settings_block)
    else:
        settings_block_with_comma = settings_block
        
    new_settings_block = re.sub(r"(\n\s*\})$", f"\n{added_settings_text}\\1", settings_block_with_comma)
    content = content.replace(settings_block, new_settings_block)

    # 2. ファイル全体の末尾（最後の }; の直前）に added_sections_text を追加
    content_match = re.search(r"(\n\s*\};\s*)$", content)
    if content_match:
        prefix_part = content[:content_match.start()]
        if not prefix_part.strip().endswith(','):
            content = prefix_part + ",\n" + added_sections_text + content_match.group(1)
        else:
            content = prefix_part + "\n" + added_sections_text + content_match.group(1)

    # 3. termsContent と privacyContent を空文字にする
    content = re.sub(r"(termsContent:\s*`.*?`)(,)?", 'termsContent: ""\\2', content, flags=re.DOTALL)
    content = re.sub(r"(privacyContent:\s*`.*?`)(,)?", 'privacyContent: ""\\2', content, flags=re.DOTALL)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Successfully synced {fname}")
