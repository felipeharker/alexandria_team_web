// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The Alexandria hub: guides, the latest release, the office tools and the standards, in one place.
// Pages are Markdown or MDX in src/content/docs; the sidebar below is the site's table of contents.
// tools/sync.py writes everything under docs/, src/generated and src/data from alexandria_phoenix.
// Every tool has a short address: /rhino, /grasshopper, /estimator/guide here, and /estimator, /materials (the
// Material Library), /colors (the Color Matcher), /colors/library, /site-plan, /vectorizer, /grid (the Parametric Grid)
// and /braille (the Braille Lettering Designer) from the alexandria_office site, through rewrites in render.yaml.

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
				// The sidebar (user, 2026-11-11): every group starts collapsed, only the one holding this page opens, and
				// this page's entry is highlighted. Every page has exactly one entry (src/routeData.ts covers the
				// pages that have none). The scripts below are what Starlight can't do on the server.
				// 1. Starlight reopens the groups opened by hand on the last page, from session storage: forget them.
				{ tag: 'script', content: "try { sessionStorage.removeItem('sl-sidebar-state'); } catch {}" },
				// 2. An entry for a section of a page (its address ends in #...) is highlighted while the address
				//    shows that section; otherwise the page's own entry is.
				{ tag: 'script', content: sidebarSectionHighlight },
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
					// in the tool categories' order below
					items: [
						{ label: 'Rhino Tools', slug: 'rhino' },
						{ label: 'Grasshopper Components', slug: 'grasshopper' },
						{ label: 'Site Plan', slug: 'site-plan/guide' },
						{ label: 'Vectorizer', slug: 'vectorizer/guide' },
						{ label: 'Parametric Grid', slug: 'grid/guide' },
						{ label: 'Braille Lettering Designer', slug: 'braille/guide' },
						{ label: 'Color Matcher', slug: 'colors/guide' },
						{ label: 'Color Library', slug: 'colors/library/guide' },
						{ label: 'Material Estimator', slug: 'estimator/guide' },
						{ label: 'Material Library', slug: 'materials/guide' },
					],
				},
				// The tools in three categories, as on the home page (user, 2026-11-11). Each opens with its category's
				// page (tools/*.mdx, the home section's Details link). The web tools open themselves; the Rhino and
				// Grasshopper packages open on their sections of the category page, as their quick guides already
				// have entries above and a page with two entries would open two groups.
				{
					label: 'Rhino/Grasshopper Tools',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'tools/rhino-grasshopper' },
						{ label: 'Alexandria Tools', link: '/tools/rhino-grasshopper/#alexandria-tools' },
						{ label: 'Alexandria Phoenix', link: '/tools/rhino-grasshopper/#alexandria-phoenix' },
					],
				},
				{
					label: 'Design Tools',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'tools/design' },
						{ label: 'Site Plan', link: '/site-plan/' },
						{ label: 'Vectorizer', link: '/vectorizer/' },
						{ label: 'Parametric Grid', link: '/grid/' },
						{ label: 'Braille Lettering Designer', link: '/braille/' },
					],
				},
				{
					label: 'Fabrication Tools',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'tools/fabrication' },
						{ label: 'Color Matcher', link: '/colors/' },
						{ label: 'Color Library', link: '/colors/library/' },
						// still being built
						{ label: 'Material Estimator', link: '/estimator/', badge: 'Beta' },
						// still being filled in
						{ label: 'Material Library', link: '/materials/', badge: 'Beta' },
					],
				},
				{
					label: 'CSV Templates',
					collapsed: true,
					items: [
						{ label: 'Material Estimator', slug: 'templates/estimator' },
						{ label: 'Material Library', slug: 'templates/material-library' },
						{ label: 'Color Matcher', slug: 'templates/color-matcher' },
						{ label: 'Grasshopper Parameters', slug: 'templates/grasshopper' },
					],
				},
				{
					label: 'Sample Project',
					collapsed: true,
					items: [{ label: 'Alexandria Design Lab', slug: 'sample-project' }],
				},
				{
					label: 'Documentation',
					collapsed: true,
					items: [
						{ label: 'Install and Update', slug: 'docs/install' },
						{ label: 'Alexandria Phoenix', slug: 'docs/phoenix' },
						{ label: 'Office Tools', slug: 'docs/office-tools' },
						{ label: 'System Architecture', slug: 'docs/architecture' },
						// Standards (docs/standards, from STANDARDS.md) stays built for the Phoenix docs' links, but out of
						// the sidebar until it covers the office's standards beyond the Rhino tools (user, 2026-11-05).
					],
				},
				{
					label: 'External Ref.',
					collapsed: true,
					items: [{ label: 'Links', slug: 'reference/links' }],
				},
			],
		}),
	],
});
