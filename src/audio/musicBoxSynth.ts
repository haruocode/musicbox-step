// Web Audio のノードでオルゴール風の音を合成する。
//
// オルゴールの櫛歯は片持ち梁として振動するため、倍音が整数倍にならない
// （基音に対しておよそ 6.27 倍、17.55 倍）。この非整数倍音と、
// 弾いた瞬間の短いノイズ（爪が歯を弾く音）でオルゴールらしさを出す。

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

type Partial = {
  ratio: number
  gain: number
  /** 基音の減衰時間に対する比率 */
  decay: number
}

const PARTIALS: Partial[] = [
  { ratio: 1, gain: 1, decay: 1 },
  { ratio: 6.27, gain: 0.12, decay: 0.12 },
  { ratio: 17.55, gain: 0.03, decay: 0.04 },
]

/** 1 音あたりの音量。4 音程度が重なっても上限に届かない値にする。 */
const NOTE_GAIN = 0.18

const ATTACK_SECONDS = 0.002
const SILENCE = 0.0001

/** 低い音ほど長く、高い音ほど短く鳴る。C4 で約 2.4 秒、C6 で約 1.2 秒。 */
export function decaySeconds(midi: number): number {
  return 2.4 * Math.sqrt(midiToFrequency(60) / midiToFrequency(midi))
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx)
  if (!buffer) {
    buffer = new AudioBuffer({ length: Math.ceil(ctx.sampleRate * 0.03), sampleRate: ctx.sampleRate })
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buffer)
  }
  return buffer
}

function playPartials(ctx: BaseAudioContext, output: AudioNode, midi: number, time: number, velocity: number) {
  const frequency = midiToFrequency(midi)
  const decay = decaySeconds(midi)

  for (const partial of PARTIALS) {
    const partialFrequency = frequency * partial.ratio
    if (partialFrequency >= ctx.sampleRate / 2) continue

    const partialDecay = decay * partial.decay
    const peak = NOTE_GAIN * velocity * partial.gain

    const osc = new OscillatorNode(ctx, { type: 'sine', frequency: partialFrequency })
    const env = new GainNode(ctx, { gain: 0 })

    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(peak, time + ATTACK_SECONDS)
    env.gain.exponentialRampToValueAtTime(SILENCE, time + ATTACK_SECONDS + partialDecay)

    osc.connect(env)
    env.connect(output)
    osc.start(time)
    // 鳴りっぱなしにしないよう、減衰し終えたら必ず止める。
    osc.stop(time + ATTACK_SECONDS + partialDecay + 0.05)
    osc.onended = () => env.disconnect()
  }
}

function playClick(ctx: BaseAudioContext, output: AudioNode, midi: number, time: number, velocity: number) {
  const source = new AudioBufferSourceNode(ctx, { buffer: getNoiseBuffer(ctx) })
  const filter = new BiquadFilterNode(ctx, {
    type: 'bandpass',
    frequency: Math.min(midiToFrequency(midi) * 4, 8000),
    Q: 1.5,
  })
  const env = new GainNode(ctx, { gain: 0 })

  env.gain.setValueAtTime(NOTE_GAIN * velocity * 0.25, time)
  env.gain.exponentialRampToValueAtTime(SILENCE, time + 0.02)

  source.connect(filter)
  filter.connect(env)
  env.connect(output)
  source.start(time)
  source.onended = () => env.disconnect()
}

/**
 * 指定した時刻（AudioContext.currentTime 基準）に 1 音鳴らす。
 * velocity は 0〜1。
 */
export function playNote(ctx: BaseAudioContext, output: AudioNode, midi: number, time: number, velocity = 1) {
  playPartials(ctx, output, midi, time, velocity)
  playClick(ctx, output, midi, time, velocity)
}
