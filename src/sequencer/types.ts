export type Pattern = {
  steps: number
  bpm: number
  /** notes[step] = そのステップで鳴らす MIDI ノート番号の配列 */
  notes: number[][]
}
