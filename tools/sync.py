"""Brings the hub up to date with Alexandria Phoenix and the shared packages folder.

    python tools/sync.py            # docs, guides, release facts and the zip
    python tools/sync.py --publish  # the same, then uploads the zip as a GitHub release

Run it after every Alexandria release. It reads the alexandria_phoenix repo beside this
one (or ALEXANDRIA_PHOENIX) and the shared alexandria_packages folder, and writes:

- src/content/docs/docs/install.md, phoenix.md, standards.md: INSTALL.md, README.md and
  STANDARDS.md, as hub pages. Edit them in alexandria_phoenix, never here.
- src/generated/troubleshooting-*.md: INSTALL.md's two troubleshooting lists, for the
  Troubleshooting page.
- src/generated/guides/rhino.html, grasshopper.html, src/styles/guides.css and
  public/guides/icons/: the two quick guides, built by alexandria_phoenix's
  tools/make_guides.py and scoped to .qg-page so they sit inside the hub's pages.
- src/data/release.json: the shared folder's version, date and contents.
- src/data/releases.json: every "Packages ..." commit in alexandria_phoenix, for What's new.
- release/alexandria_packages.zip: the shared folder, zipped as it is (not committed).

--publish uploads the zip to a release on GitHub named after the Rhino Tools package's
version, which is what the Download button links to. Commit and push the rest so
Render rebuilds the site.
"""
import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile

HUB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOENIX = os.environ.get("ALEXANDRIA_PHOENIX") or os.path.join(os.path.dirname(HUB), "alexandria_phoenix")
REPO = "felipeharker/alexandria_team_web"  # where the zip is published
ASSET = "alexandria_packages.zip"
SKIP = {"desktop.ini", "thumbs.db", ".ds_store"}

DOCS = [  # source in alexandria_phoenix, hub page, title, description
    ("INSTALL.md", "install", "Install and Update",
     "Install the two Alexandria packages in Rhino 8, keep them updated, and fix what's missing."),
    ("README.md", "phoenix", "Alexandria Phoenix",
     "Every Grasshopper component and Rhino button, the master definition and how the repo is laid out."),
    ("STANDARDS.md", "standards", "Standards",
     "How components, definitions, drawings, projects and the toolbar are built, and where each standard lives."),
]
LINKS = {"INSTALL.md": "/docs/install/", "README.md": "/docs/phoenix/", "STANDARDS.md": "/docs/standards/"}
NOTE = "<!-- Written by tools/sync.py from alexandria_phoenix/%s. Edit it there and run the sync, not this page. -->\n\n"


def write(path, text):
    path = os.path.join(HUB, *path.split("/"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(text)
    print("wrote " + os.path.relpath(path, HUB).replace(os.sep, "/"))


def read(name):
    with open(os.path.join(PHOENIX, name), encoding="utf-8") as handle:
        return handle.read()


# ------------------------------------------------------------------ Title Case
# Every title on the hub is in Title Case (the user, 2026-11-05). The Phoenix sources write theirs
# in sentence case, so the sync recases their headings and labels on the way in.
MINOR = {"a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "as", "at", "by", "in", "of", "off",
         "on", "per", "to", "via", "vs", "with", "from", "into", "onto", "than"}


def title_case(text):
    """Title Case for a title's words; words with capitals or digits inside (CMF, DM-WORKING, 2D) stay."""
    words = re.split(r"(\s+)", text)
    real = [i for i, w in enumerate(words) if w.strip()]
    for n, i in enumerate(real):
        word = words[i]
        if re.match(r"^&#?\w+;$", word):  # an HTML entity, like &amp; or &middot;
            continue
        core = re.match(r"^([^\w]*)(\w[\w'’]*)(.*)$", word)
        if not core:
            continue
        lead, body, tail = core.groups()
        if any(c.isupper() for c in body[1:]) or any(c.isdigit() for c in body) or "::" in word:
            continue
        first_or_last = n in (0, len(real) - 1) or (n > 0 and words[real[n - 1]].endswith(":"))
        if body.lower() in MINOR and not first_or_last:
            body = body.lower()
        else:
            body = body[:1].upper() + body[1:]
        words[i] = lead + body + tail
    return "".join(words)


def title_case_markdown(text):
    """Every Markdown heading in Title Case, outside code blocks."""
    out, fenced = [], False
    for line in text.split("\n"):
        if line.lstrip().startswith("```"):
            fenced = not fenced
        heading = None if fenced else re.match(r"^(#{1,6} )(.*)$", line)
        out.append(heading.group(1) + title_case_text(heading.group(2)) if heading else line)
    return "\n".join(out)


def title_case_text(text):
    """Title Case outside `code` spans."""
    return "".join(part if part.startswith("`") else title_case(part) for part in re.split(r"(`[^`]*`)", text))


def title_case_html(body):
    """Title Case for a guide's titles: its headings, the steps of its order of work, its group and family
    names and its labelled figures. Running text, and the Rhino and Grasshopper names inside it, stay."""
    def recase(match):
        return match.group(1) + re.sub(r">([^<]+)<", lambda m: ">" + title_case(m.group(1)) + "<",
                                       ">" + match.group(2) + "<")[1:-1] + match.group(3)
    patterns = [r"(<h[1-3][^>]*>)(.*?)(</h[1-3]>)",
                r"(<div><b>)([^<]*)(</b><small>)",                      # a step of the order of work
                r"(</svg><b>)([^<]*)(</b><small>)",                     # a light type
                r'(<div class="qg-group-name">)([^<]*)(</div>)',        # a toolbar group
                r'(<span class="qg-fam [^"]*">)([^<]*)(</span>)',       # a component family
                r'(<div class="qg-col [^"]*"><b>)([^<]*)(</b>)',        # a swap column
                r'(<div class="qg-sec-name">)([^<]*)(<small>)']         # a tab section
    for pattern in patterns:
        body = re.sub(pattern, recase, body, flags=re.S)
    return body


# ------------------------------------------------------------------ docs
def relink(text):
    def swap(match):
        target, anchor = match.group(2), match.group(3) or ""
        return "](%s%s)" % (LINKS[target], anchor) if target in LINKS else match.group(0)
    return re.sub(r"\]\((\./)?([A-Z]+\.md)(#[\w-]+)?\)", swap, text)


def docs():
    for source, slug, title, description in DOCS:
        text = read(source)
        text = re.sub(r"\A# .*\n+", "", text)  # the page title comes from the front matter
        front = "---\ntitle: %s\ndescription: %s\n---\n\n" % (json.dumps(title), json.dumps(description))
        text = title_case_markdown(relink(text))
        write("src/content/docs/docs/%s.md" % slug, front + NOTE % source + text.rstrip() + "\n")
    install = relink(read("INSTALL.md"))
    missing = re.search(r"^## If something's missing\n+(.*?)(?=^## |\Z)", install, re.S | re.M)
    claude = re.search(r"^If it doesn't work:\n+(.*?)(?=^## |\Z)", install, re.S | re.M)
    if not missing or not claude:
        raise SystemExit("sync: INSTALL.md lost its \"If something's missing\" or \"If it doesn't work:\" list")
    write("src/generated/troubleshooting-install.md", NOTE % "INSTALL.md" + missing.group(1).strip() + "\n")
    write("src/generated/troubleshooting-claude.md", NOTE % "INSTALL.md" + claude.group(1).strip() + "\n")


# ------------------------------------------------------------------ guides
def scope_rule(selectors):
    """One rule's selectors, scoped to .qg-page; None drops the rule."""
    out = []
    for sel in split_top(selectors, ","):
        sel = sel.strip()
        if sel in ("*",) or sel.startswith("@page"):
            return None
        if sel == ":root" or sel == "body":
            out.append(".qg-page")
        elif sel.startswith(":root[data-theme"):
            out.append(sel + " .qg-page")
        elif sel.startswith(".qg-page"):
            out.append(sel)
        else:
            out.append(".qg-page " + sel)
    return ", ".join(out)


def split_top(text, sep):
    parts, depth, start = [], 0, 0
    for i, ch in enumerate(text):
        depth += ch in "([" and 1 or ch in ")]" and -1 or 0
        if ch == sep and depth == 0:
            parts.append(text[start:i])
            start = i + 1
    parts.append(text[start:])
    return parts


def scope_css(css):
    """The guides' CSS made safe inside the hub: every rule under .qg-page, light and dark
    by the hub's data-theme only, media queries turned into container queries on the guide's
    own width, and nothing for print (the hub has its own)."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out, i = [], 0
    while True:
        brace = css.find("{", i)
        if brace < 0:
            break
        head = css[i:brace].strip()
        depth, j = 1, brace + 1
        while depth:
            depth += {"{": 1, "}": -1}.get(css[j], 0)
            j += 1
        inner = css[brace + 1:j - 1]
        i = j
        if head.startswith("@media"):
            if "print" in head or "prefers-color-scheme" in head:
                continue
            if "max-width" in head:
                head = head.replace("@media", "@container qg")
            out.append("%s {\n%s}\n" % (head, scope_css(inner)))
        elif head.startswith("@"):
            continue  # @page
        else:
            scoped = scope_rule(head)
            if scoped:
                out.append("%s {%s}\n" % (scoped, inner.rstrip()))
    return "".join(out)


def guides(version):
    sys.path.insert(0, os.path.join(PHOENIX, "tools"))
    import make_guides as mg

    comps = mg.components()
    bodies = {}
    for which, spec in mg.GUIDES.items():
        with open(os.path.join(mg.SRC, spec[3]), encoding="utf-8") as handle:
            bodies[which] = handle.read().replace("{{VERSION}}", version)
    fab, csv = mg.runs(comps)
    for key, value in (("TAB", mg.tab(comps)), ("FAMILIES", mg.legend()), ("CHAIN", mg.chain()),
                       ("SWAP", mg.swap(comps)), ("CARDS", mg.cards(comps)), ("FAB_RUN", fab), ("CSV_RUN", csv),
                       ("COUNT", str(len(comps)))):
        bodies["grasshopper"] = bodies["grasshopper"].replace("{{%s}}" % key, value)

    pages = {"rhino": "/guides/rhino-tools/", "grasshopper": "/guides/grasshopper-components/"}
    used = set()
    for which, body in bodies.items():
        body = re.sub(r"\s*<h1>.*?</h1>", "", body, flags=re.S)  # the hub page has its own title
        body = re.sub(r'\s*<p class="other">.*?</p>', "", body, flags=re.S)  # and a sidebar
        body = re.sub(r'\s*<div class="qg-foot">.*?</div>', "", body, flags=re.S)
        names = set(re.findall(r"\{\{(\w+)\}\}", body)) - {"OTHER_URL"}
        used |= names
        for name in names:
            body = body.replace("{{%s}}" % name, "/guides/icons/%s.png" % name)
        body = re.sub(r'(stroke|fill)="var\((--[a-z]+)\)"', r'style="\1:var(\2)"', body)
        body = title_case_html(mg.prefix_html(body))
        write("src/generated/guides/%s.html" % which,
              "<!-- Written by tools/sync.py from alexandria_phoenix/guides/src. Edit it there. -->\n" + body)

    css = mg.prefix_css(open(os.path.join(mg.SRC, "base.css"), encoding="utf-8").read()
                        + open(os.path.join(mg.SRC, "gh.css"), encoding="utf-8").read())
    write("src/styles/guides.css", "/* Written by tools/sync.py from alexandria_phoenix/guides/src/base.css and gh.css,\n"
          "   every rule scoped to .qg-page. Edit them there; the hub's own overrides are in theme.css. */\n"
          + scope_css(css))

    icons = os.path.join(HUB, "public", "guides", "icons")
    if os.path.isdir(icons):
        shutil.rmtree(icons)
    os.makedirs(icons)
    for name in sorted(used | {"layout_manager", "square_grid"}):
        shutil.copyfile(mg.icon_file(name), os.path.join(icons, name + ".png"))
    print("wrote public/guides/icons/ (%d icons)" % len(os.listdir(icons)))


# ------------------------------------------------------------------ the release
def shared_folder():
    match = re.search(r'^SHARED = r"(.+)"$', read("tools/release.py"), re.M)
    if not match:
        raise SystemExit("sync: can't find SHARED in alexandria_phoenix/tools/release.py")
    return match.group(1)


def release():
    shared = shared_folder()
    if not os.path.isdir(shared):
        raise SystemExit("sync: can't reach %s. Connect to the office drive and run it again." % shared)
    packages, files = {}, []
    for root, dirs, names in os.walk(shared):
        dirs.sort()
        for name in sorted(names):
            if name.lower() in SKIP:
                continue
            path = os.path.join(root, name)
            files.append(os.path.relpath(path, shared).replace(os.sep, "/"))
            match = re.match(r"alexandria (rhino|grasshopper) tools-(\d+\.\d+\.\d+\+\d+)-", name)
            if match:
                packages[match.group(1)] = (match.group(2), os.path.getmtime(path))
    if set(packages) != {"rhino", "grasshopper"}:
        raise SystemExit("sync: the shared folder should hold both packages; found %s" % (sorted(packages) or "none"))

    os.makedirs(os.path.join(HUB, "release"), exist_ok=True)
    zipped = os.path.join(HUB, "release", ASSET)
    with zipfile.ZipFile(zipped, "w", zipfile.ZIP_DEFLATED) as archive:
        for name in files:
            archive.write(os.path.join(shared, *name.split("/")), "alexandria_packages/" + name)
    print("wrote release/%s (%d files)" % (ASSET, len(files)))

    rhino = packages["rhino"][0]
    tag = "v" + rhino.replace("+", "-")
    stamp = max(when for _, when in packages.values())
    top = sorted({name.split("/")[0] + ("/" if "/" in name else "") for name in files})
    facts = {
        "version": re.match(r"\d+\.\d+", rhino).group(0),
        "rhino": rhino,
        "grasshopper": packages["grasshopper"][0],
        "date": datetime.date.fromtimestamp(stamp).isoformat(),
        "size": round(os.path.getsize(zipped) / 1048576.0, 1),
        "tag": tag,
        "url": "https://github.com/%s/releases/download/%s/%s" % (REPO, tag, ASSET),
        "contents": top,
    }
    write("src/data/release.json", json.dumps(facts, indent=2) + "\n")
    return facts, zipped


def history():
    log = subprocess.run(["git", "-C", PHOENIX, "log", "--format=%ad%x09%s", "--date=short"],
                         capture_output=True, text=True, encoding="utf-8", check=True).stdout
    entries = []
    for line in log.splitlines():
        date, subject = line.split("\t", 1)
        match = re.match(r"Packages (\d+\.\d+)\.(\S+?)(?: and \S+|/\S+)?: (.+)$", subject)
        if match:
            summary = match.group(3)
            entries.append({"version": match.group(1), "build": match.group(2), "date": date,
                            "summary": summary[:1].upper() + summary[1:]})
    write("src/data/releases.json", json.dumps(entries, indent=2) + "\n")


def publish(facts, zipped):
    exists = subprocess.run(["gh", "release", "view", facts["tag"], "--repo", REPO], capture_output=True).returncode == 0
    if exists:
        print("publish: %s is already on GitHub" % facts["tag"])
        return
    subprocess.run(["gh", "release", "create", facts["tag"], zipped, "--repo", REPO, "--title",
                    "Alexandria %s" % facts["version"], "--notes",
                    "Alexandria Rhino Tools %s and Grasshopper Tools %s, as in the shared alexandria_packages folder."
                    % (facts["rhino"], facts["grasshopper"])], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--publish", action="store_true", help="upload the zip as a GitHub release")
    args = parser.parse_args()
    if not os.path.isdir(PHOENIX):
        raise SystemExit("sync: no alexandria_phoenix at %s (set ALEXANDRIA_PHOENIX)" % PHOENIX)
    version = open(os.path.join(PHOENIX, "VERSION")).read().strip()
    docs()
    guides(version)
    history()
    facts, zipped = release()
    if args.publish:
        publish(facts, zipped)


if __name__ == "__main__":
    main()
