import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const docsConfig = JSON.parse(readFileSync(resolve(ROOT, 'docs.json'), 'utf-8'));

describe('docs.json configuration', () => {
  it('is valid JSON with a $schema field', () => {
    expect(docsConfig).toBeDefined();
    expect(docsConfig.$schema).toBe('https://mintlify.com/docs.json');
  });

  it('has required top-level fields', () => {
    expect(docsConfig).toHaveProperty('name');
    expect(docsConfig).toHaveProperty('theme');
    expect(docsConfig).toHaveProperty('colors');
    expect(docsConfig).toHaveProperty('favicon');
    expect(docsConfig).toHaveProperty('navigation');
    expect(docsConfig).toHaveProperty('logo');
  });

  describe('colors', () => {
    it('has primary, light, and dark colors', () => {
      expect(docsConfig.colors).toHaveProperty('primary');
      expect(docsConfig.colors).toHaveProperty('light');
      expect(docsConfig.colors).toHaveProperty('dark');
    });

    it('all colors are valid hex codes', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      expect(docsConfig.colors.primary).toMatch(hexPattern);
      expect(docsConfig.colors.light).toMatch(hexPattern);
      expect(docsConfig.colors.dark).toMatch(hexPattern);
    });
  });

  describe('logo', () => {
    it('has light and dark variants', () => {
      expect(docsConfig.logo).toHaveProperty('light');
      expect(docsConfig.logo).toHaveProperty('dark');
    });

    it('logo paths start with /', () => {
      expect(docsConfig.logo.light).toMatch(/^\//);
      expect(docsConfig.logo.dark).toMatch(/^\//);
    });
  });

  describe('navigation', () => {
    it('has a tabs array', () => {
      expect(docsConfig.navigation).toHaveProperty('tabs');
      expect(Array.isArray(docsConfig.navigation.tabs)).toBe(true);
      expect(docsConfig.navigation.tabs.length).toBeGreaterThan(0);
    });

    it('each tab has a tab name and groups array', () => {
      for (const tab of docsConfig.navigation.tabs) {
        expect(tab).toHaveProperty('tab');
        expect(typeof tab.tab).toBe('string');
        expect(tab).toHaveProperty('groups');
        expect(Array.isArray(tab.groups)).toBe(true);
      }
    });

    it('each group has a group name and pages array', () => {
      for (const tab of docsConfig.navigation.tabs) {
        for (const group of tab.groups) {
          expect(group).toHaveProperty('group');
          expect(typeof group.group).toBe('string');
          expect(group).toHaveProperty('pages');
          expect(Array.isArray(group.pages)).toBe(true);
          expect(group.pages.length).toBeGreaterThan(0);
        }
      }
    });

    it('page slugs contain no file extensions', () => {
      for (const tab of docsConfig.navigation.tabs) {
        for (const group of tab.groups) {
          for (const page of group.pages) {
            const slug = typeof page === 'string' ? page : page.page;
            expect(slug).not.toMatch(/\.\w+$/);
          }
        }
      }
    });
  });

  describe('navbar', () => {
    it('has links array', () => {
      expect(docsConfig.navbar).toHaveProperty('links');
      expect(Array.isArray(docsConfig.navbar.links)).toBe(true);
    });

    it('each link has label and href', () => {
      for (const link of docsConfig.navbar.links) {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('href');
      }
    });

    it('has a primary action', () => {
      expect(docsConfig.navbar).toHaveProperty('primary');
      expect(docsConfig.navbar.primary).toHaveProperty('type');
      expect(docsConfig.navbar.primary).toHaveProperty('label');
      expect(docsConfig.navbar.primary).toHaveProperty('href');
    });
  });

  describe('footer', () => {
    it('has social links', () => {
      expect(docsConfig).toHaveProperty('footer');
      expect(docsConfig.footer).toHaveProperty('socials');
    });

    it('social URLs are valid https URLs', () => {
      for (const [, url] of Object.entries(docsConfig.footer.socials)) {
        expect(url).toMatch(/^https:\/\//);
      }
    });
  });
});
