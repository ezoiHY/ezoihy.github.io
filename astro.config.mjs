// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://ezoihy.github.io',
	integrations: [sitemap()],
	trailingSlash: 'always',
});
