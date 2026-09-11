type TransportProps = {
  playing: boolean
  onPlay: () => void
  onStop: () => void
}

export function Transport({ playing, onPlay, onStop }: TransportProps) {
  return (
    <div className="transport" data-transport-state={playing ? 'playing' : 'stopped'}>
      <button type="button" className="primary" onClick={onPlay} aria-pressed={playing}>
        ▶ Play
      </button>
      <button type="button" onClick={onStop}>
        ■ Stop
      </button>
    </div>
  )
}
