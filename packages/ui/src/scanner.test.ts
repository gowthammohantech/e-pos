import { describe, expect, it } from 'vitest';
import { createScanDetector, type ScanStep } from './scanner';

/** Feed keys `gap` ms apart and collect each step. */
function run(keys: string[], gap: number, det = createScanDetector()) {
  let t = 1000;
  return keys.map((k): ScanStep => det.feed(k, (t += gap)));
}

describe('createScanDetector', () => {
  it('detects a fast burst terminated by Enter as a scan', () => {
    const steps = run([...'8901234567890', 'Enter'], 8);
    expect(steps[0]!.action).toBe('pass');
    expect(steps.slice(1, -1).every((s) => s.action === 'swallow')).toBe(true);
    expect(steps.at(-1)).toEqual({ action: 'scan', code: '8901234567890' });
  });

  it('leaves human typing alone', () => {
    const steps = run([...'12', 'Enter'], 150);
    expect(steps.every((s) => s.action === 'pass' && !s.flush)).toBe(true);
  });

  it('ignores Shift between scanner keys', () => {
    const steps = run(['A', 'Shift', 'B', 'Shift', 'C', '1', 'Enter'], 6);
    expect(steps.at(-1)).toEqual({ action: 'scan', code: 'ABC1' });
  });

  it('gives back swallowed keys when a fast burst is too short to be a scan', () => {
    const steps = run(['1', '2', 'Enter'], 10);
    expect(steps[1]!.action).toBe('swallow');
    expect(steps[2]).toEqual({ action: 'pass', flush: '2' });
  });

  it('gives back swallowed keys when the burst stalls', () => {
    const det = createScanDetector();
    det.feed('4', 0);
    det.feed('2', 10);
    expect(det.feed('x', 500)).toEqual({ action: 'pass', flush: '2' });
    expect(det.timeout()).toBeUndefined();
    det.feed('5', 1000);
    det.feed('6', 1010);
    expect(det.timeout()).toBe('6');
  });

  it('honours minLength and modifier combos', () => {
    expect(run([...'123', 'Enter'], 5, createScanDetector({ minLength: 3 })).at(-1)).toEqual({ action: 'scan', code: '123' });
    const det = createScanDetector();
    det.feed('a', 0);
    det.feed('b', 5);
    expect(det.feed('v', 10, true)).toEqual({ action: 'pass', flush: 'b' });
  });
});
