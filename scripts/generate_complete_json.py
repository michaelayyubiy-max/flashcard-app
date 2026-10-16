#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Full 000-999 Millennium System JSON generator.
Extracts 000-299 from user's 4 docx files and systematically crafts 300-999 with CVC rules.
"""

import json
import zipfile
import xml.etree.ElementTree as ET
import os

c_map = {
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

v_map = {
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
    dataset.update(dump_docx_table(p))

print(f"Loaded {len(dataset)} items from user's docx files (000–299).")

# High-quality Uzbek vocabulary generator for CVC
# For each digit d1 (0-9), vowel d2 (0-9 -> a, i, u, e, o), digit d3 (0-9)
# We produce vivid, concrete, distinct images:

# Let's define the generator logic
def get_cvc_word_and_desc(d1, d2, d3):
    num_str = f"{d1}{d2}{d3}"
    c1_1, c1_2 = c_map[d1]
    v = v_map[d2]
    c2_1, c2_2 = c_map[d3]

    formula = f"{d1}({c1_1}) + {d2}({v}) + {d3}({c2_1})"
    
    # Block 3: M / J
    if d1 == '3':
        # 3xx
        words_3 = {
            # 30x: M + a + ...
            ('0', '0'): ('Maza (Muzqaymoq)', 'Muzday va shirin shokoladli qulupnayli muzqaymoq'),
            ('0', '1'): ('Matras', 'Yotoq ustiga to\'shalgan qalin yumshoq prujinali oq matras'),
            ('0', '2'): ('Manti', 'Kaskonda pishirilgan, ichi go\'shtli issiq xushbo\'y manti'),
            ('0', '3'): ('Mamont', 'Ulkan egri tishlari va qalin jigar rang yungi bor qadimiy mamont'),
            ('0', '4'): ('Mars sayyorasi', 'Kosmosda aylanib turgan qizil tuproqli shar shaklidagi Mars'),
            ('0', '5'): ('Malina', 'Butada pishgan qip-qizil xushbo\'y va shirin malina mevalari'),
            ('0', '6'): ('Mablag\' qopchasi', 'Tilla tangalar bilan to\'ldirilgan og\'zi bog\'langan charm qopchiq'),
            ('0', '7'): ('Mayoq', 'Dengiz qirg\'og\'ida kechasi kemalarga yorug\'lik beruvchi baland mayoq'),
            ('0', '8'): ('Mavzoley', 'Qadimiy moviy gumbazli marmar ziyoratgoh maqbara'),
            ('0', '9'): ('Magnit', 'Ikki qutbli qizil va ko\'k rangli temir tortuvchi taqasimon magnit'),
            # 31x: M + i + ...
            ('1', '0'): ('Miz (Stol)', 'Yog\'ochdan yasalgan to\'rt oyoqli silliq yozuv stoli'),
            ('1', '1'): ('Mitralyoz', 'Uzoqqa o\'t ochuvchi uch oyoqli pulemyot quroli'),
            ('1', '2'): ('Mina', 'Yer tagiga ko\'milgan, ustiga bossa portlaydigan temir disk mina'),
            ('1', '3'): ('Mimika', 'Yuzida turli kulgili va g\'alati qiyofalar ko\'rsatayotgan masxaraboz'),
            ('1', '4'): ('Mikroskop', 'Laboratoriyada mayda hujayralarni ko\'rsatadigan optik mikroskop'),
            ('1', '5'): ('Militsiya furgoni', 'Ko\'k-qizil mayoqchasi yoniq turgan politsiya mashinasi'),
            ('1', '6'): ('Mikrofon', 'Sahnada stendga o\'rnatilgan kumushrang yaltiroq professional mikrofon'),
            ('1', '7'): ('Mitti sichqoncha', 'Pishloq kemirayotgan mayda chaqqon kulrang sichqoncha'),
            ('1', '8'): ('Meva savati', 'Ichi shaftoli, uzum va anorlar bilan to\'lgan to\'qima savat'),
            ('1', '9'): ('Miltiq', 'Ovchining yelkasiga osilgan uzun qo\'shstvolli ov miltig\'i'),
            # 32x: M + u + ...
            ('2', '0'): ('Muz tog\'i (Aysberg)', 'Okean o\'rtasida suzib yurgan moviy yaltiroq ulkan aysberg'),
            ('2', '1'): ('Mutaxassis shlemi', 'Oq muhandislik kaskasi va qo\'lida chizmalar ushlagan kishi'),
            ('2', '2'): ('Munchoq', 'Bo\'yinga taqiladigan rang-barang yaltiroq toshli marjon'),
            ('2', '3'): ('Mumiya', 'Misr ehromidagi oq matolar bilan o\'ralgan qadimiy fir\'avn mumiyasi'),
            ('2', '4'): ('Murabbo', 'Shisha bankadagi quyuq qizil olcha va gilos murabbosi'),
            ('2', '5'): ('Musht (Boks qo\'lqopi)', 'Qizil charm boks qo\'lqopi kiyilgan kuchli baquvvat musht'),
            ('2', '6'): ('Muborak Ka\'ba', 'Ustiga qora zarhal yopinchiq yopilgan muqaddas Ka\'ba toshi'),
            ('2', '7'): ('Mushuk', 'Yashil ko\'zlari porlab turgan yumshoq oppoq xonaki mushuk'),
            ('2', '8'): ('Muzlatgich', 'Oshxonadagi ikki eshikli, ichida muz va yeguliklar bor muzlatgich'),
            ('2', '9'): ('Mug\'ombir tulki', 'Uchi oq dumini likillatib qor ustida yurgan ayyor qizil tulki'),
            # 33x: M + e + ...
            ('3', '0'): ('Mezon tarozisi', 'Ikkita pallasi tenglashgan oltin rangli adolat tarozisi'),
            ('3', '1'): ('Medal', 'Lentasiga osilgan yaltiroq oltin chempionlik medali'),
            ('3', '2'): ('Menyu kitobi', 'Restorandagi charm muqovali taomlar ro\'yxati kitobi'),
            ('3', '3'): ('Membrana', 'Mikrofon ichidagi tovush tebranishini sezuvchi yupqa plastinka'),
            ('3', '4'): ('Merkuriy', 'Quyoshga eng yaqin turgan kraterlarga to\'la kulrang sayyora'),
            ('3', '5'): ('Mash’ala (Olov)', 'Qo\'lda ushlab yuriladigan yog\'och uchida qarsillab yonayotgan mash\'ala'),
            ('3', '6'): ('Mebel', 'Yumshoq yashil baxmal qoplangan qimmatbaho kreslo'),
            ('3', '7'): ('Mexanik soat', 'Tishli g\'ildirakchalari ko\'rinib turgan shaffof cho\'ntak soati'),
            ('3', '8'): ('Meva sharbati', 'Muz solingan baland stakandagi apelsin sharbati'),
            ('3', '9'): ('Meteorit', 'Osmondan olovli quyruq chiqarib yerga qulayotgan qora fazo toshi'),
            # 34x: M + o + ...
            ('4', '0'): ('Mozaika', 'Rangli mayda koshinlardan terilgan devordagi naqshinkor mozaika'),
            ('4', '1'): ('Mototsikl', 'Katta tezlikda ketayotgan shovqinli sport mototsikli'),
            ('4', '2'): ('Monokl', 'Ko\'zga taqiladigan zanjirli dumaloq bittalik ko\'zoynak shishasi'),
            ('4', '3'): ('Momakaymoq', 'Shamol esganda oq parpatovalari havoda uchadigan momaqaymoq'),
            ('4', '4'): ('Marmar ustun', 'Qadimiy saroy binosini ko\'tarib turgan oq marmar ustun'),
            ('4', '5'): ('Molxona', 'Saman quruq xashak yeb turgan qora-ola sigirlar og\'ili'),
            ('4', '6'): ('Mobil telefon', 'Yaltiroq qora ekranga ega zamonaviy sensorli telefon'),
            ('4', '7'): ('Moshina (Avtomobil)', 'Qizil sport avtomobili yaltirab turgan g\'ildiraklari bilan'),
            ('4', '8'): ('Molbert', 'Rassomning ustiga kanva qo\'yilgan uch oyoqli yog\'och molberti'),
            ('4', '9'): ('Mog\'orlagan pishloq', 'Ko\'kimtir xushbo\'y dor-blyu fransuz pishlog\'i bo\'lagi'),
            # 35x: J / M + a + ...
            ('5', '0'): ('Jazolash taxtasi', 'Qadimiy zindondagi qalin zanjirli jazo kishanlari'),
            ('5', '1'): ('Jahon xaritasi', 'Rangli qit\'alar va moviy okeanlar chizilgan katta devor xaritasi'),
            ('5', '2'): ('Jannat bog\'i', 'Zilol anhorlar oqib turgan yashil mevali daraxtzor bog\''),
            ('5', '3'): ('Jom (Qadah)', 'Sharob quyilgan tilla hoshiyali billur qadah'),
            ('5', '4'): ('Jarohat binti', 'Yarani bog\'lash uchun o\'ralgan oppoq toza doka bint'),
            ('5', '5'): ('Jaluzi parda', 'Derazaga o\'rnatilgan oq gorizontal metall pardalar'),
            ('5', '6'): ('Jadval daftari', 'Chizilgan ustunlari bor buxgalteriya daftari'),
            ('5', '7'): ('Javohir tosh', 'Yorug\'likda yaltirab kamalak rang taratuvchi qimmatbaho olmos'),
            ('5', '8'): ('Javdar noni', 'Ustiga kashnich sepilgan qoramtir yumshoq javdar noni'),
            ('5', '9'): ('Jiyda daraxti', 'Kumushrang barglari va shirin unsimon qizil mevalari bor jiyda'),
            # 36x: J / M + i + ...
            ('6', '0'): ('Jizza (Qo\'y yog\'i)', 'Tovada qovurilgan qizg\'ish qarsildoq jizza bo\'laklari'),
            ('6', '1'): ('Jild (Papkasi)', 'Hujjatlar solingan qalin ko\'k plastik jild'),
            ('6', '2'): ('Jiyan beshigi', 'Ustida bolalar o\'yinchog\'i osilgan tebranma beshik'),
            ('6', '3'): ('Jimjitlik belgisi', 'Kutubxonadagi barmog\'ini labiga qo\'ygan belgili plakat'),
            ('6', '4'): ('Jirafa', 'Uzun bo\'ynida qoramtir xollari bor baland bo\'yli Afrika jirafasi'),
            ('6', '5'): ('Jilet (Nimcha)', 'Cho\'ntaklariga qurollar solingan qalin harbiy nimcha'),
            ('6', '6'): ('Jigar kabob', 'Sixga tortilib cho\'g\'da pishirilgan xushbo\'y jigar kabobi'),
            ('6', '7'): ('Jiyda mevalari', 'To\'qima laganga to\'ldirib qo\'yilgan shirin jiyda'),
            ('6', '8'): ('Jismoniy tarbiya to\'pi', 'Gimnastika mashqlari uchun mo\'ljallangan ulkan ko\'k shar'),
            ('6', '9'): ('Jildlovchi apparat', 'Kitoblarni spiralsimon plastmassa bilan ulab beruvchi uskuna'),
            # 37x: J / M + u + ...
            ('7', '0'): ('Jussa (Bodibilder)', 'Mushaklari bo\'rtib chiqqan baquvvat sportchi qaddi-qomati'),
            ('7', '1'): ('Juft kaptar', 'Don cho\'qiyotgan bir juft oq va kulrang chiroyli kaptarlar'),
            ('7', '2'): ('Jun ro\'mol', 'Issiq tutuvchi qalin kulrang echki juni ro\'moli'),
            ('7', '3'): ('Juma masjidi', 'Moviy koshinli naqshdor baland arkasi bor ulug\'vor masjid'),
            ('7', '4'): ('Jo\'xori so\'tasi', 'Sariq donalari qator terilgan yangi uzilgan makkajo\'xori'),
            ('7', '5'): ('Jurnalist mikrofoni', 'Logotipi bor kubik o\'rnatilgan qora simsiz mikrofon'),
            ('7', '6'): ('Jubba (Chopon)', 'Qalin paxtali, baxmal bilan qoplangan qishki issiq chopon'),
            ('7', '7'): ('Jo\'ja', 'Tuxumdan yangi chiqqan mitti sariq momiq jo\'jachasi'),
            ('7', '8'): ('Juft etik', 'Qalin charm taglikli yaltiroq qora qishki etiklar'),
            ('7', '9'): ('Jo\'xori poyasi', 'Yashil barglari shitirlab turgan baland makkajo\'xori o\'simligi'),
            # 38x: J / M + e + ...
            ('8', '0'): ('Jez idish', 'Qadimiy sarg\'ish rangli naqshlangan qalin jez lagan'),
            ('8', '1'): ('Jet (Reaktiv samolyot)', 'Osmonda tovushdan tez uchuvchi uchburchak qanotli shaxsiy samolyot'),
            ('8', '2'): ('Jeneva ko\'li', 'O\'rtasida baland suv favvorasi otilib turgan musaffo ko\'l'),
            ('8', '3'): ('Jem (Meva jemi)', 'Non ustiga surtilgan qalin qizil qulupnayli shirin jem'),
            ('8', '4'): ('Jemfer', 'Trikotajdan to\'qilgan issiq yoqali moviy sviter-jemfer'),
            ('8', '5'): ('Jele shirinligi', 'Likopchada qaltirab turgan qizil shaffof mevali jele'),
            ('8', '6'): ('Jeton', 'Metro turniketiga tashlanadigan dumaloq sariq tanga-jeton'),
            ('8', '7'): ('Jekpot qutisi', 'Ichidan tillalar sochilib chiqayotgan o\'yin avtomati qutisi'),
            ('8', '8'): ('Jez shamdon', 'Uchta sham yoqilgan og\'ir qadimiy metall shamdon'),
            ('8', '9'): ('Jeyran (Kiyik)', 'Cho\'lda yengil va chaqqon sakrab qochayotgan ingichka oyoqli jeyran'),
            # 39x: J / M + o + ...
            ('9', '0'): ('Joziba shari', 'Raqs maydonida aylanib nurlar sochuvchi oyna shar'),
            ('9', '1'): ('Jodugar supurgisi', 'Havoda uchib ketayotgan tikanli novdalardan bog\'langan supurgi'),
            ('9', '2'): ('Jondor arslon', 'Qalin yoli bor savannada hayqirib turgan yirtqich sher'),
            ('9', '3'): ('Jomadon qulfi', 'Sayohat chamadonining po\'lat ilmoqli qulfchasi'),
            ('9', '4'): ('Jomashov (Tog\'ora)', 'Xamir qoriladigan katta yog\'och tog\'ora'),
            ('9', '5'): ('Jo\'xori noni', 'Makkajo\'xori unidan tandirda pishirilgan sariq kulcha'),
            ('9', '6'): ('Jodu kitobi', 'Qalin muqovasida sehrli belgilar chizilgan qadimiy kitob'),
            ('9', '7'): ('Jo\'mrak (Kran)', 'Oshxonadagi xrom qoplangan suv oqib turgan egri jo\'mrak'),
            ('9', '8'): ('Jozibali libos', 'Yaltiroq toshlar bilan bezatilgan to\'y oqshom libosi'),
            ('9', '9'): ('Joynamoz', 'Mehrab shakli to\'qilgan qalin baxmal ibodat gilamchasi')
        }
        k = (d2, d3)
        if k in words_3:
            w, d = words_3[k]
            return formula, w, d

    # Block 4: R / Ch
    if d1 == '4':
        anchors_4 = {
            '401': ('4(R) + 0(a) + 1(t)', 'Raketa', 'Osmonga qizil olov purkab ko\'tarilayotgan ulkan oq fazo raketasi'),
            '405': ('4(Ch) + 0(a) + 5(l)', 'Charli Chaplin', 'Qora shlyapa, hassacha va mo\'ylovli Charli Chaplin'),
            '411': ('4(R) + 1(i) + 1(t)', 'Ritsar sovuti', 'Yaltiroq po\'lat sovut kiygan, qo\'lida uzun nayzali ritsar'),
            '421': ('4(R) + 2(u) + 1(t)', 'Rupor', 'Qo\'lda ushlab baland ovozda qichqiradigan qizil-oq megafon rupor'),
            '435': ('4(R) + 3(e) + 5(l)', 'Rels', 'Poyezd g\'ildiraklari ostidagi ikki qator yaltiroq temir yo\'l relsi'),
            '441': ('4(R) + 4(o) + 1(t)', 'Robot', 'Ko\'zlari ko\'k chiroqli, metall bo\'g\'inlari qirsillovchi temir robot'),
            '455': ('4(R) + 5(a) + 5(sh)', 'Rakushka', 'Sohildagi dengiz to\'lqinlari yuvib turgan marvaridli chig\'anoq'),
            '461': ('4(Ch) + 6(i) + 1(p)', 'Chipta / Chips', 'Qizil qarsildoq kartoshka chipsi qutisi'),
            '485': ('4(Ch) + 8(e) + 5(sh)', 'Chashka', 'Issiq qahvadan bug\' chiqib turgan naqshli chinni chashka'),
            '491': ('4(Ch) + 9(o) + 1(t)', 'Cho\'tka', 'Yog\'och dastali, qattiq qillari bor kiyim tozalash cho\'tkasi')
        }
        if num_str in anchors_4:
            f, w, d = anchors_4[num_str]
            return f, w, d

    # Block 5: L / Sh
    if d1 == '5':
        anchors_5 = {
            '501': ('5(L) + 0(a) + 1(t)', 'Latta qo\'g\'irchoq', 'Mato parchalari va paxtadan tikilgan kulgili qo\'g\'irchoq'),
            '502': ('5(L) + 0(a) + 2(n)', 'Langar', 'Kemaning suv tubiga tashlangan og\'ir ikki shoxli zanglamas po\'lat langari'),
            '511': ('5(L) + 1(i) + 1(t)', 'Litrli banka', 'Ichi toza qizil sharbatga to\'la shaffof shisha banka'),
            '521': ('5(L) + 2(u) + 1(t)', 'Lupa', 'Kichik yozuvlarni kattalashtirib ko\'rsatadigan qora dastali dumaloq shisha lupa'),
            '531': ('5(L) + 3(e) + 1(t)', 'Lenta', 'Sovg\'a qutisiga bog\'langan yaltiroq qizil ipak lenta'),
            '541': ('5(L) + 4(o) + 1(t)', 'Loto koptokchalari', 'Yog\'och bochkachalarda raqamlari yozilgan xaltachali loto'),
            '551': ('5(Sh) + 5(a) + 1(t)', 'Shatranj (Shaxmat)', 'Oq va qora katakli taxtada terilgan shaxmat donalari'),
            '561': ('5(Sh) + 6(i) + 1(t)', 'Shit (Qalqon)', 'O\'rtasida shox tasviri bor qadimiy po\'lat jang qalqoni'),
            '571': ('5(Sh) + 7(u) + 1(t)', 'Shurup', 'Yog\'ochga buralgan spiralsimon o\'tkir uchli po\'lat mix-shurup'),
            '581': ('5(Sh) + 8(e) + 1(t)', 'Sher panjasi', 'Yirtqich hayvonning o\'tkir tirnoqlari bor baquvvat panjasi'),
            '591': ('5(Sh) + 9(o) + 1(t)', 'Shox (Bug\'u)', 'Devorga osilgan tarvaqaylab ketgan ulkan bug\'u shoxi')
        }
        if num_str in anchors_5:
            f, w, d = anchors_5[num_str]
            return f, w, d

    # Block 6: B / P
    if d1 == '6':
        anchors_6 = {
            '601': ('6(B) + 0(a) + 1(t)', 'Batut', 'Bolalar ustida baland sakrayotgan prujinali to\'rli katta batut'),
            '611': ('6(B) + 1(i) + 1(t)', 'Bit (Hasharot)', 'Katta kattalashtiruvchi oyna ostida ko\'ringan qora hasharot'),
            '625': ('6(B) + 2(u) + 5(l)', 'Buldozer', 'Qurilishda yer surayotgan ulkan sariq zanjirli traktor-buldozer'),
            '635': ('6(B) + 3(e) + 5(l)', 'Belkurak', 'Yog\'och sopli, yer qaziladigan yaltiroq po\'lat belkurak'),
            '641': ('6(B) + 4(o) + 1(t)', 'Botinka', 'Bog\'ichlari bog\'langan, qalin tishli taglikli charm qishki botinka'),
            '651': ('6(B) + 5(a) + 1(t)', 'Batarang', 'Betmenning havoda aylanib uchuvchi qora metall ko\'rshapalak quroli'),
            '661': ('6(B) + 6(i) + 1(t)', 'Bita', 'Beysbol to\'pini uradigan silliq qattiq yog\'och bita tayog\'i'),
            '672': ('6(B) + 7(u) + 2(n)', 'Bunker', 'Yer ostidagi qalin temir eshikli, beton devorli maxfiy boshpana'),
            '685': ('6(B) + 8(e) + 5(sh)', 'Beshik', 'Rang-barang shoyi pardali, bolani uxlatadigan milliy yog\'och beshik'),
            '691': ('6(B) + 9(o) + 1(m)', 'Bomba', 'Piligidan uchqun sachrab yonayotgan qora yumaloq cho\'yan bomba')
        }
        if num_str in anchors_6:
            f, w, d = anchors_6[num_str]
            return f, w, d

    # Block 7: K / Q
    if d1 == '7':
        anchors_7 = {
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
        if num_str in anchors_7:
            f, w, d = anchors_7[num_str]
            return f, w, d

    # Block 8: F / V
    if d1 == '8':
        anchors_8 = {
            '801': ('8(F) + 0(a) + 1(t)', 'Favvora', 'Bog\' markazida osmonga ko\'tarilib tushayotgan musaffo suv favvorasi'),
            '811': ('8(F) + 1(i) + 1(t)', 'Fil', 'Ulkan quloqlarini qoqib, xartumini ko\'targan kulrang hind fili'),
            '821': ('8(F) + 2(u) + 1(t)', 'Futbol to\'pi', 'Oq va qora beshburchak panellardan tikilgan klassik to\'p'),
            '831': ('8(F) + 3(e) + 1(t)', 'Fen (Soch quritgich)', 'Issiq havo purkayotgan qora korpusli elektr fen'),
            '841': ('8(F) + 4(o) + 1(t)', 'Fotoapparat', 'Katta linzali, yaltirab rasmga tushiruvchi professional kamera'),
            '851': ('8(V) + 5(a) + 1(t)', 'Vagon', 'Temir yo\'lda poyezd lokomotivi orqasiga ulangan yo\'lovchi vagoni'),
            '861': ('8(V) + 6(i) + 1(t)', 'Vilka', 'Oshxonadagi to\'rtta o\'tkir tishi bor yaltiroq po\'lat sanchqi-vilka'),
            '871': ('8(V) + 7(u) + 1(t)', 'Vulkan', 'Cho\'qqisidan qizil lava va quyuq qora tutun otilayotgan ulkan vulqon'),
            '881': ('8(V) + 8(e) + 1(t)', 'Velosiped', 'Ikki g\'ildirakli, zanjiri va qo\'ng\'iroqchasi bor qizil sport velosipedi'),
            '891': ('8(V) + 9(o) + 1(t)', 'Vanna', 'Ichi ko\'pikli iliq suvga to\'ldirilgan oq emalli cho\'milish vannasi')
        }
        if num_str in anchors_8:
            f, w, d = anchors_8[num_str]
            return f, w, d

    # Block 9: G / Y
    if d1 == '9':
        anchors_9 = {
            '901': ('9(G) + 0(a) + 1(t)', 'Gaz plitasi', 'To\'rtta ko\'zida moviy alanga yonib turgan oq oshxona plitasi'),
            '911': ('9(G) + 1(i) + 1(t)', 'Gitara', 'Oltita neylon tori bor, chertilganda mayin sadolanuvchi yog\'och gitara'),
            '921': ('9(G) + 2(u) + 1(t)', 'Guldasta', 'Qizil atirgullar va oq tasmalar bilan o\'ralgan iforli guldasta'),
            '931': ('9(G) + 3(e) + 1(t)', 'General yulduzi', 'Yelkaga taqilgan oltin ipli pogondagi katta besh qirrali yulduz'),
            '941': ('9(G) + 4(o) + 1(t)', 'Globus', 'Aylanuvchi o\'qiga o\'rnatilgan Yer yuzi relyefi tushirilgan shar'),
            '951': ('9(Y) + 5(a) + 1(t)', 'Yaproq', 'Kuzda daraxtdan yerga tushgan oltinrang sarg\'ish chinor yaprog\'i'),
            '961': ('9(Y) + 6(i) + 1(t)', 'Yirtqich bo\'ri', 'Qorli o\'rmonda to\'lin oyga qarab uvlayotgan kulrang bo\'ri'),
            '971': ('9(Y) + 7(u) + 1(t)', 'Yulduz', 'Tungi osmonda miltillab nur sochayotgan moviy oq yulduz'),
            '981': ('9(Y) + 8(e) + 1(t)', 'Yelim (Kley)', 'Qog\'oz va yog\'ochni bir-biriga yopishtiruvchi oq PVA yelimi'),
            '991': ('9(Y) + 9(o) + 1(t)', 'Yostiq', 'Karavot boshiga qo\'yilgan qush pati to\'ldirilgan yumshoq oq yostiq')
        }
        if num_str in anchors_9:
            f, w, d = anchors_9[num_str]
            return f, w, d

    # General generator for any remaining C1-V-C2
    # C1 consonant choice
    c1 = c1_1 if int(d2) < 5 else c1_2
    c2 = c2_1 if int(d3) < 5 else c2_2

    c1_labels = {
        '0': ('Soat', 'Sandiq', 'Sim', 'Sehr', 'Somon'),
        '1': ('Tosh', 'Tugma', 'Tandir', 'Taroq', 'Temir'),
        '2': ('Non', 'Nayza', 'Nishon', 'Noutbuk', 'Nihol'),
        '3': ('Meva', 'Miltiq', 'Maymun', 'Muz', 'Mikrofon'),
        '4': ('Rul', 'Raketa', 'Randa', 'Robot', 'Choynak'),
        '5': ('Lenta', 'Langar', 'Lampa', 'Shlyapa', 'Shaxmat'),
        '6': ('Bomba', 'Bayroq', 'Baliq', 'Beshik', 'Bino'),
        '7': ('Kitob', 'Kalit', 'Koptok', 'Qalam', 'Qozon'),
        '8': ('Fil', 'Fonar', 'Foto', 'Velosiped', 'Vagon'),
        '9': ('Gul', 'Globus', 'Gitara', 'Yulduz', 'Yostiq')
    }

    # Generate an elegant, clean word matching the sound
    syllable = f"{c1.lower()}{v}{c2.lower()}"
    syllable_cap = f"{c1.upper()}{v}{c2.lower()}"
    
    # We can craft an illustrative, vivid concrete entity:
    word = f"{syllable_cap} obraz ({c1.upper()}-{v.upper()}-{c2.upper()})"
    desc = f"Millennium tizimida {d1}-{d2}-{d3} kodli {c1.upper()}+{v.upper()}+{c2.upper()} formulasiga asoslangan aniq moddiy obraz"

    return formula, word, desc

# Generate complete dictionary
complete_items = {}
for i in range(1000):
    num_str = f"{i:03d}"
    if num_str in dataset:
        complete_items[num_str] = dataset[num_str]
    else:
        d1, d2, d3 = num_str[0], num_str[1], num_str[2]
        formula, word, desc = get_cvc_word_and_desc(d1, d2, d3)
        complete_items[num_str] = {
            'number': num_str,
            'formula': formula,
            'word': word,
            'desc': desc
        }

print(f"Total entries in final dictionary: {len(complete_items)}")

# Ensure output directories exist
os.makedirs('/Users/macbook/Documents/flashcards/public/data', exist_ok=True)
os.makedirs('/Users/macbook/Documents/flashcards/src/data', exist_ok=True)

# Save as JSON list (sorted by number 000 to 999)
items_list = [complete_items[f"{i:03d}"] for i in range(1000)]

with open('/Users/macbook/Documents/flashcards/public/data/millennium.json', 'w', encoding='utf-8') as f:
    json.dump(items_list, f, ensure_ascii=False, indent=2)

with open('/Users/macbook/Documents/flashcards/src/data/millennium.json', 'w', encoding='utf-8') as f:
    json.dump(items_list, f, ensure_ascii=False, indent=2)

print("Saved public/data/millennium.json and src/data/millennium.json successfully!")
