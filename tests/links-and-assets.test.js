import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'glob';

const ROOT = resolve(import.meta.dirname, '..');

const mdxFiles = globSync('**/*.mdx', { cwd: ROOT, ignore: ['node_modules/**'] });

/**
 * Strip fenced code blocks (``` ... ```) and inline code (`...`)
 * so we only validate real references, not example/tutorial content.
 */
function stripCodeBlocks(content) {
  // Remove fenced code blocks (triple or quadruple backticks)
  let stripped = content.replace(/````[\s\S]*?````/g, '');
  stripped = stripped.replace(/```[\s\S]*?```/g, '');
  // Remove inline code
  stripped = stripped.replace(/`[^`]+`/g, '');
  return stripped;
}

function extractInternalHrefs(content) {
  const cleaned = stripCodeBlocks(content);
  const hrefPattern = /href="(\/[^"]+)"/g;
  const hrefs = [];
  let match;
  while ((match = hrefPattern.exec(cleaned)) !== null) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

function extractImageSrcs(content) {
  const cleaned = stripCodeBlocks(content);
  const srcPattern = /src="(\/[^"]+)"/g;
  const srcs = [];
  let match;
  while ((match = srcPattern.exec(cleaned)) !== null) {
    srcs.push(match[1]);
  }
  return srcs;
}

function extractImports(content) {
  const cleaned = stripCodeBlocks(content);
  const importPattern = /import\s+\w+\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  while ((match = importPattern.exec(cleaned)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

describe('internal link validation', () => {
  const allLinks = [];
  for (const file of mdxFiles) {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    const hrefs = extractInternalHrefs(content);
    for (const href of hrefs) {
      allLinks.push({ file, href });
    }
  }

  it('found internal links to validate', () => {
    expect(allLinks.length).toBeGreaterThan(0);
  });

  it.each(allLinks)(
    '$file: href "$href" resolves to an existing page or asset',
    ({ href }) => {
      const cleanHref = href.split('#')[0];
      const asPage = resolve(ROOT, `${cleanHref.replace(/^\//, '')}.mdx`);
      const asFile = resolve(ROOT, cleanHref.replace(/^\//, ''));
      const exists = existsSync(asPage) || existsSync(asFile);
      expect(exists, `Broken link: ${href}`).toBe(true);
    }
  );
});

describe('image/asset reference validation', () => {
  const allAssets = [];
  for (const file of mdxFiles) {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    const srcs = extractImageSrcs(content);
    for (const src of srcs) {
      allAssets.push({ file, src });
    }
  }

  if (allAssets.length > 0) {
    it.each(allAssets)(
      '$file: src "$src" references an existing file',
      ({ src }) => {
        const filePath = resolve(ROOT, src.replace(/^\//, ''));
        expect(existsSync(filePath), `Missing asset: ${src}`).toBe(true);
      }
    );
  } else {
    it('no local asset references to validate', () => {
      expect(true).toBe(true);
    });
  }
});

describe('MDX import validation', () => {
  const allImports = [];
  for (const file of mdxFiles) {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    const imports = extractImports(content);
    for (const imp of imports) {
      allImports.push({ file, importPath: imp });
    }
  }

  if (allImports.length > 0) {
    it.each(allImports)(
      '$file: import "$importPath" resolves to an existing file',
      ({ importPath }) => {
        const cleanPath = importPath.replace(/^\//, '');
        const filePath = resolve(ROOT, cleanPath);
        expect(existsSync(filePath), `Missing import: ${importPath}`).toBe(true);
      }
    );
  } else {
    it('no imports to validate', () => {
      expect(true).toBe(true);
    });
  }
});
