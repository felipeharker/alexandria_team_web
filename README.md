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


Everything is at alexdesignlab.org, one short address per tool: `/rhino`, `/grasshopper`, `/estimator` (the app) and `/estimator/guide`. `render.yaml` publishes the one Render site, `alexandria-hub` in the Alexandria project. The Material Estimator itself lives in the alexandria_office repo and its own Render site; a rewrite in `render.yaml` serves it at `/estimator/`, so it deploys from its own repo.

Written by `tools/sync.py`, so edit the source, not these: `src/content/docs/docs/`, `src/generated/`, `src/data/`, `src/styles/guides.css` and `public/guides/icons/`.

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

## Add a page

Add a `.md` or `.mdx` file under `src/content/docs/` with a `title` and `description` at the top, then add it to the sidebar in `astro.config.mjs`. A future Standards section goes in `src/content/docs/standards/`, one page per topic, with screenshots in `src/assets/`.
