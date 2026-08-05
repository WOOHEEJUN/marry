import { motion } from 'framer-motion'
import { RollingNumber, Gavel, Emblem } from '../fx'
import type { AppState, Config } from '../types'

export default function Verdict({ state, config }: { state: AppState; config: Config }) {
  const m = state.meta
  const earned = state.prize.earned
  const rejected = m.totalGames - m.cleared

  return (
    <div
      className="tv-root flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #2a1a08 0%, #150b05 55%, #000 100%)',
      }}
    >
      {/* 금빛 광선 */}
      <div className="anim-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[230vh] w-[230vh] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]">
        <div
          className="h-full w-full"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, #c9a227 0deg 7deg, transparent 7deg 18deg)',
          }}
        />
      </div>

      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute text-[1.4vw]"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
        >
          ✨
        </motion.div>
      ))}

      {/* 판결문 */}
      <motion.div
        initial={{ scale: 0.72, opacity: 0, rotateX: 26 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        className="tex-paper relative flex flex-col items-center px-[4.5vw] py-[2.4vh]"
        style={{
          width: '74vw',
          height: '90vh',
          border: '12px solid transparent',
          borderImage:
            'linear-gradient(140deg,#fff3c4,#c9a227 25%,#6d4f06 50%,#ffd97a 75%,#8a6508) 1',
          boxShadow: '0 30px 90px rgba(0,0,0,.9), 0 0 80px rgba(201,162,39,.3)',
        }}
      >
        <div className="pointer-events-none absolute inset-[9px] border-[3px] border-[#8a6508]/45" />
        <div className="pointer-events-none absolute inset-[16px] border border-[#8a6508]/30" />

        {/* 워터마크 */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045]"
          style={{ fontSize: '24vw' }}
        >
          ⚖
        </div>

        {/* 머리 */}
        <div className="flex items-center gap-[1.5vw]">
          <Emblem size="4.4vw" label="법 원" />
          <div className="text-center">
            <div className="txt-court text-[1.1vw] tracking-[0.45em] text-[#8a6508]">
              {config.court.room}
            </div>
            <h1
              className="txt-court text-[5.4vw] leading-none text-[#2a1509]"
              style={{ letterSpacing: '0.14em' }}
            >
              판 결 문
            </h1>
            <div className="txt-num mt-[0.2vh] text-[1.15vw] tracking-[0.25em] text-[#8a6508]">
              {config.court.caseNo}
            </div>
          </div>
          <Emblem size="4.4vw" label="법 원" />
        </div>

        <div className="mt-[1.4vh] h-[3px] w-full bg-[#8a6508]/45" />

        {/* 피고인 */}
        <div className="mt-[1.2vh] flex w-full items-baseline gap-[1.5vw]">
          <span className="txt-court text-[1.5vw] tracking-[0.3em] text-[#8a6508]">피 고 인</span>
          <span className="txt-court text-[2.6vw] leading-none text-[#2a1509]">
            {config.defendant.name}
          </span>
          <span className="txt-court text-[1.2vw] text-[#4a3a22]">
            ({config.defendant.job})
          </span>
        </div>

        {/* 주문 */}
        <div className="mt-[1.4vh] w-full">
          <div className="txt-court text-[1.7vw] tracking-[0.5em] text-[#8a6508]">주 문</div>
          <div className="mt-[0.6vh] space-y-[0.5vh] pl-[1.5vw]">
            <div className="txt-court text-[1.9vw] leading-snug text-[#2a1509]">
              一. 피고인의 항변 중 <b className="text-[#1f6d3c]">{m.cleared}건</b>을 인용하고,{' '}
              <b className="text-[#a3200f]">{rejected}건</b>을 기각한다.
            </div>
            <div className="txt-court text-[1.9vw] leading-snug text-[#2a1509]">
              二. 기각된 공소사실에 따라 징역{' '}
              <b className="text-[#a3200f]">{m.demandStanding}년</b>을 선고한다.
            </div>
            <div className="txt-court text-[1.9vw] leading-snug text-[#2a1509]">
              三. 피고인에게 아래 적립금을 지급함이 상당하다.
            </div>
          </div>
        </div>

        {/* 적립금 */}
        <div className="mt-[1.2vh] flex w-full flex-col items-center">
          <div className="txt-court text-[1.3vw] tracking-[0.4em] text-[#8a6508]">
            최 종 적 립 금
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-[#c9a227]/30 blur-2xl" />
            <div
              className="txt-num relative text-[9.5vw] leading-none"
              style={{
                background: 'linear-gradient(180deg,#6d4f06,#c9a227 32%,#ffd97a 56%,#6d4f06 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 3px 0 rgba(255,255,255,.65))',
              }}
            >
              <RollingNumber value={earned} duration={2200} />
              <span className="text-[3.6vw]">{m.unit}</span>
            </div>
          </div>
          <div className="txt-court text-[1.15vw] text-[#4a3a22]">
            최대 {m.maxTotal}
            {m.unit} 중 {m.maxTotal > 0 ? Math.round((earned / m.maxTotal) * 100) : 0}% 확보 ·
            총 구형 {m.demandTotal}년
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-auto flex w-full items-end justify-between">
          <div className="txt-court text-[1.4vw] text-[#4a3a22]">
            {config.court.weddingDate.replace(/-/g, '. ')}
            <div className="text-[1vw] opacity-70">선고일</div>
          </div>

          <div className="flex items-center gap-[1.4vw]">
            <div className="anim-bob">
              <Gavel size="5.5vw" />
            </div>
            <div className="txt-court text-center text-[1.8vw] text-[#2a1509]">
              재판장 <span className="text-[2.2vw]">{config.witness.name}</span>
              <div className="text-[0.95vw] opacity-60">평생 감독 담당</div>
            </div>
            <motion.div
              initial={{ scale: 3.4, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 0.9, rotate: -13 }}
              transition={{ delay: 1.3, type: 'spring', stiffness: 200, damping: 12 }}
              className="flex items-center justify-center rounded-md border-[6px] border-[#c0392b]"
              style={{ width: '8.5vw', height: '8.5vw', color: '#c0392b' }}
            >
              <div className="txt-court text-center text-[1.5vw] leading-tight">
                법원
                <br />
                직인
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
