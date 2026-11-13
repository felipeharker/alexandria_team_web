---
title: The Sign Package Maker
date: 2026-11-12T20:00
area: Web Tools
---

A new Design tool at [/sign-package](/sign-package/): the standard sign package, made in the browser from your own drawings and images. It's in beta.

### Sign Package Maker <span class="ax-badge">Beta</span>

For a package whose drawings were made outside Rhino, in CorelDRAW or Illustrator, or sent by an architect: the pages, text, dimensions and callouts come out the same as a package from the Layout Manager.

- **It starts as the template.** The title page, PROJECT INFO, a design page and the CMF page, each 17 x 11 in. Add a design page per view.
- **Your details.** The project, the client, each page's quantity and scope of work, and the client's logo, which goes on the title page as the light grey mark. Anything still empty shows the template's words in red, and **Export** lists it before it writes the PDF.
- **Your drawings.** Add an SVG, a PDF or an image, or drop it on the page. An SVG or a PDF goes on at a standard scale, the largest that fits unless you pick another. A picture takes a scale once you type the real width it shows.
- **Dimensions and callouts, to the standard.** A dimension takes two points and a side, and reads the drawing's real size in feet and inches, such as 21'-9". A callout takes a point and a place for its text. The font, size, color and line weight are the standard's: there's nothing to set.
- **Colors, materials and finishes.** Paint, vinyl, materials and electrical, coded `P1`, `V1`, `M1` and `E1`, each with a swatch, listed on the CMF page.
- **Export PDF** writes `DESIGN_<project>_v#.pdf`. Lines stay lines and text stays text.
- **Linework at 1:1.** One drawing's lines at full size, in inches, as a DXF like the Fabrication Manager's, a DWG, or a PDF, to bring artwork into Rhino or CorelDRAW at its true size. The fab team still cuts from the Fabrication Manager's files.
- **Save Package File** keeps the whole package, drawings included, in one file to store with the project or open on another computer.

Two things to know while it's in beta. The title page's company name is set in Futura Bk BT only once you press **Use Futura from This Computer** under Export, in Chrome or Edge; until then it's in a close stand-in. And its DWG files have been checked in Rhino but not yet in AutoCAD: if AutoCAD asks to recover one, use the DXF.

See its [quick guide](/sign-package/guide/).
