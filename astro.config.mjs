import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://eliteliondance.fr',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/prestations'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
