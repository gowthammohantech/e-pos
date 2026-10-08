/** Prints every demo image the seed references, as JSON: [{ url, name, category, variant }]. */
import { buildSeed } from '@elixir/mock-data';

const seed = buildSeed();
const cats = new Map(seed.categories.map((c) => [c.id, c.name]));
const out = new Map<string, { url: string; name: string; category: string; variant?: string }>();
for (const x of [...seed.products, ...seed.menuItems]) {
  if (x.imageUrl && !out.has(x.imageUrl)) out.set(x.imageUrl, { url: x.imageUrl, name: x.name, category: cats.get(x.categoryId) ?? '', variant: 'variantAttrs' in x ? x.variantAttrs?.color : undefined });
}
console.log(JSON.stringify([...out.values()], null, 1));
