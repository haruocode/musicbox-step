// AudioContext と、全ノート共通の出力経路を管理する。
//
// 各ノート → マスター GainNode → DynamicsCompressorNode（リミッター） → destination
//
// ブラウザの自動再生制限により、AudioContext はユーザー操作の中で
// 作成・resume する必要がある。そのため初回の ensureRunning() で遅延作成する。

let context: AudioContext | null = null
let input: GainNode | null = null

function createContext(): { context: AudioContext; input: GainNode } {
  const ctx = new AudioContext()

  const master = new GainNode(ctx, { gain: 0.8 })

  // 保険としてのリミッター。1 音あたりの音量を控えめにしているので、
  // 通常の再生では働かない想定。
  const limiter = new DynamicsCompressorNode(ctx, {
    threshold: -3,
    knee: 0,
    ratio: 20,
    attack: 0.002,
    release: 0.2,
  })

  master.connect(limiter)
  limiter.connect(ctx.destination)

  return { context: ctx, input: master }
}

/** ユーザー操作のハンドラー内から呼ぶこと。 */
export async function ensureRunning(): Promise<AudioContext> {
  if (!context) {
    const created = createContext()
    context = created.context
    input = created.input
  }
  if (context.state === 'suspended') {
    await context.resume()
  }
  return context
}

/** ノートの出力先。ensureRunning() の後でのみ有効。 */
export function getOutput(): AudioNode {
  if (!input) throw new Error('AudioContext is not initialized')
  return input
}

export function getAudioState(): AudioContextState | 'uninitialized' {
  return context ? context.state : 'uninitialized'
}
