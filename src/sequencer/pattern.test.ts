import { describe, expect, it } from 'vitest'
import { clearPattern, createEmptyPattern, hasNote, toggleNote } from './pattern'

describe('createEmptyPattern', () => {
  it('16 ステップ・120 BPM の空のパターンを作る', () => {
    const pattern = createEmptyPattern()
    expect(pattern.steps).toBe(16)
    expect(pattern.bpm).toBe(120)
    expect(pattern.notes).toHaveLength(16)
    expect(pattern.notes.every((n) => n.length === 0)).toBe(true)
  })

  it('各ステップの配列は別々のもの', () => {
    const pattern = createEmptyPattern()
    expect(pattern.notes[0]).not.toBe(pattern.notes[1])
  })
})

describe('toggleNote', () => {
  it('ないノートを追加する', () => {
    const pattern = toggleNote(createEmptyPattern(), 3, 72)
    expect(hasNote(pattern, 3, 72)).toBe(true)
    expect(hasNote(pattern, 2, 72)).toBe(false)
  })

  it('あるノートを削除する', () => {
    const once = toggleNote(createEmptyPattern(), 3, 72)
    const twice = toggleNote(once, 3, 72)
    expect(hasNote(twice, 3, 72)).toBe(false)
  })

  it('同じステップに複数のノートを置ける（和音）', () => {
    let pattern = createEmptyPattern()
    pattern = toggleNote(pattern, 0, 72)
    pattern = toggleNote(pattern, 0, 60)
    pattern = toggleNote(pattern, 0, 64)
    expect(pattern.notes[0]).toEqual([60, 64, 72])
  })

  it('元のパターンを変更しない', () => {
    const original = createEmptyPattern()
    toggleNote(original, 0, 72)
    expect(original.notes[0]).toEqual([])
  })
})

describe('clearPattern', () => {
  it('すべてのノートを消し、ステップ数と BPM は保つ', () => {
    let pattern = { ...createEmptyPattern(), bpm: 90 }
    pattern = toggleNote(pattern, 0, 72)
    pattern = toggleNote(pattern, 5, 60)
    const cleared = clearPattern(pattern)
    expect(cleared.notes.every((n) => n.length === 0)).toBe(true)
    expect(cleared.steps).toBe(16)
    expect(cleared.bpm).toBe(90)
  })
})
