// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import { contentIndexer } from './src/integrations/content-indexer.ts';

export default defineConfig({
  adapter: vercel(),
  vite: {
    build: {
      rollupOptions: {
        external: ['openai', '@anthropic-ai/sdk'],
      },
    },
  },
  integrations: [
    starlight({
      title: 'Manual Itinerante',
      defaultLocale: 'root',
      locales: {
        root: { label: 'Português', lang: 'pt-BR' },
      },
      social: [],
      sidebar: [
        {
          label: 'Início',
          items: [
            { label: 'Bem-vindo', slug: 'index' },
            { label: 'Sobre a Itinerante', slug: 'sobre' },
          ],
        },
        {
          label: 'Jurídico',
          items: [{ autogenerate: { directory: 'juridico' } }],
        },
        {
          label: 'Software',
          items: [{ autogenerate: { directory: 'software' } }],
        },
        {
          label: 'Processos',
          items: [{ autogenerate: { directory: 'processos' } }],
        },
      ],
      components: {
        Header: './src/components/HeaderWithWidget.astro',
      },
      customCss: [
        './src/styles/custom.css',
      ],
      head: [
        {
          tag: 'script',
          attrs: { src: '/scripts/highlight.js', defer: true },
        },
      ],
    }),
    preact(),
    contentIndexer(),
  ],
});
