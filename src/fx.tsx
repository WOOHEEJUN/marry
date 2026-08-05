import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Fx } from './types'

// ══════════════════════════════════════════════════════════════
// 법정 배경
// ══════════════════════════════════════════════════════════════

/** 법정 전경 — 벽 + 조명 + 노이즈 + 비네트 */
export function Hall({ tone = 'hall' }: { tone?: 'hall' | 'wood' | 'love' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={
          tone === 'wood'
            ? 'tex-wood absolute inset-0'
            : tone === 'love'
              ? 'absolute inset-0'
              : 'tex-hall absolute inset-0'
        }
        style={
          tone === 'love'
            ? {
                background:
                  'radial-gradient(ellipse at 50% 12%, #ff9ec4 0%, #d94f8a 34%, #6b1440 70%, #2a0616 100%)',
              }
            : undefined
        }
      />
      <div className="tex-spot absolute inset-0" />
      <div className="tex-noise absolute inset-0" />
      <div className="tex-vignette absolute inset-0" />
    </div>
  )
}

/** 좌우 벨벳 커튼 */
export function Curtains({ width = '13vw' }: { width?: string }) {
  return (
    <>
      {(['left', 'right'] as const).map((side) => (
        <div
          key={side}
          className="tex-curtain anim-curtain pointer-events-none absolute top-0 h-full"
          style={{
            width,
            [side]: 0,
            transformOrigin: side === 'left' ? 'left center' : 'right center',
            boxShadow:
              side === 'left'
                ? 'inset -22px 0 44px rgba(0,0,0,.75)'
                : 'inset 22px 0 44px rgba(0,0,0,.75)',
          }}
        >
          {/* 커튼 상단 봉 */}
          <div
            className="absolute left-0 top-0 h-[1.6vh] w-full"
            style={{
              background: 'linear-gradient(180deg,#ffd97a,#8a6508 60%,#4a3405)',
              boxShadow: '0 2px 8px rgba(0,0,0,.8)',
            }}
          />
          {/* 술 장식 */}
          <div
            className="absolute bottom-0 left-0 h-[2vh] w-full"
            style={{
              background:
                'repeating-linear-gradient(90deg,#c9a227 0 6px,#8a6508 6px 12px)',
              maskImage: 'linear-gradient(180deg,#000 40%,transparent 100%)',
            }}
          />
        </div>
      ))}
    </>
  )
}

/** 정의의 저울 */
export function Scales({ size = '8vw', className = '' }: { size?: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 190" style={{ width: size, height: 'auto' }} className={className}>
      <defs>
        <linearGradient id="sc-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="38%" stopColor="#ffd97a" />
          <stop offset="70%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#6d4f06" />
        </linearGradient>
      </defs>
      {/* 기둥 */}
      <rect x="94" y="34" width="12" height="118" fill="url(#sc-gold)" />
      <ellipse cx="100" cy="160" rx="42" ry="11" fill="url(#sc-gold)" />
      <ellipse cx="100" cy="154" rx="30" ry="8" fill="#8a6508" />
      <circle cx="100" cy="28" r="10" fill="url(#sc-gold)" />
      {/* 저울대 + 접시 */}
      <g className="anim-scales">
        <rect x="24" y="40" width="152" height="8" rx="4" fill="url(#sc-gold)" />
        {[38, 162].map((cx, i) => (
          <g key={i}>
            <line x1={cx} y1="46" x2={cx - 22} y2="88" stroke="#c9a227" strokeWidth="3" />
            <line x1={cx} y1="46" x2={cx + 22} y2="88" stroke="#c9a227" strokeWidth="3" />
            <path
              d={`M${cx - 30} 88 L${cx + 30} 88 L${cx + 20} 104 L${cx - 20} 104 Z`}
              fill="url(#sc-gold)"
              stroke="#6d4f06"
              strokeWidth="2"
            />
          </g>
        ))}
      </g>
    </svg>
  )
}

/** 판사봉 */
export function Gavel({
  size = '9vw',
  strike = false,
  className = '',
}: {
  size?: string
  strike?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 220 150"
      style={{ width: size, height: 'auto' }}
      className={`${strike ? 'anim-gavel' : ''} ${className}`}
    >
      <defs>
        <linearGradient id="gv-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b87f4f" />
          <stop offset="45%" stopColor="#714122" />
          <stop offset="100%" stopColor="#2a1509" />
        </linearGradient>
        <linearGradient id="gv-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="50%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#6d4f06" />
        </linearGradient>
      </defs>
      {/* 손잡이 */}
      <rect
        x="96"
        y="52"
        width="112"
        height="17"
        rx="8"
        transform="rotate(28 96 52)"
        fill="url(#gv-wood)"
        stroke="#170c04"
        strokeWidth="3"
      />
      {/* 머리 */}
      <rect
        x="18"
        y="26"
        width="86"
        height="44"
        rx="8"
        fill="url(#gv-wood)"
        stroke="#170c04"
        strokeWidth="3"
      />
      <rect x="18" y="26" width="13" height="44" fill="url(#gv-brass)" stroke="#170c04" strokeWidth="3" />
      <rect x="91" y="26" width="13" height="44" fill="url(#gv-brass)" stroke="#170c04" strokeWidth="3" />
    </svg>
  )
}

/** 법원 문장 */
export function Emblem({ size = '7vw', label = '법 원' }: { size?: string; label?: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 200" style={{ width: size, height: 'auto' }}>
        <defs>
          <linearGradient id="em-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="40%" stopColor="#ffd97a" />
            <stop offset="100%" stopColor="#6d4f06" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="#150b05" stroke="url(#em-gold)" strokeWidth="6" />
        <circle cx="100" cy="100" r="76" fill="none" stroke="url(#em-gold)" strokeWidth="2.5" />
        {/* 월계수 */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(100,108) scale(${s},1)`}>
            <path
              d="M0 44 C-26 34 -40 12 -40 -12"
              fill="none"
              stroke="url(#em-gold)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <ellipse
                key={i}
                cx={-13 - i * 7}
                cy={30 - i * 11}
                rx="9"
                ry="5"
                fill="url(#em-gold)"
                transform={`rotate(${-32 - i * 8} ${-13 - i * 7} ${30 - i * 11})`}
              />
            ))}
          </g>
        ))}
        <text
          x="100"
          y="86"
          textAnchor="middle"
          fill="url(#em-gold)"
          fontSize="46"
          fontWeight="800"
          fontFamily="'Nanum Myeongjo',serif"
        >
          ⚖
        </text>
        <text
          x="100"
          y="126"
          textAnchor="middle"
          fill="url(#em-gold)"
          fontSize="30"
          fontWeight="800"
          fontFamily="'Nanum Myeongjo',serif"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}

/** 판결문용 법원 문장 (월계관 + M) */
export function CourtEmblem({ size = '7vh' }: { size?: string }) {
  return (
    <svg viewBox="0 0 220 220" style={{ height: size, width: 'auto' }}>
      {/* 월계관 */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(110,118) scale(${s},1)`}>
          <path
            d="M0 74 C-46 66 -74 30 -76 -22 C-77 -52 -66 -78 -48 -92"
            fill="none"
            stroke="#111"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {Array.from({ length: 8 }).map((_, i) => {
            const t = i / 7
            const x = -18 - Math.sin(t * 1.5) * 56
            const y = 56 - t * 140
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="13"
                ry="6.5"
                fill="#111"
                transform={`rotate(${-58 + t * 66} ${x} ${y})`}
              />
            )
          })}
        </g>
      ))}
      {/* 상단 왕관 */}
      <path d="M96 22 L110 6 L124 22 L118 34 L102 34 Z" fill="#111" />
      <circle cx="110" cy="4" r="5" fill="#111" />
      {/* M */}
      <text
        x="110"
        y="140"
        textAnchor="middle"
        fill="#1f6b3a"
        stroke="#111"
        strokeWidth="4"
        paintOrder="stroke"
        fontSize="112"
        fontWeight="900"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        M
      </text>
      <text
        x="110"
        y="52"
        textAnchor="middle"
        fill="#1f4fa8"
        fontSize="19"
        fontWeight="900"
        letterSpacing="2"
        fontFamily="Georgia, serif"
      >
        LEADER
      </text>
      <text
        x="110"
        y="182"
        textAnchor="middle"
        fill="#1f6b3a"
        fontSize="15"
        fontWeight="900"
        letterSpacing="1"
        fontFamily="Georgia, serif"
      >
        303 304
      </text>
    </svg>
  )
}

/** 황동 명판 */
export function Plaque({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`plaque tex-brass anim-sheen relative overflow-hidden ${className}`} style={style}>
      {children}
    </div>
  )
}

/** 하단 게시 자막 */
export function CourtTicker({ label = '공지', items }: { label?: string; items: string[] }) {
  const line = items.join('   ·   ')
  return (
    <div className="relative flex w-full items-stretch overflow-hidden border-y-[3px] border-[#170c04] bg-[#150b05]/95">
      <div
        className="txt-court z-10 flex shrink-0 items-center px-5 text-[1.4vw] text-[#2a1509]"
        style={{ background: 'linear-gradient(180deg,#ffd97a,#c9a227 60%,#8a6508)' }}
      >
        {label}
      </div>
      <div className="relative flex flex-1 items-center overflow-hidden py-2">
        <div className="anim-marquee flex shrink-0 whitespace-nowrap">
          {[0, 1].map((k) => (
            <span key={k} className="txt-court shrink-0 pr-16 text-[1.35vw] text-brass-300">
              {line}   ·   {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 숫자 롤링
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
// 적립금 사다리
// ══════════════════════════════════════════════════════════════

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
      ? { step: '2.1vw', label: '0.85vw', h: '7.5vh', min: '4.4vw', gap: '0.45vw' }
      : { step: '1.5vw', label: '0.7vw', h: '5.5vh', min: '3.6vw', gap: '0.35vw' }

  return (
    <div className="flex items-end" style={{ gap: f.gap }}>
      {ladder.map((amt, i) => {
        const done = i < cleared
        const now = i === cleared
        return (
          <div key={i} className="flex flex-col items-center" style={{ gap: 2 }}>
            <div
              className={`plaque relative flex items-center justify-center overflow-hidden ${
                done ? 'tex-brass anim-sheen' : ''
              } ${now ? 'anim-blink' : ''}`}
              style={{
                height: f.h,
                minWidth: f.min,
                border: done
                  ? '3px solid #6d4f06'
                  : now
                    ? '3px solid #c9a227'
                    : '3px solid #2a1509',
                background: done
                  ? undefined
                  : now
                    ? 'linear-gradient(180deg,#3a2010,#1a0d05)'
                    : 'linear-gradient(180deg,#241409,#150b05)',
                boxShadow: done
                  ? '0 0 20px rgba(201,162,39,.6)'
                  : 'inset 0 4px 12px rgba(0,0,0,.9)',
              }}
            >
              <span
                className="txt-num leading-none"
                style={{
                  fontSize: f.step,
                  color: done ? '#2a1509' : now ? '#ffd97a' : '#6b5335',
                }}
              >
                {amt}
              </span>
            </div>
            <span
              className="txt-court leading-none"
              style={{
                fontSize: f.label,
                color: done ? '#ffd97a' : now ? '#c9a227' : 'rgba(255,255,255,.22)',
              }}
            >
              {i + 1}건
            </span>
          </div>
        )
      })}

      <div className="flex flex-col items-center" style={{ gap: 2 }}>
        <div
          className="plaque flex items-center justify-center overflow-hidden"
          style={{
            height: f.h,
            minWidth: f.min,
            border: bonus > 0 ? '3px solid #d94f8a' : '3px solid #2a1509',
            background:
              bonus > 0
                ? 'linear-gradient(180deg,#d94f8a,#6b1440)'
                : 'linear-gradient(180deg,#241409,#150b05)',
            boxShadow: bonus > 0 ? '0 0 20px rgba(217,79,138,.6)' : 'inset 0 4px 12px rgba(0,0,0,.9)',
          }}
        >
          <span
            className="txt-num leading-none"
            style={{ fontSize: f.step, color: bonus > 0 ? '#fff' : '#6b5335' }}
          >
            {maxTotal}
          </span>
        </div>
        <span
          className="txt-court leading-none"
          style={{ fontSize: f.label, color: bonus > 0 ? '#ff9ec4' : 'rgba(255,255,255,.22)' }}
        >
          직권
        </span>
      </div>
    </div>
  )
}

/** 상단 고정 적립금 바 */
export function PrizeBar({
  earned,
  meta,
}: {
  earned: number
  meta: {
    cleared: number
    totalGames: number
    next: number
    maxTotal: number
    unit: string
    demandStanding: number
  }
}) {
  const pct = meta.maxTotal > 0 ? Math.min(100, (earned / meta.maxTotal) * 100) : 0
  const remain = Math.max(0, meta.next - earned)
  return (
    <div className="relative z-30 w-full border-b-[3px] border-[#170c04] bg-[#150b05]/92 px-[1.5vw] pb-[0.6vh] pt-[1.1vh] backdrop-blur">
      <div className="flex items-center gap-[1.2vw]">
        <div className="txt-court shrink-0 text-[1.2vw] tracking-widest text-brass-300">
          적립금
        </div>
        <div className="txt-num txt-gold shrink-0 text-[3vw] leading-none">
          <RollingNumber value={earned} />
          <span className="ml-1 text-[1.4vw]">{meta.unit}</span>
        </div>

        <div
          className="relative h-[1.9vh] flex-1 overflow-hidden rounded-sm border-[3px] border-[#170c04]"
          style={{ background: '#241409' }}
        >
          <div
            className="anim-sheen relative h-full overflow-hidden transition-[width] duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#6d4f06,#c9a227 55%,#fff3c4)',
              boxShadow: '0 0 18px rgba(201,162,39,.6)',
            }}
          />
          <div className="txt-court absolute inset-0 flex items-center justify-center text-[0.95vw] text-white/90 drop-shadow-[0_2px_2px_rgba(0,0,0,.95)]">
            인용 {meta.cleared} / {meta.totalGames}
            {remain > 0 && ` · 다음 단계까지 ${remain}${meta.unit}`}
          </div>
        </div>

        {meta.demandStanding > 0 && (
          <div className="txt-court shrink-0 text-[1vw] text-reject-lt">
            확정 징역 {meta.demandStanding}년
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 1회성 연출
// ══════════════════════════════════════════════════════════════

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
            className="flex h-[52px] w-[104px] items-center justify-center rounded-[2px] border-2 border-[#6d4f06] text-[13px] font-black text-[#4a3405]"
            style={{
              background: 'linear-gradient(150deg,#fff3c4,#ffd97a 40%,#c9a227 100%)',
              boxShadow: '0 3px 10px rgba(0,0,0,.55), inset 0 0 0 3px rgba(255,255,255,.35)',
            }}
          >
            ₩
          </div>
        </div>
      ))}
    </div>
  )
}

function StampOverlay({ text, tone, onDone }: { text: string; tone?: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1700)
    return () => clearTimeout(t)
  }, [onDone])
  const cls =
    tone === 'gold'
      ? 'stamp stamp-gold'
      : tone === 'blue'
        ? 'stamp stamp-blue'
        : tone === 'grant'
          ? 'stamp stamp-grant'
          : 'stamp'
  return (
    <div className="pointer-events-none fixed inset-0 z-[97] flex items-center justify-center">
      <div className={`${cls} anim-stamp text-[13vw] leading-none`}>{text}</div>
    </div>
  )
}

/** 인용 선고 */
function GrantOverlay({
  amount,
  title,
  subtitle,
  total,
  unit,
  step,
  onDone,
}: {
  amount?: number
  title?: string
  subtitle?: string
  total?: number
  unit?: string
  step?: number
  onDone: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[96] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="anim-spin-slow absolute h-[190vh] w-[190vh] opacity-[0.16]">
        <div
          className="h-full w-full"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, #c9a227 0deg 8deg, transparent 8deg 18deg)',
          }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.3, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 13 }}
      >
        <Gavel size="12vw" strike />
        <div className="txt-head txt-glow-grant anim-thump -mt-[1vh] text-[8vw] leading-none">
          인 용
        </div>
        {title && (
          <div className="txt-court mt-1 text-[2.2vw] text-brass-300">
            {title}
            {subtitle && ` · ${subtitle}`}
          </div>
        )}
        {!!step && (
          <div className="txt-court mt-1 text-[1.6vw] text-white/75">
            적립금 {step}단계 도달
          </div>
        )}
        {typeof total === 'number' && (
          <div className="txt-num txt-gold mt-2 text-[9vw] leading-none">
            {total.toLocaleString('ko-KR')}
            <span className="text-[3.5vw]">{unit || ''}</span>
          </div>
        )}
        {!!amount && amount > 0 && (
          <div className="txt-num mt-1 text-[2.6vw] leading-none text-grant-lt">
            ▲ +{amount.toLocaleString('ko-KR')}
            {unit || ''}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/** 기각 선고 — 붉은 섬광 + 피고인 오열 */
function RejectFlash({ cry, onDone }: { cry?: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, cry ? 2600 : 1500)
    return () => clearTimeout(t)
  }, [onDone, cry])
  return (
    <div className="pointer-events-none fixed inset-0 z-[94] flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.2, 0.55, 0.25] }}
        transition={{ duration: 1.4, times: [0, 0.1, 0.3, 0.5, 1] }}
        style={{ background: 'radial-gradient(circle, rgba(192,57,43,.4), rgba(60,6,6,.94))' }}
      />
      {cry && (
        <motion.img
          src={cry}
          alt=""
          className="relative"
          style={{ width: '46vh', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,.85))' }}
          initial={{ scale: 0.2, opacity: 0, rotate: -12 }}
          animate={{
            scale: [0.2, 1.15, 1, 1, 0.9],
            opacity: [0, 1, 1, 1, 0],
            rotate: [-12, 4, -4, 3, 0],
            y: [60, 0, 0, 0, 30],
          }}
          transition={{ duration: 2.5, times: [0, 0.18, 0.35, 0.75, 1] }}
        />
      )}
    </div>
  )
}

function HeartBurst({ onDone }: { onDone: () => void }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        i,
        x: (Math.random() - 0.5) * 120,
        y: -30 - Math.random() * 90,
        d: Math.random() * 0.5,
        s: 0.5 + Math.random() * 1.4,
        e: ['💖', '💗', '💕', '❤️', '💘', '✨'][i % 6],
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
  const label = n > 0 ? String(n) : '진술!'
  return (
    <div className="pointer-events-none fixed inset-0 z-[97] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <div
        key={label}
        className={`anim-count txt-head relative ${n > 0 ? 'txt-glow-reject' : 'txt-glow-gold'} text-[22vw] leading-none`}
      >
        {label}
      </div>
    </div>
  )
}

export function FxLayer({ fx, cry }: { fx: Fx | null; cry?: string }) {
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
            return <CashRain key={f._id} onDone={() => drop(f._id)} />
          case 'stamp':
            return (
              <StampOverlay key={f._id} text={f.text || ''} tone={f.tone} onDone={() => drop(f._id)} />
            )
          case 'clear':
            return (
              <GrantOverlay
                key={f._id}
                amount={f.amount}
                title={f.title}
                subtitle={(f as any).subtitle}
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
            return <RejectFlash key={f._id} cry={cry} onDone={() => drop(f._id)} />
          default:
            return null
        }
      })}
    </AnimatePresence>
  )
}

// ══════════════════════════════════════════════════════════════
// 소품
// ══════════════════════════════════════════════════════════════

export function PhotoBox({
  src,
  label = '사진',
  className = '',
  style,
  fit = 'cover',
}: {
  src?: string
  label?: string
  className?: string
  style?: React.CSSProperties
  fit?: 'cover' | 'contain'
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
        style={style}
        draggable={false}
      />
    )
  }
  return (
    <div
      className={`flex flex-col items-center justify-center border-4 border-dashed border-brass/35 bg-black/50 ${className}`}
      style={style}
    >
      <div className="text-[3vw] opacity-40">👤</div>
      <div className="txt-court mt-1 text-[1vw] tracking-widest text-brass/60">{label}</div>
    </div>
  )
}
