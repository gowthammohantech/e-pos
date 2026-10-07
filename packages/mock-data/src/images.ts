import type { MenuItem, Product } from '@elixir/contracts';

/**
 * Demo artwork lives in @elixir/demo-assets (public/demo/…) and is served next to each app.
 * Paths are relative so every app resolves them against its own base URL. Fashion variants
 * share one picture per style.
 */
export function demoProductImage(p: Product): string {
  return `demo/products/${p.styleCode ? `${p.tenantId}-${p.styleCode}` : p.id}.webp`;
}

export function demoMenuImage(m: MenuItem): string {
  return `demo/menu/${m.id}.webp`;
}

export function attachDemoImages(products: Product[], menu: MenuItem[]): void {
  for (const p of products) p.imageUrl ??= demoProductImage(p);
  for (const m of menu) m.imageUrl ??= demoMenuImage(m);
}
