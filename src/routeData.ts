// Starlight route middleware (astro.config.mjs `routeMiddleware`): every page should have one sidebar entry to
// highlight and one group to open (user, 2026-11-11). A page that isn't in the sidebar on purpose borrows the
// entry of the page it belongs with.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

type Entry = { type: 'link'; href: string; isCurrent: boolean } | { type: 'group'; entries: Entry[] };

// a page left out of the sidebar → the sidebar entry that stands for it
const borrowed: Record<string, string> = {
	// Standards is out of the sidebar until it covers the office's standards beyond Rhino (user, 2026-11-05);
	// it's part of the Alexandria Phoenix docs, which link to it.
	'/docs/standards': '/docs/phoenix',
};

const trim = (path: string) => path.replace(/\/$/, '');

function links(entries: Entry[]): Extract<Entry, { type: 'link' }>[] {
	return entries.flatMap((entry) => (entry.type === 'link' ? [entry] : links(entry.entries)));
}

export const onRequest = defineRouteMiddleware((context) => {
	const owner = borrowed[trim(context.url.pathname)];
	if (!owner) return;
	const all = links(context.locals.starlightRoute.sidebar as Entry[]);
	const entry = all.find((link) => trim(link.href) === owner);
	if (!entry) return;
	for (const link of all) link.isCurrent = false;
	entry.isCurrent = true;
});
