import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { Grunge, PoliceTape, NewsTicker, PhotoBox } from '../fx'
import type { Config } from '../types'

// ══════════════════════════════════════════════════════════════
// 소품 — 경찰차 경광등 / 경찰 마크
// ══════════════════════════════════════════════════════════════

/** 경찰차 실루엣 + 경광등 (좌: 빨강 / 우: 파랑) */
function PoliceCar({ side }: { side: 'left' | 'right' }) {
  const red = side === 'left'
  const c1 = red ? '#ff3b30' : '#3d7bff'
  const c2 = red ? '#e10600' : '#0047ff'
  return (
    <div
      className={`pointer-events-none absolute bottom-[6vh] ${
        side === 'left' ? 'left-[-3vw]' : 'right-[-3vw]'
      }`}
      style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}
    >
      {/* 광선 */}
      <div
        className={red ? 'anim-siren-r' : 'anim-siren-b'}
        style={{
          position: 'absolute',
          left: '4vw',
          bottom: '6vh',
          width: '34vw',
          height: '34vw',
          transform: 'translate(-50%,50%)',
          background: `radial-gradient(circle, ${c1}cc 0%, ${c2}55 32%, transparent 68%)`,
          filter: 'blur(26px)',
        }}
      />
      <svg width="26vw" viewBox="0 0 320 150" style={{ width: '26vw', height: 'auto' }}>
        {/* 차체 */}
        <path
          d="M18 118 L18 92 Q18 78 34 74 L74 66 L104 34 Q110 26 124 26 L214 26 Q228 26 234 34 L262 66 L296 74 Q312 78 312 92 L312 118 Z"
          fill="#12161a"
          stroke="#000"
          strokeWidth="4"
        />
        {/* 창문 */}
        <path d="M116 40 L206 40 L232 66 L96 66 Z" fill="#2b3339" stroke="#000" strokeWidth="3" />
        {/* 도어 라인 */}
        <path d="M164 66 L164 118" stroke="#000" strokeWidth="3" />
        {/* 경광등 바 */}
        <rect x="126" y="8" width="68" height="20" rx="5" fill="#0d1013" stroke="#000" strokeWidth="3" />
        <rect x="131" y="12" width="26" height="12" rx="3" fill={c2}>
          <animate attributeName="opacity" values="1;0.12;1" dur="0.72s" repeatCount="indefinite" />
        </rect>
        <rect x="163" y="12" width="26" height="12" rx="3" fill={c1}>
          <animate
            attributeName="opacity"
            values="0.12;1;0.12"
            dur="0.72s"
            repeatCount="indefinite"
          />
        </rect>
        {/* 바퀴 */}
        <circle cx="82" cy="118" r="26" fill="#0a0a0a" stroke="#000" strokeWidth="4" />
        <circle cx="82" cy="118" r="11" fill="#4a5158" />
        <circle cx="246" cy="118" r="26" fill="#0a0a0a" stroke="#000" strokeWidth="4" />
        <circle cx="246" cy="118" r="11" fill="#4a5158" />
        {/* 옆면 POLICE */}
        <text
          x="196"
          y="100"
          fill="#e8edf2"
          fontSize="20"
          fontWeight="900"
          fontFamily="sans-serif"
          letterSpacing="2"
        >
          POLICE
        </text>
      </svg>
    </div>
  )
}

/** 경찰 마크(금장 배지) */
function PoliceBadge() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -40 }}
      animate={{ scale: 1, rotate: -8 }}
      transition={{ delay: 0.7, type: 'spring', stiffness: 180, damping: 12 }}
      className="pointer-events-none absolute bottom-[7vh] right-[4vw]"
    >
      <div className="anim-bob relative">
        <svg width="11vw" viewBox="0 0 200 200" style={{ width: '11vw', height: 'auto' }}>
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3c4" />
              <stop offset="35%" stopColor="#ffc72c" />
              <stop offset="65%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#8a6508" />
            </linearGradient>
          </defs>
          {/* 월계관 */}
          <circle cx="100" cy="100" r="88" fill="#0d0d0d" stroke="url(#gold)" strokeWidth="7" />
          <circle cx="100" cy="100" r="74" fill="none" stroke="url(#gold)" strokeWidth="3" />
          {/* 별 */}
          <path
            d="M100 34 L116 80 L165 80 L126 108 L141 154 L100 126 L59 154 L74 108 L35 80 L84 80 Z"
            fill="url(#gold)"
            stroke="#5a4408"
            strokeWidth="3"
          />
          <text
            x="100"
            y="112"
            textAnchor="middle"
            fill="#3a2b05"
            fontSize="30"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            경찰
          </text>
        </svg>
        <div
          className="txt-head absolute -bottom-[1.2vh] left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.85vw]"
          style={{ color: '#ffc72c' }}
        >
          총각수사대
        </div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
// D-DAY
// ══════════════════════════════════════════════════════════════

function calc(target: string) {
  const t = new Date(target + 'T11:00:00+09:00').getTime()
  const diff = t - Date.now()
  return {
    d: Math.max(0, Math.floor(diff / 86400000)),
    h: Math.max(0, Math.floor((diff % 86400000) / 3600000)),
    m: Math.max(0, Math.floor((diff % 3600000) / 60000)),
    s: Math.max(0, Math.floor((diff % 60000) / 1000)),
  }
}

function Qr({ size = 100 }: { size?: number }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    QRCode.toDataURL(location.origin, {
      width: size * 3,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setUrl)
      .catch(() => {})
  }, [size])
  if (!url) return null
  return (
    <div className="flex flex-col items-center gap-[0.3vh]">
      <div className="rounded border-[3px] border-black bg-white p-[3px] shadow-[0_0_18px_rgba(255,212,0,.55)]">
        <img src={url} alt="접속 QR" style={{ width: size, height: size }} />
      </div>
      <div className="txt-head text-[0.75vw] tracking-widest text-tape">📱 폰으로 스캔</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════

export default function Intro({ config }: { config: Config }) {
  const [dd, setDd] = useState(() => calc(config.party.weddingDate))
  useEffect(() => {
    const id = setInterval(() => setDd(calc(config.party.weddingDate)), 1000)
    return () => clearInterval(id)
  }, [config.party.weddingDate])

  return (
    <div className="tv-root tex-noise">
      <Grunge />

      {/* 경찰차 (좌: 빨강 / 우: 파랑) */}
      <PoliceCar side="left" />
      <PoliceCar side="right" />

      {/* 폴리스라인 테이프 — 우상단, 좌하단 대각선 */}
      <PoliceTape
        className="left-[-10%] top-[8vh] w-[130%]"
        rotate={-8}
        height={52}
        text="POLICE LINE DO NOT CROSS ★ 총각 신분 종료 ★ "
      />
      <PoliceTape
        className="left-[-10%] bottom-[13vh] w-[130%]"
        rotate={6}
        height={44}
        speed="fast"
        text="★ 마지막 자유를 즐겨라 ★ POLICE LINE DO NOT CROSS ★ "
      />

      <PoliceBadge />

      {/* ── 본문 ── */}
      <div className="relative z-20 flex h-full flex-col items-center pt-[1.5vh]">
        {/* 긴급 속보 배지 */}
        <motion.div
          initial={{ y: -120, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 13 }}
          className="anim-shake-loop relative flex items-center gap-[0.9vw] rounded-md border-[5px] border-black px-[2vw] py-[0.5vh]"
          style={{
            background: 'linear-gradient(180deg,#ff4437,#e10600 55%,#8f0400)',
            boxShadow: '0 7px 0 rgba(0,0,0,.6), 0 12px 30px rgba(225,6,0,.6)',
          }}
        >
          <span className="anim-blink-fast text-[2.2vw] leading-none">🚨</span>
          <span className="txt-head text-[2.7vw] leading-none tracking-wide text-white drop-shadow-[0_3px_0_rgba(0,0,0,.75)]">
            긴급 속보
          </span>
          <span className="anim-blink-fast text-[2.2vw] leading-none">🚨</span>
        </motion.div>

        {/* 헤드라인 */}
        <motion.h1
          initial={{ scale: 2.2, opacity: 0, filter: 'blur(14px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: [0.2, 1.2, 0.3, 1] }}
          className="txt-head txt-outline mt-[1.2vh] text-center text-[6.2vw] leading-[0.95] text-white"
          style={{ textShadow: '0 6px 0 #000, 0 10px 26px rgba(0,0,0,.9)' }}
        >
          드디어 한 명{' '}
          <span className="txt-glow-red anim-thump inline-block">잡혀갑니다.</span>
        </motion.h1>

        {/* 사진 (점선 프레임) */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 15 }}
          className="relative mt-[1.5vh]"
        >
          <div className="absolute -inset-4 rounded bg-siren-red/25 blur-2xl" />
          <div
            className="relative flex items-center justify-center border-[4px] border-dashed border-white/45"
            style={{
              width: '38vw',
              height: '30vh',
              background: 'rgba(210,210,210,.14)',
              boxShadow: '0 0 0 6px rgba(0,0,0,.65), 0 18px 44px rgba(0,0,0,.8)',
            }}
          >
            {config.groom.photo ? (
              <img
                src={config.groom.photo}
                alt="신랑"
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="txt-head text-[2vw] tracking-widest text-white/70">신랑 사진</div>
            )}
          </div>
          {/* 조준 마커 */}
          {[
            'left-[-12px] top-[-12px] border-l-[7px] border-t-[7px]',
            'right-[-12px] top-[-12px] border-r-[7px] border-t-[7px]',
            'left-[-12px] bottom-[-12px] border-l-[7px] border-b-[7px]',
            'right-[-12px] bottom-[-12px] border-r-[7px] border-b-[7px]',
          ].map((c, i) => (
            <div key={i} className={`anim-blink absolute h-8 w-8 border-siren-red ${c}`} />
          ))}
        </motion.div>

        {/* 자유 종료 + D-DAY */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-[1.5vh] flex flex-col items-center"
        >
          <div className="txt-head text-[1.6vw] text-white/90">이제 자유는 끝났다!</div>
          <div className="txt-head mt-[0.2vh] flex items-baseline gap-[0.6vw] text-[2.6vw] text-white">
            총각 신분 종료까지
            <span className="txt-glow-red txt-num anim-blink text-[3.4vw]">
              D-{dd.d}
            </span>
          </div>
          <div className="txt-num mt-[0.2vh] text-[1.5vw] tracking-widest text-tape">
            {String(dd.h).padStart(2, '0')} : {String(dd.m).padStart(2, '0')} :{' '}
            {String(dd.s).padStart(2, '0')}
          </div>
        </motion.div>

        {/* 총각파티 강제 출동 박스 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 14 }}
          className="mt-[1.5vh] border-[5px] border-black bg-black/80 px-[2.5vw] py-[0.7vh] text-center"
          style={{ boxShadow: '0 0 34px rgba(225,6,0,.55), 0 8px 0 rgba(0,0,0,.5)' }}
        >
          <div className="txt-head text-[1.8vw] leading-tight text-white">
            마지막 자유를 즐기러
          </div>
          <div className="txt-head txt-glow-red text-[2.7vw] leading-none">
            ★ 총각파티 강제 출동! ★
          </div>
        </motion.div>
      </div>

      {/* 좌하단 QR */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-[7vh] left-[3vw] z-30"
      >
        <Qr size={96} />
      </motion.div>

      {/* 하단 속보 자막 */}
      <div className="absolute bottom-0 left-0 z-30 w-full">
        <NewsTicker
          label="속보"
          items={[
            `${config.groom.name}, ${config.party.weddingDate.replace(/-/g, '.')} 무기징역 확정`,
            '검찰 "본인이 자백했다"',
            `공범 ${config.bride.name} 씨는 불구속 입건`,
            '친구 일동 "우리는 말렸다"',
            '보석금 모금 진행 중 — 교화 프로그램 성공 시 감형',
          ]}
        />
      </div>
    </div>
  )
}
