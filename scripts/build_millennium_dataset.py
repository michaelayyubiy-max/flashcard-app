#!/usr/bin/env python3
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

docx_files = [
    '/Users/macbook/Downloads/millenium/MILLENNIUM_000_049.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_050_099.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_100_199.docx',
    '/Users/macbook/Downloads/millenium/MILLENNIUM_200_299.docx'
]

dataset = {}
for p in docx_files:
    items = dump_docx_table(p)
    dataset.update(items)

print(f"Loaded {len(dataset)} items from user's docx files (000–299).")

# Curated base vocabulary for CVC combinations
# Helper function to get default formula
def make_formula(num_str):
    d1, d2, d3 = num_str[0], num_str[1], num_str[2]
    c1 = c_map[d1][0]
    v = v_map[d2]
    c2 = c_map[d3][0]
    return f"{d1}({c1}) + {d2}({v}) + {d3}({c2})"

print("Dataset builder ready.")
