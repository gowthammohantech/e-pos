import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSeed } from '../index';

const PUBLIC = join(__dirname, '../../../demo-assets/public');

describe('demo images', () => {
  it('gives every product and menu item a bundled image', () => {
    const s = buildSeed();
    const urls = [...s.products, ...s.menuItems].map((x) => x.imageUrl);
    expect(urls.every(Boolean)).toBe(true);
    const missing = [...new Set(urls)].filter((u) => !existsSync(join(PUBLIC, u!)));
    expect(missing).toEqual([]);
  });
});
