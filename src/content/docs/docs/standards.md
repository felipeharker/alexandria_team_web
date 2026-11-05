---
title: "Standards"
description: "How components, definitions, drawings, projects and the toolbar are built, and where each standard lives."
---

<!-- Written by tools/sync.py from alexandria_phoenix/STANDARDS.md. Edit it there and run the sync, not this page. -->

How components and definitions are written. Keep it this way unless the standard itself changes.

## Components

**One file per component**, `src/<subcategory>/<snake_name>.py`. The folder name is the ribbon subcategory (`src/grid` → *Grid*).

**Python 3, SDK mode.** Each file holds one `class AP_<Name>(Grasshopper.Kernel.GH_ScriptInstance)` with a `RunScript` method, plus module-level helpers prefixed with `_`.

**The docstring is the spec.** `tools/build.py` reads the component's metadata from it:

```python
#! python3
"""Point Remap (PtRemap)

Measures how far each item sits from its nearest attractor point and remaps
those distances onto a target domain. (Becomes the component description.)

Inputs:
    Geometry: Items to measure.
    Points: Attractor points. Each item measures to the nearest one.
    Domain: Target domain for the remapped values. Default: 0 To 1.
Outputs:
    Values: One remapped value per item, in input order.
"""
```

- First line: `Full Name (NickName)`. Nickname is ≤ 10 characters, a PascalCase abbreviation of the name.
- Every input and output is described. An input whose description contains `Default:` (or starts with `Optional`) is optional; its default lives in code.

**The signature is the parameter list.** Parameter name, nickname and Python variable are the same single PascalCase word (`Region`, `Size`, `Cells`). The annotation sets the type hint and access:

| Annotation | Grasshopper |
|---|---|
| `Rhino.Geometry.Curve` | Curve hint, item access |
| `list[Rhino.Geometry.Point3d]` | Point3d hint, list access |
| `float`, `int`, `bool` | Number, Integer, Boolean |
| `System.Drawing.Color`, `Rhino.Geometry.Interval` | Colour, Domain |
| `list` (bare) | no hint, list access (any data) |
| `Grasshopper.DataTree[...]` | tree access, for components that read or keep branch structure |

Write the signature exactly as Rhino writes it, one argument per line with a 12-space indent; the build stops if Rhino would rewrite it.

**Behaviour**
- Never raise. Report with runtime messages: *Warning* when the component can carry on, *Error* when an input is unusable.
- Lists that correspond stay parallel: return `None` for an item that fails rather than dropping it.
- Use the document's absolute tolerance; never hard-code one.
- No `print`. No baking or document changes from a solve.
- Only *Display* components draw. Preview overrides are `get_ClippingBox`, `DrawViewportMeshes` and `DrawViewportWires`. Rhino ignores a `@property ClippingBox`.

**Icons** are 24 px PNGs at `icons/<snake_name>.png` in the Phoenix palette: orange `242,101,34` for what the component makes, charcoal `45,45,48` for what it reads. `tools/make_icons.py` draws the current set.

**Shared helpers** are copied verbatim between the scripts that need them (the grid clipping helpers, the centroid sampler). The build fails when two copies of a `_helper` with the same name differ, so a fix has to reach every copy. Give a genuinely different helper a different name.

## Definitions

- **Left to right, one row.** The logic chain runs along the top. Each input group sits on a lower row, directly before the stage it feeds, so wires only travel up and to the right.
- **Relays everywhere.** Every variable feeds a typed parameter (Curve, Number, Integer, Boolean, Point, Domain, Colour) in the same group, and components take wires only from relays. Logic outputs pass through relays too (`Cells`, `Values`, `Scaled`, `Kept`). Swapping a variable, or a component such as Square Grid for Hex Grid, means rewiring one point.
- **Naming.** A relay is named after the input it feeds. Sliders, toggles and swatches carry the same name. Parameters that reference Rhino geometry are named `Rhino <Thing>`.
- **Groups** have short names and are coloured by role (alpha 140):

  | Role | Colour | Example |
  |---|---|---|
  | Input | blue `160,200,235` | Boundary, Attractors, Cull Settings |
  | Logic | orange `250,185,140` | Grid, Remap, Scale, Cull |
  | Output | green `165,220,160` | Result |
  | Display | violet `205,180,235` | Preview |

- **Preview is off everywhere except Material Preview components**, which show only what the user needs to see.
- **No panels or scribbles.** Names, groups and layout carry the explanation.
- **Rhino files** have one layer per referenced input (`Region`, `Attractor Curves`), named objects, and no unused layers.

## Drawings

**Model layers.** `standards/layers.3dm` holds the layers every Alexandria model shares, named in capitals, and *Populate Model* adds every layer in it, in its order, with its colour, print width and lock. The file's units and tolerances are the document setup: inches, 0.01 and 1°, which an empty model takes. A model with objects keeps its own. A layer that's already there, in any case, is left as it is, except that the `RENDER` layers, Alexandria's own, are set to capitals.

| Layer | Holds |
|---|---|
| `DESIGN::ILLUMS` | The design's own lighting: illuminated faces and their lights, from *Set Light*. The world light is separate, on `RENDER::LIGHT` |
| `DETAILS::ANNOTATIONS::DIMENSIONS` | Dimensions. Grey `128,128,128`, 0.25 mm |
| `DETAILS::ANNOTATIONS::CALLOUTS` | Leaders, notes and titles. Grey `77,77,77`, 0.13 mm |
| `DETAILS::2D` | 2D detail linework, on sublayers such as `CUT`, `VISIBLE` and `FILL-ALUMINUM` from the detail library |
| `DETAILS::2D::SIGN-LOCATION` | Red `255,0,0`, 0.35 mm: the red boxes that locate a sign on plans, elevations and the axonometric |
| `RENDER::…` | The render assets, below |

**Annotation.** `standards/alexandria_annotation_styles.3dm` holds the eight annotation styles, matched to the design package and in round sizes: Oswald in capitals, and Futura on the title page. Sizes are in paper inches and are text cap heights. In a model Rhino multiplies them by the style's model space scale, which is 4 (3" = 1'-0") when a style is created, so a full-size detail gets 0.5" dimension text, and is then set per drawing (24 for 1/2" = 1'-0"), so text looks in the model as it will on the page. On a layout, in or out of a block, the scale doesn't apply and text is the size given, and a detail at any scale prints the model's text at that size too, while *Enable layout space scaling* is on (*Document Properties > Annotation Styles*), as it is in Rhino's templates. *Populate Model* adds the styles and resets them to these values, keeping the scale. *Standard Dimension*, *Populate Detail* and the *Layout Manager* draw in them and add any that are missing, but never reset one. `toolbar/populate_model.py` is the source of truth.

| Setting | Value | × text |
|---|---|---|
| Dimension, callout and note text | 1/8", Oswald Regular | 1 |
| Title and heading text | 0.15", Oswald Regular | 1.2 |
| Small text: subtitles and the sign-off's labels | 0.09", Oswald Regular | 0.72 |
| Fine text: legal text and signature labels | 0.075", Oswald Regular | 0.6 |
| Cover text | 0.3", Futura Bk BT | 2.4 |
| **Alexandria Dimension** | | |
| Units | Feet and inches to 1/16", fractions in line, no zero feet (`2 7/8"`, `21'-9"`). Rhino can't space the dash, as the hand-made `36' - 8"` was | |
| Text position | Centred on the dimension line, level and facing the view however the dimension runs | |
| Gap each side of the text | 0.1", where Rhino breaks the dimension line. There's no mask, so a dimension reads over a render | 0.8 |
| Arrowheads | None. The dimension line stops at the extension lines | |
| Extension lines | 3/8" long, wherever the dimension line sits, 1/16" of that past the line | 3 |
| Between stacked dimensions | 1/2" (the baseline spacing) | 4 |
| **Alexandria Leader** | | |
| Arrowhead | Dot, 0.055" across | 0.44 |
| Leader | One leg, at any angle, into a horizontal landing that carries on the way the leg runs: a leg running left ends in a landing to the left, with the text on the left. A leader never folds back over itself, so put the text on the side the leg is heading | |
| Landing | 0.25" | 2 |
| Gap from the landing to the text | 0.1" | 0.8 |
| Text position | Callout text, centred on the landing past its end. A leader drawn to the left reads on the left | |
| **Alexandria Text** | Note text, top left aligned | |
| **Alexandria Title** | Title text, centred: a detail's title | |
| **Alexandria Heading** | Title text, left aligned on its baseline: a view title, the info box's bar, the page number | |
| **Alexandria Small**, **Fine** | Small and fine text, left aligned on the baseline | |
| **Alexandria Cover** | Cover text, centred on its baseline | |

**Display modes.** The standard modes are named `DM-…`. Rhino keeps display modes per machine rather than per file, so they're exported to `standards/display_modes/` as `.ini` files. `tools/export_standards.py` refreshes the export after a mode changes. The Alexandria Rhino Tools package carries them, and its *Alexandria Setup* button installs them (or *Options > View > Display Modes > Import*, one file at a time).

| Mode | Background | Look |
|---|---|---|
| DM-WORKING | White | Off-white shading (`245,245,243`), dark grey edges and curves, grid and axes, even light, no shadows |
| DM-AUTOCAD | Dark slate `33,40,48` | DM-WORKING's shading on a CAD-style dark background with light axes |
| DM-DIAGRAM | White | Flat mid-grey surfaces with one directional light and a sheen, thin dark edges, no grid or axes |
| DM-DIAGRAM-SHADOW | White | Flat white surfaces casting hard black shadows onto a shadow-only ground plane, no grid or axes |

**Rendering.** Two V-Ray looks, set by the *Day Render* and *Night Render* buttons. Day puts the sign on a light blue sky. Night puts it on a navy to mauve sky and dims the light, so emissive sign faces, at the brightness they were designed with, carry the image. The skies are the gradients of the design package's day and night pages, drawn by `tools/make_skies.py` as `standards/render_sky/sky_day.png` and `sky_night.png`, which ship in the package. The sky is only the background: GI, reflections and refractions see a neutral colour instead (the table), so it never tints or washes over the objects in front of it. Neither button changes a layer, so the sky shows wherever the wall, ground and scale figure, as you leave them, don't cover it. Both make V-Ray the model's renderer, which a new model doesn't start with, and set every value in the table, so they run in either order.

The buttons' tooltips say what a click does: *Apply Day Settings* and *Apply Night Settings* only set the look. Right click either, *Render Day and Save* or *Render Night and Save*, to set the look and then render: a small window asks whether to *Save with sky*, which the model remembers. Ticked, the render is a JPEG with the sky in it; unticked, a PNG whose background is transparent, as V-Ray leaves the background at alpha 0. Then a Save dialog asks for the folder and the file name, starting in the folder used last, or else the project's renders folder, at the next `day_#` or `night_#` there (`day_1`, or one past the highest number of either kind), which you can change. It renders the active model view, and V-Ray saves the image there when it's done. Once the image is written V-Ray goes back to saving nothing, so a render from its own button doesn't overwrite it.

Frame a render on the design: the sign fills a good part of the frame, seen from where a person would see it, with only as much of its wall or building as it needs for context. The whole building belongs on the sign location axonometric, not in a render. Day and night renders of a sign share one view.

The design's own lighting lives once: Day turns it off and Night back on, so the same faces read unlit by day and lit at night. What's switched is every V-Ray light in the model but the world light and the sun: *Set Light*'s mesh lights and any other. V-Ray drops a mesh light's object from the render while the light is off, which let the sky show through sign faces, so by day a mesh light goes down to 0.9 instead, where a white face is as bright as a white wall and doesn't glow. Day keeps each mesh light's own intensity in the document, and Night puts it back unless it has been changed since. Only lights change: no layer is shown or hidden and no material is touched, so light sign faces with *Set Light*.

**Lighting.** *Set Light* makes the surfaces or solids you select V-Ray mesh lights of a standard type:

| Light | Intensity | Colour | Double sided |
|---|---|---|---|
| `FRONT LIT CHANNEL` | 4 | White | Yes |
| `REVERSE LIT CHANNEL` | 4 | White | Yes |
| `PUSH THROUGH BODY`, a solid | 2 | White | No |
| `PUSH THROUGH FACE` | 0.5 | Charcoal `45,45,48` | No |

The name is the light's and its sublayer's: `DESIGN::ILLUMS::FRONT LIT CHANNEL` and the mesh light `/FRONT LIT CHANNEL`, which every object of the type shares, so a change in the Asset Editor reaches them all. A light keeps any change once it's made. Day and Night Render switch a mesh light wherever it is; the sublayer keeps each type together.

**Materials by layer.** *Set Material* gives each sublayer of a chosen layer a Rhino *Plaster* material in the layer's display colour, named `MAT_1`, `MAT_2` and on in layer order, and sets the objects on it back to the layer's material. `DESIGN::ILLUMS` keeps its own. Running it again recolours each sublayer's own `MAT_#`; another parent's sublayers continue after the highest `MAT_#` in the model, so parents never share a material.

| V-Ray setting | Day | Night |
|---|---|---|
| Background (`/Environment Texture`) | `sky_day.png` | `sky_night.png` |
| Background mapping and multiplier | Screen, so the sky fills the frame top to bottom; 1; read as sRGB | Same |
| GI, reflection and refraction overrides | On: a neutral white, so the sky doesn't tint the sign | On, at 0.05 |
| World light (`/Alexandria World Light`) | 0.0625, white, shadows with radius 0.02, not in reflections | Same |
| Sun (`/Rhino Document Sun`), and Rhino's own sun, which V-Ray's follows | Off | Off |
| Ground plane (`/Rhino Document Ground Plane`) | Off | Off |
| Physical camera | ISO 1525, f/8, 1/100 s, exposure on, which shows the sky at its true colours | Same |
| White balance | Neutral `1,1,1` | Neutral |
| Image size (`/SettingsOutput`) | 3840 × 2160 px (4K, 16:9), which Rhino's render size follows | Same |

The **world light** is a V-Ray directional light named *Alexandria World Light*, in Rhino and in V-Ray, on the `RENDER::LIGHT` layer. It shines from the front left, 31° above the horizon: direction `(0.1389, 0.8430, -0.5197)`, from azimuth 189° measured clockwise from +Y. Both buttons turn it to that direction and set its strength, and keep its position. A model without one gets one, drawn with Rhino's *DirectionalLight* command (the only way V-Ray gives a directional light a V-Ray light of its own) and placed outside the model, aimed at its middle.

**Render assets.** *Populate Model* imports `standards/render_assets.3dm`, the backdrop every Alexandria render sits in, and adds the world light. Models sit at the origin with the sign facing −Y, so the backdrop fits without moving:

| Layer | Asset | Material |
|---|---|---|
| `RENDER::WALL` (locked) | 2,000' wide, 60' thick, 120' tall; its face is the y = 0 plane | *Alexandria Wall*, Plaster `230` |
| `RENDER::GROUND` (locked) | 4,800' square slab; its top is z = 0 | *Alexandria Ground*, Plaster `250` |
| `RENDER::SCALE FIGURE` | A 5'-6" figure at x = 200", y = −52" | *Alexandria Scale Figure*, Plaster `190` |
| `RENDER::LIGHT` | The world light | |

*Day Render* and *Night Render* leave these layers as they are: hide the wall, ground and scale figure to put the sign on the sky, or show them to see it against the wall. An asset whose layer already holds objects isn't imported again. To change an asset, edit `standards/render_assets.3dm` and build. Keep only the `RENDER` layers in it; empty layers an import brings are removed anyway. The file ships in every Rhino Tools package, so save it without embedded bitmaps or a preview image; its materials use no textures.

**Detail library.** `standards/sign_details.3dm` holds the sign details, `DTL-01` to `DTL-13`, each drawn full size in inches as a 2D drawing grouped `DTL-NN 2D`, flat in the Top view, and a 3D model grouped `DTL-NN 3D` (its `MODEL::details` layers aren't standardized yet). *Populate Detail* adds a drawing to a model. The drawings follow this standard: linework and fills on `DETAILS::2D::CUT`, `VISIBLE`, `WIRING`, `BREAK-LINES` and `FILL-<material>`; callouts in *Alexandria Leader* and the title, centred under the drawing, in *Alexandria Title*, on `DETAILS::ANNOTATIONS::CALLOUTS`; and notes of work by others in red on `DETAILS::ANNOTATIONS::BY-OTHERS`. To add a detail, draw it that way, group it with its title, and build. The file ships in every Rhino Tools package, so save it without render meshes or a preview image.

**Sign locations.** Plans, building elevations and site drawings show where a sign goes, not the sign: a red box the size of the sign's extent, outlined on `DETAILS::2D::SIGN-LOCATION` (red, 0.35 mm) and filled in a pale red, with a callout to the sign's own elevation. Add an axonometric of the building with the same red box, so the location reads at a glance. The sign itself, letters and all, is drawn only on its own elevations and details.

**Layouts.** `standards/layouts.3dm` is the design package template: the blocks, laid out and named in its model space, and four 17 x 11" pages, `TITLE PAGE`, `DOC PAGE`, `PROJECT INFO PAGE` and `CMF PAGE`, each shown complete. `layout_docs/sign_package_template.pdf` is a document of all four as the *Layout Manager* exports them, the CMF page with one example item of each type. The *Layout Manager* adds pages to a model complete: everything on the template page, in generic info. A document starts as `TITLE`, from the title page, and `PAGE 1`, from the doc page, and every page added after it is a doc page, `PAGE 2` and on unless it's named otherwise. *Add Info Page* adds `PROJECT INFO` after the title, and *Add CMF Page* adds `COLORS, MATERIALS & FINISHES` at the end. The doc page's title at its top left, on the green bar, is the field `%<PageName()>%`, so renaming a page renames its title. To change the template, edit it in Rhino and build. A model that already has a block keeps its own, so its pages stay as they were issued.

| Page | Holds |
|---|---|
| `TITLE PAGE` | The bands, logo and *SIGN PACKAGE*; the grey mark and the leader where the client's logo goes; the company name and the address under it. The client's logo or wordmark replaces the mark in the mark's own light grey, as a watermark, never in its colours |
| `DOC PAGE` | The small info box at the top left: the green bar with the item and its quantity, and the scope of work. The logo at the top right with the page number beside it. The view title at the bottom left: *PROPOSED SIGNAGE*, its rule and *SCALED PROPORTIONALLY*. No project bar: the page is the design's, full width |
| `PROJECT INFO PAGE` | The doc page without its view title, and two rows of three columns, each under a green heading and rule: PROJECT, CLIENT and REVISIONS, then COPYRIGHT, APPROVAL (the terms) and SIGN-OFF (comments and the signature, date, printed name and title lines). The values are document text fields |
| `CMF PAGE` | The doc page without its view title, and what the *Layout Manager* draws the CMF items from: one section heading over its rule (`CMF SECTION`, `CMF SECTION RULE`) and one row (`CMF SWATCH`, `CMF SWATCH FRAME`, `CMF CODE`, `CMF NAME`, `CMF SPEC`, `CMF FINISH`, `CMF USE`), each in its cell (`CMF SECTION CELL`, `CMF ROW CELL`), and the two `CMF AREA` rectangles they flow down, left then right |

The template's pages keep their parts grouped (`CLIENT NAME`, `ADDRESS`, `LOGO BOX`, `INFO BOX`, `PROJECT INFO`, `CMF SECTION`, `CMF ROW`, `CMF AREAS`) for editing it; a page in a model has no groups.

The CMF page is drawn, not copied: for each type that has items (paint, vinyl, materials, electrical, in that order) the *Layout Manager* copies the section heading with the type's name, then the row for each item, in code order, with its texts, and its swatch filled in the item's colour, or no swatch for an item without one. A text whose prototype has a label before ` : ` (`FINISH : `) keeps the label; an empty value leaves its text out. A heading never ends an area, and what doesn't fit is counted and reported. To restyle the page, move or restyle the prototypes and cells in the template and build; `tools/required_names.json` lists the names the build checks for.

A block is one definition placed many times, so an edit reaches every page that uses it. What every page shares is a block. What changes page to page sits on the page as plain text. Positions are round: x from the left and y from the top in steps of 0.05", or 0.025" where a baseline needs it, with text anchored on its baseline.

| Block | Holds |
|---|---|
| `LAYOUT FRAME` | The page border. Each template page's frame is named after the page, which is how the *Layout Manager* finds it |
| `LAYOUT SIDE BAR` | The project bar older documents carried down the right of every page. No page uses it now: the `PROJECT INFO` page carries what it did, and *Add Info Page* takes it off an older document's pages |
| `LAYOUT COVER` | The title page's bands, logo and title, placed at the page origin |
| `LAYOUT LOGO`, `LAYOUT LOGO MARK` | The logo, 2" wide, nested in the blocks above and on its own at the top right of a doc page, and the grey mark on the title page, 5.20" wide |
| `LAYOUT INFO PANEL` | The cream panel behind the info box, 6" by 1", scaled in Y to fit. The *Layout Manager* puts it on a page as its parts, at the back |
| `LAYOUT INFO HEADER` | The info box's green bar and Scope of Work heading |
| `LAYOUT COLOR BOX` | The box around paint and vinyl rows, 2.75" by 1", scaled in Y to fit. No page uses it now: the CMF page replaced it |
| `LAYOUT ELECTRICAL` | The electrical requirements box, 3.10" by 0.70". No page uses it now: electrical items go on the CMF page |
| `LAYOUT IMAGE BOX` | The box for a photo, 2.40" by 2.60", and the rule its title sits on. No page uses it now |
| `LAYOUT VIEW RULE` | The 3" rule under a view's title |

| Layer | Holds |
|---|---|
| `LAYOUT::SHEET` | Everything fixed |
| `LAYOUT::VARIABLE` | Red: what's set per project. Set it to grey `128,128,128` when the package is final |
| `LAYOUT::VARIABLE::BAR` | Red: the text on the green bar. Set it to white when the package is final |
| `LAYOUT::PANEL` | The info panel and green bar. On a page the panel is its parts, with draw order −1, so the header, a block, draws over it. Draw order does nothing for a block, and Rhino 8 draws a block stretched to fit, as the panel is, over the blocks in front of it, wherever its layer sits |
| `LAYOUT::DETAILS` | The drawings and details the *Layout Manager* places. Its print width is *No Print*, so a detail's frame doesn't print |
| `LAYOUT::RENDER` | A render page's sky and render, there only while the *Layout Manager* exports |
| `LAYOUT::GUIDES` | The CMF page's cells and areas, in the template only. Its print width is *No Print* |

The info page's values are fields, `%<DocumentText("PROJECT NAME")>%`, kept in the model's document text, so one entry reaches the page; the *Layout Manager*'s *Project Details* sets them. The page numbers are fields too.

**Block library.** `standards/blocks.3dm` holds the blocks *Populate Block* adds, all original drawings in one look: a pale fill, an outline on the block's layer and fine detail lines at 0.09 mm. Each block has a legend instance in the file, captioned, whose layer is the layer it goes on and whose `SIZE` user text says how it's drawn. *Paper* blocks, the north arrow, section indicator and dot callouts, are drawn at paper size, in inches: on a page they go in at 1:1, and in a model at the model space scale of *Alexandria Small*, as grouped linework, since text in a scaled block prints too big. A text named `CALLOUT` takes the next number or letter and `SECTION` the next letter. *Model* blocks, the graphic scales (0-4', 0-20', 0-100', each for its range of scales), people, cars and trees, go in at true size as block instances, their definitions copied in the first time; a definition the model has is left as it is. People, cars and trees are on `DETAILS::2D::ENTOURAGE`, symbols on `DETAILS::ANNOTATIONS::CALLOUTS` and graphic scales on `DETAILS::ANNOTATIONS::DIMENSIONS`.

**The Layout Manager** is one window for the design package. Every part of it works the same way: a list, the options it uses under it (page, scale or sky), what the last button did, and the part's buttons, verb first, with *Close* last. A button that needs Rhino, for a selection, a click on a page or a file, closes the window until it's done and opens it again where it was. Double clicking an entry runs the part's main button. Its parts, in the order of work:

| Part | What it keeps | Buttons |
|---|---|---|
| Document | The pages | *Create Document*, while the model has no pages; *Add Page*, *Rename Page*, *Remove Page* |
| Project Details | The project's and client's details, in document text | *Edit Details*; *Add Info Page*, while the document has pages and no info page |
| Drawings | Saved selections of the model, in document text `Alexandria Drawing: <name>` as object ids | *Add Drawing*, *Edit Drawing*, *Delete Drawing*, *Place on Page*, *Remove from Page* |
| Details | The sign detail library | *Place on Page*, *Remove from Page* |
| CMF | The paint, vinyl, material and electrical items, in document text `Alexandria CMF: <code>` as JSON: type, name, specification, finish, where it's used and a swatch colour or none | *Add Item*, *Edit Item*, *Remove Item*; *Add CMF Page*, while the document has pages and no CMF page |
| Renders | Each render page's sky and image, in document text `Alexandria Render: <page>` | *Set Render*, *Clear Render* |
| Images | Images from a file, placed on a page at the size and place you click, embedded, on `LAYOUT::IMAGES` | *Add Image*, *Remove Image* |
| Export | Every page | *Export PDF*, *Export Facts* |

*Add Item* offers the type's next code (`P1`, then `P2`; `V`, `M` and `E` for the others) and keeps it in step while you change the type, until you type your own; a code is unique. Every change to the items redraws the CMF page, if the document has one.

A placed drawing or detail is a Top detail view on `LAYOUT::DETAILS`, named after it and centred on it where you click, its outline following the cursor, and locked at the scale chosen. *Largest That Fits* takes the largest scale at which it fits a doc page's open area, 15.8 x 8.4": an architectural one, from 12" = 1'-0" down to 1/32" = 1'-0", or an engineering one, from 1" = 20'-0" to 1" = 200'-0", for large plans. The `RENDER` layers are off in it, and so is any other object of the model that would show in it, with *Hide in Detail*. A detail from the library comes into the model the first time it's placed, below everything else there, grouped as *Populate Detail* groups it; placing it again shows the same drawing, so fill in its blanks once. *Remove from Page* takes the view off the page and leaves the model as it is. Editing a drawing's objects places its views again, where they were and at their scales.

A render page shows its render over its sky in the PDF. During the export the sky fills the page and the render fills the page inside its frame, both on `LAYOUT::RENDER`. A render of another shape than the page is cut about its centre to fill it, so a 16:9 render loses a little of each side and no sky shows above or below it; the info panel goes in front of them as a block, since a picture prints over a page's plain objects whatever their draw order. Then they're taken out again, so the model keeps only the choice. The sky covers any detail view on a render page, so keep drawings and details to other pages. Save renders from V-Ray as JPEG: a PNG keeps the sky transparent.

*Export PDF* writes every page to one PDF, in page order, at 300 dpi for anything a page can't print as lines, to the folder you choose, starting from the last one or the project's `design_package` folder. It's named `DESIGN_<project>_v#.pdf`, one version past the highest there, the project being its *PROJECT NAME* once set, or else the project's folder. Nothing is ever written over. *Export Facts* writes `FACTS_<project>_v#.html` the same way: a page to read, print or paste, with the project's name, place, drawing number and date, the client's details, the paint, vinyl and electrical items, and the library details in the model or on a page, by name. It leaves out the drawings and the materials.

**From model to layout.** The model is the sign, full size in inches, and a layout is a sheet of paper. A detail is a window on the sheet that looks into the model at a scale. The whole path:

1. *Create Project*, then *Populate Model*, then model the sign at the origin facing -Y, on the wall's plane, with its parts on `DESIGN` sublayers and its faces on `DESIGN::ILLUMS`. *Set Material* on `DESIGN` gives the parts their materials.
2. Draw the sign's elevations and plans flat in the Top view, and dimension them in the model with *Standard Dimension*. Where the sign sits on a building, draw the building's plan, elevations and an axonometric too, with the sign as a red box on `DETAILS::2D::SIGN-LOCATION`.
3. In the *Layout Manager*: *Create Document*, then *Edit Details* for the project and client, *Add Info Page*, and *Add Page* for each view. Add the colors, materials and electrical requirements under *CMF*, and *Add CMF Page*.
4. Save each elevation or plan as a drawing and place it on its page, and place the details it needs from the library. Fill in a detail's blanks in the model.
5. Frame the view on the sign, close enough that it reads, with the sign clear of the sides the page trims, then render with a right click on the render buttons, and give each render page its image with *Set Render*.
6. *Export PDF*.

**A detail by hand.** Rhino's own `Detail` command works too, on `LAYOUT::DETAILS`. Set the detail's scale in its Properties and lock it; unlocked, a detail you double click into zooms with the mouse wheel. To hide a layer in it, double click into it, right click the layer in the Layers panel and choose *Layer Off in this Detail Only*. Dimension in the model, in a model viewport or inside a detail: a dimension drawn while the page itself is active belongs to the page. In a detail at any scale, Rhino prints the Alexandria styles at their paper sizes, so one style serves every scale.

| If you see | It's because | Then |
|---|---|---|
| A detail zoomed or moved since | It was left unlocked | Set the scale again and lock it |
| Dimensions printed small (an eighth of their size at 3/8" = 1'-0") | A saved view was restored into the detail, and Rhino treats it as a model view until it's been double clicked into. Less often, *Enable layout space scaling* is off in *Document Properties > Annotation Styles* | Double click into the detail and out. Or turn the setting on, as Rhino's templates have it |
| A Top detail grey all over | `RENDER` is on in it | Turn the `RENDER` layers off in it |
| A drawing shows objects it shouldn't | They were added after it was placed | *Edit Drawing* and Enter, which places its views again |

## Projects

`project_template/` is what *Create Project* copies for a new design project, under the name and in the folder the user gives, before saving the open model in its models folder as `<project>_model_v1.3dm`, the project's name with underscores for spaces. The model's *PROJECT NAME* becomes the project's name unless it's set already. The build ships it in the package's `shared/` folder, and the release also puts a copy in the shared Alexandria packages folder. The template alone names a project's folders: the tools find the models, renders, package and reference folders by that word in their names (`design_models`, `design_renders`, `design_package`, `reference_material`), so renaming one in the template is enough, and the build stops if a word is in no folder or in two. It holds `design_models`, `arch_drawings`, `reference_material`, `design_sketches`, `design_renders` and `design_package`, with `BRIEF.md` for what's particular to the project. `.claude/CLAUDE.md` tells an agent working there to put the user's request first, then the brief, then these standards, to use the Alexandria tools where they fit, and to do only what's asked, and describes what a finished design package looks like. Beside it, `.claude/layout_template.pdf` is a copy of `layout_docs/sign_package_template.pdf`, the layout template's pages, which the build refreshes when the export changes. It's a framework: anything particular to a project goes in the brief, not the template.

## Toolbar

**One file per button**, `toolbar/<snake_name>.py`, Python 3 (`#! python3`) with a docstring whose first line becomes the button's help text, and a `main()` run under `if __name__ == "__main__":`. A script acts on `Rhino.RhinoDoc.ActiveDoc`, prints one line saying what it did, and never raises. When it can't act (no V-Ray, an unsaved model), it says why and stops.

**Panels.** Rhino keeps its panel layout per version and doesn't carry it to a new one. Right clicking *Alexandria Setup* runs *Set Panels*, which makes the strip holding the Layers panel match `standards/panels.txt`: panels that aren't listed close, and a name that Rhino doesn't have is skipped and reported. It's separate from *Alexandria Setup* itself so that an update never rearranges anyone's panels.

**One command per button.** `tools/build.py` compiles each script into a command of the Alexandria Rhino Tools plugin, named `Alexandria…` (its `COMMANDS` table), and each button's macro runs that command. A right-click variant is a command of its own that sets `MODE` before the script runs; the script reads it with `globals().get("MODE", <default>)`. A new button needs its script, an entry in `GROUPS` in `make_toolbar.py` and one in `COMMANDS` in `build.py`; the build stops if a button names a command it doesn't compile. `GROUPS` keeps the buttons in the order of work, with Rhino's divider between groups: project, model, render, standard drawings (details and blocks, ready-made drawings the model takes in), drawings and layout, files. Each group's icons draw in its own accent colour (`ACCENTS`): orange, green, gold, violet, blue and slate, so the groups read as bands. Put a new button in the group it serves, or fold it into an existing one as a right click or a part of the *Layout Manager*.

**One language.** A tooltip names what the click does, verb first: *Apply Day Settings*, *Render Day and Save*, *Set Panels*. A window has its list, its options and then its buttons, verb first and right-aligned, with *OK* or *Close* last, and says what it did above the buttons and on the command line as `<Tool>: <what happened>.` A name asked for is checked as it's typed, and OK waits for one that works. A button's help text is its script's first docstring line, `<Tool>: <does what>.`

**Self-contained.** Each command carries its own copy of its script, so a script can't import its neighbours. Helpers shared between buttons are copied verbatim, as in `src/`. Files a command needs ship in the package's `shared/` folder, found from the plugin's path (`PlugIn.PathFromId`), as *Alexandria Setup* finds the display modes. Every script still runs straight from the repo with `_-RunPythonScript`.

**Icons** are drawn by `make_toolbar.py` in the Phoenix palette and saved to `toolbar/icons/`, and the toolbar is written to `toolbar/alexandria_tools.rui`, which the build ships in the package's `shared/` folder as `Alexandria Tools.rui`. *Alexandria Setup* copies it to `UI\Plug-ins\` in Rhino's data folder, opens it there and adds the toolbar as a tab of Rhino's Standard toolbars, and every command's `_toolbar_file` keeps that copy current. Rhino can write the toolbar it holds in memory back over that file when it closes, so a copy made while the toolbar is open doesn't last. So Setup closes the toolbar and opens it again from the current copy, which shows new buttons at once. Closing drops the tab, so Setup notes where it was and puts it back, and the tab keeps its place through updates. The file has no toolbar group, so it never opens a row of its own; Rhino has no public way to add a toolbar to a container, so Setup's `add_tab` uses Rhino.UI's internals and, if a Rhino update changes them, says how to show the toolbar instead. A toolbar named like the plugin would open from the package's versioned folder instead, and Rhino drops it from wherever it was docked at every update. The toolbar's GUIDs are fixed in the generator, so a new version replaces the installed toolbar instead of adding a second one. Run `python tools/make_toolbar.py` after adding a button or changing an icon or a script's first docstring line, then build.

## Sources of Truth

What the tools bring into a model comes from Rhino files, which ship in the Rhino Tools package. Edit the file and build, and the tools follow.

| What | Source | To change it |
|---|---|---|
| Layers, units and tolerances | `standards/layers.3dm` | Edit it and build. Every layer in it reaches every model that clicks *Populate Model* |
| Annotation styles | `standards/alexandria_annotation_styles.3dm` | Edit its styles and build |
| Render backdrop | `standards/render_assets.3dm` | Edit it and build |
| Sign details | `standards/sign_details.3dm` | Edit it and build |
| Design package pages | `standards/layouts.3dm` | Edit it and build |
| Block library | `standards/blocks.3dm` | Edit a block with *BlockEdit*, or add one with a legend instance and its `SIZE` user text, and build |
| New projects | `project_template/` | Edit it and build |
| Display modes | `standards/display_modes/`, exported from Rhino | Change the mode in Rhino, run `tools/export_standards.py`, then build |
| Right-hand panels | `standards/panels.txt` | Edit the list and build. It's one panel or toolbar name per line, top to bottom |
| V-Ray settings and mesh light types | `toolbar/day_render.py`, `night_render.py`, `set_light.py` | Edit the script and build |

The tools name some layers and styles in their code, such as `DETAILS::ANNOTATIONS::DIMENSIONS` and *Alexandria Dimension*, so keep those names: the build stops if one is missing from its file. The tables in this document describe these files, and nothing reads them, so change them along with the file.

The Rhino files are Rhino 8 files. Edit them in Rhino 8, or save one edited in a newer Rhino with `_-SaveAs _Version=8`, as the Standards Manager does. The build stops on a file a newer Rhino saved.

A model already in use keeps what it has until asked. *Populate Model* adds what's missing and sets the annotation styles back to the file's, keeping each style's model space scale, which is set per drawing. A layer's look, a block or a detail already in the model stays as it is. `layouts.3dm` keeps its styles at scale 1 for the same reason, so that scale is the one thing that differs from the styles file.

## Build and Release

1. Edit a script in `src/` or `toolbar/`. To iterate on a component, paste it into a Python 3 Script component; the signature recreates the inputs. A toolbar script runs as it is with `_-RunPythonScript`.
2. Run `tools/build.py` in Rhino 8 (`_-RunPythonScript`). It builds both packages for Rhino 8 (`rh8`), against the latest RhinoCommon 8, each from a script project in `build/` that the Script Editor can open: *Alexandria Grasshopper Tools* from `src/` and *Alexandria Rhino Tools* from `toolbar/`, with the toolbar and display modes added. It copies them to `dist/`, replacing the older ones, and installs them in this Rhino. Rhino 9 installs and runs the same packages.
3. Restart Rhino to load the new build. Placed components update automatically, because they reference the plugin rather than holding a copy of the code. Run *Alexandria Setup* if a button or a display mode changed.
4. To release, commit `dist/` and push `main`. The pre-push hook in `.githooks/` runs `tools/release.py`, which copies the packages in the pushed commit into the shared Alexandria packages folder ([INSTALL.md](/docs/install/)), so a build you haven't committed is never released. Turn the hook on once per clone with `git config core.hooksPath .githooks`; `python tools/release.py` releases `HEAD` by hand, for instance after the share was unreachable during a push. The release then removes the older Alexandria packages, so the folder holds only the current version, alongside copies of `README.md`, `INSTALL.md`, `STANDARDS.md` and the two quick guides from `guides/`, which the Rhino Tools package also carries in `shared/quick_guides/`, and all five as PDFs from `docs/`, for anyone without a Markdown viewer. Git keeps every version: to roll back, run `python tools/release.py <commit>` for the last good commit, and have anyone who already updated reinstall it from the Package Manager. Machines with automatic updates on install the release the next time Rhino starts; the rest find it in the Package Manager's *Updates* tab.
5. Run `python tools/make_site.py` to refresh the docs site in `site/`. It takes ports from the scripts and one-line summaries from the README table, so give every new component a README row. It also copies the annotation styles and a zip of the display modes into `site/downloads/`, and prints the overview in `overview/` to `site/downloads/alexandria_phoenix_overview.pdf` with headless Edge or Chrome. Last it runs `tools/make_guides.py`, which writes the Rhino toolbar and Grasshopper component quick guides from `guides/src/`: one standalone file each in `guides/`, for the release, and the site's copies in `site/guides/`, linked at the top of the front page. The Grasshopper guide reads the README table and the docstrings, so it follows the components; give a new component a 96 px icon in `guides/src/icons/` or it shows its 24 px one. Then `tools/make_pdfs.py` prints README, INSTALL, STANDARDS and both guides to `docs/` as PDFs for the release; it loads marked and the fonts from the web, so run it online. The site is built to the [Hark web standards](https://felipeharker.org/standards/): it links their stylesheet, and its own rules are in `site/assets/site.css`.

The components compile under the name *Alexandria Phoenix*, which becomes the Grasshopper tab and the `.gha`'s name, and the build then renames the package *Alexandria Grasshopper Tools*. Component GUIDs derive from the tab name, so keep it.

`VERSION` holds the release (`major.minor`) of both packages; each build appends a date-based build number, which is how the Package Manager tells a newer build. Bump the minor version for new components, new optional inputs added at the end or new toolbar buttons, and the major version when inputs are removed, renamed or reordered.

Adding an input to an existing component is safe but noisy. Definitions saved before the change report "Input parameter chunk is missing" once when they open, while keeping every wire. Re-saving the definition under the new version clears it.
