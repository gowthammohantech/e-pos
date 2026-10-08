import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { initials } from '@elixir/format';
import { Button } from './primitives';
import { Field } from './forms';

let imageBase = '/';

/**
 * Where relative image paths (e.g. the seed's `demo/menu/mi-1.webp`) are served from.
 * Each app calls this once with `import.meta.env.BASE_URL`; resolving it against the
 * page at startup also makes Tauri's relative './' base absolute.
 */
export function setImageBase(base: string) {
  imageBase = new URL(base, window.location.href).href;
}

/** Absolute, root-relative, data: and blob: URLs pass through; anything else is relative to the app. */
export function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(url) ? url : imageBase + url;
}

export interface ThumbProps {
  src?: string;
  /** Used for the initials fallback. */
  name: string;
  /** Tint behind the fallback initials (category colour). */
  color?: string;
  /** Square size in px; omit to fill the parent. */
  size?: number;
  className?: string;
}

/** Product/menu image with an initials-on-tint fallback when there is no image or it fails to load. */
export function Thumb({ src, name, color, size, className }: ThumbProps) {
  const url = resolveImageUrl(src);
  const [failed, setFailed] = useState<string>();
  const show = url && failed !== url;
  return (
    <span className={clsx('ex-thumb', !size && 'ex-thumb--fill', className)} style={size ? { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) } : undefined} aria-hidden>
      {show ? (
        <img src={url} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(url)} />
      ) : (
        <>
          <i style={color ? { background: color } : undefined} />
          <span>{initials(name)}</span>
        </>
      )}
    </span>
  );
}

const MAX_EDGE = 480;

/** Downscale a picked file to a WebP data URL so it can live in the local store and sync. */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.82);
}

/** Image picker for catalogue forms: preview, upload (resized to ≤480px) or paste a URL, remove. */
export function ImageInput({ label = 'Image', value, onChange, name, color, hint }: { label?: string; value?: string; onChange: (v: string | undefined) => void; name: string; color?: string; hint?: string }) {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  useEffect(() => setError(undefined), [value]);

  const pick = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Choose an image file (JPG, PNG or WebP).');
    setBusy(true);
    try {
      onChange(await fileToDataUrl(f));
    } catch {
      setError('That image could not be read.');
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  };

  const fromUrl = () => {
    const url = window.prompt('Image URL', value && !value.startsWith('data:') ? value : 'https://');
    if (url && url.trim() && url.trim() !== 'https://') onChange(url.trim());
  };

  return (
    <Field label={label} htmlFor={id} error={error} hint={error ? undefined : hint ?? 'JPG, PNG or WebP. Resized to 480px.'}>
      <div className="ex-imginput">
        <Thumb src={value} name={name || '?'} color={color} size={88} />
        <div className="ex-imginput__actions">
          <input ref={file} id={id} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <Button size="sm" variant="secondary" icon="Upload" disabled={busy} onClick={() => file.current?.click()}>{value ? 'Replace' : 'Upload'}</Button>
          <Button size="sm" variant="ghost" icon="Link" onClick={fromUrl}>Use URL</Button>
          {value ? <Button size="sm" variant="ghost" icon="Trash2" onClick={() => onChange(undefined)}>Remove</Button> : null}
        </div>
      </div>
    </Field>
  );
}
