// Writes the Phoenix guides site (phoenix.alexdesignlab.org) into dist-phoenix/:
//
//   /             the two guides
//   /rhino/       the Alexandria Tools quick guide (the Rhino toolbar)
//   /grasshopper/ the Alexandria Phoenix quick guide (the Grasshopper tab)
//
//     node tools/build_phoenix.mjs
//
// The guides are the same ones the hub shows: tools/sync.py writes them into src/generated/guides
// from alexandria_phoenix, with their stylesheet (src/styles/guides.css) and icons
// (public/guides/icons). This page frame and src/styles/phoenix.css give them the hub's plain look.
// Render runs it as the phoenix-guides site in render.yaml.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist-phoenix');
const HUB = 'https://alexdesignlab.org';
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const release = JSON.parse(read('src/data/release.json'));

const PAGES = [
	{
		slug: 'rhino',
		nav: 'Rhino tools',
		title: 'Alexandria Tools quick guide',
		description: 'Every button on the Alexandria Tools toolbar in Rhino 8, in the order you use them.',
		body: read('src/generated/guides/rhino.html'),
	},
	{
		slug: 'grasshopper',
		nav: 'Grasshopper components',
		title: 'Alexandria Phoenix quick guide',
		description: "Every component on Grasshopper's Alexandria Phoenix tab, the basic chain, and how they swap.",
		body: read('src/generated/guides/grasshopper.html'),
	},
];

const esc = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function page({ slug, title, description, main }) {
	const nav = PAGES.map(
		(p) => `<a href="/${p.slug}/"${p.slug === slug ? ' aria-current="page"' : ''}>${p.nav}</a>`
	).join('');
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · Alexandria</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/guides.css">
<link rel="stylesheet" href="/assets/phoenix.css">
<script>document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';</script>
</head>
<body>
<!-- Written by tools/build_phoenix.mjs in alexandria_team_web. Edit the guides in alexandria_phoenix. -->
<header class="px-top">
  <a class="px-brand" href="${HUB}/">Alexandria</a>
  <span class="px-sep" aria-hidden="true">/</span>
  <a class="px-site" href="/">Phoenix</a>
  <nav aria-label="Guides">${nav}</nav>
</header>
<main class="px-main">
${main}
</main>
<footer class="px-foot">
  <span>Alexandria ${release.version} · Rhino 8 for Windows</span>
  <a href="${HUB}/start/download/">Download</a>
  <a href="${HUB}/docs/install/">Install and update</a>
  <a href="${HUB}/">Alexandria hub</a>
</footer>
</body>
</html>
`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });

for (const p of PAGES) {
	const main = `<h1 class="px-title">${esc(p.title)}</h1>\n<div class="px-guide">${p.body}</div>`;
	mkdirSync(join(OUT, p.slug), { recursive: true });
	writeFileSync(join(OUT, p.slug, 'index.html'), page({ ...p, main }));
}

const cards = PAGES.map(
	(p) => `<a class="px-card" href="/${p.slug}/"><b>${esc(p.title)}</b><small>${esc(p.description)}</small></a>`
).join('\n');
writeFileSync(
	join(OUT, 'index.html'),
	page({
		slug: '',
		title: 'Alexandria Phoenix',
		description: 'The quick guides to the Alexandria Rhino toolbar and Grasshopper components.',
		main: `<h1 class="px-title">Alexandria Phoenix</h1>
<p class="px-lede">The quick guides to the Rhino toolbar and the Grasshopper components. Downloads, install steps and the standards are on the <a href="${HUB}/">Alexandria hub</a>.</p>
<div class="px-cards">
${cards}
</div>`,
	})
);

cpSync(join(ROOT, 'src/styles/guides.css'), join(OUT, 'assets/guides.css'));
cpSync(join(ROOT, 'src/styles/phoenix.css'), join(OUT, 'assets/phoenix.css'));
cpSync(join(ROOT, 'public/guides/icons'), join(OUT, 'guides/icons'), { recursive: true });
cpSync(join(ROOT, 'public/favicon.svg'), join(OUT, 'favicon.svg'));
writeFileSync(join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const FONTS = [
	['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter.woff2'],
	['@fontsource-variable/oswald/files/oswald-latin-wght-normal.woff2', 'oswald.woff2'],
	['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2', 'plex-mono-400.woff2'],
	['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 'plex-mono-500.woff2'],
];
mkdirSync(join(OUT, 'fonts'), { recursive: true });
for (const [from, to] of FONTS) cpSync(join(ROOT, 'node_modules', from), join(OUT, 'fonts', to));

console.log(`wrote dist-phoenix/: /, ${PAGES.map((p) => '/' + p.slug + '/').join(', ')}`);
