import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'glob';

const ROOT = resolve(import.meta.dirname, '..');
const docsConfig = JSON.parse(readFileSync(resolve(ROOT, 'docs.json'), 'utf-8'));

function collectNavPages(tabs) {
  const pages = [];
  for (const tab of tabs) {
    for (const group of tab.groups) {
      for (const page of group.pages) {
        pages.push(typeof page === 'string' ? page : page.page);
      }
    }
  }
  return pages;
}

const navPages = collectNavPages(docsConfig.navigation.tabs);

describe('navigation consistency', () => {
  describe('all navigation pages resolve to existing files', () => {
    it.each(navPages)('%s exists as an MDX file', (slug) => {
      const filePath = resolve(ROOT, `${slug}.mdx`);
      expect(existsSync(filePath), `Missing file: ${slug}.mdx`).toBe(true);
    });
  });

  it('no duplicate page slugs in navigation', () => {
    const seen = new Set();
    const duplicates = [];
    for (const slug of navPages) {
      if (seen.has(slug)) {
        duplicates.push(slug);
      }
      seen.add(slug);
    }
    expect(duplicates, `Duplicate navigation entries: ${duplicates.join(', ')}`).toEqual([]);
  });

  describe('orphaned pages (MDX files not in navigation)', () => {
    const allMdx = globSync('**/*.mdx', {
      cwd: ROOT,
      ignore: ['node_modules/**', 'snippets/**'],
    });
    const navSet = new Set(navPages);

    it('identifies all content MDX pages', () => {
      expect(allMdx.length).toBeGreaterThan(0);
    });

    it.each(allMdx)('%s is referenced in navigation', (file) => {
      const slug = file.replace(/\.mdx$/, '');
      expect(navSet.has(slug), `Orphaned page: ${file}`).toBe(true);
    });
  });

  describe('logo and favicon assets exist', () => {
    it('light logo exists', () => {
      const logoPath = resolve(ROOT, docsConfig.logo.light.replace(/^\//, ''));
      expect(existsSync(logoPath)).toBe(true);
    });

    it('dark logo exists', () => {
      const logoPath = resolve(ROOT, docsConfig.logo.dark.replace(/^\//, ''));
      expect(existsSync(logoPath)).toBe(true);
    });

    it('favicon exists', () => {
      const faviconPath = resolve(ROOT, docsConfig.favicon.replace(/^\//, ''));
      expect(existsSync(faviconPath)).toBe(true);
    });
  });
});
