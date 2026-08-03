import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Fx } from './types'

// ══════════════════════════════════════════════════════════════
// 배경 레이어
// ══════════════════════════════════════════════════════════════

export function Grunge({ tone = 'concrete' }: { tone?: 'concrete' | 'steel' | 'love' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={
          tone === 'steel'
            ? 'absolute inset-0 tex-steel'
            : tone === 'love'
              ? 'absolute inset-0'
              : 'absolute inset-0 tex-concrete'
        }
        style={
          tone === 'love'
            ? {
                background:
                  'radial-gradient(ellipse at 30% 20%, #ff6fb5 0%, #c9007a 40%, #4a0028 78%, #1a000e 100%)',
              }
            : undefined
        }
      />
      <div className="tex-noise absolute inset-0" />
      <div className="tex-scanlines absolute inset-0" />
      <div className="tex-vignette absolute inset-0" />
    </div>
  )
}

/** 경광등 — 좌우에서 빨강/파랑 번쩍 */
export function SirenLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="anim-siren-r absolute -left-[18%] top-1/2 h-[150vh] w-[65vw] -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(225,6,0,${0.55 * intensity}) 0%, rgba(225,6,0,${0.2 * intensity}) 35%, transparent 68%)`,
          filter: 'blur(30px)',
        }}
      />
      <div
        className="anim-siren-b absolute -right-[18%] top-1/2 h-[150vh] w-[65vw] -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0,71,255,${0.55 * intensity}) 0%, rgba(0,71,255,${0.2 * intensity}) 35%, transparent 68%)`,
          filter: 'blur(30px)',
        }}
      />
      {/* 회전 광선 */}
      <div className="anim-spin-slow absolute left-1/2 top-1/2 h-[220vh] w-[220vh] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]">
        <div
          className="h-full w-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,.9) 8deg, transparent 22deg, transparent 180deg, rgba(255,255,255,.7) 188deg, transparent 202deg, transparent 360deg)',
          }}
        />
      </div>
    </div>
  )
}

/** 폴리스라인 테이프 */
export function PoliceTape({
  className = '',
  rotate = -6,
  height = 54,
  text = 'POLICE LINE ★ DO NOT CROSS ★ 총각 신분 종료 ★ 접근 금지 ★',
  speed = 'normal',
}: {
  className?: string
  rotate?: number
  height?: number
  text?: string
  speed?: 'normal' | 'fast' | 'none'
}) {
  const run = speed === 'none' ? '' : speed === 'fast' ? 'anim-marquee-fast' : 'anim-marquee'
  return (
    <div
      className={`tape-strip pointer-events-none absolute flex items-center overflow-hidden ${className}`}
      style={{ height, transform: `rotate(${rotate}deg)` }}
    >
      <div className={`flex ${run} shrink-0`}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="tape-text shrink-0 px-6"
                style={{ fontSize: height * 0.46, lineHeight: `${height}px` }}
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 감옥 창살 오버레이 */
export function PrisonBars({ opacity = 0.55, drop = false }: { opacity?: number; drop?: boolean }) {
  return (
    <div
      className={`bars pointer-events-none absolute inset-0 ${drop ? 'anim-bars-drop' : ''}`}
      style={{ opacity }}
    />
  )
}

/** 쇠사슬 (SVG) */
export function Chain({ className = '', vertical = false }: { className?: string; vertical?: boolean }) {
  const links = 14
  return (
    <div className={`pointer-events-none absolute ${className}`}>
      <div className={vertical ? 'flex flex-col items-center' : 'flex items-center'}>
        {Array.from({ length: links }).map((_, i) => (
          <div
            key={i}
            className={vertical ? '-mt-2 first:mt-0' : '-ml-2 first:ml-0'}
            style={{
              width: vertical ? 26 : 34,
              height: vertical ? 34 : 26,
              borderRadius: '50%',
              border: '6px solid transparent',
              borderImage:
                'linear-gradient(140deg, #e8edf2 0%, #8b949c 30%, #3a4148 60%, #c3ccd4 100%) 1',
              background: 'transparent',
              boxShadow: '0 2px 5px rgba(0,0,0,.7)',
              transform: i % 2 ? 'rotate(90deg) scale(.92)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** 속보 자막 바 */
export function NewsTicker({
  label = '속보',
  items,
  tone = 'red',
}: {
  label?: string
  items: string[]
  tone?: 'red' | 'blue' | 'gold'
}) {
  const bg =
    tone === 'blue'
      ? 'linear-gradient(180deg,#3d7bff,#0047ff)'
      : tone === 'gold'
        ? 'linear-gradient(180deg,#ffd75e,#b8860b)'
        : 'linear-gradient(180deg,#ff4437,#a30300)'
  const line = items.join('   ◆   ')
  return (
    <div className="relative flex w-full items-stretch overflow-hidden border-y-4 border-black bg-black/90">
      <div
        className="txt-head z-10 flex shrink-0 items-center px-5 text-[1.6vw] text-white"
        style={{ background: bg, textShadow: '0 2px 4px rgba(0,0,0,.6)' }}
      >
        <span className="anim-blink mr-2">●</span>
        {label}
      </div>
      <div className="relative flex flex-1 items-center overflow-hidden py-2">
        <div className="anim-marquee flex shrink-0 whitespace-nowrap">
          {[0, 1].map((k) => (
            <span key={k} className="txt-head shrink-0 pr-16 text-[1.5vw] text-tape">
              {line}   ◆   {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 숫자 롤링 카운터
// ══════════════════════════════════════════════════════════════

export function RollingNumber({
  value,
  className = '',
  duration = 900,
}: {
  value: number
  className?: string
  duration?: number
}) {
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const e = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(from + (to - from) * e))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span className={className}>{shown.toLocaleString('ko-KR')}</span>
}

// ══════════════════════════════════════════════════════════════
// 1회성 연출 오버레이
// ══════════════════════════════════════════════════════════════

/** 지폐 비 */
function CashRain({ onDone }: { onDone: () => void }) {
  const bills = useMemo(
    () =>
      Array.from({ length: 46 }).map((_, i) => ({
        i,
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        dur: 1.5 + Math.random() * 1.3,
        r0: `${Math.random() * 360}deg`,
        r1: `${Math.random() * 1080 - 540}deg`,
        s: 0.6 + Math.random() * 0.8,
      })),
    []
  )
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="pointer-events-none fixed inset-0 z-[95] overflow-hidden">
      {bills.map((b) => (
        <div
          key={b.i}
          className="absolute top-0"
          style={
            {
              left: `${b.left}%`,
              '--r0': b.r0,
              '--r1': b.r1,
              '--s': b.s,
              animation: `bill-fall ${b.dur}s linear ${b.delay}s forwards`,
            } as React.CSSProperties
          }
        >
          <div
            className="flex h-[52px] w-[104px] items-center justify-center rounded-[3px] border-2 border-emerald-900/70 text-[13px] font-black text-emerald-950"
            style={{
              background: 'linear-gradient(150deg,#b7f7cd,#4ade80 40%,#16a34a 100%)',
              boxShadow: '0 3px 10px rgba(0,0,0,.5), inset 0 0 0 3px rgba(255,255,255,.35)',
            }}
          >
            ₩
          </div>
        </div>
      ))}
    </div>
  )
}

/** 도장 쾅 */
function StampOverlay({ text, tone, onDone }: { text: string; tone?: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1700)
    return () => clearTimeout(t)
  }, [onDone])
  const cls = tone === 'blue' ? 'stamp stamp-blue' : tone === 'gold' ? 'stamp stamp-gold' : 'stamp'
  return (
    <div className="pointer-events-none fixed inset-0 z-[97] flex items-center justify-center">
      <div className={`${cls} anim-stamp text-[13vw] leading-none`}>{text}</div>
    </div>
  )
}

/** 클리어 배너 */
function ClearOverlay({
  amount,
  title,
  total,
  unit,
  step,
  onDone,
}: {
  amount?: number
  title?: string
  total?: number
  unit?: string
  step?: number
  onDone: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[96] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="anim-spin-slow absolute h-[180vh] w-[180vh] opacity-25">
        <div
          className="h-full w-full"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, #ffc72c 0deg 9deg, transparent 9deg 18deg)',
          }}
        />
      </div>
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.3, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}
      >
        <div className="txt-head txt-glow-gold anim-thump text-[8vw] leading-none">집행 성공</div>
        {title && <div className="txt-head mt-1 text-[2.6vw] text-tape">{title}</div>}
        {!!step && (
          <div className="txt-head mt-2 text-[2vw] text-white/80">
            보석금 {step}단계 도달
          </div>
        )}
        {typeof total === 'number' && (
          <div className="txt-num txt-gold-plate mt-2 text-[10vw] leading-none">
            {total.toLocaleString('ko-KR')}
            <span className="text-[4vw]">{unit || ''}</span>
          </div>
        )}
        {!!amount && amount > 0 && (
          <div className="txt-num mt-1 text-[3vw] leading-none text-cash">
            ▲ +{amount.toLocaleString('ko-KR')}
            {unit || ''}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/** 하트 폭발 */
function HeartBurst({ onDone }: { onDone: () => void }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        i,
        x: (Math.random() - 0.5) * 120,
        y: -30 - Math.random() * 90,
        d: Math.random() * 0.5,
        s: 0.5 + Math.random() * 1.4,
        e: ['💖', '💗', '💕', '❤️', '💘', '✨', '🌸'][Math.floor(Math.random() * 7)],
      })),
    []
  )
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="pointer-events-none fixed inset-0 z-[96] flex items-center justify-center overflow-hidden">
      {hearts.map((h) => (
        <motion.div
          key={h.i}
          className="absolute"
          style={{ fontSize: `${h.s * 42}px` }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: `${h.x}vw`, y: `${h.y}vh`, scale: [0, 1.2, 1, 0.8] }}
          transition={{ duration: 2.4, delay: h.d, ease: 'easeOut' }}
        >
          {h.e}
        </motion.div>
      ))}
    </div>
  )
}

/** 3-2-1 카운트다운 */
function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3)
  useEffect(() => {
    const id = setInterval(() => setN((v) => v - 1), 1000)
    const t = setTimeout(onDone, 4000)
    return () => {
      clearInterval(id)
      clearTimeout(t)
    }
  }, [onDone])
  const label = n > 0 ? String(n) : '발성!'
  return (
    <div className="pointer-events-none fixed inset-0 z-[97] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/55" />
      <div
        key={label}
        className={`anim-count txt-head relative ${n > 0 ? 'txt-glow-red' : 'txt-glow-gold'} text-[24vw] leading-none`}
      >
        {label}
      </div>
    </div>
  )
}

/** 화면 붉은 경고 플래시 */
function FailFlash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[94]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.55, 0.1, 0.45, 0] }}
      transition={{ duration: 1.3, times: [0, 0.1, 0.3, 0.5, 1] }}
      style={{ background: 'radial-gradient(circle, rgba(225,6,0,.35), rgba(120,0,0,.9))' }}
    />
  )
}

/** 연출 매니저 — fx 이벤트를 받아 오버레이를 띄운다 */
export function FxLayer({ fx }: { fx: Fx | null }) {
  const [items, setItems] = useState<Fx[]>([])
  const seen = useRef('')

  useEffect(() => {
    if (!fx || fx._id === seen.current) return
    seen.current = fx._id
    setItems((prev) => [...prev, fx])
  }, [fx])

  const drop = (id: string) => setItems((prev) => prev.filter((i) => i._id !== id))

  return (
    <AnimatePresence>
      {items.map((f) => {
        switch (f.kind) {
          case 'cash':
          case 'perfect':
            return <CashRain key={f._id} onDone={() => drop(f._id)} />
          case 'stamp':
            return (
              <StampOverlay
                key={f._id}
                text={f.text || ''}
                tone={f.tone}
                onDone={() => drop(f._id)}
              />
            )
          case 'clear':
            return (
              <ClearOverlay
                key={f._id}
                amount={f.amount}
                title={f.title}
                total={f.total}
                unit={f.unit}
                step={f.step}
                onDone={() => drop(f._id)}
              />
            )
          case 'love-win':
            return <HeartBurst key={f._id} onDone={() => drop(f._id)} />
          case 'countdown':
            return <Countdown key={f._id} onDone={() => drop(f._id)} />
          case 'fail':
          case 'love-lose':
            return <FailFlash key={f._id} onDone={() => drop(f._id)} />
          default:
            return null
        }
      })}
    </AnimatePresence>
  )
}

// ══════════════════════════════════════════════════════════════
// 공용 소품
// ══════════════════════════════════════════════════════════════

/** 사진 자리 (사진 없으면 실루엣) */
export function PhotoBox({
  src,
  label = '사진',
  className = '',
  style,
}: {
  src?: string
  label?: string
  className?: string
  style?: React.CSSProperties
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`object-cover ${className}`}
        style={style}
        draggable={false}
      />
    )
  }
  return (
    <div
      className={`flex flex-col items-center justify-center border-4 border-dashed border-white/30 bg-black/45 ${className}`}
      style={style}
    >
      <div className="text-[3.2vw] opacity-45">👤</div>
      <div className="txt-head mt-1 text-[1.1vw] tracking-widest text-white/45">{label}</div>
    </div>
  )
}

/** 상금 사다리 — 게임을 깰수록 한 칸씩 올라간다 */
export function PrizeLadder({
  ladder,
  cleared,
  unit,
  maxTotal,
  bonus = 0,
  size = 'md',
}: {
  ladder: number[]
  cleared: number
  unit: string
  maxTotal: number
  bonus?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const f =
    size === 'lg'
      ? { step: '2.4vw', label: '1vw', h: '9vh', gap: '0.7vw' }
      : size === 'sm'
        ? { step: '17px', label: '10px', h: '48px', gap: '5px' }
        : { step: '1.7vw', label: '0.8vw', h: '6.5vh', gap: '0.5vw' }

  return (
    <div className="flex items-end" style={{ gap: f.gap }}>
      {ladder.map((amt, i) => {
        const done = i < cleared
        const now = i === cleared
        return (
          <div key={i} className="flex flex-col items-center" style={{ gap: 2 }}>
            <div
              className={`plate relative flex items-center justify-center overflow-hidden border-[3px] px-[0.5vw] ${
                done
                  ? 'anim-sheen border-gold'
                  : now
                    ? 'anim-blink border-tape'
                    : 'border-con-500'
              }`}
              style={{
                height: f.h,
                minWidth: size === 'sm' ? 52 : '5vw',
                background: done
                  ? 'linear-gradient(180deg,#8a6508,#ffc72c 55%,#b8860b)'
                  : now
                    ? 'linear-gradient(180deg,#3a3a3a,#141414)'
                    : 'linear-gradient(180deg,#1e1e1e,#0a0a0a)',
                boxShadow: done ? '0 0 22px rgba(255,199,44,.75)' : 'inset 0 4px 12px rgba(0,0,0,.9)',
              }}
            >
              <span
                className={`txt-num leading-none ${
                  done ? 'text-black' : now ? 'text-tape' : 'text-con-300'
                }`}
                style={{ fontSize: f.step }}
              >
                {amt}
              </span>
              {done && (
                <span
                  className="absolute right-[2px] top-[1px] leading-none"
                  style={{ fontSize: f.label }}
                >
                  ✔
                </span>
              )}
            </div>
            <span
              className={`txt-head leading-none ${done ? 'text-gold' : now ? 'text-tape' : 'text-white/25'}`}
              style={{ fontSize: f.label }}
            >
              {i + 1}단
            </span>
          </div>
        )
      })}

      {/* 보너스 → 최대치 */}
      <div className="flex flex-col items-center" style={{ gap: 2 }}>
        <div
          className={`plate flex items-center justify-center border-[3px] px-[0.5vw] ${
            bonus > 0 ? 'border-love' : 'border-con-500'
          }`}
          style={{
            height: f.h,
            minWidth: size === 'sm' ? 52 : '5vw',
            background:
              bonus > 0
                ? 'linear-gradient(180deg,#a30058,#ff3e9d 55%,#a30058)'
                : 'linear-gradient(180deg,#1e1e1e,#0a0a0a)',
            boxShadow: bonus > 0 ? '0 0 22px rgba(255,62,157,.7)' : 'inset 0 4px 12px rgba(0,0,0,.9)',
          }}
        >
          <span
            className={`txt-num leading-none ${bonus > 0 ? 'text-white' : 'text-con-300'}`}
            style={{ fontSize: f.step }}
          >
            {maxTotal}
          </span>
        </div>
        <span
          className={`txt-head leading-none ${bonus > 0 ? 'text-love-lt' : 'text-white/25'}`}
          style={{ fontSize: f.label }}
        >
          보너스
        </span>
      </div>
    </div>
  )
}

/** 상단 고정 보석금 바 */
export function PrizeBar({
  earned,
  meta,
  bonus = 0,
}: {
  earned: number
  meta: { cleared: number; totalGames: number; next: number; maxTotal: number; unit: string }
  bonus?: number
  /** 사다리 표시용 */
  ladder?: number[]
}) {
  const pct = meta.maxTotal > 0 ? Math.min(100, (earned / meta.maxTotal) * 100) : 0
  const remain = Math.max(0, meta.next - earned)
  return (
    <div className="relative z-30 w-full border-b-4 border-black bg-black/85 px-[1.5vw] py-[0.7vh] backdrop-blur">
      <div className="flex items-center gap-[1.5vw]">
        <div className="txt-head shrink-0 text-[1.3vw] tracking-widest text-tape">
          💰 적립 보석금
        </div>
        <div className="txt-num txt-gold-plate shrink-0 text-[3.2vw] leading-none">
          <RollingNumber value={earned} />
          <span className="ml-1 text-[1.5vw]">{meta.unit}</span>
        </div>

        <div className="relative h-[2vh] flex-1 overflow-hidden rounded-full border-[3px] border-black bg-con-800">
          <div
            className="anim-sheen relative h-full overflow-hidden transition-[width] duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#b8860b,#ffc72c 55%,#fff3c4)',
              boxShadow: '0 0 18px rgba(255,199,44,.65)',
            }}
          />
          <div className="txt-head absolute inset-0 flex items-center justify-center text-[1vw] text-white/90 drop-shadow-[0_2px_2px_rgba(0,0,0,.9)]">
            집행 {meta.cleared} / {meta.totalGames} 성공
            {remain > 0 && ` · 다음 단계까지 ${remain}${meta.unit}`}
          </div>
        </div>

        <div className="txt-head shrink-0 text-[1vw] text-white/50">
          최대 {meta.maxTotal}
          {meta.unit}
        </div>
      </div>
    </div>
  )
}
