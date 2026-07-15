import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'glob';
import matter from 'gray-matter';

const ROOT = resolve(import.meta.dirname, '..');

const mdxFiles = globSync('**/*.mdx', { cwd: ROOT, ignore: ['node_modules/**'] });

describe('MDX frontmatter validation', () => {
  it('finds MDX files to test', () => {
    expect(mdxFiles.length).toBeGreaterThan(0);
  });

  describe.each(mdxFiles)('%s', (file) => {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    if (file.startsWith('snippets/')) {
      it('snippet files may omit frontmatter', () => {
        expect(body.length).toBeGreaterThan(0);
      });
      return;
    }

    if (file.startsWith('api-reference/endpoint/')) {
      it('has a title', () => {
        expect(frontmatter).toHaveProperty('title');
        expect(typeof frontmatter.title).toBe('string');
        expect(frontmatter.title.length).toBeGreaterThan(0);
      });

      it('has an openapi reference', () => {
        expect(frontmatter).toHaveProperty('openapi');
        expect(frontmatter.openapi).toMatch(
          /^(GET|POST|PUT|PATCH|DELETE|WEBHOOK)\s+\//
        );
      });
      return;
    }

    it('has a title', () => {
      expect(frontmatter).toHaveProperty('title');
      expect(typeof frontmatter.title).toBe('string');
      expect(frontmatter.title.length).toBeGreaterThan(0);
    });

    it('has a description', () => {
      expect(frontmatter).toHaveProperty('description');
      expect(typeof frontmatter.description).toBe('string');
      expect(frontmatter.description.length).toBeGreaterThan(0);
    });

    it('title is not excessively long (<=80 chars)', () => {
      expect(frontmatter.title.length).toBeLessThanOrEqual(80);
    });

    it('description is not excessively long (<=200 chars)', () => {
      expect(frontmatter.description.length).toBeLessThanOrEqual(200);
    });
  });
});
