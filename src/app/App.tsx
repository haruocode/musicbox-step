import { useEffect, useRef, useState } from 'react'
import { ensureRunning, getOutput } from '../audio/audioEngine'
import { playNote } from '../audio/musicBoxSynth'
import { Scheduler, clampBpm } from '../audio/scheduler'
import { StepIndicator } from '../components/StepIndicator'
import { TempoControl } from '../components/TempoControl'
import { Transport } from '../components/Transport'
import { DEMO_PATTERN } from '../sequencer/pattern'

// フェーズ 2：固定のパターンをループ再生して、テンポと表示の同期を確認する。

const pattern = DEMO_PATTERN

export default function App() {
  const [bpm, setBpm] = useState(pattern.bpm)
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | null>(null)

  // スケジューラーは React の描画とは独立して動くため、最新の BPM は ref で渡す。
  const bpmRef = useRef(bpm)
  const schedulerRef = useRef<Scheduler | null>(null)

  function getScheduler(): Scheduler {
    schedulerRef.current ??= new Scheduler({
      steps: pattern.steps,
      getBpm: () => bpmRef.current,
      onStep: ({ step, time }, ctx) => {
        for (const midi of pattern.notes[step]) playNote(ctx, getOutput(), midi, time)
      },
    })
    return schedulerRef.current
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

  function handleBpmChange(value: number) {
    const next = clampBpm(value)
    bpmRef.current = next
    setBpm(next)
  }

  const stepLabel = currentStep === null ? '--' : String(currentStep + 1).padStart(2, '0')

  return (
    <main className="machine">
      <header className="machine-header">
        <h1>musicbox-step</h1>
        <p className="lcd" aria-live="off">
          <span>{playing ? 'PLAY' : 'STOP'}</span>
          <span>
            STEP {stepLabel}/{pattern.steps}
          </span>
          <span>BPM {bpm}</span>
        </p>
      </header>

      <StepIndicator steps={pattern.steps} currentStep={currentStep} />

      <section className="controls">
        <Transport playing={playing} onPlay={handlePlay} onStop={handleStop} />
        <TempoControl bpm={bpm} onChange={handleBpmChange} />
      </section>
    </main>
  )
}
