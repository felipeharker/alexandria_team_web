// Pages with no sidebar entry of their own, and the page that lists each (user, 2026-11-23: the sidebar holds
// sections, and a section's page lists what it holds). Two things read this: src/routeData.ts highlights the
// listing page's entry in the sidebar, and src/components/PageTitle.astro puts a link back to it above the title.

interface Parent {
	test: RegExp; // against the page's path, without its last slash
	href: string; // the page that lists it, as its sidebar entry has it
	label: string;
}

const parents: Parent[] = [
	// every quick guide: /site-plan/guide, /colors/library/guide …, and the two Rhino ones
	{ test: /^\/(rhino|grasshopper)$|\/guide$/, href: '/guides/', label: 'Quick Guides' },
	{ test: /^\/wiki\/suppliers\/.+/, href: '/wiki/suppliers/', label: 'Suppliers' },
	{ test: /^\/templates\/.+/, href: '/templates/', label: 'Templates' },
	// Standards too: it's off the Documentation page for now, but part of the Alexandria Phoenix docs, which link to it
	{ test: /^\/docs\/.+/, href: '/docs/', label: 'Documentation' },
	// the Alexandria Etch Font page, which the font's row of Downloads links to
	{ test: /^\/wiki\/downloads\/.+/, href: '/wiki/downloads/', label: 'Downloads' },
	// a shelved tool's guide, back to the shelf (unlisted, so no sidebar entry lights up)
	{ test: /^\/shelf\/.+/, href: '/shelf/', label: 'Shelf' },
	// The Sample Project (out of the sidebar since 2026-11-18): Your First Day links to it.
	{ test: /^\/sample-project$/, href: '/start/first-day/', label: 'Your First Day' },
];

// The management pages (/management/ and the tables under it) are unlisted (user, 2026-11-20): they have no
// parent, so nothing in the sidebar is highlighted on them.

export const trim = (path: string) => path.replace(/\/$/, '');

export function parentOf(pathname: string): Parent | undefined {
	const path = trim(pathname);
	return parents.find((parent) => parent.test.test(path));
}
