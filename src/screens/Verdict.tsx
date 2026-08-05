import { motion } from 'framer-motion'
import { RollingNumber, CourtEmblem } from '../fx'
import type { AppState, Config, GameConfig } from '../types'

/**
 * 판결문 — 실제 인쇄 판결문 양식을 그대로 재현한다.
 * 흰 종이 + 굵은 고딕, 장식은 최소화.
 */
export default function Verdict({ state, config, print }: { state: AppState; config: Config; print?: boolean }) {
  const m = state.meta
  const earned = state.prize.earned
  const mains = config.games.filter((g) => !g.bonus)
  const ladder = config.prize.ladder

  // 각 공소사실이 인용될 때 오르는 금액 (사다리 증분)
  const step = (i: number) => (ladder[i] ?? 0) - (i > 0 ? (ladder[i - 1] ?? 0) : 0)

  const rows: { charge: string; amount: string; accepted: 'grant' | 'reject' | 'none' }[] = [
    ...mains.map((gc: GameConfig, i) => {
      const g = state.games[gc.id]
      return {
        charge: gc.charge || gc.title,
        amount: `${step(i)}${m.unit}`,
        accepted: g?.cleared ? ('grant' as const) : g?.failed ? ('reject' as const) : ('none' as const),
      }
    }),
    ...(config.court.extraCharges || []).map((c) => ({
      charge: c,
      amount: '—',
      accepted: 'none' as const,
    })),
  ]

  return (
    <div
      className="tv-root flex items-center justify-center"
      style={{ background: print ? '#fff' : 'radial-gradient(ellipse at center,#2a1a08,#150b05 55%,#000)' }}
    >
      {!print && (
        <div className="anim-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[230vh] w-[230vh] -translate-x-1/2 -translate-y-1/2 opacity-[0.1]">
          <div
            className="h-full w-full"
            style={{
              background:
                'repeating-conic-gradient(from 0deg,#c9a227 0deg 7deg,transparent 7deg 18deg)',
            }}
          />
        </div>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 17 }}
        className="relative flex flex-col items-center bg-white px-[4vw] py-[2vh]"
        style={{
          width: '78vw',
          height: '94vh',
          color: '#111',
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: '0 26px 80px rgba(0,0,0,.9)',
        }}
      >
        {/* 머리 */}
        <CourtEmblem size="6.4vh" />
        <div className="mt-[0.3vh] text-center" style={{ fontWeight: 900 }}>
          <div className="text-[2.5vw] leading-tight">{config.court.name || '모시래 지방법원'}</div>
          <div className="text-[2.2vw] leading-tight tracking-[0.5em]">판 결</div>
          <div className="text-[1.35vw] leading-tight">
            [사건번호: {config.court.caseNo}
            {config.court.caseName ? ` / ${config.court.caseName}` : ''}]
          </div>
        </div>

        <div className="mt-[1.2vh] text-[2.4vw]" style={{ fontWeight: 900, letterSpacing: '0.1em' }}>
          피 고 인 : &nbsp;{config.defendant.name}
        </div>

        {/* 혐의 표 */}
        <div className="mt-[1.4vh] w-full px-[3vw]">
          <div
            className="grid items-end pb-[0.5vh] text-[1.35vw]"
            style={{ gridTemplateColumns: '1.7fr 1fr 0.6fr', fontWeight: 900 }}
          >
            <div>혐 의 (죄 목)</div>
            <div className="text-center">이행 금액</div>
            <div className="text-center">수용여부</div>
          </div>

          {rows.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.09 }}
              className="grid items-center py-[0.42vh] text-[1.45vw]"
              style={{ gridTemplateColumns: '1.7fr 1fr 0.6fr', fontWeight: 700 }}
            >
              <div className="truncate">{r.charge}</div>

              <div className="flex items-baseline justify-center gap-[0.4vw]">
                <span style={{ fontWeight: 900 }}>₩</span>
                <span
                  className="inline-block text-center"
                  style={{
                    minWidth: '7vw',
                    borderBottom: '2px solid #111',
                    fontWeight: 900,
                    color: r.accepted === 'grant' ? '#0b7a3b' : '#111',
                  }}
                >
                  {r.accepted === 'grant' ? r.amount : r.accepted === 'reject' ? '0' : ''}
                </span>
              </div>

              <div className="text-center" style={{ fontWeight: 900 }}>
                [
                <span
                  className="inline-block text-center"
                  style={{
                    minWidth: '3.2vw',
                    color:
                      r.accepted === 'grant' ? '#0b7a3b' : r.accepted === 'reject' ? '#c0392b' : '#111',
                  }}
                >
                  {r.accepted === 'grant' ? '인용' : r.accepted === 'reject' ? '기각' : ''}
                </span>
                ]
              </div>
            </motion.div>
          ))}
        </div>

        {/* 주문 */}
        <div className="mt-[1.4vh] w-full px-[3vw] text-center">
          <div className="text-[1.9vw]" style={{ fontWeight: 900, letterSpacing: '0.35em' }}>
            【 주 &nbsp;&nbsp;문 】
          </div>
          <div className="mt-[0.4vh] text-[1.5vw] leading-snug" style={{ fontWeight: 800 }}>
            "피고인 {config.defendant.name}은 상기 상당부분의 혐의에 대한 유죄가 인정된다.
            <br />
            이에 따라{' '}
            <span style={{ color: '#f2705e' }}>'무기징역급의 행복한 결혼생활'</span>과
            <br />
            최종집행이행금 상당의 물품을 룸메들로부터 수령받을 것을 명한다."
          </div>
        </div>

        {/* 최종 금액 */}
        <div className="mt-[1.2vh] flex flex-col items-center">
          <div className="text-[1.8vw]" style={{ fontWeight: 900, letterSpacing: '0.3em' }}>
            【최 종 집 행 이 행 금 】
          </div>
          <div className="mt-[0.3vh] flex items-center gap-[1vw]">
            <span className="text-[3.4vw]" style={{ fontWeight: 300, color: '#111' }}>
              |
            </span>
            <span className="text-[3.4vw]" style={{ fontWeight: 900 }}>
              ₩
            </span>
            <motion.span
              className="txt-num text-[6.4vw] leading-none"
              style={{ fontWeight: 900, minWidth: '12vw', textAlign: 'center' }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <RollingNumber value={earned} duration={2200} />
            </motion.span>
            <span className="text-[2.2vw]" style={{ fontWeight: 900 }}>
              {m.unit}
            </span>
            <span className="text-[3.4vw]" style={{ fontWeight: 300 }}>
              |
            </span>
          </div>
          <div className="text-[1.05vw]" style={{ color: '#666', fontWeight: 700 }}>
            인용 {m.cleared} / {m.totalGames}건 · 최대 {m.maxTotal}
            {m.unit}
          </div>
        </div>

        {/* 서명 */}
        <div className="mt-auto w-full px-[5vw] pb-[0.5vh]">
          <div className="flex items-baseline gap-[1.2vw] text-[1.6vw]" style={{ fontWeight: 900 }}>
            <span style={{ letterSpacing: '0.2em' }}>재 판 장 :</span>
            <span className="text-[1.9vw]" style={{ letterSpacing: '0.35em' }}>
              {config.court.judge}
            </span>
          </div>
          <div className="mt-[0.3vh] flex items-baseline gap-[1.2vw] text-[1.6vw]" style={{ fontWeight: 900 }}>
            <span style={{ letterSpacing: '0.2em' }}>담당검사 :</span>
            <span className="flex-1 text-[1.5vw] leading-snug">
              {config.prosecutors.map((p) => p.name).join(' ')}
            </span>
          </div>
        </div>

        {/* 직인 */}
        <motion.div
          initial={{ scale: 3.4, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 0.88, rotate: -13 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 200, damping: 12 }}
          className="absolute bottom-[3vh] right-[5vw] flex items-center justify-center rounded-md border-[6px] border-[#c0392b]"
          style={{ width: '8vw', height: '8vw', color: '#c0392b' }}
        >
          <div className="text-center text-[1.4vw] leading-tight" style={{ fontWeight: 900 }}>
            모시래
            <br />
            지방법원
            <br />
            직인
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
