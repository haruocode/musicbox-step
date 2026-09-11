import { describe, expect, it } from 'vitest'
import { SCALE, noteName } from './scale'

describe('SCALE', () => {
  it('C4〜C6 の全音階 15 音', () => {
    expect(SCALE).toHaveLength(15)
    expect(SCALE.map(noteName)).toEqual([
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6',
    ])
  })
})
