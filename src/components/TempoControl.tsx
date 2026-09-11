import { MAX_BPM, MIN_BPM } from '../audio/scheduler'

type TempoControlProps = {
  bpm: number
  onChange: (bpm: number) => void
}

export function TempoControl({ bpm, onChange }: TempoControlProps) {
  return (
    <div className="tempo">
      <button type="button" onClick={() => onChange(bpm - 1)} aria-label="BPM を 1 下げる">
        −
      </button>
      <label className="tempo-slider">
        <span>BPM</span>
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
      <button type="button" onClick={() => onChange(bpm + 1)} aria-label="BPM を 1 上げる">
        +
      </button>
    </div>
  )
}
