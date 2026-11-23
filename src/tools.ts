// The home page's tools, by category, in the home page's order (user, 2026-11-23): Design, Fabrication, Permitting
// (third since Photo Elevation, its first tool, 2026-11-23), Parametric, Rhino/Grasshopper. The home page (content/docs/index.mdx) draws its index strip and its sections from this list, so
// a category's count is always its tools. Add a new tool here, with a drawing of what it makes in ToolArt.astro and
// the next sheet number in its category; its category page (content/docs/tools/*.mdx) and Your First Day list it too.
import release from './data/release.json';

export interface ToolLink {
	label: string;
	href: string;
	external?: boolean;
}
export interface Tool {
	title: string;
	art: string; // a drawing's name in ToolArt
	code: string; // its sheet number, such as D-01
	links: ToolLink[]; // the first is what the card opens
	badge?: string; // "Beta", for a tool still being built
	tag?: string; // a grey tag, such as the release a download is at
}
export interface Category {
	code: string; // the sheet letter: D, F, PM, P, R
	id: string; // the section's anchor on the home page
	title: string;
	short: string; // its name in the index strip
	href: string; // its page under /tools
	tools: Tool[];
}

const web = (open: string): ToolLink[] => [
	{ label: 'Open', href: open },
	{ label: 'Guide', href: `${open}guide/` },
];

export const categories: Category[] = [
	{
		code: 'D',
		id: 'design',
		title: 'Design Tools',
		short: 'Design',
		href: '/tools/design/',
		tools: [
			{ title: 'Site Plan', art: 'site-plan', code: 'D-01', links: web('/site-plan/') },
			{ title: 'Vectorizer', art: 'vectorizer', code: 'D-02', links: web('/vectorizer/') },
			{ title: 'Braille Lettering Designer', art: 'braille', code: 'D-03', links: web('/braille/') },
		],
	},
	{
		code: 'F',
		id: 'fabrication',
		title: 'Fabrication Tools',
		short: 'Fabrication',
		href: '/tools/fabrication/',
		tools: [
			{ title: 'Color Matcher', art: 'color-matcher', code: 'F-01', links: web('/colors/') },
			{ title: 'Color Library', art: 'color-library', code: 'F-02', links: web('/colors/library/') },
			{ title: 'Material Estimator', art: 'material-estimator', code: 'F-03', badge: 'Beta', links: web('/estimator/') },
			{ title: 'Material Library', art: 'material-library', code: 'F-04', badge: 'Beta', links: web('/materials/') },
			{ title: 'Etch Text', art: 'etch-text', code: 'F-05', badge: 'Beta', links: web('/etch-text/') },
		],
	},
	{
		code: 'PM',
		id: 'permitting',
		title: 'Permitting Tools',
		short: 'Permitting',
		href: '/tools/permitting/',
		tools: [{ title: 'Photo Elevation', art: 'photo-elevation', code: 'PM-01', badge: 'Beta', links: web('/photo-elevation/') }],
	},
	{
		code: 'P',
		id: 'parametric',
		title: 'Parametric Tools',
		short: 'Parametric',
		href: '/tools/parametric/',
		tools: [
			{ title: 'Parametric Grid', art: 'parametric-grid', code: 'P-01', links: web('/grid/') },
			{ title: 'Image Grid', art: 'image-grid', code: 'P-02', badge: 'Beta', links: web('/image-grid/') },
		],
	},
	{
		code: 'R',
		id: 'rhino-grasshopper',
		title: 'Rhino/Grasshopper Tools',
		short: 'Rhino/Grasshopper',
		href: '/tools/rhino-grasshopper/',
		tools: [
			{
				title: 'Alexandria Tools',
				art: 'alexandria-tools',
				code: 'R-01',
				tag: release.version,
				links: [
					{ label: 'Download', href: '/start/download/' },
					{ label: 'Guide', href: '/rhino/' },
				],
			},
			{
				title: 'Alexandria Phoenix',
				art: 'alexandria-phoenix',
				code: 'R-02',
				tag: release.version,
				links: [
					{ label: 'Download', href: '/start/download/' },
					{ label: 'Guide', href: '/grasshopper/' },
				],
			},
		],
	},
];
