import { useState } from 'react'
import { ensureRunning, getAudioState, getOutput } from '../audio/audioEngine'
import { playNote } from '../audio/musicBoxSynth'
import { SCALE, noteName } from '../sequencer/scale'

// フェーズ 1：オーディオの検証用画面。
// ボタンのクリック（ユーザー操作）で AudioContext を作成・resume し、音を鳴らす。

const SCALE_STEP_SECONDS = 0.25

export default function App() {
  const [audioState, setAudioState] = useState(getAudioState())

  async function handlePlayNote(midi: number) {
    const ctx = await ensureRunning()
    setAudioState(ctx.state)
    playNote(ctx, getOutput(), midi, ctx.currentTime)
  }

  async function handlePlayScale() {
    const ctx = await ensureRunning()
    setAudioState(ctx.state)
    // タイマーを使わず、AudioContext の時刻で全ノートを先に予約する。
    const start = ctx.currentTime + 0.05
    SCALE.forEach((midi, i) => {
      playNote(ctx, getOutput(), midi, start + i * SCALE_STEP_SECONDS)
    })
  }

  return (
    <main className="spike">
      <h1>musicbox-step</h1>
      <p className="lcd" data-audio-state={audioState}>
        AUDIO: {audioState.toUpperCase()}
      </p>

      <section>
        <button type="button" className="primary" onClick={() => handlePlayNote(72)}>
          C5 を鳴らす
        </button>
        <button type="button" onClick={handlePlayScale}>
          音階を鳴らす
        </button>
      </section>

      <section aria-label="音域の各音">
        {[...SCALE].reverse().map((midi) => (
          <button type="button" key={midi} className="note" onClick={() => handlePlayNote(midi)}>
            {noteName(midi)}
          </button>
        ))}
      </section>
    </main>
  )
}
