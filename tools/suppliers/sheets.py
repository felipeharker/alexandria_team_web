"""Prints the supplier sheets: one PDF per supplier in the Alexandria Design Lab standard, for the Wiki's supplier pages.

    python tools/suppliers/sheets.py            # every supplier
    python tools/suppliers/sheets.py pantone    # one or more

Each sheet is the supplier's page as a document to print or send: the same words and small tables
(src/suppliers/sheets.json) and the same charts (src/suppliers/<supplier>.json, from extract.py), set one way for every
supplier. The script writes a page of HTML and headless Chrome prints it, to public/wiki/suppliers/<supplier>.pdf.
Rerun it after either file changes. Set CHROME to the browser if it isn't found.
"""
import datetime
import html
import json
import os
import re
import subprocess
import sys
import tempfile

HUB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(HUB, "src", "suppliers")
OUT = os.path.join(HUB, "public", "wiki", "suppliers")
FONTS = os.path.join(HUB, "node_modules")
BROWSERS = [os.environ.get("CHROME", ""),
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/usr/bin/google-chrome", "/usr/bin/chromium", "/opt/pw-browsers/chromium"]

# The hub's light theme (src/styles/theme.css), in print.
STYLE = """
@font-face { font-family: Inter; font-weight: 100 900; src: url("%(inter)s") format("woff2"); }
@font-face { font-family: "IBM Plex Mono"; font-weight: 400; src: url("%(mono400)s") format("woff2"); }
@font-face { font-family: "IBM Plex Mono"; font-weight: 500; src: url("%(mono500)s") format("woff2"); }
@page {
	size: Letter;
	margin: 0.6in 0.6in 0.7in;
	@bottom-left { content: "Alexandria Design Lab  ·  Supplier Sheet %(sheet)s  ·  %(name)s"; }
	@bottom-right { content: "Page " counter(page) " of " counter(pages); }
}
@page {
	@bottom-left, @bottom-right { font: 500 7pt Inter, sans-serif; color: #5d6570; letter-spacing: 0.02em; }
}
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html { font: 400 8.5pt/1.4 Inter, sans-serif; color: #24292f; }
body { margin: 0; }
code, .mono { font-family: "IBM Plex Mono", monospace; font-size: 0.94em; color: #1b1f24; white-space: nowrap; }
.top { display: flex; align-items: center; gap: 8pt; padding-bottom: 9pt; border-bottom: 1pt solid #1b1f24; }
.top svg { width: 20pt; height: 20pt; }
.top b { font-size: 10pt; font-weight: 600; color: #1b1f24; }
.top span { margin-left: auto; text-align: right; font-size: 7pt; font-weight: 600; letter-spacing: 0.08em;
	text-transform: uppercase; color: #5d6570; }
.top span i { font-style: normal; color: #1b1f24; }
h1 { margin: 16pt 0 4pt; font-size: 24pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; color: #1b1f24; }
.what { margin: 0 0 12pt; font-size: 10.5pt; color: #3a4048; max-width: 5.6in; }
.facts { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 0.75pt; margin: 0; background: #cdd2d8;
	border: 0.75pt solid #cdd2d8; border-radius: 5pt; overflow: hidden; }
.facts div { padding: 6pt 9pt 7pt; background: #fff; }
.facts dt, th, .legend { font-size: 6.2pt; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #5d6570; }
.facts dd { margin: 2pt 0 0; color: #1b1f24; }
h2 { margin: 18pt 0 0; padding-bottom: 4pt; font-size: 13pt; font-weight: 600; letter-spacing: -0.01em; color: #1b1f24;
	border-bottom: 0.75pt solid #cdd2d8; break-after: avoid; }
h3 { margin: 11pt 0 0; font-size: 9.5pt; font-weight: 600; color: #1b1f24; break-after: avoid; }
h3 small { margin-left: 5pt; font-size: 7pt; font-weight: 500; color: #8a929c; }
.note { margin: 3pt 0 0; font-size: 7.5pt; color: #5d6570; break-after: avoid; }
table { width: 100%%; margin-top: 5pt; border-collapse: collapse; border: 0.75pt solid #e2e5e9; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td { padding: 3.2pt 7pt; text-align: left; vertical-align: top; border-bottom: 0.5pt solid #e2e5e9; }
th { background: #f6f7f9; white-space: nowrap; border-bottom-color: #cdd2d8; }
td { color: #3a4048; }
td:first-child { color: #1b1f24; }
.end { text-align: right; font-variant-numeric: tabular-nums; }
.legend { display: flex; gap: 6pt; margin-top: 5pt; padding: 3pt 0; border-bottom: 0.75pt solid #cdd2d8; break-after: avoid; }
.swatches { column-gap: 14pt; margin: 0; padding: 0; list-style: none; }
.swatches li { display: flex; align-items: center; gap: 5pt; height: 13.4pt; border-bottom: 0.5pt solid #e2e5e9;
	break-inside: avoid; font-size: 7pt; white-space: nowrap; }
td.swatch { width: 1%%; padding-right: 0; vertical-align: middle; }
td.swatch i { display: block; }
.swatches i, td.swatch i { flex: none; width: 20pt; height: 9pt; border: 0.5pt solid #cdd2d8; border-radius: 1.5pt;
	background: repeating-linear-gradient(135deg, #f6f7f9 0 2pt, #cdd2d8 2pt 2.5pt); }
.swatches .name { flex: 1 1 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: #3a4048; }
.swatches .mono { flex: none; }
.swatches .more { flex: none; color: #5d6570; }
.docs { margin: 6pt 0 0; padding: 0; list-style: none; }
.docs li { padding: 4pt 0; border-bottom: 0.5pt solid #e2e5e9; break-inside: avoid; }
.docs b { font-weight: 600; color: #1b1f24; }
.docs span { display: block; font-size: 7.5pt; color: #5d6570; }
.docs .mono { font-size: 6.8pt; color: #5d6570; }
"""
MARK = ('<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1b1f24"/><path fill="#fff" '
        'fill-rule="evenodd" d="M16 6.5 25 25.5h-4.4L18.94 22h-5.88l-1.66 3.5H7Zm0 9.3-1.52 3.2h3.04Z"/></svg>')
SITE = "alexdesignlab.org"
COLUMN = 7.3 * 72  # the width between the margins, in points


def text(value):
    """Escaped, with the words between `backticks` set as codes."""
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", html.escape(str(value), quote=False))


def static_table(table):
    head = "".join("<th>%s</th>" % text(c) for c in table["columns"])
    body = "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % text(c) for c in row) for row in table["rows"])
    return "<table><thead><tr>%s</tr></thead><tbody>%s</tbody></table>" % (head, body)


def chart_rows(chart, table):
    group = next((g for g in chart["groups"] if g["title"] == table["chart"]), None)
    if group is None:
        sys.exit('No "%s" in the chart; run tools/suppliers/extract.py' % table["chart"])
    return group.get("colors") or group.get("rows") or []


def chart_table(table, rows):
    """A chart with no colours (sheet stock), or one with notes to read in full: a plain table."""
    prefix = table.get("prefix", "")
    swatches = any(row.get("hex") for row in rows)
    cls = lambda c: " ".join(k for k in ("mono", "end") if c.get(k))
    head = "".join('<th class="%s">%s</th>' % ("end" if c.get("end") else "", text(c["label"])) for c in table["columns"])
    head = ('<th class="swatch"></th>' if swatches else "") + head
    body = ""
    for row in rows:
        cells = '<td class="swatch"><i%s></i></td>' % (' style="background:%s"' % row["hex"] if row.get("hex") else "") if swatches else ""
        cells += "".join('<td class="%s">%s</td>' % (cls(c), text((prefix if c["key"] == "code" else "") + str(row.get(c["key"], ""))))
                        for c in table["columns"])
        body += "<tr>%s</tr>" % cells
    return "<table><thead><tr>%s</tr></thead><tbody>%s</tbody></table>" % (head, body)


def swatch_list(table, rows):
    """A colour chart: swatches in columns down the page, to fit a long chart on few pages."""
    columns = [c for c in table["columns"] if any(row.get(c["key"]) not in (None, "") for row in rows)]
    # a prefix that is a word of its own ("PANTONE ") is said once, over the list; one that is part of the code stays
    prefix = table.get("prefix", "")
    said = prefix if prefix.endswith(" ") else ""
    # the columns after the name line up: each is as wide as its longest value
    size = lambda c: 4.3 if c.get("mono") or c["key"] == "code" else 4.3
    lengths = {c["key"]: sorted(len(str(row.get(c["key"]) or "")) for row in rows) for c in columns}
    width = {key: found[-1] for key, found in lengths.items()}
    # three columns of swatches where nearly every row fits without cutting its name short, or else two
    usual = sum(lengths[c["key"]][int(len(rows) * 0.95) - 1] * size(c) + 5 for c in columns) + 25
    count = 3 if usual <= (COLUMN - 28) / 3 else 2
    legend = "  ·  ".join(c["label"] for c in columns)
    if said:
        legend += "  ·  Write %s before each" % said.strip()
    items = ""
    for row in rows:
        cells = ""
        for c in columns:
            value = row.get(c["key"], "")
            if c["key"] == "code":
                # codes of one length (not Pantone's, where a few are names) take one width, so the names line up
                room = ' style="width:%.0fpt"' % ((width["code"] + len("" if said else prefix)) * size(c)) if width["code"] <= 9 else ""
                cells += '<span class="mono"%s>%s</span>' % (room, text(("" if said else prefix) + str(value)))
            elif c["key"] == "name":
                cells += '<span class="name">%s</span>' % text(value)
            else:
                cells += '<span class="more%s" style="width:%.0fpt">%s</span>' % (
                    " mono" if c.get("mono") else "", width[c["key"]] * size(c), text(value if value is not None else ""))
        if not any(c["key"] == "name" for c in columns):
            cells = cells.replace('</span><span class="more', '</span><span class="name"></span><span class="more', 1)
        swatch = ' style="background:%s"' % row["hex"] if row.get("hex") else ""
        items += "<li><i%s></i>%s</li>" % (swatch, cells)
    return '<div class="legend">%s</div><ul class="swatches" style="columns:%d">%s</ul>' % (html.escape(legend), count, items)


def page(key, sheet, chart, when):
    font = lambda *parts: "file:///" + os.path.join(FONTS, *parts).replace(os.sep, "/")
    style = STYLE % {
        "inter": font("@fontsource-variable", "inter", "files", "inter-latin-wght-normal.woff2"),
        "mono400": font("@fontsource", "ibm-plex-mono", "files", "ibm-plex-mono-latin-400-normal.woff2"),
        "mono500": font("@fontsource", "ibm-plex-mono", "files", "ibm-plex-mono-latin-500-normal.woff2"),
        "sheet": sheet["sheet"], "name": sheet["name"].replace('"', ""),
    }
    out = ['<!doctype html><html lang="en"><meta charset="utf-8"><title>%s, Supplier Sheet %s</title><style>%s</style>'
           % (html.escape(sheet["name"]), sheet["sheet"], style)]
    out.append('<div class="top">%s<b>Alexandria Design Lab</b><span>Supplier Sheet <i>%s</i><br>%s</span></div>'
               % (MARK, sheet["sheet"], when))
    out.append("<h1>%s</h1><p class=\"what\">%s</p>" % (text(sheet["name"]), text(sheet["what"])))
    out.append('<dl class="facts"><div><dt>We Use It For</dt><dd>%s</dd></div><div><dt>A Code Looks Like</dt>'
               '<dd><code>%s</code></dd></div><div><dt>Website</dt><dd>%s</dd></div></dl>'
               % (text(sheet["use"]), text(sheet["code"]), text(sheet["site"]["label"])))
    for section in sheet["sections"]:
        out.append("<h2>%s</h2>" % text(section["title"]))
        if section.get("note"):
            out.append('<p class="note">%s</p>' % text(section["note"]))
        for table in section["tables"]:
            rows = chart_rows(chart, table) if table.get("chart") else table["rows"]
            if len(section["tables"]) > 1 or table["title"] != section["title"]:
                size = "<small>%s</small>" % format(len(rows), ",") if len(rows) > 40 else ""
                out.append("<h3>%s%s</h3>" % (text(table["title"]), size))
            if table.get("note"):
                out.append('<p class="note">%s</p>' % text(table["note"]))
            if not table.get("chart"):
                out.append(static_table(table))
            elif any(row.get("hex") for row in rows) and not any(row.get("note") for row in rows):
                out.append(swatch_list(table, rows))
            else:
                out.append(chart_table(table, rows))
    out.append("<h2>Made From</h2><p class=\"note\">The supplier's own documents, on the hub beside this sheet.</p><ul class=\"docs\">")
    for document in sheet["documents"]:
        href = document["href"]
        where = SITE + href if href.startswith("/") else re.sub(r"^https?://(www\.)?", "", href).rstrip("/")
        out.append('<li><b>%s</b><span>%s</span><span class="mono">%s</span></li>' % (text(document["title"]), text(document["note"]), text(where)))
    out.append("</ul>")
    return "".join(out)


def main():
    chrome = next((b for b in BROWSERS if b and os.path.exists(b)), None)
    if not chrome:
        sys.exit("Chrome wasn't found. Set CHROME to its path.")
    with open(os.path.join(DATA, "sheets.json"), encoding="utf-8") as file:
        sheets = json.load(file)
    wanted = sys.argv[1:] or list(sheets)
    when = datetime.date.today().strftime("%B %Y")
    os.makedirs(OUT, exist_ok=True)
    for key in wanted:
        if key not in sheets:
            sys.exit("No supplier %s in sheets.json: %s" % (key, ", ".join(sheets)))
        sheet = sheets[key]
        with open(os.path.join(DATA, sheet["data"] + ".json"), encoding="utf-8") as file:
            chart = json.load(file)
        path = os.path.join(OUT, key + ".pdf")
        with tempfile.TemporaryDirectory() as folder:
            source = os.path.join(folder, key + ".html")
            with open(source, "w", encoding="utf-8") as file:
                file.write(page(key, sheet, chart, when))
            subprocess.run([chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
                            "--user-data-dir=" + os.path.join(folder, "profile"), "--print-to-pdf=" + path,
                            "file:///" + source.replace(os.sep, "/")],
                           check=True, capture_output=True, timeout=300)
        print("%s  %s  %.0f KB" % (sheet["sheet"], os.path.relpath(path, HUB), os.path.getsize(path) / 1024))


if __name__ == "__main__":
    main()
