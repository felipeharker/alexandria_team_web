---
title: The Sign Package Maker Stops Asking for a Scale
date: 2026-11-17T14:00
area: Web Tools
---

The [Sign Package Maker](/sign-package/) no longer needs to know what scale a file was drawn at. A drawing goes on the page as large as fits, and one real dimension gives it its size. Reload its page to get the new version.

- **Placeholder dimensions.** A new drawing's dimensions read **X'-X"** in red. Click one you know, type its real length, such as 21'-9", and press Enter: every other dimension on that drawing fills in to match. Type a different length into any of them later and they all follow again. The drawing's **Overall Width** or **Overall Height** does the same.
- **Linework brings its overall dimensions.** An SVG or a PDF that's all lines arrives with its width and height dimensions already drawn, measured across the linework itself, whatever the page it was drawn on. For a picture, **Add Overall Dimensions** draws them.
- **Nothing is assumed.** **Drawn At** is gone. **Use the File's Size** is there for a file that was drawn full size. A red dimension never prints: **Export** lists the drawings still without a real size.
- **Size and place it by hand.** Drag any corner of a drawing to size it; as you move it, it lines up with the page's middle and edges and with the other drawings. A standard scale is now something to hold a drawing at, under **Size on the Page**, not something it needs.
- **View labels and text.** **Add View Label** gives a drawing its own title, such as FRONT VIEW, with its scale or SCALED PROPORTIONALLY under it. The new **Text** tool sets a note with no leader.
- **CMF codes in a callout.** With a callout or text selected, **CMF Code** puts in a code from the package's colors and materials, such as P1.
- **Copies.** Ctrl+D duplicates what's selected, a drawing with its dimensions and callouts. Ctrl+C and Ctrl+V carry it to another page, and **Duplicate Page** copies a whole design page.

A package you saved before opens as it was, its drawings at the scale they had. See the [quick guide](/sign-package/guide/).
