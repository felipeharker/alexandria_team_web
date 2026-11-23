// Text in the Alexandria Braille font, as dots to draw, for the font's download page. The sizes and the letters'
// cells are public/downloads/braille-font/alexandria_braille.json, the file people download and the source the font
// is built from (alexandria_phoenix, braille_font/): inches, centre to centre, at the font's point size.
import font from '../public/downloads/braille-font/alexandria_braille.json';

const { dot, spacing, cell, line } = font.inches;
const letters = font.letters as Record<string, string>;
const FIRST = 0x2800; // the blank braille pattern; a pattern's number above it has one bit per dot, dot 1 first
// where each of the eight dots sits in its cell: [column, row]
const PLACES = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3]];

/** A character's cell, as the font has it: a braille pattern is itself, a letter is its uncontracted cell, and
    anything else is blank. */
function cellOf(char: string): number {
	const code = char.codePointAt(0) ?? 0;
	if (code >= FIRST && code < FIRST + 256) return code - FIRST;
	const dots = letters[char.toLowerCase()];
	return dots ? [...dots].reduce((bits, d) => bits | (1 << (Number(d) - 1)), 0) : 0;
}

/** The text's dots at `scale` units to the inch, the first cell's dot 1 centred on (x, y): each dot's centre, the
    dots' radius, and the text's width from the first cell's left column to the last cell's right. */
export function brailleText(text: string, scale: number, x = 0, y = 0): { dots: { cx: number; cy: number }[]; r: number; width: number } {
	const dots: { cx: number; cy: number }[] = [];
	const chars = [...text];
	chars.forEach((char, i) => {
		const bits = cellOf(char);
		PLACES.forEach(([column, row], bit) => {
			if (bits & (1 << bit)) dots.push({ cx: x + (i * cell + column * spacing) * scale, cy: y + row * spacing * scale });
		});
	});
	return { dots, r: (dot / 2) * scale, width: (Math.max(0, chars.length - 1) * cell + spacing) * scale };
}

/** The font's sizes, in inches, and the point size they print at. */
export const brailleSizes = { dot, spacing, cell, line, points: font.point_size, leading: line * 72 };
