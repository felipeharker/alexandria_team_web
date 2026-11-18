#! python3
"""Etch Text: text in the Alexandria Etch single-line font, drawn as curves a laser or router follows once.

Run it in Rhino 8:

    _-RunPythonScript "<this folder>\\etch_text.py"

It asks for the text, its height (the capitals', in the model's units) and where its
bottom left goes, and draws it on the current layer as one group. Each stroke is one
open curve of lines and arcs down the middle of the letter, so the machine makes a
single pass. Rhino's own text can't do this with a font of ours: it only treats the
fonts on its built-in list as single-line and outlines every other.

Other scripts use it as a module:

    import etch_text
    curves = etch_text.curves("P1-1", plane, 0.5)   # Rhino curves, nothing added to the model
    width = etch_text.width("P1-1", 0.5)

The strokes come from alexandria_etch.json beside this file. Lower case draws as capitals.
"""
import json
import math
import os

import Rhino
from Rhino.Geometry import Arc, ArcCurve, LineCurve, Plane, Point3d, PolyCurve, Transform, Vector3d

NAME = "Etch Text"
FONT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alexandria_etch.json")
HEIGHT_KEY = "Alexandria Etch Height"  # document text: the height used last
_font = None


def font():
    global _font
    if _font is None:
        with open(FONT_FILE, encoding="utf-8") as handle:
            _font = json.load(handle)
    return _font


def _glyph(char):
    glyphs = font()["glyphs"]
    return glyphs.get(char) or glyphs.get(char.upper())


def width(text, height):
    """How wide a line of text is at this height."""
    data = font()
    return sum((_glyph(char) or {"advance": data["space"]})["advance"] for char in text) * height / data["cap_height"]


def _stroke(stroke, dx):
    """One stroke as a curve in glyph units, moved dx along the line."""
    pts = stroke["pts"]
    pairs = list(zip(pts, pts[1:])) + ([(pts[-1], pts[0])] if stroke["closed"] else [])
    curve = PolyCurve()
    for (x1, y1, bulge), (x2, y2, _) in pairs:
        start, end = Point3d(x1 + dx, y1, 0), Point3d(x2 + dx, y2, 0)
        if abs(bulge) < 1e-9:
            curve.Append(LineCurve(start, end))
        else:  # the arc's middle is off the chord's middle by bulge x half the chord, to the right of travel
            middle = Point3d((x1 + x2) / 2.0 + dx + (y2 - y1) * bulge / 2.0, (y1 + y2) / 2.0 - (x2 - x1) * bulge / 2.0, 0)
            curve.Append(ArcCurve(Arc(start, middle, end)))
    return curve


def curves(text, plane=None, height=1.0):
    """The text's strokes as curves: its baseline along the plane's x axis from the plane's origin, the capitals
    height tall. A line break starts a new line below. Nothing is added to the model."""
    data = font()
    scale = height / data["cap_height"]
    place = Transform.PlaneToPlane(Plane.WorldXY, plane or Plane.WorldXY) * Transform.Scale(Point3d.Origin, scale)
    found = []
    for row, line in enumerate(text.splitlines()):
        x = 0.0
        for char in line:
            glyph = _glyph(char)
            if not glyph:
                x += data["space"]
                continue
            for stroke in glyph["strokes"]:
                curve = _stroke(stroke, x)
                curve.Translate(Vector3d(0, -row * data["line_height"], 0))
                curve.Transform(place)
                found.append(curve)
            x += glyph["advance"]
    return found


def add(doc, text, plane, height, attributes=None):
    """Adds the text's curves to the model as one group. Returns their ids."""
    ids = [doc.Objects.AddCurve(curve, attributes) for curve in curves(text, plane, height)]
    if len(ids) > 1:
        doc.Groups.Add(ids)
    return ids


def main(doc):
    text = ""
    result, text = Rhino.Input.RhinoGet.GetString("Text to etch", False, text)
    if result != Rhino.Commands.Result.Success or not text.strip():
        return
    try:
        height = float(doc.Strings.GetValue(HEIGHT_KEY))
    except (TypeError, ValueError):
        height = 0.5 * Rhino.RhinoMath.UnitScale(Rhino.UnitSystem.Inches, doc.ModelUnitSystem)
    result, height = Rhino.Input.RhinoGet.GetNumber("Height of the capitals", False, height, 1e-6, 1e9)
    if result != Rhino.Commands.Result.Success:
        return
    result, point = Rhino.Input.RhinoGet.GetPoint("Bottom left of the text", False)
    if result != Rhino.Commands.Result.Success:
        return
    plane = doc.Views.ActiveView.ActiveViewport.ConstructionPlane()
    plane.Origin = point
    serial = doc.BeginUndoRecord(NAME)
    ids = add(doc, text.strip(), plane, height)
    doc.Strings.SetString(HEIGHT_KEY, "%g" % height)
    doc.EndUndoRecord(serial)
    doc.Views.Redraw()
    print("%s: %d curves for %s, %g tall." % (NAME, len(ids), text.strip(), height))


if __name__ == "__main__":
    main(Rhino.RhinoDoc.ActiveDoc)
