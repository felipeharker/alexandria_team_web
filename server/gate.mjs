// The Alexandria hub behind a sign-in. Render runs this as the alexandria-gate web service (render.yaml), at
// alexdesignlab.org: it serves the built hub (dist/) and the office tools (office.mjs) to the people in HUB_USERS,
// and only its sign-in page to anyone else.
//
// HUB_USERS is set in the service's Environment on Render, never in this repository: one username:passcode pair
// per person, separated by commas, such as `ana:Character_1900, ben:Character_2000`. Usernames ignore case,
// passcodes don't. To add or remove someone, edit it there and save; the service restarts with the new list.
//
// Signing in at /signin keeps a person signed in on that browser for 30 days, renewed as they use the site, and
// /signout ends it. The sign-in is a signed cookie whose key comes from SESSION_SECRET (Render makes one, see
// render.yaml) and the person's passcode, so changing someone's passcode or taking them out of HUB_USERS signs them
// out everywhere. After 10 wrong tries in 15 minutes from one address, that address waits out the 15 minutes.
//
// Addresses work as they did on the static site: the hub's pages first, then the office tools (/estimator,
// /materials, /colors, /site-plan, /vectorizer, /grid, /braille, /sign-package) wherever the hub has no page, so /estimator/guide
// stays the hub's. Run it locally with `node --env-file=<file> server/gate.mjs` (PORT, HUB_USERS and SESSION_SECRET
// in the file).

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { brotliCompress, constants as zlib, gzip } from 'node:zlib';
import { office, startOfficeSync } from './office.mjs';

const HUB = fileURLToPath(new URL('../dist', import.meta.url));
const PORT = Number(process.env.PORT) || 10000;
const OFFICE_TOOLS = new Set(['estimator', 'materials', 'colors', 'site-plan', 'vectorizer', 'grid', 'braille', 'sign-package']);
const DAY = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
const SESSION_COOKIE = 'alexandria_session';
const MAX_TRIES = 10;
const TRY_WINDOW = 15 * 60 * 1000;

const HUB_HEADERS = {
	'X-Robots-Tag': 'noindex, nofollow',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'same-origin',
};

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.csv': 'text/csv; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.md': 'text/markdown; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.pdf': 'application/pdf',
	'.zip': 'application/zip',
	'.wasm': 'application/wasm',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json|wasm)|image\/svg)/;

// --- who may come in ---

// Without SESSION_SECRET (a first deploy, or a local run) the key comes from the other secrets, so it still holds.
const SECRET =
	process.env.SESSION_SECRET ||
	createHash('sha256').update(`alexandria-gate\0${process.env.HUB_USERS || ''}\0${process.env.GITHUB_TOKEN || ''}`).digest('hex');
const digest = (text) => createHash('sha256').update(text, 'utf8').digest();
const hmac = (key, text) => createHmac('sha256', key).update(text, 'utf8').digest();

const users = new Map(); // username -> { passcode: its digest, key: signs this person's sign-ins }
for (const pair of (process.env.HUB_USERS || '').split(/[,;\n]/)) {
	const colon = pair.indexOf(':');
	if (colon < 1) continue;
	const name = pair.slice(0, colon).trim().toLowerCase();
	const passcode = pair.slice(colon + 1).trim();
	users.set(name, { passcode: digest(passcode), key: hmac(SECRET, `${name}\0${passcode}`) });
}

function passcodeMatches(name, passcode) {
	const user = users.get(name);
	const given = digest(passcode);
	return Boolean(user) && timingSafeEqual(user.passcode, given);
}

function cookie(req, wanted) {
	for (const part of String(req.headers.cookie || '').split(';')) {
		const eq = part.indexOf('=');
		if (eq > 0 && part.slice(0, eq).trim() === wanted) return part.slice(eq + 1).trim();
	}
	return '';
}

// A sign-in cookie is base64url("name\nexpiry") + "." + its signature with that person's key.
function newSession(name) {
	const payload = Buffer.from(`${name}\n${Date.now() + SESSION_DAYS * DAY}`).toString('base64url');
	return `${payload}.${hmac(users.get(name).key, payload).toString('base64url')}`;
}

function readSession(req) {
	const [payload, signature] = cookie(req, SESSION_COOKIE).split('.');
	if (!payload || !signature) return null;
	const [name, expires] = Buffer.from(payload, 'base64url').toString('utf8').split('\n');
	const user = users.get(name);
	if (!user || !(Number(expires) > Date.now())) return null;
	const wanted = hmac(user.key, payload);
	const given = Buffer.from(signature, 'base64url');
	return given.length === wanted.length && timingSafeEqual(given, wanted) ? { name, expires: Number(expires) } : null;
}

const sessionCookie = (value, maxAge) => `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

const tries = new Map(); // address -> { count, since }
const clientAddress = (req) =>
	req.headers['cf-connecting-ip'] || req.headers['true-client-ip'] ||
	String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
const tooMany = (address) => {
	const t = tries.get(address);
	return Boolean(t && Date.now() - t.since < TRY_WINDOW && t.count >= MAX_TRIES);
};
const wrongTry = (address) => {
	let t = tries.get(address);
	if (!t || Date.now() - t.since >= TRY_WINDOW) tries.set(address, (t = { count: 0, since: Date.now() }));
	t.count++;
};
setInterval(() => {
	for (const [address, t] of tries) if (Date.now() - t.since >= TRY_WINDOW) tries.delete(address);
}, TRY_WINDOW).unref();

// Where to go after signing in: an address on this site, never another site's, never the sign-in itself.
function nextAddress(value) {
	const next = String(value || '');
	if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || next.length > 2000) return '/';
	return /^\/sign(in|out)\b/.test(next) ? '/' : next;
}

// --- finding a file ---

// A file under root for the address: the file itself, a folder's index.html (for an address ending in /),
// or a redirect that adds the / (so a page's relative links work).
async function find(root, path) {
	const full = resolve(root, `.${path}`);
	if (full !== root && !full.startsWith(root + sep)) return null;
	const info = await stat(full).catch(() => null);
	if (info?.isFile()) return path.endsWith('/') ? null : { file: full, info };
	if (info?.isDirectory()) {
		const index = join(full, 'index.html');
		const indexInfo = await stat(index).catch(() => null);
		if (indexInfo?.isFile()) return path.endsWith('/') ? { file: index, info: indexInfo } : { redirect: true };
	}
	return null;
}

async function route(path) {
	const hub = await find(HUB, path);
	if (hub) {
		const cache = path.startsWith('/_astro/') ? 'private, max-age=31536000, immutable' : 'no-cache';
		return { ...hub, headers: { 'Cache-Control': cache } };
	}
	if (OFFICE_TOOLS.has(path.split('/')[1])) {
		const tools = office();
		if (!tools) return { loading: true };
		const hit = await find(tools.root, path);
		if (hit) return { ...hit, headers: tools.headers };
	}
	return null;
}

// --- answering ---

const squeezed = new Map(); // file -> { tag, br, gzip } (promises of compressed bytes)
const squeeze = { br: promisify(brotliCompress), gzip: promisify(gzip) };
const squeezeOptions = { br: { params: { [zlib.BROTLI_PARAM_QUALITY]: 11 } }, gzip: { level: 9 } };

function compressed(file, tag, encoding) {
	if (squeezed.size > 3000) squeezed.clear(); // earlier office copies' files pile up otherwise
	let entry = squeezed.get(file);
	if (!entry || entry.tag !== tag) squeezed.set(file, (entry = { tag }));
	entry[encoding] ??= readFile(file)
		.then((bytes) => squeeze[encoding](bytes, squeezeOptions[encoding]))
		.catch((error) => {
			delete entry[encoding];
			throw error;
		});
	return entry[encoding];
}

async function sendFile(req, res, { file, info, headers }, status = 200) {
	const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
	const tag = `W/"${info.size.toString(36)}-${Math.floor(info.mtimeMs).toString(36)}"`;
	for (const [name, value] of Object.entries(headers || {})) res.setHeader(name, value);
	res.setHeader('Content-Type', type);
	res.setHeader('ETag', tag);
	res.setHeader('Last-Modified', info.mtime.toUTCString());
	if (status === 200 && req.headers['if-none-match'] === tag) return res.writeHead(304).end();
	if (COMPRESSIBLE.test(type) && info.size > 1024) {
		res.setHeader('Vary', 'Accept-Encoding');
		const accepts = String(req.headers['accept-encoding'] || '');
		const encoding = /\bbr\b/.test(accepts) ? 'br' : /\bgzip\b/.test(accepts) ? 'gzip' : null;
		if (encoding) {
			const body = await compressed(file, tag, encoding);
			res.writeHead(status, { 'Content-Encoding': encoding, 'Content-Length': body.length });
			return res.end(req.method === 'HEAD' ? undefined : body);
		}
	}
	res.writeHead(status, { 'Content-Length': info.size });
	if (req.method === 'HEAD') return res.end();
	createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

const escape = (text) =>
	String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// The hub's colours (src/styles/theme.css): greys, and its one green for the button.
const STYLE = `
	:root { color-scheme: dark; --bg: #131619; --panel: #1b1f24; --ink: #e7eaee; --soft: #9aa3ae; --rule: #2b3036;
		--field: #131619; --button: #8cba00; --button-ink: #131619; --error: #ff8b85; }
	@media (prefers-color-scheme: light) { :root { color-scheme: light; --bg: #f6f7f9; --panel: #ffffff; --ink: #1b1f24;
		--soft: #5d6570; --rule: #e2e5e9; --field: #ffffff; --button: #4f7a00; --button-ink: #ffffff; --error: #b42318; } }
	* { box-sizing: border-box; }
	body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--ink);
		font: 16px/1.5 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; }
	main { width: 100%; max-width: 22rem; padding: 2rem 1.75rem; background: var(--panel); border: 1px solid var(--rule); border-radius: 8px; }
	img { display: block; margin-bottom: 1.25rem; }
	h1 { font-size: 1.25rem; line-height: 1.3; margin: 0 0 0.25rem; }
	p { margin: 0; color: var(--soft); }
	form { display: grid; gap: 1rem; margin-top: 1.5rem; }
	label { display: grid; gap: 0.35rem; font-size: 0.875rem; font-weight: 600; }
	input { font: inherit; font-size: 1rem; font-weight: 400; color: var(--ink); background: var(--field); border: 1px solid var(--rule);
		border-radius: 6px; padding: 0.55rem 0.7rem; }
	input:focus { outline: 2px solid var(--soft); outline-offset: 1px; }
	button { font: inherit; font-weight: 600; color: var(--button-ink); background: var(--button); border: 0; border-radius: 6px;
		padding: 0.65rem 1rem; cursor: pointer; margin-top: 0.25rem; }
	.message { margin-top: 1.25rem; color: var(--error); font-size: 0.9375rem; }
	.message.plain { color: var(--soft); }
	.note { margin-top: 1rem; font-size: 0.8125rem; }
`;

const page = (title, body) => `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${STYLE}</style>
<main>${body}</main>
</html>
`;

function send(res, status, html, headers = {}) {
	const body = Buffer.from(html);
	res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': body.length, ...headers });
	res.end(body);
}

const sendNote = (res, status, title, text) => send(res, status, page(title, `<h1>${title}</h1><p>${text}</p>`));

function sendSignIn(res, status, { next = '/', name = '', message = '', plain = false } = {}) {
	const body = `
<img src="/favicon.svg" alt="" width="40" height="40">
<h1>Sign In to Alexandria</h1>
<p>The office's tools, guides and standards.</p>
${message ? `<p class="message${plain ? ' plain' : ''}" role="alert">${message}</p>` : ''}
<form method="post" action="/signin">
	<input type="hidden" name="next" value="${escape(next)}">
	<label>Username <input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${escape(name)}"${name ? '' : ' autofocus'}></label>
	<label>Passcode <input name="passcode" type="password" autocomplete="current-password" required${name ? ' autofocus' : ''}></label>
	<button type="submit">Sign In</button>
</form>
<p class="note">You’ll stay signed in on this browser for 30 days.</p>`;
	send(res, status, page('Sign In to Alexandria', body));
}

const redirect = (res, location, headers = {}) =>
	res.writeHead(303, { Location: location, 'Cache-Control': 'no-store', ...headers }).end();

function readForm(req) {
	return new Promise((done, fail) => {
		let text = '';
		req.setEncoding('utf8');
		req.on('data', (chunk) => {
			text += chunk;
			if (text.length > 4096) fail(new Error('form too large'));
		});
		req.on('end', () => done(new URLSearchParams(text)));
		req.on('error', fail);
	});
}

async function signIn(req, res, url) {
	if (req.method === 'GET' || req.method === 'HEAD') {
		const next = nextAddress(url.searchParams.get('next'));
		if (readSession(req)) return redirect(res, next);
		const out = url.searchParams.has('out');
		return sendSignIn(res, 200, { next, message: out ? 'You’re signed out.' : '', plain: out });
	}
	if (req.method !== 'POST') return sendNote(res, 405, 'Not Allowed', 'This page only takes the sign-in form.');

	const address = clientAddress(req);
	const form = await readForm(req).catch(() => new URLSearchParams());
	const next = nextAddress(form.get('next'));
	const name = String(form.get('username') || '').trim().toLowerCase();
	if (tooMany(address)) {
		return sendSignIn(res, 429, { next, name, message: 'Too many wrong tries from this address. Try again in 15 minutes.' });
	}
	if (!passcodeMatches(name, String(form.get('passcode') || '').trim())) {
		wrongTry(address);
		console.log(`wrong sign-in for "${name.slice(0, 40)}" from ${address}`);
		const message = tooMany(address)
			? 'Too many wrong tries from this address. Try again in 15 minutes.'
			: 'That username and passcode don’t match. Try again.';
		return sendSignIn(res, tooMany(address) ? 429 : 401, { next, name, message });
	}
	tries.delete(address);
	console.log(`signed in: ${name} from ${address}`);
	return redirect(res, next, { 'Set-Cookie': sessionCookie(newSession(name), (SESSION_DAYS * DAY) / 1000) });
}

async function handle(req, res) {
	const url = new URL(req.url || '/', 'http://gate');
	if (url.pathname === '/healthz') return res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
	for (const [name, value] of Object.entries(HUB_HEADERS)) res.setHeader(name, value);

	if (url.pathname === '/signin') return signIn(req, res, url);
	if (url.pathname === '/signout') return redirect(res, '/signin?out', { 'Set-Cookie': sessionCookie('', 0) });
	if (url.pathname === '/favicon.svg') {
		const icon = await find(HUB, '/favicon.svg');
		if (icon) return sendFile(req, res, { ...icon, headers: { 'Cache-Control': 'public, max-age=86400' } });
	}

	const session = readSession(req);
	if (!session) {
		if (req.method !== 'GET' && req.method !== 'HEAD') return sendNote(res, 401, 'Sign In First', 'Sign in to use this site.');
		const here = url.pathname + url.search;
		return redirect(res, here === '/' ? '/signin' : `/signin?next=${encodeURIComponent(here)}`);
	}
	// keep it going for another 30 days from today, once a day at most
	if (session.expires - Date.now() < (SESSION_DAYS - 1) * DAY) {
		res.setHeader('Set-Cookie', sessionCookie(newSession(session.name), (SESSION_DAYS * DAY) / 1000));
	}

	if (req.method !== 'GET' && req.method !== 'HEAD') {
		res.setHeader('Allow', 'GET, HEAD');
		return sendNote(res, 405, 'Not Allowed', 'This site only serves pages.');
	}
	let path;
	try {
		path = decodeURIComponent(url.pathname);
	} catch {
		path = '\0';
	}
	if (path.includes('\0')) return sendNote(res, 400, 'Bad Address', 'That address isn’t one this site understands.');

	const hit = await route(path);
	if (hit?.redirect) return res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
	if (hit?.loading) return sendNote(res, 503, 'Almost Ready', 'The office tools aren’t loaded yet. Try again in a minute.');
	if (hit) return sendFile(req, res, hit);
	const missing = await find(HUB, '/404.html');
	if (missing) return sendFile(req, res, { ...missing, headers: { 'Cache-Control': 'no-cache' } }, 404);
	return sendNote(res, 404, 'Not Found', 'There’s no page at this address.');
}

const server = createServer((req, res) => {
	handle(req, res).catch((error) => {
		console.error(error);
		if (!res.headersSent) sendNote(res, 500, 'Something Went Wrong', 'The page couldn’t be served. Try again in a moment.');
		else res.destroy();
	});
});

startOfficeSync();
server.listen(PORT, () => {
	const names = [...users.keys()];
	console.log(`gate on port ${PORT}; ${names.length ? `users: ${names.join(', ')}` : 'no users yet: set HUB_USERS, nobody can sign in'}`);
	if (!process.env.SESSION_SECRET) console.log('no SESSION_SECRET: sign-ins are signed with a key made from the other settings');
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
