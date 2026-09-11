import { useEffect, useRef, useState } from 'react'
import { ensureRunning, getOutput } from '../audio/audioEngine'
import { playNote } from '../audio/musicBoxSynth'
import { Scheduler, clampBpm } from '../audio/scheduler'
import { SequencerGrid } from '../components/SequencerGrid'
import { TempoControl } from '../components/TempoControl'
import { Transport } from '../components/Transport'
import { DEMO_PATTERN, clearPattern, hasNote, toggleNote } from '../sequencer/pattern'
import { SCALE } from '../sequencer/scale'
import type { Pattern } from '../sequencer/types'

/** グリッドの行。高い音を上にする。 */
const ROWS = [...SCALE].reverse()

export default function App() {
  const [pattern, setPattern] = useState<Pattern>(DEMO_PATTERN)
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | null>(null)

  // スケジューラーは React の描画とは独立して動くため、最新のパターンは ref で渡す。
  // 予約する時点のパターンを読むので、再生中の変更は未予約のステップから反映される。
  const patternRef = useRef(pattern)
  const schedulerRef = useRef<Scheduler | null>(null)

  function getScheduler(): Scheduler {
    schedulerRef.current ??= new Scheduler({
      steps: patternRef.current.steps,
      getBpm: () => patternRef.current.bpm,
      onStep: ({ step, time }, ctx) => {
        for (const midi of patternRef.current.notes[step]) playNote(ctx, getOutput(), midi, time)
      },
    })
    return schedulerRef.current
  }

  function updatePattern(next: Pattern) {
    patternRef.current = next
    setPattern(next)
  }

  useEffect(() => () => schedulerRef.current?.stop(), [])

  // 表示は音の時計（AudioContext.currentTime）に合わせて進める。
  useEffect(() => {
    if (!playing) return
    let frame = 0
    const update = () => {
      setCurrentStep(getScheduler().currentStep())
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  async function handlePlay() {
    if (playing) return
    const ctx = await ensureRunning()
    getScheduler().start(ctx)
    setPlaying(true)
  }

  function handleStop() {
    getScheduler().stop()
    setPlaying(false)
    setCurrentStep(null)
  }

  async function handleToggle(step: number, midi: number) {
    const turningOn = !hasNote(patternRef.current, step, midi)
    updatePattern(toggleNote(patternRef.current, step, midi))

    // 停止中は、置いた音をその場で鳴らして確認できるようにする。
    if (turningOn && !playing) {
      const ctx = await ensureRunning()
      playNote(ctx, getOutput(), midi, ctx.currentTime)
    }
  }

  function handleClear() {
    updatePattern(clearPattern(patternRef.current))
  }

  function handleBpmChange(value: number) {
    updatePattern({ ...patternRef.current, bpm: clampBpm(value) })
  }

  const stepLabel = currentStep === null ? '--' : String(currentStep + 1).padStart(2, '0')

  return (
    <main className="machine">
      <header className="machine-header">
        <h1>musicbox-step</h1>
        <p className="lcd">
          <span>{playing ? 'PLAY' : 'STOP'}</span>
          <span>
            STEP {stepLabel}/{pattern.steps}
          </span>
          <span>BPM {pattern.bpm}</span>
        </p>
      </header>

      <SequencerGrid pattern={pattern} rows={ROWS} currentStep={currentStep} onToggle={handleToggle} />

      <section className="controls">
        <Transport playing={playing} onPlay={handlePlay} onStop={handleStop} />
        <TempoControl bpm={pattern.bpm} onChange={handleBpmChange} />
        <button type="button" onClick={handleClear}>
          Clear
        </button>
      </section>
    </main>
  )
}
