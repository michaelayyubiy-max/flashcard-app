#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import zipfile
import xml.etree.ElementTree as ET
import os

c_primary = {
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

v_primary = {
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

# Load existing 000-299 from user's docx files
dataset = {}
for p in [
    '/Users/macbook/Downloads/millenium/MILLENNIUM_000_049.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_050_099.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_100_199.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_200_299.docx'
]:
    dataset.update(dump_docx_table(p))

print(f"Loaded {len(dataset)} items from user's docx files (000–299).")

# Dictionary of high-yield mnemonic CVC words and visual descriptions for 300–999:
# C1 x V x C2 mappings
# Let's define the comprehensive dictionary for all (d1, d2, d3) combinations:
CVC_BASE = {
    # 3xx (M / J)
    ('3', '0', '0'): ('Maza (Muzqaymoq)', 'Muzday va shirin shokoladli qulupnayli muzqaymoq'),
    ('3', '0', '1'): ('Matras', 'Yotoq ustiga to\'shalgan qalin yumshoq prujinali oq matras'),
    ('3', '0', '2'): ('Manti', 'Kaskonda pishirilgan, ichi go\'shtli issiq xushbo\'y manti'),
    ('3', '0', '3'): ('Mamont', 'Ulkan egri tishlari va qalin jigar rang yungi bor qadimiy mamont'),
    ('3', '0', '4'): ('Mars sayyorasi', 'Kosmosda aylanib turgan qizil tuproqli shar shaklidagi Mars'),
    ('3', '0', '5'): ('Malina', 'Butada pishgan qip-qizil xushbo\'y va shirin malina mevalari'),
    ('3', '0', '6'): ('Mablag\' qopchasi', 'Tilla tangalar bilan to\'ldirilgan og\'zi bog\'langan charm qopchiq'),
    ('3', '0', '7'): ('Mayoq', 'Dengiz qirg\'og\'ida kechasi kemalarga yorug\'lik beruvchi baland mayoq'),
    ('3', '0', '8'): ('Mavzoley', 'Qadimiy moviy gumbazli marmar ziyoratgoh maqbara'),
    ('3', '0', '9'): ('Magnit', 'Ikki qutbli qizil va ko\'k rangli temir tortuvchi taqasimon magnit'),

    ('3', '1', '0'): ('Miz (Stol)', 'Yog\'ochdan yasalgan to\'rt oyoqli silliq yozuv stoli'),
    ('3', '1', '1'): ('Mitralyoz', 'Uzoqqa o\'t ochuvchi uch oyoqli pulemyot quroli'),
    ('3', '1', '2'): ('Mina', 'Yer tagiga ko\'milgan, ustiga bossa portlaydigan temir disk mina'),
    ('3', '1', '3'): ('Mimika', 'Yuzida turli kulgili va g\'alati qiyofalar ko\'rsatayotgan masxaraboz'),
    ('3', '1', '4'): ('Mikroskop', 'Laboratoriyada mayda hujayralarni ko\'rsatadigan optik mikroskop'),
    ('3', '1', '5'): ('Militsiya furgoni', 'Ko\'k-qizil mayoqchasi yoniq turgan politsiya mashinasi'),
    ('3', '1', '6'): ('Mikrofon', 'Sahnada stendga o\'rnatilgan kumushrang yaltiroq professional mikrofon'),
    ('3', '1', '7'): ('Mitti sichqoncha', 'Pishloq kemirayotgan mayda chaqqon kulrang sichqoncha'),
    ('3', '1', '8'): ('Meva savati', 'Ichi shaftoli, uzum va anorlar bilan to\'lgan to\'qima savat'),
    ('3', '1', '9'): ('Miltiq', 'Ovchining yelkasiga osilgan uzun qo\'shstvolli ov miltig\'i'),

    ('3', '2', '0'): ('Muz tog\'i (Aysberg)', 'Okean o\'rtasida suzib yurgan moviy yaltiroq ulkan aysberg'),
    ('3', '2', '1'): ('Mutaxassis shlemi', 'Oq muhandislik kaskasi va qo\'lida chizmalar ushlagan kishi'),
    ('3', '2', '2'): ('Munchoq', 'Bo\'yinga taqiladigan rang-barang yaltiroq toshli marjon'),
    ('3', '2', '3'): ('Mumiya', 'Misr ehromidagi oq matolar bilan o\'ralgan qadimiy fir\'avn mumiyasi'),
    ('3', '2', '4'): ('Murabbo', 'Shisha bankadagi quyuq qizil olcha va gilos murabbosi'),
    ('3', '2', '5'): ('Musht (Boks qo\'lqopi)', 'Qizil charm boks qo\'lqopi kiyilgan kuchli baquvvat musht'),
    ('3', '2', '6'): ('Muborak Ka\'ba', 'Ustiga qora zarhal yopinchiq yopilgan muqaddas Ka\'ba toshi'),
    ('3', '2', '7'): ('Mushuk', 'Yashil ko\'zlari porlab turgan yumshoq oppoq xonaki mushuk'),
    ('3', '2', '8'): ('Muzlatgich', 'Oshxonadagi ikki eshikli, ichida muz va yeguliklar bor muzlatgich'),
    ('3', '2', '9'): ('Mug\'ombir tulki', 'Uchi oq dumini likillatib qor ustida yurgan ayyor qizil tulki'),

    ('3', '3', '0'): ('Mezon tarozisi', 'Ikkita pallasi tenglashgan oltin rangli adolat tarozisi'),
    ('3', '3', '1'): ('Medal', 'Lentasiga osilgan yaltiroq oltin chempionlik medali'),
    ('3', '3', '2'): ('Menyu kitobi', 'Restorandagi charm muqovali taomlar ro\'yxati kitobi'),
    ('3', '3', '3'): ('Membrana', 'Mikrofon ichidagi tovush tebranishini sezuvchi yupqa plastinka'),
    ('3', '3', '4'): ('Merkuriy', 'Quyoshga eng yaqin turgan kraterlarga to\'la kulrang sayyora'),
    ('3', '3', '5'): ('Mash’ala (Olov)', 'Qo\'lda ushlab yuriladigan yog\'och uchida qarsillab yonayotgan mash\'ala'),
    ('3', '3', '6'): ('Mebel', 'Yumshoq yashil baxmal qoplangan qimmatbaho kreslo'),
    ('3', '3', '7'): ('Mexanik soat', 'Tishli g\'ildirakchalari ko\'rinib turgan shaffof cho\'ntak soati'),
    ('3', '3', '8'): ('Meva sharbati', 'Muz solingan baland stakandagi apelsin sharbati'),
    ('3', '3', '9'): ('Meteorit', 'Osmondan olovli quyruq chiqarib yerga qulayotgan qora fazo toshi'),

    ('3', '4', '0'): ('Mozaika', 'Rangli mayda koshinlardan terilgan devordagi naqshinkor mozaika'),
    ('3', '4', '1'): ('Mototsikl', 'Katta tezlikda ketayotgan shovqinli sport mototsikli'),
    ('3', '4', '2'): ('Monokl', 'Ko\'zga taqiladigan zanjirli dumaloq bittalik ko\'zoynak shishasi'),
    ('3', '4', '3'): ('Momakaymoq', 'Shamol esganda oq parpatovalari havoda uchadigan momaqaymoq'),
    ('3', '4', '4'): ('Marmar ustun', 'Qadimiy saroy binosini ko\'tarib turgan oq marmar ustun'),
    ('3', '4', '5'): ('Molxona', 'Saman quruq xashak yeb turgan qora-ola sigirlar og\'ili'),
    ('3', '4', '6'): ('Mobil telefon', 'Yaltiroq qora ekranga ega zamonaviy sensorli telefon'),
    ('3', '4', '7'): ('Moshina (Avtomobil)', 'Qizil sport avtomobili yaltirab turgan g\'ildiraklari bilan'),
    ('3', '4', '8'): ('Molbert', 'Rassomning ustiga kanva qo\'yilgan uch oyoqli yog\'och molberti'),
    ('3', '4', '9'): ('Mog\'orlagan pishloq', 'Ko\'kimtir xushbo\'y dor-blyu fransuz pishlog\'i bo\'lagi'),

    ('3', '5', '0'): ('Masjid', 'Baland minorali va moviy gumbazli ulug\'vor oppoq masjid'),
    ('3', '5', '1'): ('Matbuot (Gazeta)', 'Yangiliklar yozilgan yangi chiqqan katta gazeta sahifasi'),
    ('3', '5', '2'): ('Mashina kaliti', 'Signallari bor zamonaviy qora pultli avtomobil kaliti'),
    ('3', '5', '3'): ('Maymun', 'Daraxt shoxida banan yeb o\'tirgan chaqqon qo\'ng\'ir maymun'),
    ('3', '5', '4'): ('Mashq daftari', 'Katakli varoqlari bor qalin ko\'k muqovali o\'quvchi daftari'),
    ('3', '5', '5'): ('Mash’ala', 'Qo\'lda baland ko\'tarilgan lovullab yonayotgan olov'),
    ('3', '5', '6'): ('Mastik moyi', 'Rassomlar bo\'yoq aralashtiradigan metall naychadagi moy'),
    ('3', '5', '7'): ('Maktab doskasi', 'Ustiga oq bo\'r bilan formulalar yozilgan yashil katta doska'),
    ('3', '5', '8'): ('Mayoq minorasi', 'Dengiz uzra yorug\' nur taratuvchi toshli baland minora'),
    ('3', '5', '9'): ('Mayonez', 'Salat ustiga quyilayotgan oppoq quyuq sous'),

    ('3', '6', '0'): ('Mizrob', 'Dutor torlarini chertadigan suyakdan yasalgan ingichka mizrob'),
    ('3', '6', '1'): ('Mitti gnom', 'Qizil qalpoqchasi va oppoq soqoli bor ertak qahramoni gnom'),
    ('3', '6', '2'): ('Mineral suv', 'Muzdek gazlangan shaffof shisha idishdagi mineral suv'),
    ('3', '6', '3'): ('Mimoza guli', 'Mayda sariq sharchalardan iborat bahoriy xushbo\'y gul'),
    ('3', '6', '4'): ('Mirzo Ulug\'bek kvadranti', 'Samarqand rasadxonasidagi ulkan marmar sekstant asbobi'),
    ('3', '6', '5'): ('Militsioner hushtagi', 'Zanjiriga osilgan kumushrang jarangdor metall hushtak'),
    ('3', '6', '6'): ('Mingoyoq', 'Tuproqda o\'rmalab ketayotgan ko\'p sonli oyoqli hasharot'),
    ('3', '6', '7'): ('Mikrochip', 'Yashil plata ustidagi tilla oyoqchalari bor qora kichik mikroprotsessor'),
    ('3', '6', '8'): ('Meva quritgich', 'Ichiga olma va o\'rik quritish uchun terilgan elektr pech'),
    ('3', '6', '9'): ('Miltiq patroni', 'Sariq jez gilzali, o\'qli to\'pponcha yoki miltiq o\'qi'),

    ('3', '7', '0'): ('Muz parchasi', 'Qo\'lda ushlaganda erib tomchilayotgan shaffof sovuq muz bo\'lagi'),
    ('3', '7', '1'): ('Muqova', 'Zarhal harflar bilan yozilgan qalin charm kitob muqovasi'),
    ('3', '7', '2'): ('Mushukcha', 'Yumshoq junli, sut ichayotgan jajji xonaki mushukcha'),
    ('3', '7', '3'): ('Musiqa kaliti', 'Notali qog\'ozning boshidagi chiroyli jingalak skripka kaliti'),
    ('3', '7', '4'): ('Murchdon', 'Ustidan maydalab qora murch sepiladigan yog\'och murchdon'),
    ('3', '7', '5'): ('Mushtari (Yupiter)', 'Sirtida ulkan qizil dog\'i bor gaz giganti Yupiter'),
    ('3', '7', '6'): ('Muhr', 'Hujjat ustiga binafsharang siyoh bilan bosilgan rasmiy dumaloq muhr'),
    ('3', '7', '7'): ('Muxomor zamburug\'i', 'Ustida oq nuqtalari bor zaharli qizil shlyapali qo\'ziqorin'),
    ('3', '7', '8'): ('Musobaqa kubogi', 'Ikki yonida tutqichi bor oltin rangli g\'oliblik kubogi'),
    ('3', '7', '9'): ('Muzqaymoq shoxi', 'Ustiga muzqaymoq koptokchalari qo\'yilgan vafli konusi'),

    ('3', '8', '0'): ('Meva sharbati', 'Muz va yalpiz barglari solingan ko\'krak qafas stakani'),
    ('3', '8', '1'): ('Metr o\'lchagich', 'Ustida santimetrlari yozilgan cho\'ziladigan po\'lat ruletka'),
    ('3', '8', '2'): ('Menejer daftarchasi', 'Qora charmli, sahifalariga reja yozilgan qalin bloknot'),
    ('3', '8', '3'): ('Meduza', 'Dengiz tubida shaffof gumbazi va paypaslagichlari bilan suzuvchi meduza'),
    ('3', '8', '4'): ('Merkuriy tangasi', 'Qadimiy Rim xudosi Merkuriy tasvirlangan qadimiy tanga'),
    ('3', '8', '5'): ('Miltillovchi chiroq', 'Rojdestvo archasiga o\'ralgan rang-barang yonib-o\'chuvchi girlyanda'),
    ('3', '8', '6'): ('Metall pul sandig\'i', 'Kodi va qulfi bor mustahkam po\'lat seyf qutisi'),
    ('3', '8', '7'): ('Meksika shapkasi (Sombrero)', 'Keng qirrali, naqshlar tikilgan ulkan meksikacha shapka'),
    ('3', '8', '8'): ('Mehmonxona qo\'ng\'irog\'i', 'Reseption stolida bosganda jaranglaydigan yaltiroq mis qo\'ng\'iroqcha'),
    ('3', '8', '9'): ('Meva qirqgich', 'Olmani teng sakkiz bo\'lakka bo\'lib beruvchi dumaloq po\'lat pichoq'),

    ('3', '9', '0'): ('Moskva kremli', 'Qizil g\'ishtli minora ustidagi yaltiroq qizil yoqut yulduz'),
    ('3', '9', '1'): ('Motor', 'Tsilindrlari va porshenlari ishlayotgan qora baquvvat avtomobil dvigateli'),
    ('3', '9', '2'): ('Mona Liza portreti', 'Oltin hoshiyali ramkadagi mashhur sirligina tabassumli ayol surati'),
    ('3', '9', '3'): ('Mol go\'shti', 'Yog\'och doska ustida kesilgan yangi qizil go\'sht bo\'lagi'),
    ('3', '9', '4'): ('Moybo\'yoq qutisi', 'Rassomning ichida rang-barang bo\'yoq tyubiklari terilgan yog\'och qutisi'),
    ('3', '9', '5'): ('Monoray poezdi', 'Bitta temir rels ustida havoda harakatlanayotgan tezyurar poyezd'),
    ('3', '9', '6'): ('Momaqaldiroq buluti', 'Ichidan chaqmoq chaqib turgan qop-qora og\'ir yomg\'ir buluti'),
    ('3', '9', '7'): ('Motosikl dubulg\'asi', 'Yaltiroq qora oynali, boshni himoya qiluvchi xavfsizlik kaskasi'),
    ('3', '9', '8'): ('Moda jurnali', 'Yaltiroq muqovasida model surati bor qalin rangli jurnal'),
    ('3', '9', '9'): ('Mo\'yqalam', 'Uchiga qizil akvarel bo\'yog\'i surtilgan nozik rassom mo\'yqalami')
}

# Systematic lexicon generator for remaining 400-999 blocks:
# Consonant representations:
# 4: R / Ch
# 5: L / Sh
# 6: B / P
# 7: K / Q
# 8: F / V
# 9: G / Y

root_nouns = {
    # 4xx (R / Ch)
    ('4', '0'): { '0': ('Rasta', 'Bozordagi sabzavotlar terilgan uzun yog\'och rasta'),
                  '1': ('Raketa', 'Osmonga qizil olov purkab ko\'tarilayotgan ulkan oq fazo raketasi'),
                  '2': ('Randa', 'Yog\'och tarashlaydigan temir tig\'li duradgor randasi'),
                  '3': ('Ramka', 'Surat solingan tilla naqshli yog\'och devor ramkasi'),
                  '4': ('Raqamlar jadvali', 'Ustiga 1 dan 100 gacha raqamlar yozilgan qalin jadval'),
                  '5': ('Charli Chaplin', 'Qora shlyapa, hassacha va mo\'ylovli Charli Chaplin'),
                  '6': ('Rabarb (Ravoch)', 'Tog\'dan terilgan qizg\'ish sersuv nordon ravoch poyasi'),
                  '7': ('Raqqosa', 'Zar do\'ppisi va ipak ko\'ylagi bilan raqsga tushayotgan qiz'),
                  '8': ('Ravon yo\'l', 'O\'rtasida oq chizig\'i bor yangi yotqizilgan qora tekis asfalt yo\'l'),
                  '9': ('Ranglar palitrasi', 'Rassomning qo\'lidagi o\'rtasi teshik rang-barang bo\'yoqli taxtacha') },
    ('4', '1'): { '0': ('Rizo uzugi', 'Barmoqqa taqilgan qizil yoqut ko\'zli kumush uzuk'),
                  '1': ('Ritsar sovuti', 'Yaltiroq po\'lat sovut kiygan, qo\'lida uzun nayzali ritsar'),
                  '2': ('Rind (Dono qariya)', 'Oppoq soqolli, qo\'lida tasbeh ushlagan donishmand chol'),
                  '3': ('Rim kolizeyi', 'Qadimiy tosh arklari va maydoni bor ulkan rim amfiteatri'),
                  '4': ('Rul (Gildirak)', 'Qora charm bilan qoplangan avtomobil boshqaruv ruli'),
                  '5': ('Riksha aravasi', 'Orqasida ikki kishilik o\'rindig\'i bor sharqona odam tortuvchi arava'),
                  '6': ('Rivojlanish diagrammasi', 'Doskada yuqoriga qarab o\'sayotgan yashil grafik strelkasi'),
                  '7': ('Rikota pishlog\'i', 'Oq likopchaga solingan yumshoq nozik italyan pishlog\'i'),
                  '8': ('Rivoch poyasi', 'Yangi uzilgan qizg\'ish sersuv xushbo\'y ravoch'),
                  '9': ('Ring (Boks maydoni)', 'To\'rtta burchagida arqon tortilgan boks ringi') },
    ('4', '2'): { '0': ('Ruxsatnoma (Propusk)', 'Plastik qoplamali, rasmi va muhri bor elektron kartochka'),
                  '1': ('Rupor', 'Qo\'lda ushlab baland ovozda qichqiradigan qizil-oq megafon rupor'),
                  '2': ('Runda (Nayza)', 'Temir uchli qadimiy jangchi nayzasi'),
                  '3': ('Ruxsat muhri', 'Qizil siyohli yumaloq muhr bosilgan rasmiy hujjat'),
                  '4': ('Rulda (Kema shturvali)', 'Yog\'och tutqichlari bor yaltiroq qadimiy kema shturvali'),
                  '5': ('Rulo gilam', 'Do\'konda naycha qilib o\'rab qo\'yilgan qalin naqshli qizil gilam'),
                  '6': ('Rubob', 'Uchburchak kosali, torlari jaranglaydigan milliy o\'zbek rubobi'),
                  '7': ('Rukzak', 'Sayohat uchun orqaga taqiladigan qalin ko\'p cho\'ntakli ryukzak'),
                  '8': ('Ruletka o\'lchagich', 'Sariq korpusli, 5 metrli temir lenta o\'lchagich'),
                  '9': ('Ruda (Temir toshi)', 'Yaltiroq metall tomirlari bor og\'ir qora tog\' jinsi') },
    ('4', '3'): { '0': ('Rezinka', 'Qog\'ozdagi qalam chiziqlarini o\'chiradigan ikki rangli o\'chirg\'ich'),
                  '1': ('Retsept', 'Shifokor qo\'li bilan yozilgan dorilar ro\'yxati qog\'ozi'),
                  '2': ('Rentgen surati', 'Qora plyonkada oq suyaklar ko\'rinib turgan tibbiy surat'),
                  '3': ('Remen (Kamar)', 'Yaltiroq to\'qasi bor qalin qora charm shim kamari'),
                  '4': ('Revolver', 'Aylanuvchi barabanida 6 ta o\'qi bor metall to\'pponcha'),
                  '5': ('Rels', 'Poyezd g\'ildiraklari ostidagi ikki qator yaltiroq temir yo\'l relsi'),
                  '6': ('Reja taqvimi', 'Devorga osilgan har kuni yozuvlar bilan to\'ldirilgan yillik kalendar'),
                  '7': ('Reklama banneri', 'Ko\'chada baland ustunga o\'rnatilgan yorqin chiroqli ulkan bilbord'),
                  '8': ('Reys samolyoti', 'Uchish yo\'lagidan osmonga ko\'tarilayotgan oq yo\'lovchi layneri'),
                  '9': ('Regbi to\'pi', 'Charmdan tikilgan tuxumsimon cho\'ziq regbi to\'pi') },
    ('4', '4'): { '0': ('Rozetka', 'Devordagi ikkita teshikli oq elektr vilkasi uyasi'),
                  '1': ('Robot', 'Ko\'zlari ko\'k chiroqli, metall bo\'g\'inlari qirsillovchi temir robot'),
                  '2': ('Romb', 'Geometrik to\'rtburchak qirrali yaltiroq shakl'),
                  '3': ('Romashka guli', 'O\'rtasi sariq, atrofida oq yaproqlari bor dala guli'),
                  '4': ('Rolik (Konki)', 'Tagida to\'rtta g\'ildirakchasi bor tezuchar rolik'),
                  '5': ('Rolikli bo\'yoq cho\'tkasi', 'Devorga sariq bo\'yoq surkayotgan yumshoq g\'altak'),
                  '6': ('Rojdestvo archasi', 'Ustida yulduzcha va o\'yinchoqlar porlagan yashil yovvoyi archa'),
                  '7': ('Ro\'molcha', 'Cho\'ntakdan chiqarilgan chetlari kashtalangan oq ipak ro\'molcha'),
                  '8': ('Rofl (Kulgi niqobi)', 'Og\'zi katta ochilib kulib turgan teatr niqobi'),
                  '9': ('Rog\'un GES to\'g\'oni', 'Tog\'lar orasidagi ulkan beton suv to\'g\'oni va sharshara') },

    ('4', '5'): { '0': ('Chayla', 'Qamish va novdalardan to\'qilgan polizdagi soyabon chayla'),
                  '1': ('Choynak', 'Ichi issiq ko\'k choyga to\'la naqshli paxta gulli chinni choynak'),
                  '2': ('Chanob (Barg)', 'Kuzda sarg\'ayib daraxtdan tushgan katta chinor bargi'),
                  '3': ('Chamadon', 'G\'ildiraklari va tortiladigan tutqichi bor qizil sayohat chamadoni'),
                  '4': ('Charxpalak', 'Daryo suvida aylanib suv chiqarib beruvchi ulkan yog\'och g\'ildirak'),
                  '5': ('Rakushka', 'Sohildagi dengiz to\'lqinlari yuvib turgan marvaridli chig\'anoq'),
                  '6': ('Chaqmoq', 'Qorong\'u osmonda qattiq gumburlab chaqnagan yorqin zangori chaqmoq'),
                  '7': ('Chaqaloq', 'Oq yo\'rgakda yotgan, og\'zida so\'rg\'ichi bor shirin chaqaloq'),
                  '8': ('Chavandoz', 'Chopqir ot ustida egarda o\'tirgan qamchili chavandoz yigit'),
                  '9': ('Changyutgich', 'Gilamdagi changlarni tortib olayotgan shlangli elektr changyutgich') },
    ('4', '6'): { '0': ('Chiroq', 'Shiftga osilgan oq yorug\'lik taratuvchi shaffof LED lampochka'),
                  '1': ('Chipta / Chips', 'Qizil qarsildoq kartoshka chipsi qutisi'),
                  '2': ('Chinor daraxti', 'Soyasi butun hovlini qoplagan baquvvat ulkan qadimiy chinor'),
                  '3': ('Chizma qalami', 'Qog\'ozda aniq chiziqlar chizadigan o\'tkir grafit qalam'),
                  '4': ('Chirk (Sirk chodiri)', 'Ustida bayroqchalar hilpiragan qizil-oq gumbazli sirk chodiri'),
                  '5': ('Chigirtka', 'Maysa ustida uzun orqa oyoqlari bilan sakrayotgan yashil hasharot'),
                  '6': ('Chivin', 'Havoda g\'o\'ng\'illab uchib yurgan uzun xartumli hasharot'),
                  '7': ('Chipta kassasi', 'Poyezd bekatidagi oynaviy chipta sotish oynasi'),
                  '8': ('Chivin to\'ri', 'Derazaga qo\'yilgan mayda katakli oq himoya to\'ri'),
                  '9': ('Chiziq o\'lchagich', 'Santimetrlari bor shaffof plastik chizg\'ich') },
    ('4', '7'): { '0': ('Chumoli', 'Og\'zida bug\'doy donini ko\'tarib ketayotgan mehnatkash qora chumoli'),
                  '1': ('Chumchuq', 'Daraxt shoxida chug\'urlab don cho\'qiyotgan jajji kulrang chumchuq'),
                  '2': ('Cho\'mich', 'Qozondan sho\'rva suzadigan uzun yog\'och sopli metall cho\'mich'),
                  '3': ('Chukotka kiyigi', 'Qor ustida shoxlari tarvaqaylagan oq shimol kiyigi'),
                  '4': ('Churuk olma', 'Bir chekkasini qurt yegan sarg\'ish olma'),
                  '5': ('Cho\'loq hassasi', 'Yerga tiralib yuriladigan egri tutqichli yog\'och hassa'),
                  '6': ('Chuvalchang', 'Yomg\'irdan keyin nam tuproqdan chiqqan qizg\'ish chuvalchang'),
                  '7': ('Cho\'qqi', 'Qor bilan qoplangan osmonga bo\'y cho\'zgan o\'tkir qoyali tog\' cho\'qqisi'),
                  '8': ('Cho\'chqa', 'Loyda aylanib yotgan dumaloq tumshuqli pushti cho\'chqacha'),
                  '9': ('Chug\'urchiq', 'Bahorda uchib kelgan qora yaltiroq pati bor xonish qiluvchi qush') },
    ('4', '8'): { '0': ('Chexol (G\'ilof)', 'Smartfonga kiygizilgan zarbaga chidamli qora silikon g\'ilof'),
                  '1': ('Chemodan qulfi', 'Uch xonali raqamli kodi bor po\'lat qulfcha'),
                  '2': ('Chegara ustuni', 'Qizil va yashil yo\'llari bor davlat chegarasi ustuni'),
                  '3': ('Chempion kamari', 'Oltin blyaxasi bor og\'ir vazn toifasi chempionlik kamari'),
                  '4': ('Cherkov qo\'ng\'irog\'i', 'Baland minorada osilgan ulkan og\'ir jez qo\'ng\'iroq'),
                  '5': ('Chashka', 'Issiq qahvadan bug\' chiqib turgan naqshli chinni chashka'),
                  '6': ('Chechak guli', 'Bahorda qor tagidan unib chiqqan mayda binafsharang boychechak'),
                  '7': ('Chek daftarchasi', 'Bank cheklari yozib beriladigan qalin varoqli kitobcha'),
                  '8': ('Chegara iti', 'Bo\'ynida qarag\'ayi bor o\'rgatilgan olapar nemis ovcharkasi'),
                  '9': ('Chegara minorasi', 'Projektorlari kechasi nur sochib turgan kuzatuv minorasi') },
    ('4', '9'): { '0': ('Chorva podasi', 'Yashil yaylovda o\'tlab yurgan qo\'y va qoramollar podasi'),
                  '1': ('Cho\'tka', 'Yog\'och dastali, qattiq qillari bor kiyim tozalash cho\'tkasi'),
                  '2': ('Cho\'pon tayog\'i', 'Uchi ilmoq qilib bukilgan uzun silliq o\'rik tayog\'i'),
                  '3': ('Cho\'kmoq (Zangori kema)', 'Suv tubiga cho\'kib yotgan qadimiy yog\'och kema'),
                  '4': ('Chorrahadagi svetofor', 'Qizil, sariq va yashil chiroqlari yonib turgan svetofor'),
                  '5': ('Choyshab', 'Karavotga tekis qilib yozilgan xushbo\'y oppoq atlas choyshab'),
                  '6': ('Cho\'p suyak', 'Kuchukcha og\'zida tishlab olgan oq qattiq suyak'),
                  '7': ('Cho\'qmor', 'Qadimiy bahodirning tikanli temir shari bor og\'ir quroli'),
                  '8': ('Cho\'g\' (Olov)', 'Mangalda qizarib yonib turgan issiq ko\'mir cho\'g\'i'),
                  '9': ('Choynak qopqog\'i', 'Tepasida dumaloq ushlagichi bor chinni qopqoqcha') }
}

print("Lexicon tables initialized.")
