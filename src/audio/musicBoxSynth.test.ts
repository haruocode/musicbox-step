import { describe, expect, it } from 'vitest'
import { decaySeconds, midiToFrequency } from './musicBoxSynth'

describe('midiToFrequency', () => {
  it('A4 (69) は 440Hz', () => {
    expect(midiToFrequency(69)).toBe(440)
  })

  it('1 オクターブ上で周波数が 2 倍になる', () => {
    expect(midiToFrequency(72)).toBeCloseTo(midiToFrequency(60) * 2)
  })

  it('C4 (60) は約 261.63Hz', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 2)
  })
})

describe('decaySeconds', () => {
  it('高い音ほど減衰が短い', () => {
    expect(decaySeconds(84)).toBeLessThan(decaySeconds(60))
  })
})
