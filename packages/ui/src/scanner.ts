import { useEffect, useRef } from 'react';

export interface ScanDetectorOptions {
  /** Shortest code accepted as a scan (shorter bursts are treated as typing). */
  minLength?: number;
  /** Max gap between keystrokes of one scan. HID scanners emit ~5–20 ms apart; people type slower. */
  maxGapMs?: number;
}

export interface ScanStep {
  /** pass: let the browser handle the key · swallow: block it (part of a scan) · scan: a full code arrived. */
  action: 'pass' | 'swallow' | 'scan';
  code?: string;
  /** Characters swallowed by a burst that turned out not to be a scan — give them back to the field. */
  flush?: string;
}

const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

/**
 * Pure keystroke-timing state machine. The 1st key of a burst always passes (it can't be told apart
 * from typing yet); every following key inside `maxGapMs` is swallowed; Enter/Tab ends the scan.
 */
export function createScanDetector({ minLength = 4, maxGapMs = 35 }: ScanDetectorOptions = {}) {
  let buf = '';
  let last = -Infinity;
  const reset = () => {
    const swallowed = buf.slice(1);
    buf = '';
    last = -Infinity;
    return swallowed || undefined;
  };
  return {
    reset,
    /** Called when no key arrived for a while — an unterminated burst is abandoned. */
    timeout: reset,
    feed(key: string, time: number, combo = false): ScanStep {
      if (MODIFIERS.has(key)) return { action: 'pass' };
      const flush = buf && time - last > maxGapMs ? reset() : undefined;
      if (combo) return { action: 'pass', flush: flush ?? reset() };
      if (key === 'Enter' || key === 'Tab') {
        if (buf.length >= minLength) {
          const code = buf;
          reset();
          return { action: 'scan', code };
        }
        return { action: 'pass', flush: flush ?? reset() };
      }
      if (key.length !== 1) return { action: 'pass', flush: flush ?? reset() };
      last = time;
      if (buf) {
        buf += key;
        return { action: 'swallow', flush };
      }
      buf = key;
      return { action: 'pass', flush };
    },
  };
}

type Field = HTMLInputElement | HTMLTextAreaElement;
const isField = (el: unknown): el is Field => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

/** Set a (React-controlled) field's value and notify React through a native input event. */
function setFieldValue(el: Field, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertText(el: Field, text: string) {
  let start = el.value.length;
  let end = start;
  try {
    start = el.selectionStart ?? start;
    end = el.selectionEnd ?? start;
  } catch {
    /* input types without selection support */
  }
  setFieldValue(el, el.value.slice(0, start) + text + el.value.slice(end));
  try {
    el.setSelectionRange(start + text.length, start + text.length);
  } catch {
    /* ignore */
  }
}

const overlayOpen = () => typeof document !== 'undefined' && !!document.querySelector('.ex-overlay');

/**
 * Page-level barcode scanner capture. While enabled, a scan is delivered to `onScan` wherever the
 * cursor is — it never lands in a quantity/price field. Normal typing is untouched.
 * Pauses while a modal/drawer is open so dialogs with their own scan fields (serial, IMEI) keep working.
 */
export function useBarcodeScanner(onScan: (code: string) => void, { enabled = true, ...opts }: ScanDetectorOptions & { enabled?: boolean } = {}) {
  const ref = useRef(onScan);
  ref.current = onScan;
  const { minLength, maxGapMs = 35 } = opts;
  useEffect(() => {
    if (!enabled) return;
    const det = createScanDetector({ minLength, maxGapMs });
    // Field that received the 1st (un-swallowable) key of the current burst, and its value before it.
    let leak: { el: Field; value: string } | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const giveBack = (text?: string) => {
      if (text && leak?.el.isConnected) insertText(leak.el, text);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (overlayOpen()) {
        giveBack(det.reset());
        leak = undefined;
        return;
      }
      const step = det.feed(e.key, Date.now(), e.ctrlKey || e.metaKey || e.altKey);
      giveBack(step.flush);
      if (step.flush || (step.action === 'pass' && e.key.length !== 1)) leak = undefined;
      clearTimeout(timer);
      if (step.action === 'pass' && e.key.length === 1) {
        const t = e.target;
        leak = isField(t) ? { el: t, value: t.value } : undefined;
      }
      if (step.action === 'swallow' || step.action === 'scan') {
        e.preventDefault();
        e.stopPropagation();
      }
      if (step.action === 'swallow') {
        timer = setTimeout(() => {
          giveBack(det.timeout());
          leak = undefined;
        }, maxGapMs * 3);
      }
      if (step.action === 'scan') {
        if (leak?.el.isConnected && leak.el.value !== leak.value) setFieldValue(leak.el, leak.value);
        leak = undefined;
        ref.current(step.code!);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [enabled, minLength, maxGapMs]);
}
