# Alexandria hub

The office's one place for Alexandria: the latest release to download, the quick guides for the Rhino tools, the Grasshopper components and the office tools, the documentation and standards, and reference links. Built with [Starlight](https://starlight.astro.build) (Astro), published by Render.

Public for now, but kept out of search engines (`noindex` on every page and in `robots.txt`). Securing it behind a sign-in comes later.

## Where things are

| Path | What |
|---|---|
| `src/content/docs/` | The pages, one Markdown or MDX file each. The file's path is its address: `start/download.mdx` is `/start/download/`. |
| `astro.config.mjs` | The sidebar, the site's title and the stylesheets. |
| `src/styles/theme.css` | The Alexandria style: colours, type and every `ax-` part (cards, the release card, What's new, link lists). |
| `src/components/` | The release card, What's new, the hub's cards, and the wrapper the guides sit in. |
| `src/guides/` | Guides written for the hub (the Material Estimator's). |
| `tools/sync.py` | Brings in everything that comes from `alexandria_phoenix` and the shared packages folder. |


Everything is at alexdesignlab.org, one short address per tool: `/rhino`, `/grasshopper`, `/estimator` (the app) and `/estimator/guide`. `render.yaml` publishes the one Render service, `alexandria-gate`. The office tools live in the alexandria_office repo; the gate fetches them, so they still deploy from their own repo.

**Sign-in (2026-11-12).** `server/gate.mjs` is the hub behind a username and passcode: the `alexandria-gate` web service in `render.yaml` (Starter, always on) serves `dist/` and the office tools to the people in its `HUB_USERS` setting, and only its sign-in page to anyone else. People sign in once at `/signin` and stay signed in on that browser for 30 days (`/signout` ends it); the cookie is signed with `SESSION_SECRET`, which Render generates. The office tools come from the private alexandria_office repo through `server/office.mjs`, which reads it with `GITHUB_TOKEN` (read-only, that repo only) at build time and then every two minutes, so a push there still shows up on its own. Both settings live in the service's Environment on Render, never in this repo. To add or remove someone, edit `HUB_USERS` there (`name:passcode, name:passcode`) and save.

**Typical Signage Types** (the Wiki, `/wiki/signage-types`) shows each sign type in the detail library as a letter A lit at night beside its detail. In `public/wiki/signage-types/`: the drawings (`DTL-NN.svg` and `.pdf`) come from alexandria_phoenix's `docs/details/` through `tools/sync.py` (printed there in Rhino by its `tools/make_details.py`); the renders (`DTL-NN.jpg`) from `python tools/render_signs.py`, which screenshots `tools/sign_types/render.html` (three.js, from jsDelivr) in headless Chrome; and the Rhino model (`typical_signage_types.3dm`) from `tools/sign_types/make_model.py`, run in an empty Rhino 8 model. The render page and the model script build the same letters, so change both.

**The supplier pages** (the Wiki, `/wiki/suppliers/`) are one page per supplier, Matthews Paint, Sherwin-Williams, Pantone, 3M Films and Eastern Metal Supply. They are tables and little else, all with the same parts in the same order: a sentence and three facts, Products, Colors (or Sign Parts and Sheet Stock for a metal supplier), Documents. Nothing is written in the pages themselves: the words and the small tables are in `src/suppliers/sheets.json`, which is edited by hand, and the long charts are groups of `src/suppliers/<supplier>.json`, which `python tools/suppliers/extract.py <folder>` reads out of the suppliers' own documents (it needs poppler, Pillow and numpy, and only when a document is replaced). `SupplierIntro.astro`, `SupplierSection.astro` and `SupplierDocuments.astro` show them. Each supplier also has a **supplier sheet**, a PDF of the same data in the Alexandria Design Lab standard (`public/wiki/suppliers/<supplier>.pdf`, numbered S-01 on): run `python tools/suppliers/sheets.py` after either file changes (it prints with headless Chrome). The suppliers' own documents are other people's, so they stay out of this public repository: they live in the private alexandria_office repo, in `public/sources/suppliers/`, and the gate serves them at `/sources/suppliers/` to people who are signed in. In the sidebar the pages sit in the Wiki under Paint/Vinyl or Materials.

Written by `tools/sync.py`, so edit the source, not these: `src/content/docs/docs/`, `src/generated/`, `src/data/`, `src/styles/guides.css`, `public/guides/icons/` and the drawings in `public/wiki/signage-types/`.

## After an Alexandria release

Once `tools/release.py` in alexandria_phoenix has filled the shared folder, from here:

```bash
python tools/sync.py --publish
```

That refreshes the docs pages, the two Rhino and Grasshopper quick guides, What's new and the release facts, zips the shared folder as it is, and uploads the zip as a GitHub release, which the Download button links to. Then commit and push: Render rebuilds the site. Without `--publish` it does everything but the upload.

## Run it

```bash
npm install
```

```bash
npm run dev
```

The dev server runs at http://localhost:4321. Search works only in a build (`npm run build`, then `npm run preview`).

To try the whole site as the gate serves it, office tools and sign-in included, build it, then run
`node --env-file=<file> server/gate.mjs` with `PORT`, `HUB_USERS` and `OFFICE_DIR=../alexandria_office` in the file: the
office tools then come from that checkout as it is, on whatever branch it's on, instead of from GitHub.

## Add a page

Add a `.md` or `.mdx` file under `src/content/docs/` with a `title` and `description` at the top, then add it to the sidebar in `astro.config.mjs`. A future Standards section goes in `src/content/docs/standards/`, one page per topic, with screenshots in `src/assets/`.
