import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { hasNote } from '../sequencer/pattern'
import { noteName } from '../sequencer/scale'
import type { Pattern } from '../sequencer/types'

type SequencerGridProps = {
  pattern: Pattern
  /** 上の行から順に並べる MIDI ノート番号（高い音が上） */
  rows: readonly number[]
  currentStep: number | null
  onToggle: (step: number, midi: number) => void
}

type Position = { row: number; step: number }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function stepLabel(step: number): string {
  return String(step + 1).padStart(2, '0')
}

export function SequencerGrid({ pattern, rows, currentStep, onToggle }: SequencerGridProps) {
  // ロービング tabindex：Tab で止まるのはフォーカス中の 1 セルだけ
  const [focus, setFocus] = useState<Position>({ row: 0, step: 0 })
  const cells = useRef(new Map<string, HTMLButtonElement>())
  const scrollRef = useRef<HTMLDivElement>(null)

  const steps = Array.from({ length: pattern.steps }, (_, step) => step)

  function moveFocus(row: number, step: number) {
    const next = { row: clamp(row, 0, rows.length - 1), step: clamp(step, 0, pattern.steps - 1) }
    setFocus(next)
    cells.current.get(`${next.row}:${next.step}`)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent, row: number, step: number) {
    switch (event.key) {
      case 'ArrowUp':
        moveFocus(row - 1, step)
        break
      case 'ArrowDown':
        moveFocus(row + 1, step)
        break
      case 'ArrowLeft':
        moveFocus(row, step - 1)
        break
      case 'ArrowRight':
        moveFocus(row, step + 1)
        break
      case 'Home':
        moveFocus(row, 0)
        break
      case 'End':
        moveFocus(row, pattern.steps - 1)
        break
      default:
        return
    }
    event.preventDefault()
  }

  // グリッドが横スクロールしているとき（スマホ）、再生中のステップが画面外に出ないようにする。
  useEffect(() => {
    const container = scrollRef.current
    if (currentStep === null || !container || container.scrollWidth <= container.clientWidth) return
    const header = container.querySelector<HTMLElement>(`[data-step-header="${currentStep}"]`)
    const corner = container.querySelector<HTMLElement>('.grid-corner')
    if (!header || !corner) return

    const visibleLeft = container.scrollLeft + corner.offsetWidth
    const visibleRight = container.scrollLeft + container.clientWidth
    const left = header.offsetLeft
    const right = left + header.offsetWidth
    if (left < visibleLeft || right > visibleRight) {
      container.scrollTo({ left: left - corner.offsetWidth, behavior: 'smooth' })
    }
  }, [currentStep])

  return (
    <div className="grid-scroll" ref={scrollRef}>
      <div
        role="grid"
        aria-label="ノートグリッド"
        className="grid"
        data-current-step={currentStep === null ? '' : currentStep + 1}
        style={{ '--steps': pattern.steps } as CSSProperties}
      >
        <div role="row" className="grid-row">
          <span role="columnheader" className="grid-corner">
            <span className="visually-hidden">音名</span>
          </span>
          {steps.map((step) => (
            <span
              role="columnheader"
              key={step}
              data-step-header={step}
              className={[
                'grid-step',
                step % 4 === 0 && 'beat',
                step === currentStep && 'current',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={step === currentStep ? 'step' : undefined}
            >
              {stepLabel(step)}
            </span>
          ))}
        </div>

        {rows.map((midi, row) => (
          <div role="row" className="grid-row" key={midi}>
            <span role="rowheader" className={['grid-note', midi % 12 === 0 && 'octave'].filter(Boolean).join(' ')}>
              {noteName(midi)}
            </span>
            {steps.map((step) => {
              const on = hasNote(pattern, step, midi)
              const key = `${row}:${step}`
              return (
                <span
                  role="gridcell"
                  key={step}
                  className={['grid-cell', step % 4 === 0 && 'beat', step === currentStep && 'current']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    type="button"
                    className="cell"
                    ref={(el) => {
                      if (el) cells.current.set(key, el)
                      else cells.current.delete(key)
                    }}
                    tabIndex={focus.row === row && focus.step === step ? 0 : -1}
                    aria-pressed={on}
                    aria-label={`${noteName(midi)}、ステップ ${step + 1}`}
                    onClick={() => {
                      setFocus({ row, step })
                      onToggle(step, midi)
                    }}
                    onKeyDown={(event) => handleKeyDown(event, row, step)}
                  >
                    {/* 色だけに頼らず、記号でもオンを示す */}
                    <span aria-hidden="true">{on ? '●' : ''}</span>
                  </button>
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
