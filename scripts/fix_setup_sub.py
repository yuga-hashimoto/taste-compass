import os
import re

locales_dir = "/Volumes/MOVESPEED/Documents/GitHub/taste-compass/src/i18n/locales"

sub_replacements = {
    "en.ts": (r"pageSub:\s*['\"]Choose count & theme to start['\"]", "pageSub: 'Choose count to start'"),
    "zh-TW.ts": (r"pageSub:\s*['\"]選擇張數和主題開始測驗['\"]", "pageSub: '選擇測試張數開始測驗'"),
    "es.ts": (r"pageSub:\s*['\"]Elige cantidad y tema para empezar['\"]", "pageSub: 'Elige cantidad para empezar'"),
    "pt.ts": (r"pageSub:\s*['\"]Escolha a quantidade e o tema para começar['\"]", "pageSub: 'Escolha a quantidade para começar'"),
    "fr.ts": (r"pageSub:\s*['\"]Choisissez la quantité et le thème['\"]", "pageSub: 'Choisissez la quantité'"),
    "de.ts": (r"pageSub:\s*['\"]Anzahl und Thema wählen und starten['\"]", "pageSub: 'Anzahl wählen und starten'"),
    "id.ts": (r"pageSub:\s*['\"]Pilih jumlah dan tema untuk memulai['\"]", "pageSub: 'Pilih jumlah untuk memulai'"),
    "th.ts": (r"pageSub:\s*['\"]เลือกจำนวนและธีมเพื่อเริ่ม['\"]", "pageSub: 'เลือกจำนวนเพื่อเริ่ม'"),
    "vi.ts": (r"pageSub:\s*['\"]Chọn số lượng và chủ đề để bắt đầu['\"]", "pageSub: 'Chọn số lượng để bắt đầu'"),
    "ar.ts": (r"pageSub:\s*['\"]اختر العدد والموضوع للبدء['\"]", "pageSub: 'اختر العدد للبدء'"),
    "hi.ts": (r"pageSub:\s*['\"]संख्या और थीम चुनें और शुरू करें['\"]", "pageSub: 'संख्या चुनें और शुरू करें'")
}

for filename, (pattern, replacement) in sub_replacements.items():
    filepath = os.path.join(locales_dir, filename)
    if not os.path.exists(filepath):
        print(f"File {filename} not found.")
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content, count = re.subn(pattern, replacement, content)
    if count > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Successfully updated setup.pageSub in {filename}")
    else:
        print(f"Could not find pattern in {filename}")

print("Cleanup script execution finished.")
