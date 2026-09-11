import type { Pattern } from './types'

export function createEmptyPattern(steps = 16, bpm = 120): Pattern {
  return { steps, bpm, notes: Array.from({ length: steps }, () => []) }
}

export function hasNote(pattern: Pattern, step: number, midi: number): boolean {
  return pattern.notes[step]?.includes(midi) ?? false
}

/** 指定したステップのノートをオン／オフした新しいパターンを返す。 */
export function toggleNote(pattern: Pattern, step: number, midi: number): Pattern {
  const notes = pattern.notes.map((stepNotes, i) => {
    if (i !== step) return stepNotes
    return stepNotes.includes(midi) ? stepNotes.filter((n) => n !== midi) : [...stepNotes, midi].sort((a, b) => a - b)
  })
  return { ...pattern, notes }
}

/** すべてのノートを消した新しいパターンを返す。ステップ数と BPM は保つ。 */
export function clearPattern(pattern: Pattern): Pattern {
  return { ...pattern, notes: pattern.notes.map(() => []) }
}

/**
 * 最初に表示するパターン（きらきら星の冒頭）。
 * ステップ 1 と 9 には低音を重ねている。
 */
export const DEMO_PATTERN: Pattern = {
  steps: 16,
  bpm: 120,
  notes: [
    [60, 72], [72], [79], [79], [81], [81], [79], [],
    [65, 77], [77], [76], [76], [74], [74], [72], [],
  ],
}
