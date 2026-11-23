// Starlight route middleware (astro.config.mjs `routeMiddleware`): every page has one sidebar entry to highlight
// (user, 2026-11-11). A page with no entry of its own, such as a quick guide or a supplier, highlights the entry of
// the page that lists it (src/nav.ts).
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { parentOf, trim } from './nav';

type Entry = { type: 'link'; href: string; isCurrent: boolean } | { type: 'group'; entries: Entry[] };

function links(entries: Entry[]): Extract<Entry, { type: 'link' }>[] {
	return entries.flatMap((entry) => (entry.type === 'link' ? [entry] : links(entry.entries)));
}

export const onRequest = defineRouteMiddleware((context) => {
	const parent = parentOf(context.url.pathname);
	if (!parent) return;
	const all = links(context.locals.starlightRoute.sidebar as Entry[]);
	const entry = all.find((link) => trim(link.href) === trim(parent.href));
	if (!entry) return;
	for (const link of all) link.isCurrent = false;
	entry.isCurrent = true;
});
