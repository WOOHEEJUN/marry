// ══════════════════════════════════════════════════════════════
// 사운드 — Web Audio로 직접 합성 (오디오 파일 0개, 오프라인 OK)
// ══════════════════════════════════════════════════════════════

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = false

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    enabled = true
    return
  }
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.55
  master.connect(ctx.destination)
  enabled = true
}

export function setVolume(v: number) {
  if (master) master.gain.value = v
}
export function isAudioOn() {
  return enabled && !!ctx
}

function now() {
  return ctx!.currentTime
}

function env(node: AudioNode, t0: number, a: number, d: number, peak = 1) {
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d)
  node.connect(g)
  g.connect(master!)
  return g
}

function osc(type: OscillatorType, freq: number, t0: number, dur: number) {
  const o = ctx!.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
  return o
}

function noiseBuffer(dur: number) {
  const len = Math.floor(ctx!.sampleRate * dur)
  const buf = ctx!.createBuffer(1, len, ctx!.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function noise(t0: number, dur: number, filterFreq = 1200, q = 1) {
  const src = ctx!.createBufferSource()
  src.buffer = noiseBuffer(dur)
  const f = ctx!.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = filterFreq
  f.Q.value = q
  src.connect(f)
  src.start(t0)
  return f
}

// ── 개별 사운드 ────────────────────────────────────────────────

/** 판사봉 — 나무 타격음 (탕! 탕! 탕!) */
export function sfxGavel(strikes = 3) {
  if (!isAudioOn()) return
  const t0 = now()
  for (let i = 0; i < strikes; i++) {
    const s = t0 + i * 0.26
    // 나무 몸통 울림
    const o = ctx!.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(320, s)
    o.frequency.exponentialRampToValueAtTime(72, s + 0.14)
    env(o, s, 0.002, 0.16, 0.55)
    o.start(s)
    o.stop(s + 0.25)
    // 타격 순간의 딱 소리
    const n = noise(s, 0.05, 2100, 1.1)
    env(n, s, 0.001, 0.05, 0.42)
    // 배음
    ;[880, 1240].forEach((f, k) => {
      const m = osc('sine', f, s + k * 0.004, 0.12)
      env(m, s + k * 0.004, 0.002, 0.12, 0.1)
    })
  }
}

/** 법정 개정 종 */
export function sfxCourtBell() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[523, 784, 1046].forEach((f, i) => {
    const o = osc('sine', f, t0 + i * 0.02, 1.6)
    env(o, t0 + i * 0.02, 0.01, 1.6, 0.13)
  })
}

/** 돈 — 코인 짤랑 + 금전등록기 */
export function sfxCash() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[1046, 1318, 1568, 2093].forEach((f, i) => {
    const o = osc('triangle', f, t0 + i * 0.045, 0.3)
    env(o, t0 + i * 0.045, 0.005, 0.3, 0.16)
  })
  // 등록기 '팅'
  const o2 = osc('sine', 880, t0 + 0.02, 0.5)
  env(o2, t0 + 0.02, 0.004, 0.5, 0.12)
  const n = noise(t0, 0.12, 5200, 2)
  env(n, t0, 0.003, 0.12, 0.1)
}

/** 도장 쾅 */
export function sfxStamp() {
  if (!isAudioOn()) return
  const t0 = now()
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(180, t0)
  o.frequency.exponentialRampToValueAtTime(38, t0 + 0.22)
  env(o, t0, 0.004, 0.28, 0.75)
  o.start(t0)
  o.stop(t0 + 0.35)
  const n = noise(t0, 0.09, 900, 0.7)
  env(n, t0, 0.002, 0.09, 0.35)
}

/** 실패 — 부저 */
export function sfxFail() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[0, 0.18].forEach((off) => {
    const o = ctx!.createOscillator()
    o.type = 'square'
    o.frequency.setValueAtTime(150, t0 + off)
    o.frequency.linearRampToValueAtTime(88, t0 + off + 0.15)
    env(o, t0 + off, 0.006, 0.16, 0.2)
    o.start(t0 + off)
    o.stop(t0 + off + 0.25)
  })
}

/** 철문 쾅 닫힘 */
export function sfxCellDoor() {
  if (!isAudioOn()) return
  const t0 = now()
  const n = noise(t0, 0.5, 320, 0.6)
  env(n, t0, 0.01, 0.5, 0.4)
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(120, t0 + 0.28)
  o.frequency.exponentialRampToValueAtTime(32, t0 + 0.6)
  env(o, t0 + 0.28, 0.005, 0.42, 0.6)
  o.start(t0 + 0.28)
  o.stop(t0 + 0.8)
  // 쇠 울림
  ;[2400, 3100, 4300].forEach((f, i) => {
    const m = osc('triangle', f, t0 + 0.28 + i * 0.01, 0.4)
    env(m, t0 + 0.28 + i * 0.01, 0.003, 0.4, 0.05)
  })
}

/** 카운트다운 삑 */
export function sfxBeep(high = false) {
  if (!isAudioOn()) return
  const t0 = now()
  const o = osc('square', high ? 1200 : 720, t0, 0.14)
  env(o, t0, 0.004, 0.14, 0.16)
}

/** 팡파레 (클리어) */
export function sfxFanfare() {
  if (!isAudioOn()) return
  const t0 = now()
  const notes = [523, 659, 784, 1046, 1318]
  notes.forEach((f, i) => {
    const s = t0 + i * 0.1
    const o = osc('sawtooth', f, s, 0.5)
    const flt = ctx!.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.value = 3000
    o.connect(flt)
    env(flt, s, 0.01, 0.5, 0.14)
  })
  // 마지막 화음
  const s = t0 + 0.5
  ;[1046, 1318, 1568].forEach((f) => {
    const o = osc('triangle', f, s, 1.1)
    env(o, s, 0.02, 1.1, 0.12)
  })
}

/** 조준 락온 */
export function sfxLockOn() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[0, 0.07, 0.14].forEach((off, i) => {
    const o = osc('square', 900 + i * 260, t0 + off, 0.06)
    env(o, t0 + off, 0.002, 0.06, 0.1)
  })
}

/** 하트 뿅 (천생연분) */
export function sfxLove() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[784, 988, 1175, 1568].forEach((f, i) => {
    const s = t0 + i * 0.08
    const o = osc('sine', f, s, 0.4)
    env(o, s, 0.008, 0.4, 0.16)
  })
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(400, t0)
  o.frequency.exponentialRampToValueAtTime(1600, t0 + 0.35)
  env(o, t0, 0.01, 0.35, 0.08)
  o.start(t0)
  o.stop(t0 + 0.5)
}

/** 화면 전환 휙 */
export function sfxWhoosh() {
  if (!isAudioOn()) return
  const t0 = now()
  const src = ctx!.createBufferSource()
  src.buffer = noiseBuffer(0.4)
  const f = ctx!.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 1.4
  f.frequency.setValueAtTime(300, t0)
  f.frequency.exponentialRampToValueAtTime(3400, t0 + 0.22)
  f.frequency.exponentialRampToValueAtTime(400, t0 + 0.4)
  src.connect(f)
  env(f, t0, 0.02, 0.38, 0.14)
  src.start(t0)
}

/** 타자기 틱 */
export function sfxTick() {
  if (!isAudioOn()) return
  const t0 = now()
  const n = noise(t0, 0.03, 2600, 3)
  env(n, t0, 0.001, 0.03, 0.06)
}

export function playFx(kind: string) {
  switch (kind) {
    case 'cash':
      sfxCash()
      break
    case 'stamp':
      sfxStamp()
      break
    case 'fail':
      sfxGavel(1)
      setTimeout(() => sfxFail(), 120)
      setTimeout(() => sfxCellDoor(), 200)
      break
    case 'clear':
      sfxGavel(3)
      setTimeout(() => sfxFanfare(), 620)
      break
    case 'lock-on':
      sfxLockOn()
      break
    case 'countdown':
      break
    case 'listen':
      sfxBeep(true)
      break
    case 'love-win':
      sfxLove()
      break
    case 'love-reveal':
      sfxBeep(true)
      break
    case 'love-lose':
      sfxFail()
      break
    case 'revive':
    case 'revive-offer':
      sfxCourtBell()
      break
    case 'whoosh':
      sfxWhoosh()
      break
    case 'gavel':
      sfxGavel(3)
      break
    case 'bell':
      sfxCourtBell()
      break
    case 'reveal-word':
      sfxCash()
      break
    default:
      break
  }
}
