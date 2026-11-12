"""Renders a lit letter A for each typical sign type, for the Typical Signage Types page.

    python tools/render_signs.py            # every type
    python tools/render_signs.py DTL-05     # one or more

tools/sign_types/render.html builds each sign in three.js, as its detail in the library draws it, and lights it at
night; headless Chrome opens it and takes a screenshot, saved as public/wiki/signage-types/DTL-NN.jpg. three.js
loads from jsDelivr, so run it online. Rerun it when a detail is added (and give the new type its sign in
render.html) or a sign's look changes; tools/sync.py brings the drawings.
"""
import io
import os
import subprocess
import sys
import tempfile

from PIL import Image

HUB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(HUB, "tools", "sign_types", "render.html")
OUT = os.path.join(HUB, "public", "wiki", "signage-types")
TYPES = ["DTL-%02d" % n for n in range(1, 14)]
SIZE = (1600, 1200)
BROWSERS = [os.environ.get("CHROME", ""),
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]


def render(chrome, name):
    url = "file:///%s?type=%s&w=%d&h=%d" % (PAGE.replace(os.sep, "/"), name, SIZE[0], SIZE[1])
    with tempfile.TemporaryDirectory() as folder:
        shot = os.path.join(folder, "shot.png")
        subprocess.run([chrome, "--headless=new", "--hide-scrollbars", "--use-angle=swiftshader",
                        "--enable-unsafe-swiftshader", "--force-device-scale-factor=1",
                        "--window-size=%d,%d" % SIZE, "--virtual-time-budget=30000",
                        "--user-data-dir=" + os.path.join(folder, "profile"), "--screenshot=" + shot, url],
                       check=True, capture_output=True, timeout=300)
        image = Image.open(shot).convert("RGB")
    path = os.path.join(OUT, name + ".jpg")
    image.save(path, quality=88, optimize=True, progressive=True)
    print("wrote public/wiki/signage-types/%s.jpg" % name)


def main():
    chrome = next((path for path in BROWSERS if path and os.path.isfile(path)), None)
    if not chrome:
        raise SystemExit("render_signs: no Chrome found (set CHROME to its path)")
    os.makedirs(OUT, exist_ok=True)
    for name in sys.argv[1:] or TYPES:
        render(chrome, name)


if __name__ == "__main__":
    main()
