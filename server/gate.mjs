// The Alexandria hub behind a sign-in. Render runs this as the alexandria-gate web service (render.yaml): it serves
// the built hub (dist/) and the office tools (office.mjs) to the people in HUB_USERS, and nothing to anyone else.
//
// HUB_USERS is set in the service's Environment on Render, never in this repository: one username:passcode pair
// per person, separated by commas, such as `ana:Character_1900, ben:Character_2000`. Usernames ignore case,
// passcodes don't. To add or remove someone, edit it there and save; the service restarts with the new list.
// Browsers show their own sign-in box and remember it until they're closed. After 10 wrong tries in 15 minutes
// from one address, that address gets nothing until the 15 minutes are up.
//
// Addresses work as they did on the static site: the hub's pages first, then the office tools (/estimator,
// /materials, /colors, /site-plan, /vectorizer, /grid, /braille) wherever the hub has no page, so /estimator/guide
// stays the hub's. Run it locally with `node --env-file=<file> server/gate.mjs` (PORT and HUB_USERS in the file).

import { createHash, timingSafeEqual } from 'node:crypto';
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
const OFFICE_TOOLS = new Set(['estimator', 'materials', 'colors', 'site-plan', 'vectorizer', 'grid', 'braille']);
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

const digest = (text) => createHash('sha256').update(text, 'utf8').digest();
const users = new Map();
for (const pair of (process.env.HUB_USERS || '').split(/[,;\n]/)) {
	const colon = pair.indexOf(':');
	if (colon > 0) users.set(pair.slice(0, colon).trim().toLowerCase(), digest(pair.slice(colon + 1).trim()));
}

// 'none' (no sign-in sent yet), 'ok', or 'wrong'
function signIn(req) {
	const basic = /^Basic\s+(\S+)$/i.exec(req.headers.authorization || '');
	if (!basic) return 'none';
	const text = Buffer.from(basic[1], 'base64').toString('utf8');
	const colon = text.indexOf(':');
	const name = text.slice(0, Math.max(colon, 0)).trim().toLowerCase();
	const given = digest(text.slice(colon + 1));
	const wanted = users.get(name);
	return colon > 0 && wanted && timingSafeEqual(wanted, given) ? 'ok' : 'wrong';
}

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

const note = (title, text) => `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<style>
	:root { color-scheme: light dark; --bg: #f4f4f4; --ink: #222; --soft: #5c5c5c; }
	@media (prefers-color-scheme: dark) { :root { --bg: #1b1b1b; --ink: #eee; --soft: #a8a8a8; } }
	body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, sans-serif; }
	main { max-width: 26rem; padding: 1.5rem; }
	h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
	p { margin: 0; color: var(--soft); }
</style>
<main><h1>${title}</h1><p>${text}</p></main>
</html>
`;

function sendNote(res, status, title, text) {
	const body = Buffer.from(note(title, text));
	res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': body.length });
	res.end(body);
}

async function handle(req, res) {
	const url = new URL(req.url || '/', 'http://gate');
	if (url.pathname === '/healthz') return res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
	for (const [name, value] of Object.entries(HUB_HEADERS)) res.setHeader(name, value);

	const address = clientAddress(req);
	if (tooMany(address)) return sendNote(res, 429, 'Too Many Tries', 'Too many wrong passcodes from this address. Try again in 15 minutes.');
	const signedIn = signIn(req);
	if (signedIn !== 'ok') {
		if (signedIn === 'wrong') {
			wrongTry(address);
			console.log(`wrong sign-in from ${address}`);
			if (tooMany(address)) return sendNote(res, 429, 'Too Many Tries', 'Too many wrong passcodes from this address. Try again in 15 minutes.');
		}
		res.setHeader('WWW-Authenticate', 'Basic realm="Alexandria", charset="UTF-8"');
		return sendNote(res, 401, 'Sign In to Alexandria', 'This site is for the Alexandria office. Reload the page to sign in with your username and passcode.');
	}
	tries.delete(address);

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
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
