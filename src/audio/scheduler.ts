// 先読み型のステップスケジューラー。
//
// setInterval は「これから鳴らす音を予約する」ためだけに使い、
// 音を鳴らす時刻そのものは AudioContext.currentTime で決める。

export const TICK_MS = 25
export const LOOKAHEAD_SECONDS = 0.1
const START_DELAY_SECONDS = 0.05

export const MIN_BPM = 40
export const MAX_BPM = 240

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

/** 1 ステップ（16 分音符）の長さ（秒）。 */
export function stepDuration(bpm: number): number {
  return 60 / bpm / 4
}

export type StepEvent = {
  step: number
  /** 鳴る時刻（AudioContext.currentTime 基準） */
  time: number
}

/**
 * 先読みウィンドウ内に来るステップを集め、次に予約するステップを返す。
 * BPM は次に予約するステップの間隔から反映される（予約済みの時刻は変えない）。
 */
export function collectDueSteps(
  next: StepEvent,
  now: number,
  bpm: number,
  steps: number,
): { events: StepEvent[]; next: StepEvent } {
  let { step, time } = next

  // タブが止まっていたなどで大きく遅れた場合、遅れた分をまとめて鳴らさず今から再開する。
  if (time < now) time = now

  const events: StepEvent[] = []
  while (time < now + LOOKAHEAD_SECONDS) {
    events.push({ step, time })
    time += stepDuration(bpm)
    step = (step + 1) % steps
  }
  return { events, next: { step, time } }
}

/** キューのうち、鳴る時刻を過ぎた最後のイベントの位置。なければ -1。 */
export function lastStartedIndex(queue: readonly StepEvent[], now: number): number {
  let index = -1
  for (let i = 0; i < queue.length && queue[i].time <= now; i++) index = i
  return index
}

type SchedulerOptions = {
  steps: number
  getBpm: () => number
  /** ステップの音を予約する。event.time に鳴るようにスケジュールすること。 */
  onStep: (event: StepEvent, ctx: BaseAudioContext) => void
}

export class Scheduler {
  private readonly options: SchedulerOptions
  private ctx: BaseAudioContext | null = null
  private timer: ReturnType<typeof setInterval> | undefined
  private next: StepEvent = { step: 0, time: 0 }
  /** 予約済みで、まだ表示に反映していないステップ */
  private queue: StepEvent[] = []
  private displayedStep: number | null = null

  constructor(options: SchedulerOptions) {
    this.options = options
  }

  start(ctx: BaseAudioContext) {
    this.stop()
    this.ctx = ctx
    this.next = { step: 0, time: ctx.currentTime + START_DELAY_SECONDS }
    this.tick()
    this.timer = setInterval(() => this.tick(), TICK_MS)
  }

  /** 以降の予約を止める。すでに予約・発音済みの音は自然に減衰させる。 */
  stop() {
    clearInterval(this.timer)
    this.timer = undefined
    this.ctx = null
    this.queue = []
    this.displayedStep = null
  }

  /**
   * 表示すべき現在のステップ。requestAnimationFrame から呼ぶ。
   * 鳴る時刻を過ぎたステップだけを反映するので、表示が音より先に進まない。
   */
  currentStep(): number | null {
    if (!this.ctx) return null
    const index = lastStartedIndex(this.queue, this.ctx.currentTime)
    if (index >= 0) {
      this.displayedStep = this.queue[index].step
      this.queue.splice(0, index + 1)
    }
    return this.displayedStep
  }

  private tick() {
    const ctx = this.ctx
    if (!ctx) return
    const { events, next } = collectDueSteps(this.next, ctx.currentTime, this.options.getBpm(), this.options.steps)
    this.next = next
    for (const event of events) {
      this.queue.push(event)
      this.options.onStep(event, ctx)
    }
  }
}
