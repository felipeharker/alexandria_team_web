// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The Alexandria hub: guides, the latest release, the office tools and the standards, in one place.
// Pages are Markdown or MDX in src/content/docs; the sidebar below is the site's table of contents.
// tools/sync.py writes everything under docs/, src/generated and src/data from alexandria_phoenix.
export default defineConfig({
	site: 'https://alexdesignlab.org',
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
					label: 'Start here',
					items: [
						{ label: 'Your first day', slug: 'start/first-day' },
						{ label: 'Download', slug: 'start/download' },
						{ label: 'What’s new', slug: 'start/whats-new' },
						{ label: 'Troubleshooting', slug: 'start/troubleshooting' },
					],
				},
				{
					label: 'Quick guides',
					items: [
						{ label: 'Rhino tools', slug: 'guides/rhino-tools' },
						{ label: 'Grasshopper components', slug: 'guides/grasshopper-components' },
						{ label: 'Material Estimator', slug: 'guides/material-estimator' },
					],
				},
				{
					label: 'Office tools',
					items: [{ label: 'All office tools', slug: 'tools' }],
				},
				{
					label: 'Documentation',
					items: [
						{ label: 'Install and update', slug: 'docs/install' },
						{ label: 'Alexandria Phoenix', slug: 'docs/phoenix' },
						{ label: 'Standards', slug: 'docs/standards' },
					],
				},
				{
					label: 'Reference',
					items: [{ label: 'Links', slug: 'reference/links' }],
				},
			],
		}),
	],
});
