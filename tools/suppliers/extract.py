"""The supplier charts on the Wiki pages (Matthews Paint, Pantone, Sherwin-Williams, 3M and Eastern Metal Supply), read
out of the suppliers' own documents into src/suppliers/*.json, which src/components/SupplierChart.astro shows as tables.

    python tools/suppliers/extract.py <folder holding the documents>

The documents are the ones linked at the foot of each Wiki page (/sources/suppliers/ on the hub; they live in
alexandria_office's public/sources/suppliers/, not here). Needs poppler (pdftotext, pdftoppm), Pillow and numpy. Run it
only when a chart is replaced: the JSON is committed.

Every swatch is the chart's own colour as its PDF draws it, read from the page, so it is an on-screen approximation
and nothing more. Matthews' chart is a scan with no text in it, so its codes, names and LRVs were typed out by hand in
matthews.json's source list below and only its swatches are read from the page.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "src" / "suppliers"

FILES = {
    "matthews": "matthews-paint-color-chart.pdf",
    "sw": "sherwin-williams-colorsnap-swatches.pdf",
    "bridge": "pantone-color-bridge-cmyk-pc.pdf",
    "opaque": "3m-opaque-graphic-films-poster.pdf",
    "translucent": "3m-translucent-films-3630-3730-poster.pdf",
    "ems": "eastern-metal-supply-catalog.txt",
}


def render(pdf, dpi, page=None):
    """The pages of a PDF as RGB arrays."""
    with tempfile.TemporaryDirectory() as tmp:
        cmd = ["pdftoppm", "-r", str(dpi), "-png"]
        if page:
            cmd += ["-f", str(page), "-l", str(page)]
        subprocess.run(cmd + [str(pdf), tmp + "/p"], check=True, stderr=subprocess.DEVNULL)
        return [np.asarray(Image.open(f).convert("RGB")) for f in sorted(Path(tmp).glob("*.png"))]


def swatch(img, x0, y0, x1, y1):
    """The median colour of a rectangle (pixels) as a hex code."""
    patch = img[int(y0):int(y1), int(x0):int(x1)].reshape(-1, 3)
    r, g, b = (int(v) for v in np.median(patch, axis=0))
    return "#%02X%02X%02X" % (r, g, b)


def blocks(pdf, kind="block"):
    """The text of a PDF with where it sits, per page: [(xMin, yMin, xMax, yMax, [lines])]."""
    html = subprocess.run(["pdftotext", "-bbox-layout", str(pdf), "-"], check=True, capture_output=True, text=True).stdout
    html = html.replace("&amp;", "&").replace("&#39;", "'").replace("&apos;", "'")
    pages = []
    for page in re.findall(r"<page[^>]*>(.*?)</page>", html, re.S):
        found = []
        for x0, y0, x1, y1, body in re.findall(
            r'<%s xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</%s>' % (kind, kind), page, re.S
        ):
            if kind == "block":
                lines = [" ".join(re.findall(r">([^<]+)</word>", line)) for line in re.findall(r"<line[^>]*>(.*?)</line>", body, re.S)]
            else:
                lines = [" ".join(re.findall(r">([^<]+)</word>", body))]
            found.append((float(x0), float(y0), float(x1), float(y1), lines))
        pages.append(found)
    return pages


# ---------------------------------------------------------------------------------------------------------------------
# Matthews Paint: typed from the chart, page by page and column by column (code, name, LRV).

MATTHEWS = {
    "Standard Colors": [
        # page 1
        ("MP24846", "Rally Red", 10.1), ("MP23966", "Crimson Red", 14.9), ("MP24069", "Fire Red", 17.2),
        ("MP26434", "Tangerine", 20.8), ("MP58765", "Persimmon", 15), ("MP29732", "Napa Merlot", 9.6),
        ("MP25248", "Rose Magenta", 10.9), ("MP26452", "Cerise Lipstick", 16.9), ("MP29653", "Navel Orange", 32.7),
        ("MP29633", "Fiesta Orange", 33.1),
        ("MP23906", "Bright Orange", 28.1), ("MP28239", "Orange Flare", 24.6), ("MP56966", "Orange County", 22.9),
        ("MP58094", "Peach Blossom", 26.5), ("MP29496", "Apricot", 37.8), ("MP29214", "Coral", 31.3),
        ("MP25616", "Salmon", 44.6), ("MP10211", "Citrus Yellow", 62.9), ("MP29464", "Jonquil Yellow", 72.1),
        ("MP29545", "Citron Glace", 79.4),
        ("MP25026", "Chartreuse Yellow", 56.5), ("MP25890", "Yellow Petal", 64.5), ("MP55149", "Schoolbus Yellow", 39.3),
        ("MP28240", "Yellow Corn", 49.2), ("MP28153", "Mustard", 41.8), ("MP26406", "Pastel Orange", 49.6),
        ("MP25900", "Canterbury Cream", 77.5), ("MP24510", "Deep Green", 6.4), ("MP55690", "Forest Green", 6.9),
        ("MP24502", "Country Club Green", 17.5),
        # page 2
        ("MP25066", "Green Jewel", 21.4), ("MP58098", "Sea Green", 35.4), ("MP56060", "Prickly Pear", 8),
        ("MP25899", "Kryptonite Green", 21.7), ("MP26749", "Spring Green", 28.3), ("MP28434", "Granny Smith", 39),
        ("MP55396", "Moonlit Pond", 8.4), ("MP25771", "Bayou Blue", 15), ("MP24340", "Mardi Gras Teal", 27.8),
        ("MP29439", "Tropic Turquoise", 31.4),
        ("MP25837", "Stormy Blue", 6.8), ("MP23708", "North Sea Blue", 17.2), ("MP56851", "Blue Smoke", 24.1),
        ("MP20498", "Mediterranean Sky", 51.7), ("MP43348", "Lake George", 71), ("MP55697", "Bluest Blue", 6.8),
        ("MP25808", "Bicycle Blue", 10.6), ("MP28073", "American Blue", 13.9), ("MP24100", "Electrical Blue", 31.1),
        ("MP55795", "Bluetooth", 6.7),
        ("MP29320", "Marina Blue", 14), ("MP25956", "Royal Purple", 7.4), ("MP30493", "Scandinavian Blue", 9.6),
        ("MP25854", "Lily Morada", 22.8), ("MP25834", "Taco Bell Violet 2", 7.4), ("MP25542", "Amethyst Violet", 10.2),
        ("MP25502", "Very Violet", 18.7), ("MP25550", "Deep Purple", 7.8), ("MP25867", "Graceful Grape", 22.7),
        ("MP29705", "Grape Jello", 10.3),
        # page 3, the first column and the top of the second
        ("MP23446", "Country Red", 7.8), ("MP23647", "Fire Weed Red", 15.2), ("MP22823", "Savannah Clay", 29.6),
        ("MP10217", "Rich Brown", 5.8), ("MP25839", "Clay Basket Brown", 19.5), ("MP12257", "Cabot Trail", 28.5),
        ("MP25849", "Durango Grey", 24.6), ("MP55840", "Cool Gray", 47.2), ("MP25829", "Taos Sand Beige", 60.6),
        ("MP25833", "Bone White", 68.7),
        ("MP55685", "Snowflake", 78.7), ("MP25836", "Cicada Grey", 32.8), ("MP34412", "Smoke Screen", 47),
    ],
    "Metallic Selections": [
        # page 3, the rest of the second column and the third
        ("MP16771", "Champagne Grey Metallic", 43.9), ("MP33172", "Silver Surfer Metallic", 57),
        ("MP41279", "Pale Bronze Metallic", 30.9), ("MP28448", "Umbra Grey Metallic", 31.5),
        ("MP55753", "Sunrise Silver Metallic", 54.3), ("MP32195", "Staid Gray Metallic", 16.7),
        ("MP19757", "Burgundy Metallic", 9), ("MP19759", "Raspberry Metallic", 11.6), ("MP21843", "Old Orchid Metallic", 14.8),
        ("MP47128", "Rose Quartz Metallic", 44), ("MP27540", "Balsam Green Metallic", 10.5),
        ("MP30043", "Fern Green Metallic", 30.5), ("MP42868", "Moss Green Metallic", 42.4),
        ("MP50184", "Royal Blue Metallic", 5.4), ("MP24661", "Hapsburg Blue Metallic", 7.8),
        ("MP45612", "Baby Blue Metallic", 37.2),
    ],
    "Proseco Collection and Other Factory Mixed Colors": [
        # page 4; a note where the chart adds one
        ("48101SP", "Proseco Gold Standard", 61.2), ("48102SP", "Proseco Silver Rose", 58.8),
        ("48103SP", "Proseco Brass Alloy", 61.4), ("481042SP", "Proseco Polished Pewter", 40.8, "Printed as 481042SP on the chart."),
        ("48105SP", "Proseco Bronze Hint", 54.2), ("48107SP", "Proseco Golden Glow", 60), ("48108SP", "Proseco Blue Steel", 44.4),
        ("42212SP", "Scarlet Red", 11.6), ("42214SP", "Mexicali Red", 9.4),
        ("42215SP", "Burgundy Maroon", 6.4), ("42218SP", "Sundance Yellow", None), ("42259SP", "Federal Green", 12),
        ("42219SP", "Capri Blue", 7.3), ("SOA202SP", "Natural White", 89.3),
        ("6422SP", "Gloss Hi-Hide White", 91.7, "Shares its swatch with 6525SP / SVOC1304SP Satin Hi-Hide White, LRV 88.5 (starred on the chart)."),
        ("42204SP", "Gloss Black", 4.2), ("41335SP", "Anodic Black", 4.3, "Starred on the chart."),
        ("41306SP", "Signal Jet Black", 4.2, "Starred on the chart."),
        ("41342SP", "Brushed Aluminum", 68.2, "Starred on the chart."), ("46258SP", "Tucson Gold", 34.6), ("46253SP", "Copper", 25.5),
        ("41312SP", "Medium Bronze", 14.8), ("41313SP", "Dark Bronze", 10.1), ("41314SP", "Old Copper", 11.6),
        ("46400SP", "Brilliant Gold", 55.5, "Sprayed over MP28645 base color. Starred on the chart."),
        ("46401SP", "Aztec Gold", 39.7, "Sprayed over MP34132 base color. Starred on the chart."),
        ("46402SP", "Aztec Copper", 19.4, "Sprayed over MP32759 base color. Starred on the chart."),
    ],
}


def matthews(folder):
    pages = render(folder / FILES["matthews"], 110)
    # 3 columns by up to 10 rows a page: each swatch's centre, in pixels at 110 dpi, measured on the page
    cols = [224, 470, 716]
    def cell(page, col, row, top=155):
        x, y = cols[col], top + 31 + row * 89.55
        return swatch(pages[page], x - 70, y - 18, x + 70, y + 18)

    order = [(p, c, r) for p in (0, 1) for c in range(3) for r in range(10)]
    order += [(2, 0, r) for r in range(10)] + [(2, 1, r) for r in range(3)]
    metallic = [(2, 1, r) for r in range(4, 10)] + [(2, 2, r) for r in range(10)]
    proseco = [(3, c, r) for c in range(3) for r in range(9)]
    groups = []
    for (title, rows), cells in zip(MATTHEWS.items(), (order, metallic, proseco)):
        assert len(rows) == len(cells), (title, len(rows), len(cells))
        colors = []
        for row, (p, c, r) in zip(rows, cells):
            entry = {"code": row[0], "name": row[1], "hex": cell(p, c, r, 184 if p == 3 else 155)}
            if row[2] is not None:
                entry["lrv"] = row[2]
            if len(row) > 3:
                entry["note"] = row[3]
            colors.append(entry)
        groups.append({"title": title, "colors": colors})
    return {"groups": groups}


# ---------------------------------------------------------------------------------------------------------------------
# Sherwin-Williams: the ColorSnap swatch list is a table with text in it.

def sherwin(folder):
    text = subprocess.run(["pdftotext", "-layout", str(folder / FILES["sw"]), "-"], check=True, capture_output=True, text=True).stdout
    colors = []
    for line in text.splitlines():
        m = re.match(r"\s*(SW)\s?(\d{4})\s+(.+?)\s+(N/A|[\w-]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([0-9A-Fa-f]{6})\b", line)
        if not m:
            continue
        entry = {"code": "SW " + m[2], "name": m[3].strip(), "hex": "#" + m[8].upper()}
        if m[4] != "N/A":
            entry["locator"] = m[4]
        colors.append(entry)
    return {"groups": [{"title": "ColorSnap Colors", "colors": colors}]}


# ---------------------------------------------------------------------------------------------------------------------
# Pantone: the Color Bridge chart names each colour over its CMYK build, under its swatch.

def pantone(folder):
    pdf = folder / FILES["bridge"]
    dpi = 100
    colors, seen = [], set()
    for number, lines in enumerate(blocks(pdf, "line"), start=1):
        img = render(pdf, dpi, number)[0]
        names = [(x, y, re.search(r"PANTONE (.+?) PC\b", t[0])) for x, y, _, _, t in lines]
        names = [(x, y, m[1]) for x, y, m in names if m]
        builds = [(x, y, re.search(r"C:(\d+) M:(\d+) Y:(\d+) K:(\d+)", t[0])) for x, y, _, _, t in lines]
        builds = [(x, y, m) for x, y, m in builds if m]
        # the chart reads down each column
        for x, y, name in sorted(names, key=lambda n: (round(n[0] / 20), n[1])):
            under = [b for b in builds if abs(b[0] - x) < 6 and 0 < b[1] - y < 14]
            if not under or name in seen:
                continue
            seen.add(name)
            m = min(under, key=lambda b: b[1])[2]
            s = dpi / 72
            # the chart shortens some names to fit
            name = {"Pro. Yel.": "Process Yellow", "Pro. Mag.": "Process Magenta", "Pro. Cyan": "Process Cyan",
                    "Pro. Black": "Process Black", "Or. 021": "Orange 021", "Rub. Red": "Rubine Red",
                    "Rhod. Red": "Rhodamine Red", "Ref. Blue": "Reflex Blue", "Pro. Blue": "Process Blue"}.get(name, name)
            name = name.replace("Wm Gy", "Warm Gray").replace("Cl Gy", "Cool Gray")
            colors.append({
                "code": name,
                "hex": swatch(img, (x + 12) * s, (y - 36) * s, (x + 46) * s, (y - 10) * s),
                "cmyk": "%s / %s / %s / %s" % (m[1], m[2], m[3], m[4]),
            })
    return {"groups": [{"title": "Color Bridge, Coated", "colors": colors}]}


# ---------------------------------------------------------------------------------------------------------------------
# 3M: two posters, each colour's name and number set on or beside its swatch.

def label(lines):
    """A poster label's lines → (name and number, PANTONE match or None)."""
    at = next((i for i, line in enumerate(lines) if line.startswith("PANTONE")), len(lines))
    match = " ".join(lines[at:]).replace(" ®", "").strip() or None
    return " ".join(lines[:at]).strip(), match


def films(folder):
    groups = []
    # Opaque: the label is at the swatch's top left
    pdf = folder / FILES["opaque"]
    img = render(pdf, 72)[0]
    sets = {"7125, 7725 and 180mC": [], "Series 50": [], "7725SE Fluorescent": []}
    for x, y, _, _, lines in blocks(pdf)[0]:
        if not (470 < y < 1520 and x < 1640) or lines[0].startswith(("*", "Fluorescent")):
            continue
        text, match = label(lines)
        m = re.match(r"(.+?) (\d+)$", text)
        note = None
        if m:
            name, code = m[1], m[2]
        elif "only" in text:
            name, code = "White", "10"
            note = "180mC only." if "180mC" in text else "7125 and 7725 only."
        else:
            continue
        key = "7125, 7725 and 180mC" if x < 1110 else ("Series 50" if y < 1130 else "7725SE Fluorescent")
        entry = {"code": code, "name": name, "hex": swatch(img, x + 15, y + 42, x + 105, y + 72)}
        if match:
            entry["match"] = match
        if note:
            entry["note"] = note
        sets[key].append((round(x / 20), y, entry))
    for title, found in sets.items():
        groups.append({"title": title, "colors": [e for _, _, e in sorted(found, key=lambda f: (f[0], f[1]))]})

    # Translucent: the label is to the swatch's right
    pdf = folder / FILES["translucent"]
    img = render(pdf, 72)[0]
    sets = {"3730": [], "3630": []}
    for x, y, _, _, lines in blocks(pdf)[0]:
        text, match = label(lines)
        m = re.match(r"(.+?) (3[67]30)-(\w+)$", text)
        if not m:
            continue
        entry = {"code": "%s-%s" % (m[2], m[3]), "name": m[1], "hex": swatch(img, x - 95, y - 10, x - 35, y + 30)}
        if match:
            entry["match"] = match
        sets[m[2]].append((round(x / 20), y, entry))
    for series, title in (("3630", "Scotchcal Translucent 3630"), ("3730", "Envision Translucent 3730")):
        groups.append({"title": title, "colors": [e for _, _, e in sorted(sets[series], key=lambda f: (f[0], f[1]))]})
    return {"groups": groups}


# ---------------------------------------------------------------------------------------------------------------------
# Eastern Metal Supply: the catalog came as its text, so the Sheet & Plate pages are read by line number (first, last).

EMS_SHEET = [
    ("5052-H32 Mill Finish", [(2906, 2983)]),
    ("3003-H14 Mill Finish", [(2986, 3010), (3013, 3030)]),
    ("6061-T6 Mill Finish", [(3078, 3089)]),
    ("5005 Anodized, PVC One Side", [(3094, 3108)]),
    ("5052-H38 Alodine Pretreated", [(3231, 3248)]),
    ("3003-H22/24 Tread Brite", [(3042, 3069)]),
]
EMS_PAINTED = (3118, 3175)
EMS_ACM = (3177, 3199)
EMS_COIL = (3203, 3216)


def eastern(folder):
    lines = (folder / FILES["ems"]).read_text(encoding="utf-8").splitlines()
    take = lambda first, last: [line.strip() for line in lines[first - 1:last]]
    row = re.compile(
        r"(\S+)( NC| MILL ORDER)?(?: (Clear|Bronze|Extra Dark))? (\.\d+ x [\d.]+ x ?[\d.]+(?: \([^)]*\))?) ([\d.]+)(?: - NC)?(?: [\d.]+)?$"
    )

    def sheet(spans, color=None):
        rows = []
        for first, last in spans:
            for line in take(first, last):
                m = row.match(line)
                if not m:
                    continue
                size = m[4].replace("x144", "x 144")
                entry = {"code": m[1] + (" NC" if m[2] == " NC" else ""), "size": size, "weight": m[5]}
                if m[3]:
                    entry["finish"] = m[3]
                if color:
                    entry["finish"] = color
                if m[2] == " MILL ORDER":
                    entry["note"] = "Mill order."
                rows.append(entry)
        return rows

    groups = [{"title": title, "rows": sheet(spans)} for title, spans in EMS_SHEET]

    painted, color = [], None
    for number in range(EMS_PAINTED[0], EMS_PAINTED[1] + 1):
        line = lines[number - 1].strip()
        if re.fullmatch(r"[A-Za-z ]+/[A-Za-z ]+", line):
            color = line
        else:
            painted += sheet([(number, number)], color)
    seen = set()
    painted = [r for r in painted if not (r["code"] in seen or seen.add(r["code"]))]
    groups.append({"title": "Painted Sheet, with PVC", "rows": painted})

    acm, product = [], None
    for line in take(*EMS_ACM):
        m = re.match(r"(EMS ACM|PolyMetal|ValuMetal) - (\.\d+) Skin Thickness; (.+?)(?: - NEW!)?$", line)
        if m:
            product = (m[1], m[2] + '" skin, ' + m[3].lower().replace("55°", "55°"))
            continue
        m = re.match(r"(50-\S+) (\d+mm x .+?) ((?:White|Black)\S*(?: One Side)?)$", line)
        if m and product:
            acm.append({"code": m[1], "product": product[0], "size": m[2].replace("’", "'"), "finish": m[3], "note": product[1]})
    groups.append({"title": "ACM Panels", "rows": acm})

    coil, color = [], None
    for line in take(*EMS_COIL):
        m = re.match(r"(49-\S+) (\.\d+ x .+)$", line)
        if m:
            coil.append({"code": m[1], "finish": color, "size": m[2].replace("'", "'")})
        elif line.isupper() or line.startswith("MILL FINISH"):
            color = line.title().replace("(No Pvc Mask)", "(no PVC mask)")
    groups.append({"title": "Channel Letter Coil", "rows": coil})
    return {"groups": groups}


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for name, make in (("matthews", matthews), ("sherwin-williams", sherwin), ("pantone", pantone), ("3m", films), ("eastern-metal-supply", eastern)):
        data = make(folder)
        (OUT / (name + ".json")).write_text(json.dumps(data, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8")
        print(name, {g["title"]: len(g.get("colors") or g["rows"]) for g in data["groups"]})
