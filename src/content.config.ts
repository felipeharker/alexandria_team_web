import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Starlight's own labels, in Title Case like every other title (src/content/i18n/en.json)
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
	// What's New: one Markdown file per update, to the Rhino and Grasshopper packages or to the web tools, written by
	// hand when it ships (src/content/updates/). The page shows the newest three.
	updates: defineCollection({
		loader: glob({ pattern: '*.md', base: './src/content/updates' }),
		schema: z.object({
			title: z.string(),
			date: z.coerce.date(), // with a time when two updates share a day, so they sort
			area: z.enum(['Web Tools', 'Rhino and Grasshopper']),
			version: z.string().optional(),
		}),
	}),
};
