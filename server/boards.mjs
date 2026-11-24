// The management tables, read live from the GitHub Projects they're edited on (Felipe, 2026-11-24: GitHub is the
// source of truth, the hub shows them to people who are signed in here, with no GitHub sign-in). Each board becomes
// the CSV text the hub's management pages (src/management.ts) read at /management/<name>.csv.
//
//   accounts.csv  Alexandria · Accounts (Project 18): draft items, one per service
//   work.csv      Alexandria · Design Projects (Project 17): a job's sub-issues are its rows of work
//   roadmap.csv   Alexandria · Development Roadmap (Project 14): one row per issue, Parent from its parent issue
//
// BOARDS_TOKEN (set on Render, never here) is a classic token with read:project and repo: GitHub has no fine-grained
// token for a user's projects, and the issues are in the private alexandria_management. A board is fetched at most
// once every two minutes; if GitHub fails, the last good copy is served.

const OWNER = 'felipeharker';
const FRESH = 2 * 60 * 1000;

const BOARDS = {
	accounts: { number: 18, columns: ['Service', 'Description', 'Current account', 'Status', 'Notes'] },
	work: { number: 17, columns: ['Project', 'Work', 'Assigned to', 'Status', 'Priority', 'Start', 'Due', 'Issue', 'Notes'] },
	roadmap: { number: 14, columns: ['Item', 'Category', 'Subcategory', 'Status', 'Priority', 'Start', 'Target', 'Parent', 'Issue', 'Notes'] },
};

const QUERY = `query($number: Int!, $after: String) {
  user(login: "${OWNER}") { projectV2(number: $number) { items(first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      isArchived
      content {
        ... on DraftIssue { title }
        ... on Issue { number title parent { number title } subIssues { totalCount } }
      }
      fieldValues(first: 30) { nodes {
        ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2FieldCommon { name } } }
        ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2FieldCommon { name } } }
        ... on ProjectV2ItemFieldDateValue { date field { ... on ProjectV2FieldCommon { name } } }
      } }
    }
  } } }
}`;

async function items(number, token) {
	const all = [];
	let after = null;
	do {
		const res = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'alexandria-gate' },
			body: JSON.stringify({ query: QUERY, variables: { number, after } }),
			signal: AbortSignal.timeout(15000),
		});
		const json = await res.json().catch(() => ({}));
		const page = json.data?.user?.projectV2?.items;
		if (!res.ok || json.errors || !page) throw new Error(`GitHub ${res.status}: ${JSON.stringify(json.errors ?? json.message ?? '')}`);
		all.push(...page.nodes);
		after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
	} while (after);
	return all
		.filter((item) => !item.isArchived && item.content)
		.map((item) => {
			const fields = {};
			for (const value of item.fieldValues.nodes) {
				if (value?.field?.name) fields[value.field.name] = value.name ?? value.text ?? value.date ?? '';
			}
			return { ...item.content, fields };
		});
}

const rows = {
	accounts: (list) =>
		list.map((item) => {
			const f = item.fields;
			return [item.title, f.Description, f.Account, f.Status, f.Notes];
		}),
	// A job with sub-issues on the board is the rows of its sub-issues (the page folds them under it); a job without
	// any is a row of its own.
	work: (list) => {
		const onBoard = new Set(list.map((item) => item.number));
		return list
			.filter((item) => !(item.subIssues?.totalCount && list.some((other) => other.parent?.number === item.number)))
			.map((item) => {
				const f = item.fields;
				const job = item.parent && onBoard.has(item.parent.number) ? item.parent.title : item.title;
				const work = job === item.title ? '' : item.title;
				return [job, work, f['Assigned to'], f.Status, f.Priority, f.Start, f.Due, item.number ? `#${item.number}` : '', f.Notes];
			});
	},
	roadmap: (list) =>
		list.map((item) => {
			const f = item.fields;
			return [item.title, f.Category, f.Subcategory, f.Status, f.Priority, f.Start, f.Target, item.parent?.title, item.number ? `#${item.number}` : '', f.Notes];
		}),
};

const quote = (value) => {
	const text = String(value ?? '');
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const toCsv = (columns, body) => [columns, ...body].map((row) => row.map(quote).join(',')).join('\r\n') + '\r\n';

const cache = new Map(); // name -> { at, csv, pending }

/** the board as CSV text, or null when there's no such table; throws when it can't be read and there's no copy */
export async function boardCsv(name) {
	const board = BOARDS[name];
	if (!board) return null;
	const token = process.env.BOARDS_TOKEN;
	if (!token) throw new Error('BOARDS_TOKEN is not set');
	const held = cache.get(name);
	if (held?.csv && Date.now() - held.at < FRESH) return held.csv;
	if (held?.pending) return held.pending;
	const pending = items(board.number, token)
		.then((list) => {
			const csv = toCsv(board.columns, rows[name](list));
			cache.set(name, { at: Date.now(), csv });
			return csv;
		})
		.catch((error) => {
			console.error(`board ${name}:`, error.message);
			if (held?.csv) return cache.set(name, { at: held.at, csv: held.csv }), held.csv;
			cache.delete(name);
			throw error;
		});
	cache.set(name, { ...held, pending });
	return pending;
}

/** the address of a table's board on GitHub */
export const boardUrl = (name) => BOARDS[name] && `https://github.com/users/${OWNER}/projects/${BOARDS[name].number}`;
