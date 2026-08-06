// ══════════════════════════════════════════════════════════════
// 효과음 — 실제 음원 파일 재생 (public/sfx)
//   합성음은 쓰지 않는다. 어떤 파일을 어느 자리에 쓸지는
//   config.sounds 에서 지정하고 /admin 에서 미리듣기·교체할 수 있다.
// ══════════════════════════════════════════════════════════════

export interface SoundSlot {
  id: string
  label: string
  /** 미리듣기 목록에서 추천할 파일 접두어 */
  hint?: string
}

/** 게임이 쓰는 소리 자리 */
export const SLOTS: SoundSlot[] = [
  { id: 'gavel', label: '판사봉', hint: 'wood' },
  { id: 'fanfare', label: '팡파레 (인용)', hint: 'jingle' },
  { id: 'applause', label: '박수', hint: 'applause' },
  { id: 'cheer', label: '환호', hint: 'cheer' },
  { id: 'airhorn', label: '에어혼', hint: 'airhorn' },
  { id: 'sadTrombone', label: '뽕 (기각)', hint: 'sad' },
  { id: 'boo', label: '야유', hint: 'boo' },
  { id: 'buzzer', label: '땡 (오답)', hint: 'error' },
  { id: 'ding', label: '딩동댕 (정답)', hint: 'confirm' },
  { id: 'drumroll', label: '두구두구', hint: 'drum' },
  { id: 'cymbal', label: '심벌', hint: 'cymbal' },
  { id: 'coins', label: '동전 (적립)', hint: 'coins' },
  { id: 'levelup', label: '레벨업', hint: 'jingle' },
  { id: 'gameover', label: '게임오버', hint: 'jingle' },
  { id: 'magic', label: '반짝', hint: 'jingle' },
  { id: 'bell', label: '개정 종', hint: 'bell' },
  { id: 'door', label: '철문', hint: 'door' },
  { id: 'glass', label: '유리 깨짐', hint: 'glass' },
  { id: 'fart', label: '뿌직', hint: 'fart' },
  { id: 'click', label: '클릭 (지목)', hint: 'click' },
  { id: 'tick', label: '삑 (청취)', hint: 'tick' },
  { id: 'up', label: '슝 (상승)', hint: 'up' },
  { id: 'down', label: '슝 (하강)', hint: 'down' },
  { id: 'question', label: '문제 등장', hint: 'question' },
  { id: 'select', label: '선택', hint: 'select' },
  { id: 'drop', label: '기록', hint: 'drop' },
]

export const DEFAULT_SOUNDS: Record<string, string> = {
  gavel: 'wood-wood_heavy_000.ogg',
  fanfare: 'jingle-steel07.ogg',
  applause: 'applause-long.ogg',
  cheer: 'cheer.ogg',
  airhorn: 'airhorn.ogg',
  sadTrombone: 'sad-trombone.ogg',
  boo: 'boo.ogg',
  buzzer: 'error-error_001.ogg',
  ding: 'confirm-confirmation_001.ogg',
  drumroll: 'drumroll.ogg',
  cymbal: 'cymbal.ogg',
  coins: 'coins-handlecoins.ogg',
  levelup: 'jingle-nes05.ogg',
  gameover: 'jingle-sax07.ogg',
  magic: 'jingle-pizzi07.ogg',
  bell: 'bell-bell_heavy_000.ogg',
  door: 'door-doorclose_000.ogg',
  glass: 'glass-glass_heavy_000.ogg',
  fart: 'fart.ogg',
  click: 'click-click_001.ogg',
  tick: 'tick-tick_001.ogg',
  up: 'up-maximize_001.ogg',
  down: 'down-minimize_001.ogg',
  question: 'question-question_001.ogg',
  select: 'select-select_001.ogg',
  drop: 'drop-drop_001.ogg',
}

// ── 오디오 엔진 ────────────────────────────────────────────────

let ctx: AudioContext | null = null
let master: GainNode | null = null
let limiter: DynamicsCompressorNode | null = null
let enabled = false

const buffers = new Map<string, AudioBuffer>()
const loading = new Map<string, Promise<AudioBuffer | null>>()
let soundMap: Record<string, string> = { ...DEFAULT_SOUNDS }

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    enabled = true
    return
  }
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return
  ctx = new AC()

  limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -6
  limiter.knee.value = 8
  limiter.ratio.value = 10
  limiter.attack.value = 0.004
  limiter.release.value = 0.2

  master = ctx.createGain()
  master.gain.value = 1.5

  master.connect(limiter)
  limiter.connect(ctx.destination)
  enabled = true

  void preloadAll()
}

export function isAudioOn() {
  return enabled && !!ctx
}
export function setVolume(v: number) {
  if (master) master.gain.value = Math.max(0, Math.min(3, v))
}
export function getVolume() {
  return master ? master.gain.value : 0
}

/** config.sounds 로 슬롯 배치를 갱신 */
export function setSoundMap(map?: Record<string, string> | null) {
  soundMap = { ...DEFAULT_SOUNDS, ...(map || {}) }
  if (enabled) void preloadAll()
}
export function getSoundMap() {
  return soundMap
}

async function loadFile(file: string): Promise<AudioBuffer | null> {
  if (!ctx || !file) return null
  if (buffers.has(file)) return buffers.get(file)!
  if (loading.has(file)) return loading.get(file)!

  const p = (async () => {
    try {
      const res = await fetch(`/sfx/${encodeURIComponent(file)}`)
      if (!res.ok) return null
      const buf = await ctx!.decodeAudioData(await res.arrayBuffer())
      buffers.set(file, buf)
      return buf
    } catch {
      return null
    } finally {
      loading.delete(file)
    }
  })()
  loading.set(file, p)
  return p
}

async function preloadAll() {
  await Promise.all(Object.values(soundMap).map((f) => loadFile(f)))
}

/**
 * 슬롯별 최대 재생 길이(초).
 * 원본 박수/환호/부부젤라는 10초가 넘어 다음 연출과 겹치므로 잘라 쓴다.
 */
const MAX_DUR: Record<string, number> = {
  applause: 3.6,
  cheer: 3.0,
  airhorn: 2.2,
  drumroll: 1.5,
  cymbal: 2.4,
  sadTrombone: 3.2,
  bell: 1.6,
  fanfare: 2.6,
  gameover: 2.2,
}

export interface PlayOpts {
  gain?: number
  rate?: number
  delay?: number
  /** 최대 재생 길이(초). 끝에서 짧게 페이드아웃한다 */
  dur?: number
  /** 앞부분을 건너뛴다 (초) */
  offset?: number
}

/** 파일 하나 재생 */
export async function playFile(file: string, opts: PlayOpts = {}) {
  if (!isAudioOn() || !file) return
  const buf = await loadFile(file)
  if (!buf || !ctx) return

  const t = ctx.currentTime + (opts.delay ?? 0)
  const gain = opts.gain ?? 1
  const offset = Math.max(0, Math.min(opts.offset ?? 0, Math.max(0, buf.duration - 0.05)))
  const avail = (buf.duration - offset) / (opts.rate ?? 1)
  const dur = opts.dur && opts.dur < avail ? opts.dur : avail

  const src = ctx.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = opts.rate ?? 1

  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  // 잘라 쓰는 경우 끝에서 부드럽게 줄인다
  if (dur < avail) {
    const fade = Math.min(0.3, dur * 0.35)
    g.gain.setValueAtTime(gain, t + dur - fade)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
  }

  src.connect(g)
  g.connect(master!)
  src.start(t, offset)
  src.stop(t + dur + 0.05)
}

/** 슬롯 재생 */
export function play(slot: string, opts: PlayOpts = {}) {
  if (!slot) return
  void playFile(soundMap[slot], { dur: MAX_DUR[slot], ...opts })
}

// ══════════════════════════════════════════════════════════════
// 사운드보드 — 컨트롤러에서 TV 로 직접 쏘는 목록
// ══════════════════════════════════════════════════════════════

export const SOUNDBOARD: { id: string; label: string }[] = [
  { id: 'fanfare', label: '팡파레' },
  { id: 'applause', label: '박수' },
  { id: 'cheer', label: '환호' },
  { id: 'airhorn', label: '에어혼' },
  { id: 'sadTrombone', label: '뽕 (실패)' },
  { id: 'boo', label: '야유' },
  { id: 'buzzer', label: '땡' },
  { id: 'ding', label: '딩동댕' },
  { id: 'drumroll', label: '두구두구' },
  { id: 'cymbal', label: '심벌' },
  { id: 'gavel', label: '판사봉' },
  { id: 'coins', label: '동전' },
  { id: 'levelup', label: '레벨업' },
  { id: 'gameover', label: '게임오버' },
  { id: 'magic', label: '반짝' },
  { id: 'bell', label: '개정 종' },
  { id: 'door', label: '철문' },
  { id: 'glass', label: '유리 깨짐' },
  { id: 'fart', label: '뿌직' },
  { id: 'up', label: '슝 (상승)' },
  { id: 'down', label: '슝 (하강)' },
  { id: 'question', label: '문제 등장' },
]

// ══════════════════════════════════════════════════════════════
// 상황별 연출
// ══════════════════════════════════════════════════════════════

export function playFx(kind: string, payload?: any) {
  if (!isAudioOn()) return

  switch (kind) {
    // 사운드보드 직접 재생
    case 'sfx':
      play(payload?.name)
      break

    // 인용 — 판사봉 3타 → 팡파레 → 박수 → 에어혼
    case 'clear':
      play('gavel')
      play('gavel', { delay: 0.22 })
      play('gavel', { delay: 0.44 })
      play('fanfare', { delay: 0.85 })
      play('applause', { delay: 1.15, gain: 0.9 })
      play('airhorn', { delay: 1.9, gain: 0.8 })
      break

    // 기각 — 판사봉 1타 → 뽕 → 야유 → 철문
    case 'fail':
      play('gavel')
      play('sadTrombone', { delay: 0.25 })
      play('boo', { delay: 1.1, gain: 0.9 })
      play('boo', { delay: 1.35, rate: 0.88, gain: 0.7 })
      play('door', { delay: 1.9 })
      break

    case 'cash':
      play('coins')
      play('levelup', { delay: 0.2 })
      break

    case 'stamp':
      play('gavel', { gain: 0.9 })
      break

    // 추첨 — 드럼롤 → 심벌 → 반짝
    case 'draw':
      play('drumroll')
      play('cymbal', { delay: 1.5 })
      play('magic', { delay: 1.6 })
      break

    case 'tally':
      play('drop')
      play('ding', { delay: 0.12 })
      break

    case 'lock-on':
      play('click')
      break

    case 'listen':
      play('tick')
      break

    case 'reveal-word':
      play('ding')
      play('applause', { delay: 0.25, gain: 0.6 })
      break

    case 'love-win':
      play('magic')
      play('cheer', { delay: 0.25, gain: 0.9 })
      break

    case 'love-reveal':
      play('up')
      break

    case 'love-lose':
      play('buzzer')
      play('boo', { delay: 0.3, gain: 0.8 })
      break

    case 'revive':
    case 'revive-offer':
      play('bell')
      play('magic', { delay: 0.3 })
      break

    case 'undo':
      play('down')
      break

    case 'whoosh':
      play('select', { gain: 0.6 })
      break

    case 'countdown':
      play('tick')
      play('tick', { delay: 1 })
      play('tick', { delay: 2 })
      play('question', { delay: 3 })
      break

    case 'volume':
      setVolume(Number(payload?.value ?? 1.5))
      play('tick')
      break

    default:
      break
  }
}

/** 개정 인사 (TV 첫 클릭) */
export function playOpening() {
  play('gavel')
  play('gavel', { delay: 0.22 })
  play('gavel', { delay: 0.44 })
  play('bell', { delay: 0.9 })
}
