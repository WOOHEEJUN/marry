import { motion, AnimatePresence } from 'framer-motion'
import CourtFrame from './CourtFrame'
import { Plaque } from '../fx'
import type { AppState, Config, DrawState, GameConfig } from '../types'

/** 제비뽑기 노역 — 미확보 적립금을 미션 수행으로 충당한다 */
export default function GameDraw({
  state,
  config,
  gc,
}: {
  state: AppState
  config: Config
  gc: GameConfig
}) {
  const g = state.games[gc.id] as DrawState
  if (!g) return null

  const missions = gc.missions || []
  const m = state.meta
  const done = g.results.filter((r) => r !== 'pending').length

  return (
    <CourtFrame state={state} config={config} gc={gc} g={g} compactHead>
      {/* 부족분 */}
      <div className="mb-[1.4vh] flex items-center gap-[1.2vw]">
        <Plaque className="px-[1.4vw] py-[0.35vh] text-center">
          <div className="txt-court text-[0.8vw] tracking-[0.25em] text-[#4a3405]">미확보 적립금</div>
          <div className="txt-num text-[2.2vw] leading-none text-[#2a1509]">
            {m.shortfall}
            {m.unit}
          </div>
        </Plaque>
        <div className="txt-court text-[1.3vw] text-white/65">
          노역 {done} / {missions.length} 집행
        </div>
      </div>

      {/* 뽑힌 미션 */}
      <div className="relative w-full" style={{ minHeight: '26vh' }}>
        <AnimatePresence mode="wait">
          {g.current === null ? (
            <motion.div
              key="pool"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="grid w-full gap-[1vw]"
              style={{ gridTemplateColumns: `repeat(${Math.min(missions.length, 4)}, minmax(0,1fr))` }}
            >
              {missions.map((ms, i) => {
                const used = g.drawn.includes(i)
                const won = g.results[i] === 'win'
                const lost = g.results[i] === 'lose'
                return (
                  <motion.div
                    key={i}
                    initial={{ y: 26, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="panel relative flex flex-col items-center justify-center overflow-hidden px-[0.8vw] py-[1.4vh]"
                    style={{
                      minHeight: '24vh',
                      borderColor: won ? '#1f9d55' : lost ? '#c0392b' : '#170c04',
                      background: used
                        ? 'linear-gradient(180deg,#1a0d05,#0d0703)'
                        : 'repeating-linear-gradient(45deg,#5c3319 0 14px,#3a2010 14px 28px)',
                      opacity: used ? 0.55 : 1,
                    }}
                  >
                    {!used ? (
                      <>
                        <div className="anim-bob text-[3.4vw]">🎴</div>
                        <div className="txt-court mt-[0.5vh] text-[1.5vw] text-brass-300">
                          제{i + 1}호
                        </div>
                        <div className="txt-court text-[0.95vw] text-white/40">봉인</div>
                      </>
                    ) : (
                      <>
                        <div className="txt-head text-center text-[1.5vw] leading-tight text-brass-100">
                          {ms.title}
                        </div>
                        <div
                          className={`stamp mt-[0.8vh] text-[1.6vw] ${won ? 'stamp-grant' : ''}`}
                        >
                          {won ? '완 수' : '미완수'}
                        </div>
                        {won && (
                          <div className="txt-num mt-[0.4vh] text-[1.4vw] text-grant-lt">
                            +{ms.reward ?? config.prize.bonusStep ?? 15}
                            {m.unit}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key={`drawn-${g.current}`}
              initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 190, damping: 15 }}
              className="tex-paper mx-auto flex w-[62vw] flex-col items-center rounded-sm px-[2.5vw] py-[1.8vh]"
              style={{
                border: '8px solid transparent',
                borderImage:
                  'linear-gradient(140deg,#fff3c4,#c9a227 26%,#6d4f06 52%,#ffd97a 74%,#8a6508) 1',
                boxShadow: '0 18px 50px rgba(0,0,0,.85), 0 0 60px rgba(201,162,39,.55)',
              }}
            >
              <div className="txt-court text-[1.1vw] tracking-[0.4em] text-[#8a6508]">
                노역 제{g.current + 1}호
              </div>
              <div className="txt-head mt-[0.3vh] text-center text-[3.4vw] leading-tight text-[#2a1509]">
                {g.mission?.title || ''}
              </div>
              <div className="mt-[0.8vh] h-[2px] w-[70%] bg-[#8a6508]/40" />
              <div className="txt-court mt-[0.8vh] text-center text-[1.7vw] leading-snug text-[#4a3a22]">
                {g.mission?.desc || ''}
              </div>
              <div className="txt-num mt-[1vh] text-[2.4vw] leading-none text-[#8a6508]">
                완수 시 +{g.mission?.reward ?? config.prize.bonusStep ?? 15}
                {m.unit}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {g.current === null && (
        <div className="txt-court anim-blink mt-[1.4vh] text-[2vw] text-brass-300">
          피고인이 「도전」을 외치면 추첨합니다
        </div>
      )}
    </CourtFrame>
  )
}
