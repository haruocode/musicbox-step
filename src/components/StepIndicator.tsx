type StepIndicatorProps = {
  steps: number
  currentStep: number | null
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <ol className="step-indicator" data-current-step={currentStep === null ? '' : currentStep + 1} aria-label="ステップ">
      {Array.from({ length: steps }, (_, step) => {
        const current = step === currentStep
        return (
          <li
            key={step}
            className={['step', step % 4 === 0 && 'beat', current && 'current'].filter(Boolean).join(' ')}
            aria-current={current ? 'step' : undefined}
          >
            {String(step + 1).padStart(2, '0')}
          </li>
        )
      })}
    </ol>
  )
}
