// Text in the Alexandria Etch single-line font, as SVG path data, for the pages that show the font (the home page's
// Etch Text card and the font's download page). The strokes are public/downloads/etch-font/alexandria_etch.json, the
// file people download: capitals 100 units tall, each stroke a list of [x, y, bulge], a bulge being a DXF
// polyline's (0 for a line, else tan(a quarter of the arc's angle), positive counter clockwise).
import font from '../public/downloads/etch-font/alexandria_etch.json';

type Stroke = { closed: boolean; pts: number[][] };
type Glyph = { advance: number; strokes: Stroke[] };
const glyphs = font.glyphs as unknown as Record<string, Glyph>;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** The text's strokes as one path, its baseline at y and its left at x, the capitals `height` tall; and its width. */
export function etchText(text: string, height: number, x = 0, y = 0): { d: string; width: number } {
	const s = height / font.cap_height;
	const at = (px: number, py: number, pen: number) => `${r2(x + (pen + px) * s)} ${r2(y - py * s)}`;
	let pen = 0;
	const parts: string[] = [];
	for (const char of text) {
		const glyph = glyphs[char] ?? glyphs[char.toUpperCase()];
		if (!glyph) {
			pen += font.space;
			continue;
		}
		for (const { pts, closed } of glyph.strokes) {
			const ring = closed ? [...pts, pts[0]] : pts;
			parts.push(`M${at(pts[0][0], pts[0][1], pen)}`);
			for (let i = 0; i + 1 < ring.length; i++) {
				const [x1, y1, bulge] = ring[i], [x2, y2] = ring[i + 1];
				if (!bulge) parts.push(`L${at(x2, y2, pen)}`);
				else {
					const r = r2(((Math.hypot(x2 - x1, y2 - y1) * (1 + bulge * bulge)) / (4 * Math.abs(bulge))) * s);
					// counter clockwise with y up is sweep 0 on a page, where y runs down
					parts.push(`A${r} ${r} 0 0 ${bulge > 0 ? 0 : 1} ${at(x2, y2, pen)}`);
				}
			}
			if (closed) parts.push('Z');
		}
		pen += glyph.advance;
	}
	return { d: parts.join(''), width: pen * s };
}
