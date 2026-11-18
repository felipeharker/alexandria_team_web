// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The Alexandria hub: guides, the latest release, the office tools and the standards, in one place.
// Pages are Markdown or MDX in src/content/docs; the sidebar below is the site's table of contents.
// tools/sync.py writes everything under docs/, src/generated and src/data from alexandria_phoenix.
// Every tool has a short address: /rhino, /grasshopper, /estimator/guide here, and /estimator, /materials (the
// Material Library), /colors (the Color Matcher), /colors/library, /site-plan, /vectorizer, /grid (the Parametric Grid),
// /image-grid (the Image Grid), /braille (the Braille Lettering Designer), /sign-package (the Sign Package Maker) and /etch-text (Etch Text) from the alexandria_office repo,
// served beside these pages by server/gate.mjs.

// Runs in every page's head (see the sidebar notes in `head` below): moves the sidebar's highlight to an
// entry for a section of this page when the address shows that section, and back to the page's own entry
// when it doesn't.
const sidebarSectionHighlight = `document.addEventListener('DOMContentLoaded', () => {
	const links = [...document.querySelectorAll('.sidebar-content a[href]')];
	const page = links.find((a) => a.getAttribute('aria-current') === 'page');
	const trim = (path) => path.replace(/\\/$/, '');
	const mark = () => {
		const section = location.hash && links.find((a) => a.hash === location.hash && trim(a.pathname) === trim(location.pathname));
		const here = section || page;
		if (!here) return;
		for (const a of links) a.removeAttribute('aria-current');
		here.setAttribute('aria-current', 'page');
	};
	mark();
	addEventListener('hashchange', mark);
});`;

// The tag on a category with nothing in it yet (Permitting): grey, where Beta, for a tool you can already use, is
// blue. theme.css draws both.
const alpha = { text: 'Alpha', variant: 'note', class: 'ax-alpha' };

// Also in every page's head: the top sections work as one accordion (user, 2026-11-18). Opening one closes the
// others; the subsections inside it are already open (their groups below are `collapsed: false`).
const sidebarAccordion = `document.addEventListener('DOMContentLoaded', () => {
	const sections = [...document.querySelectorAll('.sidebar-content ul.top-level > li > details')];
	for (const section of sections) {
		section.addEventListener('toggle', () => {
			if (!section.open) return;
			for (const other of sections) if (other !== section) other.open = false;
		});
	}
});`;

export default defineConfig({
	site: 'https://alexdesignlab.org',
	redirects: {
		// the guides' first addresses, from the day the hub went up
		'/guides/rhino-tools': '/rhino/',
		'/guides/grasshopper-components': '/grasshopper/',
		'/guides/material-estimator': '/estimator/guide/',
		// the one page of all the tools, before it became a page per category (2026-11-11); home shows them all
		'/tools': '/',
	},
	integrations: [
		starlight({
			title: 'Alexandria',
			description: 'Tools, guides and standards for Alexandria: the Rhino and Grasshopper tools and the office tools.',
			favicon: '/favicon.svg',
			lastUpdated: false,
			credits: false,
			head: [
				// Public for now, but not for search engines: it's the office's hub.
				{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } },
				// The sidebar (user, 2026-11-11): every top section starts collapsed, only the one holding this page opens,
				// and this page's entry is highlighted. A section's subsections open with it (user, 2026-11-18). Every page has exactly one entry (src/routeData.ts covers the
				// pages that have none). The scripts below are what Starlight can't do on the server.
				// 1. Starlight reopens the groups opened by hand on the last page, from session storage: forget them.
				{ tag: 'script', content: "try { sessionStorage.removeItem('sl-sidebar-state'); } catch {}" },
				// 2. An entry for a section of a page (its address ends in #...) is highlighted while the address
				//    shows that section; otherwise the page's own entry is.
				{ tag: 'script', content: sidebarSectionHighlight },
				// 3. The top sections are one accordion: opening one closes the others.
				{ tag: 'script', content: sidebarAccordion },
			],
			routeMiddleware: './src/routeData.ts',
			customCss: [
				'@fontsource-variable/inter',
				'@fontsource-variable/oswald',
				'@fontsource/ibm-plex-mono/400.css',
				'@fontsource/ibm-plex-mono/500.css',
				'./src/styles/guides.css',
				'./src/styles/theme.css',
			],
			sidebar: [
				{
					label: 'Starting Out',
					collapsed: true,
					items: [
						{ label: 'Your First Day', slug: 'start/first-day' },
						{ label: 'Download', slug: 'start/download' },
						{ label: 'What’s New', slug: 'start/whats-new' },
						{ label: 'Troubleshooting', slug: 'start/troubleshooting' },
					],
				},
				{
					label: 'Quick Guides',
					collapsed: true,
					// The same groups as Tools below, in the same order and under the same names, with a guide where Tools
					// has the tool (user, 2026-11-18). Change the two together.
					items: [
						{
							label: 'Rhino/Grasshopper',
							collapsed: false,
							items: [
								{ label: 'Rhino Tools', slug: 'rhino' },
								{ label: 'Grasshopper Components', slug: 'grasshopper' },
							],
						},
						{
							label: 'Design',
							collapsed: false,
							items: [
								{ label: 'Site Plan', slug: 'site-plan/guide' },
								{ label: 'Vectorizer', slug: 'vectorizer/guide' },
								{ label: 'Braille Lettering Designer', slug: 'braille/guide' },
								{ label: 'Sign Package Maker', slug: 'sign-package/guide' },
							],
						},
						{
							label: 'Parametric',
							collapsed: false,
							items: [
								{ label: 'Parametric Grid', slug: 'grid/guide' },
								{ label: 'Image Grid', slug: 'image-grid/guide' },
							],
						},
						{
							label: 'Fabrication',
							collapsed: false,
							items: [
								{ label: 'Color Matcher', slug: 'colors/guide' },
								{ label: 'Color Library', slug: 'colors/library/guide' },
								{ label: 'Material Estimator', slug: 'estimator/guide' },
								{ label: 'Material Library', slug: 'materials/guide' },
								{ label: 'Etch Text', slug: 'etch-text/guide' },
							],
						},
						// no guides yet: a plain entry with an Alpha tag, as in Tools, and its own short page
						{ label: 'Permitting', slug: 'permitting/guide', badge: alpha, attrs: { class: 'ax-side-section' } },
					],
				},
				// The tools, under one heading with a group per category, as on the home page (user, 2026-11-11 and
				// 2026-11-17). Each category opens with its page (tools/*.mdx, the home section's Details link). The web
				// tools open themselves; the Rhino and Grasshopper packages open on their sections of the category page,
				// as their quick guides already have entries above and a page with two entries would open two groups.
				{
					label: 'Tools',
					collapsed: true,
					items: [
						{
							label: 'Rhino/Grasshopper',
							collapsed: false,
							items: [
								{ label: 'Overview', slug: 'tools/rhino-grasshopper' },
								{ label: 'Alexandria Tools', link: '/tools/rhino-grasshopper/#alexandria-tools' },
								{ label: 'Alexandria Phoenix', link: '/tools/rhino-grasshopper/#alexandria-phoenix' },
							],
						},
						{
							label: 'Design',
							collapsed: false,
							items: [
								{ label: 'Overview', slug: 'tools/design' },
								{ label: 'Site Plan', link: '/site-plan/' },
								{ label: 'Vectorizer', link: '/vectorizer/' },
								{ label: 'Braille Lettering Designer', link: '/braille/' },
								// new, and its DWG hasn't been opened in AutoCAD yet
								{ label: 'Sign Package Maker', link: '/sign-package/', badge: 'Beta' },
							],
						},
						{
							label: 'Parametric',
							collapsed: false,
							// split from Design Tools (user, 2026-11-17): grids of cells, each sized by a rule
							items: [
								{ label: 'Overview', slug: 'tools/parametric' },
								{ label: 'Parametric Grid', link: '/grid/' },
								// new
								{ label: 'Image Grid', link: '/image-grid/', badge: 'Beta' },
							],
						},
						{
							label: 'Fabrication',
							collapsed: false,
							items: [
								{ label: 'Overview', slug: 'tools/fabrication' },
								{ label: 'Color Matcher', link: '/colors/' },
								{ label: 'Color Library', link: '/colors/library/' },
								// still being built
								{ label: 'Material Estimator', link: '/estimator/', badge: 'Beta' },
								// still being filled in
								{ label: 'Material Library', link: '/materials/', badge: 'Beta' },
								// new, and its DXF hasn't been run on the laser or the router yet
								{ label: 'Etch Text', link: '/etch-text/', badge: 'Beta' },
							],
						},
						// A category with no tools yet (user, 2026-11-12): a plain entry with an Alpha tag and no group to
						// open onto nothing (user, 2026-11-18), set like the group names beside it (ax-side-section).
						{ label: 'Permitting', slug: 'tools/permitting', badge: alpha, attrs: { class: 'ax-side-section' } },
					],
				},
				// Everything that isn't starting out, a guide or a tool is a subsection of the Wiki (user, 2026-11-18): the
				// reference pages by subject (Signage, Paint/Vinyl, Materials), then Templates, Downloads, Documentation and External Ref.,
				// which were top sections until then. The Sample Project left the sidebar the same day; its page is still there
				// for Your First Day's link (src/routeData.ts).
				{
					label: 'Wiki',
					collapsed: true,
					items: [
						{
							label: 'Signage',
							collapsed: false,
							items: [
								{ label: 'Typical Signage Types', slug: 'wiki/signage-types' },
							],
						},
						{
							// One page per supplier, all with the same sections (wiki/suppliers/*.mdx, from src/suppliers/sheets.json):
							// paint and colour first, then film.
							label: 'Paint/Vinyl',
							collapsed: false,
							items: [
								{ label: 'Matthews Paint', slug: 'wiki/suppliers/matthews-paint' },
								{ label: 'Sherwin-Williams', slug: 'wiki/suppliers/sherwin-williams' },
								{ label: 'Pantone', slug: 'wiki/suppliers/pantone' },
								{ label: '3M Films', slug: 'wiki/suppliers/3m' },
							],
						},
						{
							label: 'Materials',
							collapsed: false,
							items: [
								{ label: 'Eastern Metal Supply', slug: 'wiki/suppliers/eastern-metal-supply' },
							],
						},
						{
							// "CSV Templates" until 2026-11-17 (user): the pages keep their names, as each is still a CSV file
							label: 'Templates',
							collapsed: false,
							items: [
								{ label: 'Material Estimator', slug: 'templates/estimator' },
								{ label: 'Material Library', slug: 'templates/material-library' },
								{ label: 'Color Matcher', slug: 'templates/color-matcher' },
								{ label: 'Grasshopper Parameters', slug: 'templates/grasshopper' },
							],
						},
						{
							// Every file there is to download, in one place (user, 2026-11-18), and the office's own font
							label: 'Downloads',
							collapsed: false,
							items: [
								{ label: 'All Downloads', slug: 'wiki/downloads' },
								{ label: 'Alexandria Etch Font', slug: 'wiki/downloads/etch-font' },
							],
						},
						{
							label: 'Documentation',
							collapsed: false,
							items: [
								{ label: 'Install and Update', slug: 'docs/install' },
								{ label: 'Alexandria Phoenix', slug: 'docs/phoenix' },
								{ label: 'Office Tools', slug: 'docs/office-tools' },
								{ label: 'System Architecture', slug: 'docs/architecture' },
								// Standards (docs/standards, from STANDARDS.md) stays built for the Phoenix docs' links, but out of the
								// sidebar until it covers the office's standards beyond the Rhino tools (user, 2026-11-05).
							],
						},
						{
							label: 'External Ref.',
							collapsed: false,
							items: [
								{ label: 'Links', slug: 'reference/links' },
							],
						},
					],
				},
			],
		}),
	],
});
