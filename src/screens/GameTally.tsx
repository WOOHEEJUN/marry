import { motion } from 'framer-motion'
import CourtFrame from './CourtFrame'
import { Plaque, RollingNumber } from '../fx'
import type { AppState, Config, GameConfig, TallyState } from '../types'

/** 합산형 — 라운드마다 숫자를 기록해 합계가 목표에 닿으면 인용 (눈 가리고 셀카 등) */
export default function GameTally({
  state,
  config,
  gc,
}: {
  state: AppState
  config: Config
  gc: GameConfig
}) {
  const g = state.games[gc.id] as TallyState
  if (!g) return null

  const unit = gc.tallyUnit || '개'
  const label = gc.tallyLabel || '기록'
  const target = gc.target ?? 0
  const total = g.values.reduce((a, b) => a + (b || 0), 0)
  const pct = target > 0 ? Math.min(100, (total / target) * 100) : 0
  const left = Math.max(0, target - total)

  return (
    <CourtFrame state={state} config={config} gc={gc} g={g}>
      {/* 합계 */}
      <div className="flex items-end gap-[2.5vw]">
        <div className="text-center">
          <div className="txt-court text-[1.2vw] tracking-[0.3em] text-brass-300">누 계</div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-brass/25 blur-2xl" />
            <div className="txt-num txt-gold relative text-[9vw] leading-none">
              <RollingNumber value={total} />
              <span className="ml-1 text-[3vw]">{unit}</span>
            </div>
          </div>
        </div>

        <div className="pb-[2vh] text-center">
          <div className="txt-court text-[2.4vw] leading-none text-white/40">/</div>
        </div>

        <div className="pb-[1vh] text-center">
          <div className="txt-court text-[1.1vw] tracking-[0.3em] text-brass-300">목 표</div>
          <div className="txt-num text-[5vw] leading-none text-white/75">
            {target}
            <span className="ml-1 text-[2vw]">{unit}</span>
          </div>
        </div>
      </div>

      {/* 진행 게이지 */}
      <div className="mt-[1.6vh] w-full px-[4vw]">
        <div
          className="relative h-[3.2vh] overflow-hidden rounded-sm border-[4px] border-[#170c04]"
          style={{ background: '#241409', boxShadow: 'inset 0 4px 12px rgba(0,0,0,.9)' }}
        >
          <div
            className="anim-sheen relative h-full overflow-hidden transition-[width] duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#6d4f06,#c9a227 60%,#fff3c4)',
              boxShadow: '0 0 22px rgba(201,162,39,.7)',
            }}
          />
          <div className="txt-court absolute inset-0 flex items-center justify-center text-[1.2vw] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,.95)]">
            {left > 0 ? `목표까지 ${left}${unit}` : '목표 달성'}
          </div>
        </div>
      </div>

      {/* 라운드별 기록 */}
      <div className="mt-[2vh] flex items-end gap-[1vw]">
        {g.values.map((v, i) => {
          const done = g.results[i] !== 'pending'
          const now = i === g.round && !g.cleared && !g.failed
          return (
            <motion.div
              key={i}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-[0.4vh]"
            >
              <div
                className={`panel flex items-center justify-center ${now ? 'anim-blink' : ''}`}
                style={{
                  width: '8vw',
                  height: '8vw',
                  borderColor: done ? '#c9a227' : now ? '#c9a227' : '#170c04',
                  background: done
                    ? 'linear-gradient(180deg,#3a2604,#150b05)'
                    : 'linear-gradient(180deg,#241409,#0d0703)',
                  boxShadow: done
                    ? '0 0 0 3px rgba(201,162,39,.3), 0 0 34px rgba(201,162,39,.5)'
                    : 'inset 0 6px 20px rgba(0,0,0,.95)',
                }}
              >
                {done ? (
                  <span className="txt-num txt-glow-gold text-[4.4vw] leading-none">{v}</span>
                ) : (
                  <span className="txt-court text-[3.4vw] leading-none text-white/10">?</span>
                )}
              </div>
              <span className="txt-court text-[1vw] text-white/50">{i + 1}회차</span>
            </motion.div>
          )
        })}
      </div>

      <div className="txt-court mt-[1.4vh] text-[1.5vw] text-white/60">{label}</div>
    </CourtFrame>
  )
}
