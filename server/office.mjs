// The office tools for the gate (gate.mjs): alexandria_office's public/ folder, kept beside the hub so the gate
// serves them itself and the alexandria-office site's own address can be switched off.
//
// alexandria_office is private, so this reads it with GITHUB_TOKEN, a fine-grained token limited to that repo with
// Contents: read-only, set in the service's Environment on Render (never in this repository). The newest commit on
// main and its files come from GitHub's API, into office/<commit>/. The build runs `node server/office.mjs` once,
// so a deploy starts with the tools in place; the running gate then checks every two minutes, so a push to
// alexandria_office shows up here without a hub deploy. If GitHub can't be reached, the last copy stays.
// OFFICE_REPO (owner/name) points it at another repo, for trying it out.
//
// The office's own render.yaml still sets its headers (the Site Plan's map servers are in its Content-Security-Policy):
// its `/*` headers are read from the same download and sent with every office file.

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';

const REPO = process.env.OFFICE_REPO || 'felipeharker/alexandria_office';
const TOKEN = process.env.GITHUB_TOKEN || '';
const BRANCH = 'main';
const DIR = fileURLToPath(new URL('../office', import.meta.url));
const CHECK_EVERY = 2 * 60 * 1000;

// used only if the office's render.yaml can't be read
const DEFAULT_HEADERS = {
	'Cache-Control': 'no-cache',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'same-origin',
	'X-Frame-Options': 'DENY',
};

let current = null; // { sha, root, headers }

/** The office files now being served: { sha, root, headers }, or null before the first download. */
export const office = () => current;

async function github(path, accept, seconds) {
	const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
		headers: {
			Accept: accept,
			'User-Agent': 'alexandria-gate',
			'X-GitHub-Api-Version': '2022-11-28',
			...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
		},
		signal: AbortSignal.timeout(seconds * 1000),
	});
	if (!res.ok) {
		const hint = res.status === 404 || res.status === 401 ? (TOKEN ? ': is GITHUB_TOKEN still good?' : ': set GITHUB_TOKEN') : '';
		throw new Error(`GitHub ${path.split('/')[0]}: HTTP ${res.status}${hint}`);
	}
	return res;
}

async function latestCommit() {
	const sha = (await (await github(`commits/${BRANCH}`, 'application/vnd.github.sha', 20)).text()).trim();
	if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`GitHub commits: unexpected answer for ${BRANCH}`);
	return sha;
}

// The entries of a tar file: ustar headers, with pax and GNU long names (GitHub's tarballs use pax).
function* untar(tar) {
	let at = 0;
	let longName = null;
	while (at + 512 <= tar.length) {
		const head = tar.subarray(at, at + 512);
		if (head.every((b) => b === 0)) return;
		const text = (from, length) => {
			const field = head.subarray(from, from + length);
			const end = field.indexOf(0);
			return field.subarray(0, end < 0 ? length : end).toString('utf8');
		};
		const size = parseInt(text(124, 12).trim() || '0', 8);
		const type = String.fromCharCode(head[156] || 48);
		const body = tar.subarray(at + 512, at + 512 + size);
		at += 512 + Math.ceil(size / 512) * 512;
		if (type === 'x') {
			const path = body.toString('utf8').match(/(?:^|\n)\d+ path=([^\n]*)\n/);
			if (path) longName = path[1];
		} else if (type === 'L') {
			longName = body.toString('utf8').replace(/\0+$/, '');
		} else if (type !== 'g') {
			const prefix = text(345, 155);
			const path = longName ?? (prefix ? `${prefix}/${text(0, 100)}` : text(0, 100));
			longName = null;
			if (type === '0' || type === '7') yield { path, body };
		}
	}
}

// The `/*` headers in the office's render.yaml: `- path: /*`, `name: ...`, then `value: ...` (comments allowed between).
function readHeaders(yaml) {
	const headers = {};
	const entry = /-\s*path:\s*(\S+)[ \t]*\n\s*name:\s*([\w-]+)[ \t]*\n(?:\s*#[^\n]*\n)*\s*value:\s*([^\n]+)/g;
	for (const [, path, name, raw] of yaml.matchAll(entry)) {
		if (path !== '/*') continue;
		const quoted = raw.match(/^(["'])(.*)\1/);
		headers[name] = quoted ? quoted[2] : raw.replace(/\s+#.*$/, '').trim();
	}
	return Object.keys(headers).length ? headers : DEFAULT_HEADERS;
}

async function use(sha) {
	const folder = join(DIR, sha);
	const yaml = await readFile(join(folder, 'render.yaml'), 'utf8').catch(() => '');
	current = { sha, root: join(folder, 'public'), headers: readHeaders(yaml) };
}

async function download(sha) {
	const res = await github(`tarball/${sha}`, 'application/vnd.github+json', 120);
	const tar = gunzipSync(Buffer.from(await res.arrayBuffer()));
	// a new folder per commit; HEAD names the one in use and is written last, so a half-written folder is never used
	const folder = join(DIR, sha);
	await rm(folder, { recursive: true, force: true });
	let files = 0;
	for (const { path, body } of untar(tar)) {
		const inRepo = path.split('/').slice(1).join('/'); // drop the tarball's owner-repo-<commit>/ folder
		if (inRepo !== 'render.yaml' && !inRepo.startsWith('public/')) continue;
		const out = resolve(folder, inRepo);
		if (!out.startsWith(folder + sep)) continue;
		await mkdir(dirname(out), { recursive: true });
		await writeFile(out, body);
		if (inRepo.startsWith('public/')) files++;
	}
	if (!files) throw new Error('GitHub tarball: no public/ files');
	await writeFile(join(DIR, 'HEAD'), sha);
	return files;
}

/** Brings the office files up to the newest commit on main; returns true when they changed. */
export async function refresh(log = console.log) {
	const sha = await latestCommit();
	if (current?.sha === sha) return false;
	const files = await download(sha);
	const before = current?.sha;
	await use(sha);
	log(`office tools: ${files} files from ${REPO} ${sha.slice(0, 7)}`);
	// earlier copies go a minute later, after any request still reading them
	setTimeout(async () => {
		for (const name of await readdir(DIR).catch(() => [])) {
			if (name !== sha && name !== 'HEAD') await rm(join(DIR, name), { recursive: true, force: true }).catch(() => {});
		}
	}, before ? 60_000 : 0).unref();
	return true;
}

/** For the gate: serve the copy the build fetched, then keep it up to date. */
export async function startOfficeSync(log = console.log) {
	await mkdir(DIR, { recursive: true });
	const sha = (await readFile(join(DIR, 'HEAD'), 'utf8').catch(() => '')).trim();
	if (/^[0-9a-f]{40}$/.test(sha)) await use(sha).catch(() => {});
	let busy = false;
	const check = async () => {
		if (busy) return;
		busy = true;
		try {
			await refresh(log);
		} catch (error) {
			log(`office tools: kept ${current ? current.sha.slice(0, 7) : 'nothing'} (${error.message})`);
		} finally {
			busy = false;
		}
	};
	check();
	setInterval(check, CHECK_EVERY).unref();
}

// `node server/office.mjs`: fetch once, for the build. A failure doesn't stop the deploy (the first one runs before
// GITHUB_TOKEN is set); the gate keeps trying once it's running.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	await mkdir(DIR, { recursive: true });
	await refresh().catch((error) => console.warn(`office tools: not fetched at build (${error.message}); the gate will keep trying`));
}
