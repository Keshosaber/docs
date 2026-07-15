import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const spec = JSON.parse(
  readFileSync(resolve(ROOT, 'api-reference', 'openapi.json'), 'utf-8')
);

describe('openapi.json specification', () => {
  it('is valid JSON', () => {
    expect(spec).toBeDefined();
  });

  it('declares OpenAPI 3.x version', () => {
    expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/);
  });

  describe('info', () => {
    it('has required info fields', () => {
      expect(spec.info).toHaveProperty('title');
      expect(spec.info).toHaveProperty('version');
      expect(typeof spec.info.title).toBe('string');
      expect(spec.info.title.length).toBeGreaterThan(0);
    });

    it('has a description', () => {
      expect(spec.info).toHaveProperty('description');
      expect(spec.info.description.length).toBeGreaterThan(0);
    });

    it('has a license', () => {
      expect(spec.info).toHaveProperty('license');
      expect(spec.info.license).toHaveProperty('name');
    });
  });

  describe('servers', () => {
    it('defines at least one server', () => {
      expect(Array.isArray(spec.servers)).toBe(true);
      expect(spec.servers.length).toBeGreaterThan(0);
    });

    it('each server has a url', () => {
      for (const server of spec.servers) {
        expect(server).toHaveProperty('url');
        expect(server.url.length).toBeGreaterThan(0);
      }
    });
  });

  describe('paths', () => {
    it('defines at least one path', () => {
      expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
    });

    it('all paths start with /', () => {
      for (const path of Object.keys(spec.paths)) {
        expect(path).toMatch(/^\//);
      }
    });

    it('each path has at least one HTTP method', () => {
      const validMethods = [
        'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace',
      ];
      for (const [path, methods] of Object.entries(spec.paths)) {
        const methodKeys = Object.keys(methods).filter((k) =>
          validMethods.includes(k)
        );
        expect(methodKeys.length, `${path} has no HTTP methods`).toBeGreaterThan(
          0
        );
      }
    });

    it('each operation has a description', () => {
      const validMethods = [
        'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace',
      ];
      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const method of validMethods) {
          if (methods[method]) {
            expect(
              methods[method].description,
              `${method.toUpperCase()} ${path} missing description`
            ).toBeDefined();
          }
        }
      }
    });

    it('each operation defines at least one response', () => {
      const validMethods = [
        'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace',
      ];
      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const method of validMethods) {
          if (methods[method]) {
            expect(
              Object.keys(methods[method].responses).length,
              `${method.toUpperCase()} ${path} has no responses`
            ).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe('components and schemas', () => {
    it('defines components with schemas', () => {
      expect(spec).toHaveProperty('components');
      expect(spec.components).toHaveProperty('schemas');
      expect(Object.keys(spec.components.schemas).length).toBeGreaterThan(0);
    });

    it('each schema has a type or uses composition', () => {
      for (const [name, schema] of Object.entries(spec.components.schemas)) {
        const hasType = 'type' in schema;
        const hasComposition =
          'allOf' in schema || 'oneOf' in schema || 'anyOf' in schema;
        expect(
          hasType || hasComposition,
          `Schema "${name}" has no type or composition keyword`
        ).toBe(true);
      }
    });

    it('all $ref pointers resolve to existing schemas', () => {
      const schemaNames = Object.keys(spec.components.schemas);
      const refs = JSON.stringify(spec).match(/"\$ref"\s*:\s*"([^"]+)"/g) || [];
      for (const ref of refs) {
        const refPath = ref.match(/"#\/components\/schemas\/(\w+)"/);
        if (refPath) {
          expect(
            schemaNames,
            `$ref to "${refPath[1]}" does not exist`
          ).toContain(refPath[1]);
        }
      }
    });
  });

  describe('security', () => {
    it('defines a top-level security scheme', () => {
      expect(Array.isArray(spec.security)).toBe(true);
      expect(spec.security.length).toBeGreaterThan(0);
    });

    it('referenced security schemes exist in components', () => {
      for (const entry of spec.security) {
        for (const schemeName of Object.keys(entry)) {
          expect(
            spec.components.securitySchemes,
            `Security scheme "${schemeName}" not defined in components`
          ).toHaveProperty(schemeName);
        }
      }
    });
  });

  describe('webhooks', () => {
    it('defines webhooks when present', () => {
      if (spec.webhooks) {
        expect(Object.keys(spec.webhooks).length).toBeGreaterThan(0);
      }
    });

    it('each webhook has a post method with a description', () => {
      if (spec.webhooks) {
        for (const [name, webhook] of Object.entries(spec.webhooks)) {
          expect(
            webhook.post,
            `Webhook "${name}" missing post method`
          ).toBeDefined();
          expect(
            webhook.post.description,
            `Webhook "${name}" post missing description`
          ).toBeDefined();
        }
      }
    });
  });
});
