import os
import re

locales_dir = "/Volumes/MOVESPEED/Documents/GitHub/taste-compass/src/i18n/locales"

title_additions = {
    "ja.ts": ("result: {", "result: {\n    title: '診断結果',"),
    "en.ts": ("result: {", "result: {\n    title: 'Diagnosis Result',"),
    "ko.ts": ("result: {", "result: {\n    title: '진단 결과',"),
    "zh-CN.ts": ("result: {", "result: {\n    title: '诊断结果',"),
    "zh-TW.ts": ("result: {", "result: {\n    title: '診斷結果',"),
    "es.ts": ("result: {", "result: {\n    title: 'Resultado del Diagnóstico',"),
    "pt.ts": ("result: {", "result: {\n    title: 'Resultado do Diagnóstico',"),
    "fr.ts": ("result: {", "result: {\n    title: 'Résultat du diagnostic',"),
    "de.ts": ("result: {", "result: {\n    title: 'Diagnoseergebnis',"),
    "id.ts": ("result: {", "result: {\n    title: 'Hasil Diagnosis',"),
    "th.ts": ("result: {", "result: {\n    title: 'ผลการวินิจฉัย',"),
    "vi.ts": ("result: {", "result: {\n    title: 'Kết quả chẩn đoán',"),
    "ar.ts": ("result: {", "result: {\n    title: 'نتيجة التشخيص',"),
    "hi.ts": ("result: {", "result: {\n    title: 'निदान परिणाम',")
}

for filename, (target, replacement) in title_additions.items():
    filepath = os.path.join(locales_dir, filename)
    if not os.path.exists(filepath):
        print(f"File {filename} not found.")
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 最初の置換を実行 (result: { の部分)
    # result: { が複数ある場合があるかもしれないので、1回のみ置換
    new_content, count = re.subn(re.escape(target), replacement, content, count=1)
    if count > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Successfully added result.title in {filename}")
    else:
        print(f"Could not find result: {{ block in {filename}")

print("Result title addition complete.")
