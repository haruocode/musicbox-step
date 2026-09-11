import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Scheduler, TICK_MS, clampBpm, collectDueSteps, lastStartedIndex, stepDuration } from './scheduler'
import type { StepEvent } from './scheduler'

describe('Scheduler', () => {
  // AudioContext の代わりに、テストから時刻を進められる偽の時計を使う。
  const ctx = { currentTime: 0 } as BaseAudioContext & { currentTime: number }
  let scheduled: StepEvent[]
  let scheduler: Scheduler

  function advance(seconds: number) {
    ctx.currentTime += seconds
    vi.advanceTimersByTime(seconds * 1000)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    ctx.currentTime = 0
    scheduled = []
    scheduler = new Scheduler({ steps: 4, getBpm: () => 120, onStep: (event) => scheduled.push(event) })
  })

  afterEach(() => {
    scheduler.stop()
    vi.useRealTimers()
  })

  it('ステップ 0 から順に予約し、最後の次は 0 に戻る', () => {
    scheduler.start(ctx)
    for (let i = 0; i < 40; i++) advance(TICK_MS / 1000)
    expect(scheduled.map((e) => e.step)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0])
  })

  it('ステップの間隔は BPM どおり（120 BPM で 0.125 秒）', () => {
    scheduler.start(ctx)
    for (let i = 0; i < 20; i++) advance(TICK_MS / 1000)
    const gaps = scheduled.slice(1).map((e, i) => e.time - scheduled[i].time)
    for (const gap of gaps) expect(gap).toBeCloseTo(0.125)
  })

  it('表示は鳴る時刻を過ぎてから進む', () => {
    scheduler.start(ctx)
    // 開始直後はステップ 0 が予約済みでも、まだ鳴っていない
    expect(scheduled[0].step).toBe(0)
    expect(scheduler.currentStep()).toBeNull()

    advance(scheduled[0].time)
    expect(scheduler.currentStep()).toBe(0)
  })

  it('Stop すると予約も表示も止まる', () => {
    scheduler.start(ctx)
    advance(0.2)
    scheduler.stop()
    const count = scheduled.length
    advance(1)
    expect(scheduled.length).toBe(count)
    expect(scheduler.currentStep()).toBeNull()
  })
})

describe('stepDuration', () => {
  it('120 BPM の 16 分音符は 0.125 秒', () => {
    expect(stepDuration(120)).toBe(0.125)
  })

  it('60 BPM の 16 分音符は 0.25 秒', () => {
    expect(stepDuration(60)).toBe(0.25)
  })
})

describe('clampBpm', () => {
  it('範囲外の値を 40〜240 に収める', () => {
    expect(clampBpm(10)).toBe(40)
    expect(clampBpm(999)).toBe(240)
  })

  it('整数に丸める', () => {
    expect(clampBpm(120.4)).toBe(120)
  })
})

describe('collectDueSteps', () => {
  it('先読みウィンドウ（0.1 秒）内のステップだけを集める', () => {
    const { events, next } = collectDueSteps({ step: 0, time: 0 }, 0, 120, 16)
    expect(events).toEqual([{ step: 0, time: 0 }])
    expect(next).toEqual({ step: 1, time: 0.125 })
  })

  it('時間が進むと次のステップを集める', () => {
    const { events } = collectDueSteps({ step: 1, time: 0.125 }, 0.05, 120, 16)
    expect(events).toEqual([{ step: 1, time: 0.125 }])
  })

  it('最後のステップの次はステップ 0 に戻る', () => {
    const { events, next } = collectDueSteps({ step: 15, time: 1 }, 0.95, 120, 16)
    expect(events.map((e) => e.step)).toEqual([15])
    expect(next.step).toBe(0)
  })

  it('予約がない区間では何も集めない', () => {
    const { events } = collectDueSteps({ step: 3, time: 1 }, 0.5, 120, 16)
    expect(events).toEqual([])
  })

  it('BPM の変更は次に予約するステップの間隔から反映される', () => {
    const { events, next } = collectDueSteps({ step: 0, time: 0 }, 0, 60, 16)
    expect(events[0].time).toBe(0)
    expect(next.time).toBe(0.25)
  })

  it('大きく遅れた場合は遅れた分をまとめて鳴らさず、今から再開する', () => {
    const { events } = collectDueSteps({ step: 2, time: 0.25 }, 5, 120, 16)
    expect(events).toEqual([{ step: 2, time: 5 }])
  })
})

describe('lastStartedIndex', () => {
  const queue = [
    { step: 0, time: 0 },
    { step: 1, time: 0.125 },
    { step: 2, time: 0.25 },
  ]

  it('鳴る時刻を過ぎた最後のイベントを返す', () => {
    expect(lastStartedIndex(queue, 0.2)).toBe(1)
  })

  it('まだ何も鳴っていなければ -1', () => {
    expect(lastStartedIndex(queue, -0.01)).toBe(-1)
  })
})
