#!/usr/bin/env python3
"""Source real photos for the demo seed from Wikimedia Commons and Open Food Facts.

  pnpm --silent --filter @elixir/demo-assets items > /tmp/items.json
  python3 scripts/fetch_photos.py candidates /tmp/items.json /tmp/cands   # review sheet.html, set "pick" in photos.json
                                                                          # (--titles: list file titles, no previews)
  python3 scripts/fetch_photos.py build /tmp/items.json /tmp/cands        # writes public/demo/**, CREDITS.json, src/native.ts

Both sources are freely licensed (CC / public domain); attribution is kept in public/demo/CREDITS.json.
Requires Pillow with WebP support.
"""
import html
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
QUERIES = {k: v for k, v in json.loads((ROOT / 'scripts' / 'photos.json').read_text()).items() if not k.startswith('_')}
UA = 'ElixirPOS-demo-assets/0.1 (https://github.com/gowthammohantech/e-pos; demo seed images)'
N = 4  # candidates per item
SIZE = 480


def get(url: str, tries: int = 6) -> bytes:
    """GET with a polite delay (Wikimedia rate-limits bursts) and backoff on 429/5xx."""
    # Commons hands out thumb.wikimedia.org links; the same paths are served by upload.wikimedia.org.
    url = url.replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/', 1)
    for i in range(tries):
        time.sleep(1.0)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if i == tries - 1 or e.code not in (429, 500, 502, 503, 504):
                raise
            wait = float(e.headers.get('Retry-After') or 0) or 5 * 2 ** i
            print(f'  {e.code}, retrying in {min(wait, 30):.0f}s', file=sys.stderr)
            time.sleep(min(wait, 30))
        except OSError:
            if i == tries - 1:
                raise
            time.sleep(2 ** i)
    raise RuntimeError('unreachable')


def strip_tags(s: str) -> str:
    return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()


def search_commons(q: str) -> list[dict]:
    params = {
        'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6,
        'gsrsearch': f'{q} filetype:bitmap', 'gsrlimit': 12,
        'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size|mime', 'iiurlwidth': 800,
    }
    data = json.loads(get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))
    pages = sorted((data.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
    out = []
    for p in pages:
        ii = (p.get('imageinfo') or [{}])[0]
        if ii.get('mime') not in ('image/jpeg', 'image/png', 'image/webp') or min(ii.get('width', 0), ii.get('height', 0)) < 300:
            continue
        meta = ii.get('extmetadata', {})
        out.append({
            'thumb': ii.get('thumburl') or ii['url'],
            'source': ii.get('descriptionurl'),
            'title': p['title'],
            'author': strip_tags(meta.get('Artist', {}).get('value', '')) or 'Unknown',
            'license': meta.get('LicenseShortName', {}).get('value', ''),
            'licenseUrl': meta.get('LicenseUrl', {}).get('value', ''),
        })
    return out[:N]


def search_off(q: str) -> list[dict]:
    """q is 'brand-tag|words': pack shots of that brand, best match on the product-name words first.
    (OFF's full-text search answers 503 to scripts; the v2 tag filter is reliable.)"""
    brand, _, words = q.partition('|')
    params = {'brands_tags': brand, 'fields': 'code,product_name,brands,image_front_url', 'page_size': 100, 'sort_by': 'unique_scans_n'}
    data = json.loads(get('https://world.openfoodfacts.org/api/v2/search?' + urllib.parse.urlencode(params)))
    want = [w for w in words.lower().split() if w]
    def score(p: dict) -> int:
        name = (p.get('product_name') or '').lower()
        return sum(w in name for w in want)
    out = []
    for p in sorted((p for p in data.get('products', []) if p.get('image_front_url')), key=score, reverse=True):
        out.append({
            'thumb': re.sub(r'\.(\d+)\.jpg$', '.full.jpg', p['image_front_url']),
            'source': f"https://world.openfoodfacts.org/product/{p['code']}",
            'title': f"{p.get('brands', '')} {p.get('product_name', '')}".strip(),
            'author': 'Open Food Facts contributors',
            'license': 'CC BY-SA 3.0',
            'licenseUrl': 'https://creativecommons.org/licenses/by-sa/3.0/',
        })
    return out[:N]


def fetch_rendition(url: str) -> bytes:
    """Commons rate-limits originals and non-standard widths; small originals are fetched as a standard thumbnail step."""
    m = re.match(r'(https://upload\.wikimedia\.org/wikipedia/commons)/([0-9a-f]/[0-9a-f]{2})/([^?]+)', url)
    if not m:
        return get(url)
    for width in (500, 330, 250):
        try:
            return get(f'{m[1]}/thumb/{m[2]}/{m[3]}/{width}px-{m[3]}', tries=2)
        except urllib.error.HTTPError as e:
            if e.code not in (400, 404, 429):  # 400/404: original narrower than this step
                raise
    return get(url)


def square(raw: bytes) -> Image.Image:
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    return ImageOps.fit(im, (SIZE, SIZE), Image.LANCZOS, centering=(0.5, 0.5))


def fit_pack(raw: bytes) -> Image.Image:
    """Pack shots are tall: letterbox onto white instead of cropping the label away."""
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    im.thumbnail((SIZE - 32, SIZE - 32), Image.LANCZOS)
    bg = Image.new('RGB', (SIZE, SIZE), 'white')
    bg.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2))
    return bg


def preview(url: str) -> str:
    """Smaller rendition for the review sheet (Commons serves fixed thumbnail steps; OFF has .400.jpg)."""
    return re.sub(r'/960px-', '/330px-', re.sub(r'\.full\.jpg$', '.400.jpg', url))


def candidates(items: list[dict], out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    cache_file = out / 'cands.json'
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    rows = []
    for it in items:
        q = QUERIES[it['name']]
        key = f"{q['src']}:{q['q']}"
        if not cache.get(key):  # empty results aren't cached, so a tweaked query or retry gets another go
            try:
                cache[key] = (search_off if q['src'] == 'off' else search_commons)(q['q'])
            except Exception as e:  # noqa: BLE001 — keep going; a re-run retries just the failures
                print(f"ERR {it['name']}: {e}")
                continue
            if cache[key]:
                cache_file.write_text(json.dumps(cache, indent=1))
        cells = []
        for i, c in enumerate(cache[key]):
            if TITLES_ONLY:
                cells.append(f"<td>{i}: {html.escape(c['title'])}</td>")
                continue
            thumb = out / 'thumbs' / f"{re.sub(r'[^a-z0-9]+', '-', key.lower())}-{i}.jpg"
            if not thumb.exists():
                thumb.parent.mkdir(exist_ok=True)
                try:
                    im = Image.open(io.BytesIO(get(preview(c['thumb'])))).convert('RGB')
                    im.thumbnail((200, 200))
                    im.save(thumb, quality=80)
                except Exception as e:  # noqa: BLE001
                    print('thumb failed', it['name'], i, e, file=sys.stderr)
                    continue
            cells.append(f'<td><img src="thumbs/{thumb.name}"><br>{i}</td>')
        pick = q.get('pick', 0)
        rows.append(f"<tr><th>{html.escape(it['name'])}<br><small>{html.escape(q['q'])} · pick {pick}</small></th>{''.join(cells) or '<td>NO RESULTS</td>'}</tr>")
        print(f"{len(cache.get(key, []))} {it['name']}")
    (out / 'sheet.html').write_text(
        '<style>body{font:12px sans-serif}th{width:180px;text-align:left}td{text-align:center}img{width:150px;height:150px;object-fit:cover}</style><table>'
        + ''.join(rows) + '</table>'
    )


def build(items: list[dict], out: Path) -> None:
    cache = json.loads((out / 'cands.json').read_text())
    credits_file = ROOT / 'public' / 'demo' / 'CREDITS.json'
    old = json.loads(credits_file.read_text()) if credits_file.exists() else {}
    credits = {}
    for it in items:
        q = QUERIES[it['name']]
        c = cache[f"{q['src']}:{q['q']}"][q.get('pick', 0)]
        dest = ROOT / 'public' / it['url']
        dest.parent.mkdir(parents=True, exist_ok=True)
        meta = {k: c[k] for k in ('title', 'author', 'license', 'licenseUrl', 'source')}
        if not (dest.exists() and old.get(it['url']) == meta):  # unchanged picks aren't re-downloaded
            try:
                raw = fetch_rendition(c['thumb'])
            except Exception as e:  # noqa: BLE001 — report and continue; a re-run fetches the rest
                print(f"ERR {it['name']}: {e}")
                continue
            (fit_pack(raw) if q['src'] == 'off' or q.get('fit') == 'pad' else square(raw)).save(dest, 'WEBP', quality=80, method=6)
            print('ok', it['url'], it['name'])
        credits[it['url']] = meta
    credits_file.parent.mkdir(parents=True, exist_ok=True)
    credits_file.write_text(json.dumps(credits, indent=1, ensure_ascii=False) + '\n')
    write_native(sorted(credits))


def write_native(urls: list[str]) -> None:
    """React Native can't resolve paths at runtime, so Metro needs one static require() per file."""
    body = '\n'.join(f"  '{u}': require('../public/{u}')," for u in urls)
    (ROOT / 'src').mkdir(exist_ok=True)
    (ROOT / 'src' / 'native.ts').write_text(
        '// Generated by scripts/fetch_photos.py — do not edit.\n'
        'export const demoImages: Record<string, number> = {\n' + body + '\n};\n'
    )


TITLES_ONLY = '--titles' in sys.argv  # skip preview downloads (Wikimedia rate-limits shared IPs hard)

if __name__ == '__main__':
    mode, items_path, out_dir = [a for a in sys.argv[1:] if not a.startswith('--')][:3]
    items = json.loads(Path(items_path).read_text())
    missing = [i['name'] for i in items if i['name'] not in QUERIES]
    if missing:
        sys.exit(f'No query in photos.json for: {missing}')
    {'candidates': candidates, 'build': build}[mode](items, Path(out_dir))
