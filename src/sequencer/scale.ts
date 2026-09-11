/** MVP の音域：C4〜C6 の C メジャー全音階（MIDI ノート番号）。 */
export const SCALE: readonly number[] = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84]

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** 表示用の音名（60 → "C4"）。 */
export function noteName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}
