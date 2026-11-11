# Alexandria hub

Read README.md first. A Starlight site for the office's Alexandria tools; the audience is designers, not developers.

- Never edit what `tools/sync.py` writes (listed in the README): change it in `../alexandria_phoenix` and run the sync.
- One style for everything: `src/styles/theme.css`. Clean and simple: greys, one green (for buttons and the Beta tag only), and colour only where it codes something (the toolbar groups in the guides). No decorative stripes, display type or effects. Reuse its tokens and `ax-` parts; guides use the quick guides' `qg-` classes from `src/styles/guides.css`. The Material Estimator (in `../alexandria_office`) uses the same values.
- Keep every page `noindex`, and keep the hub out of the public docs site and the portfolio until it's secured.
- The release zip is uploaded to GitHub releases, never committed (`release/` is ignored).
- Write plainly and briefly, for someone opening Rhino, not reading code.
