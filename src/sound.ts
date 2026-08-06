// ══════════════════════════════════════════════════════════════
// 효과음 — Web Audio 로 직접 합성 (오디오 파일 0개, 오프라인 OK)
//   TV 스피커로 크게 나가야 하므로 마스터를 세게 잡고
//   리미터(컴프레서)를 물려 찌그러지지 않게 한다.
// ══════════════════════════════════════════════════════════════

let ctx: AudioContext | null = null
let master: GainNode | null = null
let limiter: DynamicsCompressorNode | null = null
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

  limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -8
  limiter.knee.value = 6
  limiter.ratio.value = 12
  limiter.attack.value = 0.003
  limiter.release.value = 0.16

  master = ctx.createGain()
  master.gain.value = 1.6 // 크게. 리미터가 뒤에서 잡아준다.

  master.connect(limiter)
  limiter.connect(ctx.destination)
  enabled = true
}

export function setVolume(v: number) {
  if (master) master.gain.value = Math.max(0, Math.min(3, v))
}
export function getVolume() {
  return master ? master.gain.value : 0
}
export function isAudioOn() {
  return enabled && !!ctx
}

const now = () => ctx!.currentTime

// ── 기본 빌딩 블록 ─────────────────────────────────────────────

function env(node: AudioNode, t0: number, a: number, d: number, peak = 1) {
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a)
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
  o.stop(t0 + dur + 0.06)
  return o
}

let noiseBuf: AudioBuffer | null = null
function getNoise() {
  if (noiseBuf) return noiseBuf
  const len = ctx!.sampleRate * 3
  const b = ctx!.createBuffer(1, len, ctx!.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  noiseBuf = b
  return b
}

function noise(
  t0: number,
  dur: number,
  freq = 1200,
  q = 1,
  type: BiquadFilterType = 'bandpass'
) {
  const src = ctx!.createBufferSource()
  src.buffer = getNoise()
  src.loop = true
  const f = ctx!.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  src.connect(f)
  src.start(t0, Math.random() * 2)
  src.stop(t0 + dur + 0.1)
  return f
}

/** 음이름 → 주파수 */
const N: Record<string, number> = {
  C3: 130.8, D3: 146.8, E3: 164.8, F3: 174.6, G3: 196, A3: 220, B3: 246.9,
  C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, B5: 987.8,
  C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568, C7: 2093,
}

// ══════════════════════════════════════════════════════════════
// 효과음
// ══════════════════════════════════════════════════════════════

/** 판사봉 — 탕! 탕! 탕! */
export function sfxGavel(strikes = 3) {
  if (!isAudioOn()) return
  const t0 = now()
  for (let i = 0; i < strikes; i++) {
    const s = t0 + i * 0.24
    const o = ctx!.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(360, s)
    o.frequency.exponentialRampToValueAtTime(64, s + 0.13)
    env(o, s, 0.001, 0.18, 0.95)
    o.start(s)
    o.stop(s + 0.3)
    env(noise(s, 0.05, 2400, 0.9), s, 0.001, 0.05, 0.6)
    env(noise(s, 0.09, 420, 1.4), s, 0.001, 0.09, 0.45)
  }
}

/** 팡파레 — 짜잔! (성공) */
export function sfxFanfare() {
  if (!isAudioOn()) return
  const t0 = now()
  const melody = [N.C5, N.E5, N.G5, N.C6]
  melody.forEach((f, i) => {
    const s = t0 + i * 0.11
    ;[1, 2].forEach((h, k) => {
      const o = osc(k ? 'square' : 'sawtooth', f * h, s, 0.4)
      const flt = ctx!.createBiquadFilter()
      flt.type = 'lowpass'
      flt.frequency.value = 3600
      o.connect(flt)
      env(flt, s, 0.008, 0.4, k ? 0.12 : 0.34)
    })
  })
  // 마지막 화음 + 심벌
  const s = t0 + 0.46
  ;[N.C6, N.E6, N.G6].forEach((f) => {
    const o = osc('sawtooth', f, s, 1.3)
    const flt = ctx!.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.setValueAtTime(5000, s)
    flt.frequency.exponentialRampToValueAtTime(1400, s + 1.3)
    o.connect(flt)
    env(flt, s, 0.02, 1.3, 0.26)
  })
  sfxCymbalAt(s)
}

/** 뽕... 뽕... 뽀오옹 (실패 트롬본) */
export function sfxSadTrombone() {
  if (!isAudioOn()) return
  const t0 = now()
  const steps = [
    [N.G4, 0.0, 0.26],
    [N.F4, 0.3, 0.26],
    [N.E4, 0.6, 0.26],
    [N.D4, 0.9, 1.0],
  ] as [number, number, number][]
  steps.forEach(([f, off, dur], i) => {
    const s = t0 + off
    const o = ctx!.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(f * 1.06, s)
    o.frequency.exponentialRampToValueAtTime(f, s + 0.07)
    if (i === steps.length - 1) {
      o.frequency.setValueAtTime(f, s + 0.5)
      o.frequency.exponentialRampToValueAtTime(f * 0.72, s + dur)
    }
    // 관악기 느낌: 로우패스 + 살짝 비브라토
    const flt = ctx!.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.value = 1500
    const vib = ctx!.createOscillator()
    vib.frequency.value = 5.5
    const vibGain = ctx!.createGain()
    vibGain.gain.value = f * 0.015
    vib.connect(vibGain)
    vibGain.connect(o.frequency)
    vib.start(s)
    vib.stop(s + dur + 0.1)
    o.connect(flt)
    env(flt, s, 0.02, dur, 0.42)
    o.start(s)
    o.stop(s + dur + 0.1)
  })
}

/** 땡! (오답 부저) */
export function sfxBuzzer() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[0, 0.16].forEach((off) => {
    const o = ctx!.createOscillator()
    o.type = 'square'
    o.frequency.setValueAtTime(140, t0 + off)
    o.frequency.linearRampToValueAtTime(96, t0 + off + 0.14)
    const flt = ctx!.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.value = 1100
    o.connect(flt)
    env(flt, t0 + off, 0.004, 0.16, 0.55)
    o.start(t0 + off)
    o.stop(t0 + off + 0.26)
    // 거친 배음
    const o2 = osc('sawtooth', 210, t0 + off, 0.14)
    env(o2, t0 + off, 0.004, 0.14, 0.2)
  })
}

/** 딩동댕 (정답) */
export function sfxDing() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[N.E5, N.G5, N.C6].forEach((f, i) => {
    const s = t0 + i * 0.09
    const o = osc('sine', f, s, 0.9)
    env(o, s, 0.004, 0.9, 0.4)
    const o2 = osc('sine', f * 2, s, 0.6)
    env(o2, s, 0.004, 0.6, 0.12)
  })
}

/** 박수 갈채 */
export function sfxApplause(dur = 2.4) {
  if (!isAudioOn()) return
  const t0 = now()
  // 바탕 노이즈 (군중)
  const bed = noise(t0, dur, 2000, 0.7)
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.18)
  g.gain.setValueAtTime(0.4, t0 + dur * 0.55)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  bed.connect(g)
  g.connect(master!)
  // 개별 손뼉
  const claps = Math.floor(dur * 34)
  for (let i = 0; i < claps; i++) {
    const s = t0 + 0.05 + Math.random() * (dur - 0.3)
    env(noise(s, 0.03, 1400 + Math.random() * 2600, 1.6), s, 0.001, 0.03, 0.16)
  }
}

/** 야유 (우~) */
export function sfxBoo() {
  if (!isAudioOn()) return
  const t0 = now()
  for (let i = 0; i < 7; i++) {
    const s = t0 + Math.random() * 0.25
    const base = 120 + Math.random() * 90
    const o = ctx!.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(base * 1.25, s)
    o.frequency.exponentialRampToValueAtTime(base, s + 0.35)
    o.frequency.exponentialRampToValueAtTime(base * 0.82, s + 1.3)
    const flt = ctx!.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.value = 700
    o.connect(flt)
    env(flt, s, 0.09, 1.3, 0.16)
    o.start(s)
    o.stop(s + 1.5)
  }
  env(noise(t0, 1.4, 500, 0.6), t0, 0.15, 1.3, 0.14)
}

/** 두구두구두구 (드럼롤) */
export function sfxDrumroll(dur = 1.6) {
  if (!isAudioOn()) return
  const t0 = now()
  let t = 0
  let gap = 0.075
  while (t < dur) {
    const s = t0 + t
    env(noise(s, 0.045, 1900, 1.1), s, 0.001, 0.045, 0.2 + (t / dur) * 0.34)
    const o = osc('triangle', 190, s, 0.05)
    env(o, s, 0.001, 0.05, 0.1)
    t += gap
    gap = Math.max(0.028, gap * 0.955)
  }
  sfxCymbalAt(t0 + dur)
}

/** 심벌 크래시 */
function sfxCymbalAt(s: number) {
  const hi = noise(s, 1.6, 7000, 0.4, 'highpass')
  env(hi, s, 0.002, 1.6, 0.34)
  const mid = noise(s, 1.1, 3600, 0.5)
  env(mid, s, 0.002, 1.1, 0.2)
}
export function sfxCymbal() {
  if (!isAudioOn()) return
  sfxCymbalAt(now())
}

/** 두둥탁 (아재개그 마무리) */
export function sfxRimshot() {
  if (!isAudioOn()) return
  const t0 = now()
  const kick = (s: number) => {
    const o = ctx!.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(180, s)
    o.frequency.exponentialRampToValueAtTime(48, s + 0.13)
    env(o, s, 0.001, 0.16, 0.85)
    o.start(s)
    o.stop(s + 0.25)
  }
  const snare = (s: number) => {
    env(noise(s, 0.16, 1900, 0.8), s, 0.001, 0.16, 0.45)
    const o = osc('triangle', 240, s, 0.1)
    env(o, s, 0.001, 0.1, 0.24)
  }
  kick(t0)
  kick(t0 + 0.16)
  snare(t0 + 0.32)
  sfxCymbalAt(t0 + 0.33)
}

/** 뿅 (코믹 팝) */
export function sfxPop() {
  if (!isAudioOn()) return
  const t0 = now()
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(320, t0)
  o.frequency.exponentialRampToValueAtTime(1500, t0 + 0.09)
  env(o, t0, 0.003, 0.12, 0.5)
  o.start(t0)
  o.stop(t0 + 0.2)
}

/** 뾰용~ (스프링 보잉) */
export function sfxBoing() {
  if (!isAudioOn()) return
  const t0 = now()
  const o = ctx!.createOscillator()
  o.type = 'triangle'
  o.frequency.setValueAtTime(700, t0)
  o.frequency.exponentialRampToValueAtTime(120, t0 + 0.5)
  const vib = ctx!.createOscillator()
  vib.type = 'sine'
  vib.frequency.setValueAtTime(26, t0)
  vib.frequency.exponentialRampToValueAtTime(8, t0 + 0.5)
  const vg = ctx!.createGain()
  vg.gain.setValueAtTime(180, t0)
  vg.gain.exponentialRampToValueAtTime(12, t0 + 0.5)
  vib.connect(vg)
  vg.connect(o.frequency)
  vib.start(t0)
  vib.stop(t0 + 0.6)
  env(o, t0, 0.004, 0.55, 0.42)
  o.start(t0)
  o.stop(t0 + 0.7)
}

/** 슬라이드 휘슬 (위로 / 아래로) */
export function sfxSlide(up = true) {
  if (!isAudioOn()) return
  const t0 = now()
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(up ? 400 : 1500, t0)
  o.frequency.exponentialRampToValueAtTime(up ? 1800 : 260, t0 + 0.5)
  env(o, t0, 0.02, 0.52, 0.3)
  o.start(t0)
  o.stop(t0 + 0.65)
  env(noise(t0, 0.5, up ? 2400 : 900, 6), t0, 0.02, 0.5, 0.06)
}

/** 돈! (금전등록기 + 동전) */
export function sfxCash() {
  if (!isAudioOn()) return
  const t0 = now()
  // 레지스터 '칭'
  env(noise(t0, 0.08, 5200, 2), t0, 0.001, 0.08, 0.3)
  ;[N.C6, N.E6, N.G6, N.C7].forEach((f, i) => {
    const s = t0 + i * 0.04
    const o = osc('triangle', f, s, 0.45)
    env(o, s, 0.003, 0.45, 0.3)
  })
  // 동전 짤랑
  for (let i = 0; i < 14; i++) {
    const s = t0 + 0.1 + Math.random() * 0.6
    const o = osc('sine', 1600 + Math.random() * 2400, s, 0.14)
    env(o, s, 0.002, 0.14, 0.12)
  }
}

/** 레벨업 (8비트 상승) */
export function sfxLevelUp() {
  if (!isAudioOn()) return
  const t0 = now()
  const seq = [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6]
  seq.forEach((f, i) => {
    const s = t0 + i * 0.055
    const o = osc('square', f, s, 0.12)
    env(o, s, 0.002, 0.12, 0.26)
  })
  const s = t0 + seq.length * 0.055
  ;[N.C6, N.G6].forEach((f) => {
    const o = osc('square', f, s, 0.5)
    env(o, s, 0.003, 0.5, 0.24)
  })
}

/** 게임오버 (8비트 하강) */
export function sfxGameOver() {
  if (!isAudioOn()) return
  const t0 = now()
  const seq = [N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, N.D4, N.C3]
  seq.forEach((f, i) => {
    const s = t0 + i * 0.1
    const o = osc('square', f, s, 0.18)
    env(o, s, 0.003, 0.18, 0.3)
  })
}

/** 경고 사이렌 */
export function sfxSiren(cycles = 2) {
  if (!isAudioOn()) return
  const t0 = now()
  const o = ctx!.createOscillator()
  o.type = 'sawtooth'
  for (let i = 0; i < cycles; i++) {
    const s = t0 + i * 0.62
    o.frequency.setValueAtTime(620, s)
    o.frequency.linearRampToValueAtTime(1150, s + 0.31)
    o.frequency.linearRampToValueAtTime(620, s + 0.62)
  }
  const dur = cycles * 0.62
  const flt = ctx!.createBiquadFilter()
  flt.type = 'lowpass'
  flt.frequency.value = 2600
  o.connect(flt)
  env(flt, t0, 0.03, dur, 0.34)
  o.start(t0)
  o.stop(t0 + dur + 0.1)
}

/** 에어혼 (파티!) */
export function sfxAirhorn() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[0, 0.42, 0.84].forEach((off, i) => {
    const s = t0 + off
    const dur = i === 2 ? 0.7 : 0.3
    ;[1, 1.5, 2.01, 2.99].forEach((h, k) => {
      const o = ctx!.createOscillator()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(196 * h * 0.97, s)
      o.frequency.exponentialRampToValueAtTime(196 * h, s + 0.05)
      const flt = ctx!.createBiquadFilter()
      flt.type = 'lowpass'
      flt.frequency.value = 4200
      o.connect(flt)
      env(flt, s, 0.012, dur, 0.3 / (k + 1))
      o.start(s)
      o.stop(s + dur + 0.1)
    })
  })
}

/** 두근두근 (긴장) */
export function sfxHeartbeat(beats = 4) {
  if (!isAudioOn()) return
  const t0 = now()
  for (let i = 0; i < beats; i++) {
    ;[0, 0.19].forEach((off, k) => {
      const s = t0 + i * 0.62 + off
      const o = ctx!.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(88, s)
      o.frequency.exponentialRampToValueAtTime(38, s + 0.16)
      env(o, s, 0.006, 0.2, k ? 0.42 : 0.62)
      o.start(s)
      o.stop(s + 0.3)
    })
  }
}

/** 유리 깨짐 */
export function sfxGlass() {
  if (!isAudioOn()) return
  const t0 = now()
  env(noise(t0, 0.1, 6000, 0.5, 'highpass'), t0, 0.001, 0.1, 0.5)
  for (let i = 0; i < 22; i++) {
    const s = t0 + 0.02 + Math.random() * 0.55
    const o = osc('triangle', 2200 + Math.random() * 4500, s, 0.12)
    env(o, s, 0.001, 0.12, 0.13)
  }
}

/** 방귀 (…파티니까) */
export function sfxFart() {
  if (!isAudioOn()) return
  const t0 = now()
  const o = ctx!.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(105, t0)
  o.frequency.linearRampToValueAtTime(62, t0 + 0.34)
  o.frequency.linearRampToValueAtTime(84, t0 + 0.48)
  const vib = ctx!.createOscillator()
  vib.type = 'square'
  vib.frequency.setValueAtTime(34, t0)
  vib.frequency.linearRampToValueAtTime(17, t0 + 0.5)
  const vg = ctx!.createGain()
  vg.gain.value = 26
  vib.connect(vg)
  vg.connect(o.frequency)
  vib.start(t0)
  vib.stop(t0 + 0.6)
  const flt = ctx!.createBiquadFilter()
  flt.type = 'lowpass'
  flt.frequency.value = 620
  o.connect(flt)
  env(flt, t0, 0.015, 0.5, 0.55)
  o.start(t0)
  o.stop(t0 + 0.65)
}

/** 반짝 (매직) */
export function sfxMagic() {
  if (!isAudioOn()) return
  const t0 = now()
  for (let i = 0; i < 16; i++) {
    const s = t0 + i * 0.035
    const o = osc('sine', 900 + i * 190 + Math.random() * 220, s, 0.3)
    env(o, s, 0.002, 0.3, 0.14)
  }
}

/** 철문 쾅 */
export function sfxCellDoor() {
  if (!isAudioOn()) return
  const t0 = now()
  env(noise(t0, 0.45, 320, 0.6), t0, 0.01, 0.45, 0.4)
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(120, t0 + 0.24)
  o.frequency.exponentialRampToValueAtTime(30, t0 + 0.6)
  env(o, t0 + 0.24, 0.004, 0.45, 0.75)
  o.start(t0 + 0.24)
  o.stop(t0 + 0.85)
  ;[2400, 3100, 4300].forEach((f, i) => {
    const s = t0 + 0.24 + i * 0.01
    const m = osc('triangle', f, s, 0.4)
    env(m, s, 0.003, 0.4, 0.08)
  })
}

/** 도장 쾅 */
export function sfxStamp() {
  if (!isAudioOn()) return
  const t0 = now()
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(200, t0)
  o.frequency.exponentialRampToValueAtTime(36, t0 + 0.2)
  env(o, t0, 0.001, 0.26, 0.9)
  o.start(t0)
  o.stop(t0 + 0.4)
  env(noise(t0, 0.08, 900, 0.7), t0, 0.001, 0.08, 0.45)
}

/** 삑 (카운트다운/청취) */
export function sfxBeep(high = false) {
  if (!isAudioOn()) return
  const t0 = now()
  const o = osc('square', high ? 1200 : 760, t0, 0.13)
  env(o, t0, 0.003, 0.13, 0.3)
}

/** 조준 락온 */
export function sfxLockOn() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[0, 0.06, 0.12].forEach((off, i) => {
    const s = t0 + off
    const o = osc('square', 880 + i * 300, s, 0.055)
    env(o, s, 0.002, 0.055, 0.22)
  })
}

/** 화면 전환 휙 */
export function sfxWhoosh() {
  if (!isAudioOn()) return
  const t0 = now()
  const f = noise(t0, 0.42, 300, 1.4)
  f.frequency.setValueAtTime(300, t0)
  f.frequency.exponentialRampToValueAtTime(3600, t0 + 0.22)
  f.frequency.exponentialRampToValueAtTime(380, t0 + 0.42)
  env(f, t0, 0.02, 0.4, 0.26)
}

/** 하트 뿅 (증인 신문 정답) */
export function sfxLove() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[N.G5, N.B5, N.D6, N.G6].forEach((f, i) => {
    const s = t0 + i * 0.075
    const o = osc('sine', f, s, 0.45)
    env(o, s, 0.006, 0.45, 0.32)
  })
  const o = ctx!.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(420, t0)
  o.frequency.exponentialRampToValueAtTime(1700, t0 + 0.35)
  env(o, t0, 0.01, 0.35, 0.16)
  o.start(t0)
  o.stop(t0 + 0.5)
  sfxMagic()
}

/** 법정 개정 종 */
export function sfxCourtBell() {
  if (!isAudioOn()) return
  const t0 = now()
  ;[N.C5, N.G5, N.C6].forEach((f, i) => {
    const s = t0 + i * 0.02
    const o = osc('sine', f, s, 1.8)
    env(o, s, 0.008, 1.8, 0.3)
  })
}

/** 시계 째깍 */
export function sfxTick() {
  if (!isAudioOn()) return
  const t0 = now()
  env(noise(t0, 0.025, 3000, 3), t0, 0.001, 0.025, 0.18)
}

// ══════════════════════════════════════════════════════════════
// 사운드보드 — 컨트롤러에서 직접 쏘는 목록
// ══════════════════════════════════════════════════════════════

export const SOUNDBOARD: { id: string; label: string; play: () => void }[] = [
  { id: 'fanfare', label: '팡파레', play: () => sfxFanfare() },
  { id: 'applause', label: '박수', play: () => sfxApplause() },
  { id: 'airhorn', label: '에어혼', play: () => sfxAirhorn() },
  { id: 'sad', label: '뽕 (실패)', play: () => sfxSadTrombone() },
  { id: 'buzzer', label: '땡 (오답)', play: () => sfxBuzzer() },
  { id: 'ding', label: '딩동댕', play: () => sfxDing() },
  { id: 'boo', label: '야유', play: () => sfxBoo() },
  { id: 'rimshot', label: '두둥탁', play: () => sfxRimshot() },
  { id: 'drumroll', label: '두구두구', play: () => sfxDrumroll() },
  { id: 'gavel', label: '판사봉', play: () => sfxGavel(3) },
  { id: 'cash', label: '돈 소리', play: () => sfxCash() },
  { id: 'levelup', label: '레벨업', play: () => sfxLevelUp() },
  { id: 'gameover', label: '게임오버', play: () => sfxGameOver() },
  { id: 'siren', label: '사이렌', play: () => sfxSiren(2) },
  { id: 'heartbeat', label: '두근두근', play: () => sfxHeartbeat(4) },
  { id: 'boing', label: '뾰용', play: () => sfxBoing() },
  { id: 'pop', label: '뿅', play: () => sfxPop() },
  { id: 'slideup', label: '슝 (상승)', play: () => sfxSlide(true) },
  { id: 'slidedown', label: '슝 (하강)', play: () => sfxSlide(false) },
  { id: 'glass', label: '유리 깨짐', play: () => sfxGlass() },
  { id: 'fart', label: '뿌직', play: () => sfxFart() },
  { id: 'magic', label: '반짝', play: () => sfxMagic() },
  { id: 'cymbal', label: '심벌', play: () => sfxCymbal() },
  { id: 'door', label: '철문 쾅', play: () => sfxCellDoor() },
  { id: 'bell', label: '개정 종', play: () => sfxCourtBell() },
  { id: 'love', label: '하트', play: () => sfxLove() },
]

const BOARD = new Map(SOUNDBOARD.map((s) => [s.id, s.play]))

/** 서버가 보낸 연출에 맞춰 소리를 재생 */
export function playFx(kind: string, payload?: any) {
  switch (kind) {
    // ── 사운드보드 직접 재생 ──
    case 'sfx': {
      const p = BOARD.get(payload?.name)
      if (p) p()
      break
    }

    // ── 인용 (성공) ──
    case 'clear':
      sfxGavel(3)
      setTimeout(() => sfxFanfare(), 620)
      setTimeout(() => sfxApplause(3), 900)
      setTimeout(() => sfxAirhorn(), 1500)
      break

    // ── 기각 (실패) ──
    case 'fail':
      sfxGavel(1)
      setTimeout(() => sfxSadTrombone(), 180)
      setTimeout(() => sfxBoo(), 500)
      setTimeout(() => sfxCellDoor(), 1200)
      break

    case 'cash':
      sfxCash()
      setTimeout(() => sfxLevelUp(), 160)
      break

    case 'stamp':
      sfxStamp()
      break

    case 'draw':
      sfxDrumroll(1.4)
      setTimeout(() => sfxMagic(), 1450)
      break

    case 'tally':
      sfxPop()
      setTimeout(() => sfxDing(), 90)
      break

    case 'lock-on':
      sfxLockOn()
      break

    case 'listen':
      sfxBeep(true)
      break

    case 'reveal-word':
      sfxDing()
      setTimeout(() => sfxApplause(1.6), 200)
      break

    case 'love-win':
      sfxLove()
      setTimeout(() => sfxApplause(2), 300)
      break

    case 'love-reveal':
      sfxSlide(true)
      break

    case 'love-lose':
      sfxBuzzer()
      setTimeout(() => sfxBoo(), 220)
      break

    case 'revive':
    case 'revive-offer':
      sfxCourtBell()
      setTimeout(() => sfxMagic(), 300)
      break

    case 'undo':
      sfxSlide(false)
      break

    case 'whoosh':
      sfxWhoosh()
      break

    case 'countdown':
      sfxBeep(false)
      setTimeout(() => sfxBeep(false), 1000)
      setTimeout(() => sfxBeep(false), 2000)
      setTimeout(() => {
        const t0 = now()
        const o = osc('square', N.C6, t0, 0.5)
        env(o, t0, 0.004, 0.5, 0.34)
      }, 3000)
      break

    // ── 볼륨 원격 조절 ──
    case 'volume':
      setVolume(Number(payload?.value ?? 1.6))
      sfxBeep(true)
      break

    default:
      break
  }
}
