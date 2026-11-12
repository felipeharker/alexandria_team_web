#! python3
"""Builds the Rhino model of the typical sign types: a letter A for each detail in the library, as the renders show it.

Open a new, empty model in Rhino 8, then run:

    _-RunPythonScript "<hub>\\tools\\sign_types\\make_model.py"

Each type (DTL-01 to DTL-13) is a 24" letter A built as its detail draws it, the same geometry as render.html,
on its own layer, on a stretch of wall, in a row 72" apart, with its title under it and a named view of it. Lit
faces, LEDs and neon carry emissive materials, so the Raytraced mode lights them. The model is written to
public/wiki/signage-types/typical_signage_types.3dm, which the Typical Signage Types page links to; the open
model itself isn't saved, so close it without saving.
"""
import math
import os

import Rhino
import System
from Rhino.Geometry import Point3d, Vector3d

HUB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(HUB, "public", "wiki", "signage-types", "typical_signage_types.3dm")
SPACING = 72.0  # inches between signs
TOL = 0.001

# The letter, in sign space: x to the right, y up, z out of the wall, in inches. 24" tall, 22" wide, 5.5" strokes.
OUTLINE = [(0, 0), (5.5, 0), (22 / 3.0, 5.5), (44 / 3.0, 5.5), (16.5, 0), (22, 0), (14, 24), (8, 24)]
COUNTER = [(5.5 + 10 / 3.0, 10), (16.5 - 10 / 3.0, 10), (11, 16.5)]
STROKE = [[(3, 0.4), (11, 23), (19, 0.4)], [(5.9, 8.3), (16.1, 8.3)]]  # a single-line A, for neon
LEGS = [((2.75, 0.9), (10.4, 23.1)), ((19.25, 0.9), (11.6, 23.1)), ((8.6, 7.75), (13.4, 7.75))]  # stroke centres
STANDOFFS = [(2.9, 2.5), (19.1, 2.5), (11, 21.5), (11, 7.75)]

# name: (colour 0-255, emission colour 0-1 or None, emission strength, roughness, metallic, opacity)
MATERIALS = {
    "Wall": ((138, 138, 134), None, 0, 0.92, 0.0, 1.0),
    "Returns": ((58, 50, 43), None, 0, 0.45, 0.1, 1.0),  # painted aluminum: returns, trim caps, cabinets
    "Backer Dark": ((38, 38, 40), None, 0, 0.5, 0.0, 1.0),  # painted backers and cabinet faces
    "Backer Light": ((189, 189, 185), None, 0, 0.7, 0.0, 1.0),
    "Raceway": ((110, 110, 106), None, 0, 0.6, 0.0, 1.0),
    "Can Inside": ((226, 226, 222), None, 0, 0.6, 0.0, 1.0),
    "Bronze": ((168, 134, 94), None, 0, 0.42, 0.3, 1.0),
    "Standoff": ((192, 192, 192), None, 0, 0.3, 0.9, 1.0),
    "Clear Acrylic": ((255, 255, 255), None, 0, 0.05, 0.0, 0.0),
    "Lit Acrylic": ((245, 245, 240), (1.0, 0.95, 0.89), 2.0, 0.35, 0.0, 1.0),
    "LED": ((255, 255, 255), (1.0, 0.94, 0.86), 6.0, 0.35, 0.0, 1.0),
    "LED Rope": ((255, 226, 184), (1.0, 0.75, 0.44), 5.0, 0.35, 0.0, 1.0),
    "RGB LED": ((120, 160, 255), (0.24, 0.42, 1.0), 6.0, 0.35, 0.0, 1.0),
    "Vinyl": ((160, 20, 8), (0.88, 0.07, 0.02), 1.5, 0.35, 0.0, 1.0),
}

TYPES = [  # name, title (as on the Typical Signage Types page)
    ("DTL-01", "Front-Lit Channel Letters, Flush Wall Mount"),
    ("DTL-02", "Front-Lit Channel Letters, Raceway Mount"),
    ("DTL-03", "Front-Lit Channel Letters on a Cloud Backer"),
    ("DTL-04", "Front-Lit Channel Letters on a Pan Backer"),
    ("DTL-05", "Halo-Lit Reverse Channel Letters on Standoffs"),
    ("DTL-06", "Halo-Lit Reverse Channel Letters on a Backer"),
    ("DTL-07", "Push-Thru Cabinet"),
    ("DTL-08", "Open-Face Channel Letters, Exposed LEDs"),
    ("DTL-09", "LED Neon on a Clear Backer"),
    ("DTL-10", "Open-Face Channel Letters, LED Rope"),
    ("DTL-11", "Front and Back-Lit Channel Letters"),
    ("DTL-12", "Non-Illuminated Dimensional Letters"),
    ("DTL-13", "Front-Lit Acrylic Cabinet"),
]


# ------------------------------------------------------------------ geometry, in sign space
def _curve(points, closed=True):
    pts = [Point3d(x, y, 0) for x, y in points]
    if closed:
        pts.append(pts[0])
    return Rhino.Geometry.Polyline(pts).ToPolylineCurve()


def _rect(x0, y0, x1, y1):
    return _curve([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])


def _area(curve):
    props = Rhino.Geometry.AreaMassProperties.Compute(curve)
    return props.Area if props else 0


def _offset(curve, distance, round_corners=False):
    """The curve offset outward by distance, or inward when it's negative."""
    style = Rhino.Geometry.CurveOffsetCornerStyle.Round if round_corners else Rhino.Geometry.CurveOffsetCornerStyle.Sharp
    found = []
    for d in (distance, -distance):
        result = curve.Offset(Rhino.Geometry.Plane.WorldXY, d, TOL, style)
        if result and len(result) == 1 and result[0].IsClosed:
            found.append(result[0])
    found.sort(key=_area)
    return found[-1] if distance > 0 else found[0]


def _at(curve, z):
    copy = curve.DuplicateCurve()
    copy.Translate(Vector3d(0, 0, z))
    return copy


def _planar(curves, z):
    items = System.Collections.Generic.List[Rhino.Geometry.Curve]()
    for curve in curves:
        items.Add(_at(curve, z))
    return list(Rhino.Geometry.Brep.CreatePlanarBreps(items, TOL) or [])


def _prism(curves, z0, z1, back=True, front=True, sides=True):
    """The region inside the first curve and outside the rest, from z0 to z1, joined."""
    parts = []
    if sides:
        for curve in curves:
            parts.append(Rhino.Geometry.Surface.CreateExtrusion(_at(curve, z0), Vector3d(0, 0, z1 - z0)).ToBrep())
    if back:
        parts += _planar(curves, z0)
    if front:
        parts += _planar(curves, z1)
    items = System.Collections.Generic.List[Rhino.Geometry.Brep]()
    for part in parts:
        items.Add(part)
    return list(Rhino.Geometry.Brep.JoinBreps(items, TOL) or parts)


def _cylinder(x, y, z0, z1, r):
    circle = Rhino.Geometry.Circle(Rhino.Geometry.Plane(Point3d(x, y, z0), Vector3d.ZAxis), r)
    return [Rhino.Geometry.Cylinder(circle, z1 - z0).ToBrep(True, True)]


def _pipe(curve, z, r):
    return list(Rhino.Geometry.Brep.CreatePipe(_at(curve, z), r, False, Rhino.Geometry.PipeCapMode.Round, True, TOL, 0.01))


def _sphere(x, y, z, r):
    return [Rhino.Geometry.Sphere(Point3d(x, y, z), r).ToBrep()]


def _standoffs(z0, z1):
    return [b for x, y in STANDOFFS for b in _cylinder(x, y, z0, z1, 0.3)]


# ------------------------------------------------------------------ the parts the signs share
def _channel(z0, depth):
    """A front-lit channel letter z0 off the wall: returns, a lit white acrylic face and its trim cap."""
    outline, counter, front = _curve(OUTLINE), _curve(COUNTER), z0 + depth
    return [("Returns", _prism([outline, counter], z0, front, front=False)),
            ("Lit Acrylic", _prism([outline, counter], front, front + 0.1875)),
            ("Returns", _prism([_offset(outline, 0.08), outline], front - 0.75, front + 0.25)),
            ("Returns", _prism([counter, _offset(counter, -0.08)], front - 0.75, front + 0.25))]


def _reverse(base, z0, depth, light="LED"):
    """A reverse channel letter on standoffs z0 off a surface at base: opaque face and returns, LEDs in its open
    back behind clear polycarbonate."""
    outline, counter = _curve(OUTLINE), _curve(COUNTER)
    return [("Standoff", _standoffs(base, z0)),
            ("Returns", _prism([outline, counter], z0, z0 + depth, back=False)),
            (light, _planar([_offset(outline, -0.4), _offset(counter, 0.4)], z0 + 0.15)),
            ("Clear Acrylic", _planar([outline, counter], z0))]


def _cabinet():
    box = _rect(-7, -5, 29, 29)
    return box, [("Returns", _prism([box], 0, 4, back=False, front=False)),
                 ("Returns", _prism([_offset(box, 0.75), box], 3.4, 4.4))]


def _open_can(depth):
    outline, counter = _curve(OUTLINE), _curve(COUNTER)
    return [("Returns", _prism([outline, counter], 0, depth, back=False, front=False)),
            ("Can Inside", _planar([outline, counter], 0.05))]


# ------------------------------------------------------------------ the signs
def _dtl01():
    return _channel(0, 4)


def _dtl02():
    return [("Raceway", _prism([_rect(-4, 9, 26, 15)], 0, 4))] + _channel(4, 4)


def _dtl03():
    return [("Backer Dark", _prism([_offset(_curve(OUTLINE), 3.5, round_corners=True)], 0, 1.5))] + _channel(1.5, 4)


def _dtl04():
    return [("Backer Dark", _prism([_rect(-6, -5, 28, 29)], 0, 3))] + _channel(3, 4)


def _dtl05():
    return _reverse(0, 2.5, 4)


def _dtl06():
    return [("Backer Light", _prism([_rect(-6, -5, 28, 29)], 0, 1))] + _reverse(1, 3.5, 4)


def _dtl07():
    box, parts = _cabinet()
    outline, counter = _curve(OUTLINE), _curve(COUNTER)
    return parts + [("Backer Dark", _prism([box, outline], 3.875, 4, sides=False)),
                    ("Backer Dark", _prism([counter], 3.875, 4, sides=False)),
                    ("Lit Acrylic", _prism([outline, counter], 3.25, 4.5))]


def _dtl08():
    bulbs = []
    for (x0, y0), (x1, y1) in LEGS:
        steps = max(1, int(round(math.hypot(x1 - x0, y1 - y0) / 2.6)))
        for i in range(steps + 1):
            t = float(i) / steps
            bulbs += _sphere(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 1.1, 0.45)
    return _open_can(4) + [("LED", bulbs)]


def _dtl09():
    corners = ((-2.5, -2.5), (24.5, -2.5), (-2.5, 26.5), (24.5, 26.5))
    return [("Clear Acrylic", _prism([_rect(-4, -4, 26, 28)], 1.0, 1.75)),
            ("Standoff", [b for x, y in corners for b in _cylinder(x, y, 0, 2.1, 0.4)]),
            ("LED", [b for stroke in STROKE for b in _pipe(_curve(stroke, closed=False), 2.05, 0.3)])]


def _dtl10():
    ropes = [_offset(_curve(OUTLINE), -1.4), _offset(_curve(COUNTER), 1.4)]
    return _open_can(5) + [("LED Rope", [b for rope in ropes for b in _pipe(rope, 1.6, 0.3)])]


def _dtl11():
    outline, counter = _curve(OUTLINE), _curve(COUNTER)
    inset, inset_counter = _offset(outline, -1.2), _offset(counter, 1.2)
    return [("Standoff", _standoffs(0, 1.5)),
            ("Returns", _prism([outline, counter], 1.5, 4.5, back=False, front=False)),
            ("Returns", _prism([outline, inset], 4.5, 4.625, sides=False)),
            ("Returns", _prism([inset_counter, counter], 4.5, 4.625, sides=False)),
            ("Lit Acrylic", _prism([inset, inset_counter], 4.0, 5.0)),
            ("RGB LED", _planar([_offset(outline, -0.4), _offset(counter, 0.4)], 1.65)),
            ("Clear Acrylic", _planar([outline, counter], 1.5))]


def _dtl12():
    return [("Bronze", _prism([_curve(OUTLINE), _curve(COUNTER)], 0.25, 1.25))]


def _dtl13():
    box, parts = _cabinet()
    return parts + [("Lit Acrylic", _prism([box], 3.8125, 4, sides=False)),
                    ("Vinyl", _planar([_curve(OUTLINE), _curve(COUNTER)], 4.01))]


BUILDERS = [_dtl01, _dtl02, _dtl03, _dtl04, _dtl05, _dtl06, _dtl07, _dtl08, _dtl09, _dtl10, _dtl11, _dtl12, _dtl13]


# ------------------------------------------------------------------ the model
def _to_world(index):
    """Sign space to the model: the wall upright in world XZ, the sign facing -Y (the Front view), in a row along X."""
    turn = Rhino.Geometry.Transform.Identity
    turn.M11, turn.M12, turn.M21, turn.M22 = 0.0, -1.0, 1.0, 0.0
    return Rhino.Geometry.Transform.Translation(Vector3d(index * SPACING, 0, 0)) * turn


def _materials(doc):
    found = {}
    for name, (base, emission, strength, roughness, metallic, opacity) in MATERIALS.items():
        material = Rhino.DocObjects.Material()
        material.Name = name
        material.ToPhysicallyBased()
        pbr = material.PhysicallyBased
        pbr.BaseColor = Rhino.Display.Color4f(base[0] / 255.0, base[1] / 255.0, base[2] / 255.0, 1.0)
        pbr.Roughness, pbr.Metallic = roughness, metallic
        if emission:
            pbr.Emission = Rhino.Display.Color4f(emission[0] * strength, emission[1] * strength, emission[2] * strength, 1.0)
        if opacity < 1:
            pbr.Opacity, pbr.OpacityIOR, pbr.OpacityRoughness = opacity, 1.49, 0.0
        found[name] = Rhino.Render.RenderMaterial.FromMaterial(material, doc)
        found[name].Name = name
        doc.RenderMaterials.Add(found[name])
    return found


def _layer(doc, name, color, parent=None):
    layer = Rhino.DocObjects.Layer()
    layer.Name, layer.Color = name, color
    if parent is not None:
        layer.ParentLayerId = doc.Layers[parent].Id
    return doc.Layers.Add(layer)


def _add(doc, breps, layer, material, transform):
    attributes = Rhino.DocObjects.ObjectAttributes()
    attributes.LayerIndex = layer
    for brep in breps:
        brep = brep.DuplicateBrep()
        brep.Transform(transform)
        obj = doc.Objects.FindId(doc.Objects.AddBrep(brep, attributes))
        obj.RenderMaterial = material
        obj.CommitChanges()


def build(doc):
    doc.ModelUnitSystem = Rhino.UnitSystem.Inches
    materials = _materials(doc)
    root = _layer(doc, "Typical Signage Types", System.Drawing.Color.Black)
    walls = _layer(doc, "Wall", System.Drawing.Color.FromArgb(150, 150, 150), root)
    labels = _layer(doc, "Titles", System.Drawing.Color.Black, root)
    view = doc.Views.Find("Perspective", False) or doc.Views.ActiveView
    for i, ((name, title), builder) in enumerate(zip(TYPES, BUILDERS)):
        transform = _to_world(i)
        layer = _layer(doc, name, System.Drawing.Color.FromArgb(60, 60, 60), root)
        _add(doc, _prism([_rect(-20, -16, 42, 42)], -2, 0), walls, materials["Wall"], transform)
        for material, breps in builder():
            _add(doc, breps, layer, materials[material], transform)
        plane = Rhino.Geometry.Plane(Point3d(-18, -13, 0.01), Vector3d.XAxis, Vector3d.YAxis)
        plane.Transform(transform)
        text = Rhino.Geometry.TextEntity.Create(name + "  " + title, plane, doc.DimStyles.Current, False, 0, 0)
        text.TextHeight = 1.25
        attributes = Rhino.DocObjects.ObjectAttributes()
        attributes.LayerIndex = labels
        doc.Objects.AddText(text, attributes)
        if view:  # the renders' camera, as a named view
            target, location = Point3d(11, 12, 2), Point3d(-30, 21, 76)
            target.Transform(transform)
            location.Transform(transform)
            viewport = view.ActiveViewport
            viewport.ChangeToPerspectiveProjection(True, 50)
            viewport.SetCameraLocations(target, location)
            viewport.CameraUp = Vector3d.ZAxis
            doc.NamedViews.Add(name, viewport.Id)
    doc.Lights.Sun.Enabled = False
    doc.Lights.Skylight.Enabled = False
    doc.GroundPlane.Enabled = False
    doc.RenderSettings.BackgroundStyle = Rhino.Display.BackgroundStyle.SolidColor
    doc.RenderSettings.BackgroundColorTop = System.Drawing.Color.FromArgb(12, 14, 20)
    doc.Layers.SetCurrentLayerIndex(root, True)
    for layer in list(doc.Layers):  # the template's empty layers
        if layer.Index != root and layer.ParentLayerId == System.Guid.Empty and not doc.Objects.FindByLayer(layer):
            doc.Layers.Delete(layer.Index, True)
    if view:
        view.ActiveViewport.ZoomExtents()
    doc.Views.Redraw()


def main():
    doc = Rhino.RhinoDoc.ActiveDoc
    if doc.Path or doc.Objects.Count:
        print("Make Model: run it in a new, empty model")
        return
    build(doc)
    options = Rhino.FileIO.FileWriteOptions()
    options.IncludeRenderMeshes = False
    options.IncludePreviewImage = False
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    print("wrote %s: %s" % (os.path.relpath(OUT, HUB).replace(os.sep, "/"), doc.WriteFile(OUT, options)))
    doc.Modified = False


if __name__ == "__main__":
    main()
