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
      logo: {
        src: './public/logotipo-dpe-rr.webp', // Coloque o arquivo em src/assets/
        alt: 'Logo DPE-RR',
        replacesTitle: false, // Define se substitui ou fica ao lado do texto
      },
      favicon: './public/logotipo-dpe-rr.png', // Coloque o arquivo em src/assets/
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
          label: 'Sistemas',
          items: [{ autogenerate: { directory: 'sistemas' } }],
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
