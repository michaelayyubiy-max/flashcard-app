#!/usr/bin/env python3
import json
import zipfile
import xml.etree.ElementTree as ET
import os

# Letters:
# 0: S / Z
# 1: T / D
# 2: N / H
# 3: M / J
# 4: R / Ch
# 5: L / Sh
# 6: B / P
# 7: K / Q
# 8: F / V
# 9: G / Y
#
# Vowels:
# 0, 5 -> a
# 1, 6 -> i
# 2, 7 -> u
# 3, 8 -> e
# 4, 9 -> o

c_letters = {
    '0': ('S', 'Z'),
    '1': ('T', 'D'),
    '2': ('N', 'H'),
    '3': ('M', 'J'),
    '4': ('R', 'Ch'),
    '5': ('L', 'Sh'),
    '6': ('B', 'P'),
    '7': ('K', 'Q'),
    '8': ('F', 'V'),
    '9': ('G', 'Y')
}

v_letters = {
    '0': 'a', '5': 'a',
    '1': 'i', '6': 'i',
    '2': 'u', '7': 'u',
    '3': 'e', '8': 'e',
    '4': 'o', '9': 'o'
}

def dump_docx_table(docx_path):
    if not os.path.exists(docx_path):
        return {}
    with zipfile.ZipFile(docx_path) as z:
        tree = ET.fromstring(z.read('word/document.xml'))
        rows = []
        for tr in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr'):
            cells = [''.join(node.text for node in tc.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text).strip() for tc in tr.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tc')]
            if cells:
                rows.append(cells)
        items = {}
        for r in rows[1:]:
            if len(r) >= 3:
                num = r[0].strip()
                formula = r[1].strip() if len(r) > 1 else ''
                word = r[2].strip() if len(r) > 2 else ''
                desc = r[3].strip() if len(r) > 3 else ''
                items[num] = {'number': num, 'formula': formula, 'word': word, 'desc': desc}
        return items

dataset = {}
for p in [
    '/Users/macbook/Downloads/millenium/MILLENNIUM_000_049.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_050_099.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_100_199.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_200_299.docx'
]:
    items = dump_docx_table(p)
    dataset.update(items)

print(f"Loaded {len(dataset)} items directly from verified docx (000-299).")

# Known explicit anchors from Master Guide and standard Uzbek Mnemonics
anchors = {
    # 400s
    '401': ('4(R) + 0(a) + 1(t)', 'Raketa', 'Osmonga qizil olov purkab ko\'tarilayotgan ulkan oq fazo raketasi'),
    '405': ('4(Ch) + 0(a) + 5(l)', 'Charli Chaplin', 'Qora shlyapa, hassacha va mo\'ylovli Charli Chaplin'),
    '411': ('4(R) + 1(i) + 1(t)', 'Ritsar sovuti', 'Yaltiroq po\'lat sovut kiygan, qo\'lida uzun nayzali ritsar'),
    '421': ('4(R) + 2(u) + 1(t)', 'Rupor', 'Qo\'lda ushlab baland ovozda qichqiradigan qizil-oq mefon rupor'),
    '435': ('4(R) + 3(e) + 5(l)', 'Rels', 'Poyezd g\'ildiraklari ostidagi ikki qator yaltiroq temir yo\'l relsi'),
    '441': ('4(R) + 4(o) + 1(t)', 'Robot', 'Ko\'zlari ko\'k chiroqli, metall bo\'g\'inlari qirsillovchi temir robot'),
    '455': ('4(R) + 5(a) + 5(sh)', 'Rakushka', 'Sohildagi dengiz to\'lqinlari yuvib turgan marvaridli chig\'anoq'),
    '461': ('4(Ch) + 6(i) + 1(p)', 'Chipta / Chips', 'Qizil qarsildoq kartoshka chipsi qutisi'),
    '485': ('4(Ch) + 8(e) + 5(sh)', 'Chashka', 'Issiq qahvadan bug\' chiqib turgan naqshli chinni chashka'),
    '491': ('4(Ch) + 9(o) + 1(t)', 'Cho\'tka', 'Yog\'och dastali, qattiq qillari bor kiyim tozalash cho\'tkasi'),

    # 600s
    '601': ('6(B) + 0(a) + 1(t)', 'Batut', 'Bolalar ustida baland sakrayotgan prujinali to\'rli katta batut'),
    '611': ('6(B) + 1(i) + 1(t)', 'Bit (Hasharot)', 'Katta kattalashtiruvchi oyna ostida ko\'ringan qora hasharot'),
    '625': ('6(B) + 2(u) + 5(l)', 'Buldozer', 'Qurilishda yer surayotgan ulkan sariq zanjirli traktor-buldozer'),
    '635': ('6(B) + 3(e) + 5(l)', 'Belkurak', 'Yog\'och sopli, yer qaziladigan yaltiroq po\'lat belkurak'),
    '641': ('6(B) + 4(o) + 1(t)', 'Botinka', 'Bog\'ichlari bog\'langan, qalin tishli taglikli charm qishki botinka'),
    '651': ('6(B) + 5(a) + 1(t)', 'Batarang', 'Betmenning havoda aylanib uchuvchi qora metall ko\'rshapalak quroli'),
    '661': ('6(B) + 6(i) + 1(t)', 'Bita', 'Beysbol to\'pini uradigan silliq qattiq yog\'och bita tayog\'i'),
    '672': ('6(B) + 7(u) + 2(n)', 'Bunker', 'Yer ostidagi qalin temir eshikli, beton devorli maxfiy boshpana'),
    '685': ('6(B) + 8(e) + 5(sh)', 'Beshik', 'Rang-barang shoyi pardali, bolani uxlatadigan milliy yog\'och beshik'),
    '691': ('6(B) + 9(o) + 1(m)', 'Bomba', 'Piligidan uchqun sachrab yonayotgan qora yumaloq cho\'yan bomba'),

    # 700s
    '701': ('7(K) + 0(a) + 1(t)', 'Katta kema', 'Moviy okean uzra oq ko\'pik qoldirib suzayotgan ulkan kruiz layneri'),
    '711': ('7(K) + 1(i) + 1(t)', 'Kit', 'Suv yuzasiga chiqib baland favvora otayotgan ulkan ko\'k kit'),
    '725': ('7(K) + 2(u) + 5(l)', 'Kulol ko\'zasi', 'Loydan yasalgan, bo\'ynida ingichka naqshlari bor qadimiy ko\'za'),
    '732': ('7(K) + 3(e) + 2(n)', 'Kenguru', 'Qornidagi xaltachasida bolachasi bo\'lgan uzun dumli sakrovchi kenguru'),
    '741': ('7(Q) + 4(o) + 1(t)', 'Qozon', 'O\'choqda olov ustida palov damlangan qora quyma cho\'yan qozon'),
    '751': ('7(K) + 5(a) + 5(sh)', 'Kaska', 'Qurilish ustasining boshidagi yorqin sariq himoya shlemi (kaska)'),
    '761': ('7(K) + 6(i) + 1(p)', 'Kirpich (G\'isht)', 'Bino qurilishida teriladigan qizil pishiq loy g\'isht'),
    '772': ('7(Q) + 7(u) + 2(n)', 'Qunduz', 'Daryo bo\'yida shox-shabbalardan to\'g\'on qurayotgan suzuvchi qunduz'),
    '782': ('7(K) + 8(e) + 2(n)', 'KentaVR', 'Yarmi inson, yarmi baquvvat chopqir ot bo\'lgan afsonaviy bahodir'),
    '791': ('7(Q) + 9(o) + 1(t)', 'Qovun', 'Sariq to\'rsimon po\'sti bor, shirin tilimlab kesilgan xushbo\'y qovun')
}

# Systematic high-yield dictionary for CVC words in Uzbek
# Digits C1, V, C2:
# We will create a comprehensive dictionary mapping each (d1, d2, d3) to best word and description.
# Let's write a generator helper:

def build_entry(num_str):
    if num_str in dataset:
        return dataset[num_str]
    if num_str in anchors:
        f, w, d = anchors[num_str]
        return {'number': num_str, 'formula': f, 'word': w, 'desc': d}
    
    d1, d2, d3 = num_str[0], num_str[1], num_str[2]
    c1_opts = c_letters[d1]
    v = v_letters[d2]
    c2_opts = c_letters[d3]

    # Predefined high-quality lexicon for 300-999
    # We will import from our full vocabulary builder below
    return None

print("Script framework written.")
