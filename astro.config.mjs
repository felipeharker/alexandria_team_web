// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// The Alexandria hub: guides, the latest release, the office tools and the standards, in one place.
// Pages are Markdown or MDX in src/content/docs; the sidebar below is the site's menu.
// tools/sync.py writes everything under docs/, src/generated and src/data from alexandria_phoenix.
// Every tool has a short address: /rhino, /grasshopper, /colors/guide here, and /colors (the Color Matcher),
// /colors/library, /site-plan, /vectorizer, /grid (the Parametric Grid),
// /image-grid (the Image Grid), /braille (the Braille Lettering Designer), /etch-text (Etch Text) and /photo-elevation
// (Photo Elevation) from the alexandria_office repo,
// served beside these pages by server/gate.mjs.

export default defineConfig({
	site: 'https://alexdesignlab.org',
	redirects: {
		// the guides' first addresses, from the day the hub went up
		'/guides/rhino-tools': '/rhino/',
		'/guides/grasshopper-components': '/grasshopper/',
		// the one page of all the tools, before it became a page per category (2026-11-11); home shows them all
		'/tools': '/',
	},
	integrations: [
		// Starlight would add the sitemap itself; it's added here to leave the unlisted pages out of it: the
		// management page and the shelf.
		sitemap({ filter: (page) => !/^\/(management|shelf)\//.test(new URL(page).pathname) }),
		starlight({
			title: 'Alexandria',
			description: 'Tools, guides and standards for Alexandria: the Rhino and Grasshopper tools and the office tools.',
			favicon: '/favicon.svg',
			lastUpdated: false,
			credits: false,
			head: [
				// Public for now, but not for search engines: it's the office's hub.
				{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } },
			],
			routeMiddleware: './src/routeData.ts',
			// the page title, with a link back to the page that lists this one (src/nav.ts)
			components: { PageTitle: './src/components/PageTitle.astro' },
			customCss: [
				'@fontsource-variable/inter',
				'@fontsource-variable/oswald',
				'@fontsource/ibm-plex-mono/400.css',
				'@fontsource/ibm-plex-mono/500.css',
				'./src/styles/guides.css',
				'./src/styles/theme.css',
			],
			// The sidebar (user, 2026-11-23: "the table of contents is getting very heavy"): sixteen entries, all in view,
			// none of them a single tool, file or supplier. An entry is a page, and a page that holds several things lists
			// them itself: a tool category its tools, Quick Guides every guide, Suppliers the suppliers, Templates the
			// templates, Documentation the documents, Downloads every file. The pages under those (a guide, a supplier, a
			// template) have no entry of their own: src/routeData.ts highlights the entry of the page that lists them.
			// Before this there was an entry per tool, twice (Quick Guides and Tools), and one per download.
			// Not in the sidebar on purpose (user, 2026-11-20): the management page, src/content/docs/management/, which
			// is unlisted. It is out of the search (`pagefind: false`) and the sitemap (above) too, and
			// nothing links to it. The shelf (user, 2026-11-23), src/content/docs/shelf/, is unlisted the same way: the
			// tools taken off the site until they're ready, and their guides.
			sidebar: [
				{
					label: 'Starting Out',
					items: [
						{ label: 'Your First Day', slug: 'start/first-day' },
						{ label: 'Download', slug: 'start/download' },
						{ label: 'What’s New', slug: 'start/whats-new' },
						{ label: 'Troubleshooting', slug: 'start/troubleshooting' },
					],
				},
				// One entry per category, as on the home page and in its order (user, 2026-11-23). Each opens the category's
				// page (tools/*.mdx), where every tool has its drawing, Open and Guide. Permitting is third since it got its
				// first tool, Photo Elevation (user, 2026-11-23); until then it sat last with an Alpha tag (theme.css still
				// has the tag, `ax-alpha`, for the next category that starts empty).
				{
					label: 'Tools',
					items: [
						{ label: 'Design', slug: 'tools/design' },
						{ label: 'Fabrication', slug: 'tools/fabrication' },
						{ label: 'Permitting', slug: 'tools/permitting' },
						{ label: 'Parametric', slug: 'tools/parametric' },
						{ label: 'Rhino/Grasshopper', slug: 'tools/rhino-grasshopper' },
					],
				},
				// Every guide on one page (guides/index.mdx), by category. Set like the section names (ax-side-section).
				{ label: 'Quick Guides', slug: 'guides', attrs: { class: 'ax-side-section' } },
				{
					label: 'Wiki',
					items: [
						{ label: 'Signage Types', slug: 'wiki/signage-types' },
						// one page per supplier (wiki/suppliers/*.mdx), listed on wiki/suppliers/index.mdx
						{ label: 'Suppliers', slug: 'wiki/suppliers' },
						{ label: 'Templates', slug: 'templates' },
						// Standards (docs/standards, from STANDARDS.md) stays built for the Phoenix docs' links, but off the
						// Documentation page until it covers the office's standards beyond the Rhino tools (user, 2026-11-05).
						{ label: 'Documentation', slug: 'docs' },
						{ label: 'Reference Links', slug: 'reference/links' },
					],
				},
				// Every file there is to download, as tables on one page (user, 2026-11-18).
				{ label: 'Downloads', slug: 'wiki/downloads', attrs: { class: 'ax-side-section' } },
			],
		}),
	],
});
