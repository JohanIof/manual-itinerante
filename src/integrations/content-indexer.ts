import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

interface ContentEntry {
  slug: string;
  title: string;
  description: string;
  body: string;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/m, '')           // frontmatter
    .replace(/```[\s\S]*?```/g, '')             // code blocks
    .replace(/`[^`]*`/g, '')                     // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '')            // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')      // links → text
    .replace(/^#{1,6}\s+/gm, '')                // headings
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1') // bold/italic
    .replace(/^\s*[-*+]\s+/gm, '')              // unordered lists
    .replace(/^\s*\d+\.\s+/gm, '')              // ordered lists
    .replace(/^\s*>\s+/gm, '')                  // blockquotes
    .replace(/\|.*\|/g, '')                      // tables
    .replace(/^[-=]{3,}$/gm, '')                // hr
    .replace(/import\s+.*$/gm, '')              // import statements
    .replace(/<[^>]+>/g, '')                     // HTML tags
    .replace(/\n{3,}/g, '\n\n')                 // excess newlines
    .trim();
}

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

export function contentIndexer(): AstroIntegration {
  return {
    name: 'content-indexer',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const docsDir = path.resolve('src/content/docs');
        const files = collectMarkdownFiles(docsDir);
        const entries: ContentEntry[] = [];

        for (const file of files) {
          const raw = fs.readFileSync(file, 'utf-8');
          const { data, content } = matter(raw);
          
          const relativePath = path.relative(docsDir, file);
          const slug = relativePath
            .replace(/\\/g, '/')
            .replace(/\.(md|mdx)$/, '')
            .replace(/\/index$/, '');

          entries.push({
            slug,
            title: data.title || slug,
            description: data.description || '',
            body: stripMarkdown(content),
          });
        }

        const outPath = new URL('content.json', dir).pathname;
        // On Windows, URL pathname starts with / before drive letter
        const cleanPath = outPath.replace(/^\/([a-zA-Z]:)/, '$1');
        fs.writeFileSync(cleanPath, JSON.stringify(entries, null, 2), 'utf-8');
        logger.info(`Generated content.json with ${entries.length} entries`);
      },
      'astro:server:setup': async ({ logger }) => {
        // Also generate content.json for dev mode
        const docsDir = path.resolve('src/content/docs');
        const publicDir = path.resolve('public');
        const files = collectMarkdownFiles(docsDir);
        const entries: ContentEntry[] = [];

        for (const file of files) {
          const raw = fs.readFileSync(file, 'utf-8');
          const { data, content } = matter(raw);
          
          const relativePath = path.relative(docsDir, file);
          const slug = relativePath
            .replace(/\\/g, '/')
            .replace(/\.(md|mdx)$/, '')
            .replace(/\/index$/, '');

          entries.push({
            slug,
            title: data.title || slug,
            description: data.description || '',
            body: stripMarkdown(content),
          });
        }

        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(path.join(publicDir, 'content.json'), JSON.stringify(entries, null, 2), 'utf-8');
        logger.info(`Generated content.json with ${entries.length} entries (dev mode)`);
      },
    },
  };
}
