import { motion } from 'framer-motion'
import { RollingNumber, PhotoBox } from '../fx'
import type { AppState, Config } from '../types'

export default function Certificate({ state, config }: { state: AppState; config: Config }) {
  const earned = state.prize.earned
  const total = config.prize.totalPool
  const pct = total > 0 ? Math.min(100, (earned / total) * 100) : 0

  const wins = Object.values(state.games).reduce(
    (a, g) => a + g.results.filter((r) => r === 'win').length,
    0
  )
  const cleared = Object.values(state.games).filter((g) => g.cleared).length

  return (
    <div
      className="tv-root flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at center, #2a2210 0%, #120e05 55%, #000 100%)',
      }}
    >
      {/* 회전 광선 */}
      <div className="anim-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[240vh] w-[240vh] -translate-x-1/2 -translate-y-1/2 opacity-[0.13]">
        <div
          className="h-full w-full"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, #ffc72c 0deg 7deg, transparent 7deg 18deg)',
          }}
        />
      </div>

      {/* 반짝이 */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute text-[1.6vw]"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.3, 0.4] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
        >
          ✨
        </motion.div>
      ))}

      {/* 증서 */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotateX: 30 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        className="relative flex flex-col items-center px-[5vw] py-[3vh]"
        style={{
          width: '76vw',
          height: '88vh',
          background: 'linear-gradient(170deg,#fffdf3,#f7eed2 55%,#efe2bd)',
          border: '14px solid transparent',
          borderImage:
            'linear-gradient(140deg,#fff3c4,#ffc72c 25%,#8a6508 50%,#ffe08a 75%,#b8860b) 1',
          boxShadow: '0 30px 90px rgba(0,0,0,.85), 0 0 80px rgba(255,199,44,.35)',
        }}
      >
        {/* 내부 금테 */}
        <div className="pointer-events-none absolute inset-[10px] border-[3px] border-[#b8860b]/55" />
        <div className="pointer-events-none absolute inset-[18px] border-[1px] border-[#b8860b]/35" />

        {/* 워터마크 */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]"
          style={{ fontSize: '22vw' }}
        >
          ⚖️
        </div>

        <div
          className="txt-head text-[1.3vw] tracking-[0.5em] text-[#8a6508]"
          style={{ fontFamily: 'var(--font-cert)' }}
        >
          교 정 본 부
        </div>

        <h1
          className="mt-[0.5vh] text-[6vw] leading-none text-[#3a2b05]"
          style={{ fontFamily: 'var(--font-cert)', fontWeight: 800, letterSpacing: '0.1em' }}
        >
          출 소 증 명 서
        </h1>
        <div className="txt-num mt-[0.3vh] text-[1.3vw] tracking-[0.3em] text-[#8a6508]">
          CERTIFICATE OF RELEASE · {config.groom.prisonNo}
        </div>

        <div className="mt-[1.5vh] flex w-full items-center justify-center gap-[3vw]">
          <PhotoBox
            src={config.groom.photo}
            label="신랑"
            className="rounded-sm border-[5px] border-[#8a6508]"
            style={{ width: '14vw', height: '20vh' }}
          />
          <div className="text-center">
            <div
              className="text-[2vw] text-[#5a4408]"
              style={{ fontFamily: 'var(--font-cert)', fontWeight: 700 }}
            >
              위 사람은 아래와 같이
            </div>
            <div
              className="text-[3.4vw] leading-tight text-[#3a2b05]"
              style={{ fontFamily: 'var(--font-cert)', fontWeight: 800 }}
            >
              모든 교화 프로그램을 마치고
              <br />
              보석금을 확보하였으므로
            </div>
            <div className="txt-head mt-[0.5vh] text-[2.6vw] text-[#a30000]">
              이에 출소를 증명함.
            </div>
          </div>
        </div>

        {/* 최종 금액 */}
        <div className="mt-[2vh] flex w-full flex-col items-center">
          <div className="txt-head text-[1.6vw] tracking-[0.35em] text-[#8a6508]">
            최 종 확 보 보 석 금
          </div>
          <div className="relative mt-[0.3vh]">
            <div className="absolute -inset-4 rounded-full bg-[#ffc72c]/35 blur-2xl" />
            <div
              className="txt-num relative text-[10vw] leading-none"
              style={{
                background:
                  'linear-gradient(180deg,#8a6508,#b8860b 30%,#ffc72c 55%,#8a6508 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 3px 0 rgba(255,255,255,.7))',
              }}
            >
              <RollingNumber value={earned} duration={2200} />
              <span className="text-[4vw]">{config.prize.currency}</span>
            </div>
          </div>
          <div className="txt-head mt-[0.3vh] text-[1.3vw] text-[#5a4408]">
            총 목표 {total.toLocaleString('ko-KR')}
            {config.prize.currency} 중 {pct.toFixed(1)}% 확보 · 성공 {wins}회 · 집행 클리어{' '}
            {cleared}건
          </div>
        </div>

        {/* 하단 서명 */}
        <div className="mt-auto flex w-full items-end justify-between">
          <div
            className="text-[1.5vw] text-[#5a4408]"
            style={{ fontFamily: 'var(--font-cert)', fontWeight: 700 }}
          >
            {config.party.weddingDate.replace(/-/g, '. ')}
            <div className="text-[1.1vw] opacity-70">혼인 집행일</div>
          </div>

          <div className="flex items-center gap-[1.5vw]">
            <div
              className="text-center text-[2vw] text-[#3a2b05]"
              style={{ fontFamily: 'var(--font-cert)', fontWeight: 800 }}
            >
              교정본부장 <span className="text-[2.4vw]">{config.bride.name}</span>
              <div className="text-[1vw] opacity-60">평생 감시 담당</div>
            </div>
            {/* 직인 */}
            <motion.div
              initial={{ scale: 3.5, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 0.9, rotate: -13 }}
              transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 12 }}
              className="flex items-center justify-center rounded-lg border-[6px] border-[#c0392b]"
              style={{
                width: '9vw',
                height: '9vw',
                color: '#c0392b',
                boxShadow: '0 0 0 3px rgba(192,57,43,.2)',
              }}
            >
              <div
                className="text-center text-[1.6vw] leading-tight"
                style={{ fontFamily: 'var(--font-cert)', fontWeight: 800 }}
              >
                교정
                <br />
                본부
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
