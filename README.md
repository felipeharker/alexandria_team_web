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
| `src/guides/` | The web tools' quick guides, one HTML file each (see The Quick Guides below). |
| `src/nav.ts` | The pages that have no sidebar entry, and the page that lists each (see The Sidebar below). |
| `src/tools.ts` | The home page's tools, by category: its index strip and its sections are drawn from this list. |
| `tools/sync.py` | Brings in everything that comes from `alexandria_phoenix` and the shared packages folder. |


Everything is at alexdesignlab.org, one short address per tool: `/rhino`, `/grasshopper`, `/colors` (the app) and `/colors/guide`. `render.yaml` publishes the one Render service, `alexandria-gate`. The office tools live in the alexandria_office repo; the gate fetches them, so they still deploy from their own repo.

**The sidebar** (2026-11-23) holds sections, not single things: sixteen entries, all in view. An entry is a page, and a page that holds several things lists them itself: a tool category lists its tools (`tools/*.mdx`), Quick Guides every guide (`guides/index.mdx`), Suppliers the suppliers, Templates the templates, Documentation the documents, Downloads every file. So a new tool, guide, supplier, template or download is added to its page, never to the sidebar. The pages under those have no entry of their own: `src/nav.ts` names the page that lists each, `src/routeData.ts` highlights that page's entry, and `src/components/PageTitle.astro` puts a link back to it above the title.

**The quick guides.** A web tool's guide (`src/guides/<tool>.html`, shown by `Guide.astro`) is a drawing of the tool's screen with numbered dots: point at a dot for the control's name, click it for what it does, in a panel that opens under the drawing; then a short list of steps, each with the dots it uses. `src/guides/vectorizer.html` is the pattern and `Guide.astro`'s top comment has the markup's rules. The drawing shows the tool as it is, label for label, so check a guide against its tool's `index.html` (in alexandria_office) whenever the tool changes. Words are kept few: one line per dot, a fact said once, no tips lists. The Rhino and Grasshopper guides come from alexandria_phoenix through `tools/sync.py` and stay static, as they also ship as files and PDFs.

**Off the site, on the shelf** (2026-11-23, not ready for the team): the Sign Package Maker, the Material Estimator and the Material Library. No page, menu, search or guide names them: their cards, category sheets, Quick Guides and First Day rows, CSV template pages and files, and their lines in What's New, Troubleshooting and Office Tools are gone, and `tools/sync.py` no longer copies the two CSV templates. They are still in alexandria_office and the gate still serves them (`sign-package`, `estimator` and `materials` in `OFFICE_TOOLS` in `server/gate.mjs`), so the one page that lists them can open them: **the shelf**, `/shelf/` (`src/content/docs/shelf/`), unlisted like the management pages, out of the sidebar, the search and the sitemap. Each one's guide is a page under it (`/shelf/estimator/` and so on), from the same `src/guides/*.html`; their drawings are still in `ToolArt.astro`. To put a tool back: its card in `src/tools.ts`, its sheet on its category page, its rows on Quick Guides and Your First Day, its guide's page at `<tool>/guide.mdx`, and off the shelf. To shelve another, the reverse, as the shelf's own top comment lists. Etch Text took sheet number F-03 when the two material tools left Fabrication.

**Off the toolbar:** the Layout Manager and the Fabrication Manager (2026-11-23, not ready for the team). They stay in alexandria_phoenix, in `dev_tools/` on Felipe's private Alexandria Dev tab, and are out of the released Alexandria Rhino Tools package. The Rhino quick guide, Alexandria Phoenix, Install and Standards pages come from alexandria_phoenix through `tools/sync.py`, so they follow it; the Sample Project keeps its finished package. alexandria_phoenix's `dev_tools/README.md` says how to put them back.

**Sign-in (2026-11-12).** `server/gate.mjs` is the hub behind a username and passcode: the `alexandria-gate` web service in `render.yaml` (Starter, always on) serves `dist/` and the office tools to the people in its `HUB_USERS` setting, and only its sign-in page to anyone else. People sign in once at `/signin` and stay signed in on that browser for 30 days (`/signout` ends it); the cookie is signed with `SESSION_SECRET`, which Render generates. The office tools come from the private alexandria_office repo through `server/office.mjs`, which reads it with `GITHUB_TOKEN` (read-only, that repo only) at build time and then every two minutes, so a push there still shows up on its own. Both settings live in the service's Environment on Render, never in this repo. To add or remove someone, edit `HUB_USERS` there (`name:passcode, name:passcode`) and save.

**Typical Signage Types** (the Wiki, `/wiki/signage-types`) shows each sign type in the detail library as a letter A lit at night beside its detail. In `public/wiki/signage-types/`: the drawings (`DTL-NN.svg` and `.pdf`) come from alexandria_phoenix's `docs/details/` through `tools/sync.py` (printed there in Rhino by its `tools/make_details.py`); the renders (`DTL-NN.jpg`) from `python tools/render_signs.py`, which screenshots `tools/sign_types/render.html` (three.js, from jsDelivr) in headless Chrome; and the Rhino model (`typical_signage_types.3dm`) from `tools/sign_types/make_model.py`, run in an empty Rhino 8 model. The render page and the model script build the same letters, so change both.

**The supplier pages** (the Wiki, `/wiki/suppliers/`) are one page per supplier, Matthews Paint, Sherwin-Williams, Pantone, 3M Films and Eastern Metal Supply. They are tables and little else, all with the same parts in the same order: a sentence and three facts, Products, Colors (or Sign Parts and Sheet Stock for a metal supplier), Documents. Nothing is written in the pages themselves: the words and the small tables are in `src/suppliers/sheets.json`, which is edited by hand, and the long charts are groups of `src/suppliers/<supplier>.json`, which `python tools/suppliers/extract.py <folder>` reads out of the suppliers' own documents (it needs poppler, Pillow and numpy, and only when a document is replaced). `SupplierIntro.astro`, `SupplierSection.astro` and `SupplierDocuments.astro` show them. Each supplier also has a **supplier sheet**, a PDF of the same data in the Alexandria Design Lab standard (`public/wiki/suppliers/<supplier>.pdf`, numbered S-01 on): run `python tools/suppliers/sheets.py` after either file changes (it prints with headless Chrome). The suppliers' own documents are other people's, so they stay out of this public repository: they live in the private alexandria_office repo, in `public/sources/suppliers/`, and the gate serves them at `/sources/suppliers/` to people who are signed in. In the sidebar the pages sit in the Wiki under Paint/Vinyl or Materials.

**The management pages** (`/management/`, added 2026-11-20) are unlisted: they are in no menu, out of the search (`pagefind: false`), and nothing on the hub links to them, though anyone signed in can open one by its address. `/management/` lists them and gives the CSV standard they share: Account Migration (`/management/accounts/`), Project Work and Assignments (`/management/work/`) and Development and Project Roadmap (`/management/roadmap/`). Each page is one CSV file shown as a table by `ManagementTable.astro`, in the supplier pages' table, with the file's columns listed under it. The files are the office's own records, so they stay out of this public repository: they live in the private alexandria_office repo, in `public/management/`, and the gate serves them at `/management/<file>.csv`. A page reads its file in the browser each time it opens, so a change pushed to alexandria_office shows within two minutes, with no deploy here. **Parents and sub-tasks** (2026-11-23): a file with a Parent column (roadmap.csv) nests each row under the row it names; a file without one (work.csv) folds the rows that share a project under it. Sub-tasks start folded under their parent, which shows its progress and links to its dashboard, `/management/dashboard/?roadmap=<slug>` (`dashboard.mdx`, `ManagementDashboard.astro`): done, late, start and end, a status bar, a timeline and the sub-tasks. The shared reading and drawing is `src/management.ts`. The roadmap follows the planning board: rows with an Issue take their fields and parents from Project 14 through alexandria_management's `planning/sync_roadmap.py`. For a new table, add its file there, a page in `src/content/docs/management/` with its columns, and a row on `/management/`.

**Downloads** (the Wiki, `/wiki/downloads`) lists every file there is to download, as tables: the release, the fonts, the templates, the models and details, and the supplier sheets. When a page gains a file to download, add its row there. **Alexandria Etch**, the office's single-line font for etched part labels, has its own page (`/wiki/downloads/etch-font`) and its files in `public/downloads/etch-font/`: copies of alexandria_phoenix's `etch_font/` (the specimen as `alexandria_etch_specimen.pdf`, and a zip of them all with that folder's README), to copy again when the font changes. `src/etchFont.ts` draws text in the font from the copied `alexandria_etch.json`, for that page's specimen and the home page's Etch Text card. Etch Text itself (`/etch-text`) is in alexandria_office, with its own copy of the JSON. The **Claude connectors** row is the installer of the Claude connectors (MCP) for Rhino and CorelDRAW, for a PC without Rhino: `public/downloads/claude-connectors/alexandria_claude_connectors.zip`, which `tools/sync.py` zips from alexandria_phoenix's `claude_connectors/` folder. With Rhino, Alexandria Setup runs the same installer from the package.

Written by `tools/sync.py`, so edit the source, not these: `src/content/docs/docs/`, `src/generated/`, `src/data/`, `src/styles/guides.css`, `public/guides/icons/`, the drawings in `public/wiki/signage-types/` and `public/downloads/claude-connectors/`.

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

Add a `.md` or `.mdx` file under `src/content/docs/` with a `title` and `description` at the top, then list it on the page of the section it belongs to (see The Sidebar above), and give it that page as its parent in `src/nav.ts`. Only a new section goes in the sidebar in `astro.config.mjs`. A future Standards section goes in `src/content/docs/standards/`, one page per topic, with screenshots in `src/assets/`.
