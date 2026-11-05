---
title: "Alexandria Phoenix"
description: "Every Grasshopper component and Rhino button, the master definition and how the repo is laid out."
---

<!-- Written by tools/sync.py from alexandria_phoenix/README.md. Edit it there and run the sync, not this page. -->

Modular Grasshopper components for the logic that comes up on every project: grids in a region, attractor remaps, value-driven transforms, culls and previews. Built for Rhino 8 as a compiled Grasshopper plugin, from plain Python 3 scripts kept in this repo.

The successor to *Alexandria*. Docs: https://alexandria.felipeharker.org

## Components

| Subcategory | Component | Nickname | Does |
|---|---|---|---|
| Grid | Square Grid in Region | SqGrid | Square cells, centred on a closed planar region and trimmed to it |
| Grid | Hex Grid in Region | HexGrid | Pointy-top hexagons, centred and trimmed the same way |
| Grid | Rectangle Grid in Region | RectGrid | Rectangular cells |
| Grid | Triangle Grid in Region | TriGrid | Equilateral triangles in alternating rows |
| Grid | Diamond Grid in Region | DiaGrid | Interlocking diamonds |
| Grid | Brick Grid in Region | BrickGrid | Running-bond courses with an adjustable shift |
| Grid | Panel Grid in Region | PanelGrid | Exact-size panels with closers at the edges and open joints |
| Voronoi | Attractor Seeds | AttrSeeds | One seed per cell, pulled from its centroid toward attractor curves |
| Voronoi | Jitter Seeds | JitSeeds | One seed per cell, at a random point inside it |
| Voronoi | Scatter Seeds | ScatSeeds | Evenly scattered random seeds in a region, optionally pulled toward curves |
| Voronoi | Voronoi in Region | VoroRegion | Voronoi cells from any seeds, trimmed to a region |
| Geometry | Region Trim | Trim | Splits curves into what lies inside and outside a region, keeping closed curves closed |
| Geometry | Plane Bounds | Bounds | Bounding rectangle and box square to any plane, for stock sizes |
| Remap | Point Remap | PtRemap | Distance to the nearest attractor point, remapped to a domain |
| Remap | Curve Remap | CrvRemap | Distance to the nearest attractor curve, remapped to a domain |
| Remap | Image Remap | ImgRemap | Image brightness under each item, remapped to a domain |
| Remap | Random Values | RandVal | One seeded random value per item |
| Remap | Value Remap | ValRemap | Any number list remapped to a domain |
| Remap | Blend Values | BlendVal | Two value fields combined by average, min, max or multiply |
| Remap | Step Values | StepVal | Values snapped to a step, with a type index per distinct size |
| Transform | Scale by Values | ScaleVal | Scales each item about its own centroid by its matching value |
| Transform | Rotate by Values | RotateVal | Rotates each item about its own centroid by its matching angle |
| Transform | Offset by Values | OffsetVal | Insets or grows each closed curve by its matching distance |
| Cull | Percent Cull | PctCull | Randomly removes a share of the items on one side of a value threshold |
| Pattern | Lattice Pattern | Lattice | A chord lattice inside every cell, picked with one index |
| Pattern | Voronoi Pattern | VoroPatt | A Voronoi subdivision of every cell, picked with one index |
| Fabricate | Fold Cells | Fold | Folds cells up along creases into flaps, wedges or pyramids |
| Fabricate | Unfold | Unfold | Flattens folded geometry into cut and score lines |
| Fabricate | Panel Tabs | PanelTabs | Flat blank of a folded panel: face, folds and tabs, plus creases |
| Fabricate | Frame Slots | FrameSlots | The frame slots that line up with Panel Tabs |
| Display | Material Preview | Preview | Shaded preview in a chosen colour and opacity |
| Document | Layer Geometry | LayerGeo | Live geometry from a Rhino layer, updating as the layer changes |
| Document | Bake to Layer | Bake | Bakes branches onto named, coloured layers, replacing on each press |
| Document | Export Parameters | ParamOut | Writes the canvas's inputs to a CSV, one section per variant |
| Document | Apply Parameters | ParamIn | Sets the canvas's inputs from that CSV |
| Utility | Feet Inches | FtIn | Lengths as architectural feet and inches |

Components that do the same job share the same inputs and outputs: any grid feeds any remap, transform, cull or pattern; any remap feeds Scale, Rotate, Offset and Cull.

## Install

Two packages, installed from the Package Manager of Rhino 8 out of the office's shared Alexandria packages folder. **[INSTALL.md](/docs/install/)** covers installing, updating and moving from the old install.

| Package | Adds |
|---|---|
| Alexandria Grasshopper Tools | The components, on the **Alexandria Phoenix** tab |
| Alexandria Rhino Tools | The Alexandria Tools toolbar and its commands, and the DM display modes |

## Alexandria Tools

A Rhino 8 toolbar for drawing and rendering, from the Alexandria Rhino Tools package. Each button runs one of the package's commands, grouped in the order of work with a divider between groups: project, model, render, standard drawings, drawings and layout, files. Type `AlexandriaSetup` once after installing: it adds the toolbar as a tab of Rhino's Standard toolbars, after the first tab, from a fixed path in Rhino's UI folder, so the tab stays wherever you drag it through updates, and installs the display modes.

| Group | Button | Does |
|---|---|---|
| Project | Alexandria Setup | Adds the Alexandria Tools tab, imports the DM display modes that ship in the package, and closes older Alexandria toolbars. Right click, *Set Panels*: arranges Rhino's right-hand panels to the standard, which Rhino doesn't carry over to a new version |
| | Create Project | Asks for a project name, then opens a folder browser. Copies the project template there as a folder of the project's name and saves the open model in its models folder, `design_models` as the template names it, as `<project>_model_v1.3dm`, spaces as underscores, where you carry on working in the new copy. The model's project name, on its project info page, becomes the project's. The file it came from stays as it was. Never writes over an existing folder |
| Model | Populate Model | Sets a model up to the standard: inches and the standard tolerances if it's empty, the `DESIGN` and `DETAILS` layers, the Alexandria annotation styles, the render backdrop (a wall, a modeled ground and a scale figure, each on its `RENDER::` layer with its material) and the world light |
| | Set Material | Lists the layers with sublayers and gives each sublayer of the one you choose a Rhino Plaster material in its display colour, named `MAT_1`, `MAT_2` and on in layer order, after any `MAT_#` another parent's sublayers have. Replaces any material the sublayer or its objects had; leaves `DESIGN::ILLUMS` alone |
| | Set Light | Select surfaces, solids or meshes and choose a light: front lit channel, reverse lit channel, push through body or push through face. They become that type's V-Ray mesh light, shared by every object of the type, on its sublayer of `DESIGN::ILLUMS`, so the render settings switch them |
| Render | Apply Day Settings | Sets V-Ray to the bright day: the light blue sky of the design package as the background, neutral light, the world light at 0.0625, the sun off and 4K output. Every custom V-Ray light goes off, and Set Light's mesh lights go down to daylight so their faces stay in the render, unlit. Right click, *Render Day and Save*: does this, asks whether to *Save with sky* (a JPEG with the sky, or else a PNG with a transparent background), then where to save the render, starting at the next `day_#` in the folder used last or the project's `design_renders`, then renders the active view and saves it there |
| | Apply Night Settings | Sets V-Ray to the dark night: the navy to mauve sky of the design package as the background, the same world light and exposure, and neutral light at 5%, so lit sign faces carry the image. Every custom V-Ray light comes back on as it was set up. Right click, *Render Night and Save*: the same, as the next `night_#` |
| Standard drawings | Populate Detail | Lists the sign details in the detail library and adds the 2D drawing of the one you choose to the model where you click, grouped, on the `DETAILS::2D` and `DETAILS::ANNOTATIONS` layers in the Alexandria styles |
| | Populate Block | Lists the blocks in the block library and adds the one you choose where you click: a north arrow, section indicator, numbered or lettered dot callout, graphic scale, person, car or tree. Symbols come in at paper size on a page and at the annotation scale in a model, as grouped linework whose text keeps its paper size, and a callout takes the next number or letter; people, cars, trees and graphic scales come in at true size as blocks |
| Drawings and layout | Standard Dimension | Left click: a dimension in the Alexandria style, on `DETAILS::ANNOTATIONS::DIMENSIONS`. Right click, *Standard Leader*: a leader, on `DETAILS::ANNOTATIONS::CALLOUTS`. Adds any annotation styles the model lacks |
| | Layout Manager | One window for the design package, below: pages, project details, drawings, details, colors and materials, renders, the PDF and the project facts |
| Files | Save as Rhino 7 | Writes a Rhino 7 copy next to the model as `<name>_r7.3dm`. The open model keeps its own name and path |
| | Save as Rhino 8 | Writes a Rhino 8 copy next to the model as `<name>_r8.3dm`. The open model keeps its own name and path |

Each group's icons have their own colour: orange, green, gold, violet, blue and slate.

### Layout Manager

Choose what to manage at the top of the window. Every part works the same way: a list, the options it uses under it, and its buttons at the bottom, with Close last. A button that needs Rhino, for a selection, a click on a page or a file, closes the window until it's done, then opens it again where you were, with what happened written above the buttons. Double click an entry for the part's main button.

| Part | Buttons |
|---|---|
| Document | *Create Document* adds the title page, `TITLE`, and the first doc page, `PAGE 1`, complete in generic info. *Add Page*, *Rename Page* and *Remove Page* manage the pages. A doc page's title, at its top left, is its page name |
| Project Details | *Edit Details* sets the project's and client's details. *Add Info Page* adds the `PROJECT INFO` page after the title: project, client, revisions, copyright and the approval sign-off. Design pages carry no project bar, so drawings and renders get the full width |
| Drawings | Saved selections of your model. *Add Drawing* saves the selected objects under a name, *Edit Drawing* renames one and changes its objects, *Delete Drawing* forgets it. *Place on Page* puts a Top view of it on the chosen page, at the chosen scale, where you click, showing only its objects; *Remove from Page* takes it off again |
| Details | The sign detail library. *Place on Page* adds a detail's 2D drawing to the model, below everything else, the first time, and puts it on the chosen page at the chosen scale where you click. *Remove from Page* takes it off the page |
| CMF | Colors, materials, finishes and electrical requirements. *Add Item*, *Edit Item* and *Remove Item* manage paint, vinyl, material and electrical items, each with a code (`P1`, `V1`, `M1`, `E1`), its specification, finish, where it's used and a swatch colour. *Add CMF Page* adds `COLORS, MATERIALS & FINISHES`, which lists them by type and follows every change |
| Renders | *Set Render* gives a page a render image and a day or night sky, from the Sky option; *Clear Render* takes it away. The PDF shows the render behind the page, cut about its centre to fill it inside the frame |
| Images | *Add Image* puts an image from a file on the chosen page: click one corner, then the opposite one, the outline keeping the image's proportions, or type `@6,0` for 6" wide. It's embedded, on `LAYOUT::IMAGES`. *Remove Image* takes it off |
| Export | *Export PDF* writes every page, in page order, to the folder you choose as `DESIGN_<project>_v#.pdf`, one version past the highest there. *Export Facts* writes the project facts beside it as `FACTS_<project>_v#.html`: the client, the paint, vinyl and electrical items, and the sign details used, by name |

*Largest That Fits*, the default scale, takes the largest architectural scale at which a drawing or detail fits a doc page's open area. Locate a sign on plans and building elevations with a red box on `DETAILS::2D::SIGN-LOCATION`, and add an axonometric of the building with the same box; draw the sign itself only on its own elevations and details.

The render settings change V-Ray's environment, sun, camera and image size, and switch the design's own lighting: every V-Ray light but the world light and the sun. The sky is only ever the background: the objects in front of it get a neutral light, so it doesn't tint them. Only lights change: layers, objects and materials stay as you leave them, so show or hide the wall, ground and scale figure yourself. The drawing and render standards behind the buttons are in [STANDARDS.md](/docs/standards/#drawings).

## Master Definition

`alexandria_phoenix_master_v1.0.gh` with `alexandria_phoenix_master_v1.0.3dm` is the template definition. Along the top it runs a 144 × 96 in region through Square Grid, Curve Remap, Scale by Values and Percent Cull to a Material Preview, and is laid out the way every Phoenix definition should be. See [STANDARDS.md](/docs/standards/).

Below the template, a showcase runs every component in its simplest form: one column per section of the Phoenix tab, in tab order, and one titled row per sample, chained to whatever the sample needs. Each sample works on its own named tile in the `.3dm`, laid out in the same columns, so every preview lands on its own. The section headers and row titles are scribbles, the one exception to the no-scribbles rule, because the showcase is a catalogue rather than a working definition.

| Column | Rows |
|---|---|
| Grid | All seven grids, each on its own region |
| Voronoi | Hex Grid → Attractor Seeds · Hex Grid → Jitter Seeds · Scatter Seeds, each → Voronoi in Region |
| Geometry | Region Trim · Plane Bounds |
| Remap | Layer Geometry → Point Remap + Image Remap → Blend Values → Value Remap → Step Values → Scale by Values |
| Transform | Random Values → Rotate by Values · Offset by Values |
| Cull | Random Values → Percent Cull |
| Pattern | Lattice Pattern · Voronoi Pattern |
| Fabricate | Lattice → Fold Cells → Unfold → Bake to Layer · Panel Tabs → Frame Slots |
| Display | Material Preview |
| Document | Layer Geometry · Export Parameters + Apply Parameters |
| Utility | Feet Inches |

`alexandria_phoenix_master_parameters.csv` holds the canvas's inputs in two sections, `Default` and `Dense`: set Section and press Apply to switch between them. `alexandria_phoenix_master_image.png` is the picture Image Remap reads, and Bake writes the unfolded sheet onto the `Cut` and `Score` layers. The master is a live canvas that evolves with use; the scripts in `src/` are the source of truth.

## Repository

```
src/<subcategory>/   one Python 3 script per component (the source of truth)
icons/               24 px component icons
toolbar/             one Python 3 script per Alexandria Tools button, its icons and the toolbar file
standards/           the Rhino files the tools draw from: layers, annotation styles, render assets, sign details and layouts (.3dm), and the DM display modes (.ini)
tools/build.py       compiles src/ and toolbar/ into the two packages and installs them
tools/make_icons.py  draws the icon set
tools/make_toolbar.py       builds toolbar/alexandria_tools.rui
tools/export_standards.py   exports the DM display modes from Rhino into standards/
tools/release.py     copies the committed packages to the shared folder, run on push by .githooks/pre-push
tools/make_site.py   writes the docs site's component reference, prints the overview PDF and runs make_guides.py
tools/make_guides.py writes the two quick guides from guides/src/: standalone in guides/, and in site/guides/
tools/make_pdfs.py   prints README, INSTALL, STANDARDS and the quick guides to docs/ as PDFs, for the release
site/                the docs site, published by Render as it is; each page's head carries its share card (Open Graph), and site/sitemap.xml lists the docs, the quick guides and the studies
guides/              the Rhino toolbar and Grasshopper component quick guides, one file each, released beside the docs and carried in the Rhino Tools package
docs/                the PDFs the release puts in the shared folder beside the Markdown, for anyone without a Markdown viewer
overview/            the printed overview, printed to site/downloads/alexandria_phoenix_overview.pdf
dist/                the latest build of both Yak packages
alexandria_phoenix_master_*   the master definition, its parameters CSV and the Image Remap picture
grasshopper_definitions/     studies built to the standard, each .gh with its .3dm (voronoi_studies, modifier_studies)
project_template/    what Create Project copies for a new design project, with its brief, its notes for Claude and the layout template's pages
```

## Development

Edit a script in `src/` or `toolbar/`, run `tools/build.py` inside Rhino 8, which builds the packages and installs them, and restart Rhino. To release, commit and push: pushing `main` copies the committed packages into the shared folder (turn the hook on once with `git config core.hooksPath .githooks`). After adding a toolbar button or changing an icon, run `python tools/make_toolbar.py` before building. The details are in [STANDARDS.md](/docs/standards/#build-and-release).
