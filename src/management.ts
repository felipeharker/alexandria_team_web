// The management pages' shared parts (ManagementTable.astro, ManagementDashboard.astro): reading a CSV file from
// alexandria_office's public/management/ (the gate serves it at /management/<file>), building its parents and
// sub-tasks, and drawing a row's cells. Runs in the browser.
//
// Parents (Felipe, 2026-11-23): a file with a Parent column nests each row under the row whose first column is
// named there (roadmap.csv, any depth). A file without one folds the rows that share their first column under that
// name (work.csv: a project and its pieces of work), once there are two or more. Each parent has a dashboard at
// /management/dashboard/?<file name>=<the parent's slug>.

/** the planning board's issues: the Issue column (`#8`) links here */
export const ISSUES = 'https://github.com/felipeharker/alexandria_management/issues/';

// Rows of cells from CSV text: commas (or semicolons, if that's what the header row uses), "quoted" cells that
// may hold commas, line breaks and "" for a quote. Blank rows are dropped.
export function parseCsv(text: string): string[][] {
	const firstLine = text.slice(0, text.search(/[\r\n]|$/));
	const comma = !firstLine.includes(',') && firstLine.includes(';') ? ';' : ',';
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c !== '"') cell += c;
			else if (text[i + 1] === '"') (cell += '"'), i++;
			else quoted = false;
		} else if (c === '"' && cell === '') quoted = true;
		else if (c === comma) (row.push(cell), (cell = ''));
		else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
		} else cell += c;
	}
	if (cell !== '' || row.length) (row.push(cell), rows.push(row));
	return rows.map((cells) => cells.map((value) => value.trim())).filter((cells) => cells.some(Boolean));
}

// The file's text: UTF-8 (with or without Excel's mark at the start), or Excel's older plain "CSV" save.
function decode(bytes: ArrayBuffer): string {
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		return new TextDecoder('windows-1252').decode(bytes);
	}
}

// A date as the standard writes it, 2026-12-04, also when Excel has rewritten it as 12/4/2026.
export function isoDate(value: string): string {
	const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	return us ? `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}` : value;
}
export const isDate = (value: string) => /^\d{4}-\d\d-\d\d$/.test(value);
/** today, in the viewer's own time zone, as 2026-11-23 */
export const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
/** whole days from one date to another */
export const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000);

/** a name as it goes in a dashboard's address: Sign Package Maker: out of beta → sign-package-maker-out-of-beta */
export const slug = (name: string) =>
	name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const TAGS = /^(status|priority|current account|migrated\b.*)$/;
export const DATES = /^(start|due|target|date)$/;
export const ENDS = /^(due|target)$/;
const WIDE = /^(description|notes)$/;
const GOOD = /^(y|yes|done|company|shipped|complete|completed)$/;
const WARN = /^(n|no|personal|waiting|blocked|on hold|urgent)$/;
const ACTIVE = /^(doing|in progress|partial|high)$/;
export const tone = (value: string) => {
	const v = value.toLowerCase();
	return GOOD.test(v) ? 'good' : WARN.test(v) ? 'warn' : ACTIVE.test(v) ? 'active' : '';
};
/** the board's statuses in the order the work moves */
export const STATUSES = ['Done', 'Doing', 'Waiting', 'Next', 'Later', 'Inbox'];
const PRIORITIES = ['Urgent', 'High', 'Normal', 'Low'];

export interface Row {
	cells: string[];
	/** the first column */
	name: string;
	slug: string;
	parent?: Row;
	children: Row[];
	depth: number;
	/** made from a group of rows sharing a name (work.csv's projects), not a row of the file */
	group?: boolean;
	/** Parent names a row that isn't in the file */
	orphan?: boolean;
}

export interface Table {
	file: string;
	/** roadmap, from roadmap.csv: the dashboard's address uses it */
	key: string;
	columns: string[];
	keys: string[];
	/** a column's place, by its header or its header's first word (Migrated finds "Migrated (Y/N)"); -1 if none */
	at: (name: string) => number;
	/** every row of the file, in its order */
	rows: Row[];
	/** the rows at the top: parents, groups and rows on their own, in the file's order */
	top: Row[];
	/** the Parent column, or -1 when the file folds by its first column */
	parentAt: number;
}

export async function load(file: string): Promise<Table> {
	const res = await fetch(`/management/${file}`, { cache: 'no-store' });
	if (!res.ok) throw new Error(String(res.status));
	const parsed = parseCsv(decode(await res.arrayBuffer()).replace(/^﻿/, ''));
	if (!parsed.length) throw new Error('empty');
	const columns = parsed[0];
	const keys = columns.map((column) => column.toLowerCase());
	const at = (name: string) => keys.findIndex((key) => key === name.toLowerCase() || key.startsWith(`${name.toLowerCase()} `));
	const rows: Row[] = parsed.slice(1).map((cells) => {
		const full = columns.map((_, i) => cells[i] ?? '');
		return { cells: full, name: full[0], slug: slug(full[0]), children: [], depth: 0 };
	});
	const parentAt = at('parent');
	const top: Row[] = [];
	if (parentAt >= 0) {
		const byName = new Map(rows.map((row) => [row.name.toLowerCase(), row]));
		for (const row of rows) {
			const named = row.cells[parentAt];
			let parent = named ? byName.get(named.toLowerCase()) : undefined;
			// a row can't sit under itself, or under one of its own sub-tasks
			for (let up = parent; up; up = up.parent) if (up === row) parent = undefined;
			if (parent) (row.parent = parent), parent.children.push(row);
			else (row.orphan = Boolean(named)), top.push(row);
		}
		const depth = (row: Row, d: number) => ((row.depth = d), row.children.forEach((child) => depth(child, d + 1)));
		top.forEach((row) => depth(row, 0));
	} else {
		const groups = new Map<string, Row[]>();
		for (const row of rows) groups.set(row.name, [...(groups.get(row.name) ?? []), row]);
		for (const [name, members] of groups) {
			if (members.length < 2) {
				top.push(members[0]);
				continue;
			}
			const group: Row = { cells: rollUp(columns, keys, members), name, slug: slug(name), children: members, depth: 0, group: true };
			for (const member of members) (member.parent = group), (member.depth = 1);
			top.push(group);
		}
	}
	return { file, key: file.replace(/\.csv$/i, ''), columns, keys, at, rows, top, parentAt };
}

// A group's own cells, from its rows: the status furthest from done, the highest priority, the earliest start,
// the latest due date, everyone on it.
function rollUp(columns: string[], keys: string[], members: Row[]): string[] {
	return columns.map((_, i) => {
		const values = members.map((row) => row.cells[i]).filter(Boolean);
		const key = keys[i];
		if (i === 0) return members[0].cells[0];
		if (key === 'status') {
			if (values.length && values.every((v) => v.toLowerCase() === 'done')) return 'Done';
			const order = STATUSES.slice(1).map((s) => s.toLowerCase());
			return values.filter((v) => v.toLowerCase() !== 'done').sort((a, b) => rank(order, a) - rank(order, b))[0] ?? '';
		}
		if (key === 'priority') return values.sort((a, b) => rank(PRIORITIES.map((p) => p.toLowerCase()), a) - rank(PRIORITIES.map((p) => p.toLowerCase()), b))[0] ?? '';
		if (DATES.test(key)) {
			const dates = values.map(isoDate).filter(isDate).sort();
			return (ENDS.test(key) ? dates.at(-1) : dates[0]) ?? '';
		}
		if (/^(assigned to|people|who)$/.test(key))
			return [...new Set(values.flatMap((v) => v.split(';').map((p) => p.trim())).filter(Boolean))].join('; ');
		return '';
	});
}
const rank = (order: string[], value: string) => (order.indexOf(value.toLowerCase()) + 1 || order.length + 1);

/** every row under this one, at any depth */
export const descendants = (row: Row): Row[] => row.children.flatMap((child) => [child, ...descendants(child)]);

/** the row's Status, if the file has one */
export const status = (table: Table, row: Row) => {
	const i = table.at('status');
	return i >= 0 ? row.cells[i] : '';
};
export const isDone = (table: Table, row: Row) => status(table, row).toLowerCase() === 'done';

/** the row's Due or Target date, if it has one */
export function end(table: Table, row: Row): string {
	const i = table.keys.findIndex((key) => ENDS.test(key));
	const date = i >= 0 ? isoDate(row.cells[i]) : '';
	return isDate(date) ? date : '';
}
export function start(table: Table, row: Row): string {
	const i = table.keys.findIndex((key) => key === 'start');
	const date = i >= 0 ? isoDate(row.cells[i]) : '';
	return isDate(date) ? date : '';
}
/** past its Due or Target, and not done */
export const isLate = (table: Table, row: Row) => {
	const date = end(table, row);
	return Boolean(date) && date < today && !isDone(table, row);
};

export const dashboard = (table: Table, row: Row) => `/management/dashboard/?${table.key}=${row.slug}`;

/** "2/5", the done share of a parent's sub-tasks, drawn small */
export function mini(table: Table, row: Row): HTMLElement {
	const under = descendants(row);
	const done = under.filter((r) => isDone(table, r)).length;
	const box = document.createElement('span');
	box.className = 'ax-manage-mini';
	box.title = `${done} of ${under.length} sub-tasks done`;
	const bar = document.createElement('i');
	const fill = document.createElement('b');
	fill.style.width = `${under.length ? (done / under.length) * 100 : 0}%`;
	bar.append(fill);
	box.append(bar, `${done}/${under.length}`);
	return box;
}

/**
 * A row's first cell: its fold button if the table gives it one, its name, and for a parent, its progress and a link
 * to its dashboard on the line below. A Parent naming no row is flagged.
 */
export function nameCell(table: Table, row: Row, name: string, fold?: HTMLElement): HTMLElement {
	const cell = document.createElement('div');
	cell.className = 'ax-manage-cell';
	if (fold) cell.append(fold);
	const text = document.createElement('div');
	if (name) text.append(Object.assign(document.createElement('span'), { textContent: name }));
	if (row.orphan) {
		const mark = Object.assign(document.createElement('span'), { className: 'ax-manage-orphan', textContent: ' · parent?' });
		mark.title = `No row called “${row.cells[table.parentAt]}”`;
		text.append(mark);
	}
	if (row.children.length) {
		const meta = document.createElement('div');
		meta.className = 'ax-manage-meta';
		meta.append(mini(table, row), Object.assign(document.createElement('a'), { className: 'ax-manage-dash', href: dashboard(table, row), textContent: 'Dashboard' }));
		text.append(meta);
	}
	cell.append(text);
	return cell;
}

/**
 * A row of the table: its cells as tags, dates (a passed Due or Target marked), an issue link or text. The Parent
 * column is left out, since the nesting shows it. `name` fills the first cell's contents: the table adds its fold
 * button, progress and dashboard link there.
 */
export function rowElement(table: Table, row: Row, name?: (td: HTMLElement) => void, depth = row.depth, hide = new Set<number>()): HTMLTableRowElement {
	const tr = document.createElement('tr');
	if (depth) tr.className = 'child';
	if (row.group) tr.classList.add('group');
	tr.style.setProperty('--depth', String(depth));
	row.cells.forEach((value, i) => {
		if (i === table.parentAt || hide.has(i)) return;
		const td = document.createElement('td');
		const key = table.keys[i];
		if (i === 0) {
			td.className = 'name';
			if (name) name(td);
			else td.textContent = value;
		} else if (WIDE.test(key)) (td.className = 'wide'), (td.textContent = value);
		else if (TAGS.test(key) && value) {
			const tag = Object.assign(document.createElement('span'), { textContent: value });
			tag.className = `ax-tag ${tone(value)}`.trim();
			td.append(tag);
		} else if (DATES.test(key)) {
			const date = isoDate(value);
			td.className = 'date';
			td.textContent = date;
			if (ENDS.test(key) && isDate(date) && date < today && !isDone(table, row)) {
				td.classList.add('late');
				td.title = 'Past this date';
			}
		} else if (key === 'issue' && /^#?\d+$/.test(value)) {
			const n = value.replace('#', '');
			td.className = 'issue';
			td.append(Object.assign(document.createElement('a'), { href: `${ISSUES}${n}`, textContent: `#${n}`, title: 'On the planning board' }));
		} else {
			td.textContent = value;
			// the same as its parent's, such as its Category: shown quieter
			if (value && row.parent && !row.parent.group && value === row.parent.cells[i]) td.classList.add('same');
		}
		tr.append(td);
	});
	return tr;
}

/** the header cells, without the Parent column */
export const headerCells = (table: Table, hide = new Set<number>()) =>
	table.columns.filter((_, i) => i !== table.parentAt && !hide.has(i)).map((column) => Object.assign(document.createElement('th'), { textContent: column }));
