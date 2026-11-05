// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The Alexandria hub: guides, the latest release, the office tools and the standards, in one place.
// Pages are Markdown or MDX in src/content/docs; the sidebar below is the site's table of contents.
// tools/sync.py writes everything under docs/, src/generated and src/data from alexandria_phoenix.
// Every tool has a short address: /rhino, /grasshopper, /estimator/guide here, and /estimator, /colors
// (the Color Matcher) and /colors/library from the alexandria_office site, through rewrites in render.yaml.
export default defineConfig({
	site: 'https://alexdesignlab.org',
	redirects: {
		// the guides' first addresses, from the day the hub went up
		'/guides/rhino-tools': '/rhino/',
		'/guides/grasshopper-components': '/grasshopper/',
		'/guides/material-estimator': '/estimator/guide/',
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
			],
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
					items: [
						{ label: 'Your First Day', slug: 'start/first-day' },
						{ label: 'Download', slug: 'start/download' },
						{ label: 'What’s New', slug: 'start/whats-new' },
						{ label: 'Troubleshooting', slug: 'start/troubleshooting' },
					],
				},
				{
					label: 'Quick Guides',
					items: [
						{ label: 'Rhino Tools', slug: 'rhino' },
						{ label: 'Grasshopper Components', slug: 'grasshopper' },
						{ label: 'Material Estimator', slug: 'estimator/guide' },
						{ label: 'Color Matcher', slug: 'colors/guide' },
						{ label: 'Color Library', slug: 'colors/library/guide' },
					],
				},
				{
					label: 'Tools',
					items: [
						{ label: 'Material Estimator', link: '/estimator/' },
						{ label: 'Color Matcher', link: '/colors/' },
						{ label: 'Color Library', link: '/colors/library/' },
						{ label: 'All Office Tools', slug: 'tools' },
					],
				},
				{
					label: 'CSV Templates',
					items: [
						{ label: 'Material Estimator', slug: 'templates/estimator' },
						{ label: 'Color Matcher', slug: 'templates/color-matcher' },
						{ label: 'Grasshopper Parameters', slug: 'templates/grasshopper' },
					],
				},
				{
					label: 'Sample Project',
					items: [{ label: 'Alexandria Design Lab', slug: 'sample-project' }],
				},
				{
					label: 'Documentation',
					items: [
						{ label: 'Install and Update', slug: 'docs/install' },
						{ label: 'Alexandria Phoenix', slug: 'docs/phoenix' },
						{ label: 'Standards', slug: 'docs/standards' },
					],
				},
				{
					label: 'External Ref.',
					items: [{ label: 'Links', slug: 'reference/links' }],
				},
			],
		}),
	],
});
