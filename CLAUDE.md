# Alexandria hub

Read README.md first. A Starlight site for the office's Alexandria tools; the audience is designers, not developers.

- Never edit what `tools/sync.py` writes (listed in the README): change it in `../alexandria_phoenix` and run the sync.
- One style for everything: `src/styles/theme.css`. Clean and simple: greys, one blue (for buttons, the Beta tag and what's under the pointer only: a tool card's edge and halo, a sidebar entry; the Alpha tag is grey), and colour otherwise only where it codes something (the toolbar groups in the guides, the state tags in a management table). No decorative stripes, display type or effects. Reuse its tokens and `ax-` parts; guides use the quick guides' `qg-` classes from `src/styles/guides.css`. The Material Estimator (in `../alexandria_office`) uses the same values.
- Keep every page `noindex`, and keep the hub out of the public docs site and the portfolio until it's secured.
- The release zip is uploaded to GitHub releases, never committed (`release/` is ignored).
- Write plainly and briefly, for someone opening Rhino, not reading code.
