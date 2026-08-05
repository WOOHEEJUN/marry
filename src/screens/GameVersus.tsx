import { motion } from 'framer-motion'
import CourtFrame from './CourtFrame'
import { PhotoBox, RollingNumber } from '../fx'
import type { AppState, Config, GameConfig, VersusState } from '../types'

/** 대결형 — 피고인 vs 검사단 (탁구공 빙고 / 코끼리코 점수 등) */
export default function GameVersus({
  state,
  config,
  gc,
}: {
  state: AppState
  config: Config
  gc: GameConfig
}) {
  const g = state.games[gc.id] as VersusState
  if (!g) return null

  const points = gc.scoring === 'points'
  const unit = gc.tallyUnit || '점'
  const mine = points ? g.mine.reduce((a, b) => a + (b || 0), 0) : g.results.filter((r) => r === 'win').length
  const theirs = points
    ? g.theirs.reduce((a, b) => a + (b || 0), 0)
    : g.results.filter((r) => r === 'lose').length
  const leading = mine === theirs ? 'tie' : mine > theirs ? 'mine' : 'theirs'

  const Side = ({
    side,
    name,
    score,
    photo,
  }: {
    side: 'mine' | 'theirs'
    name: string
    score: number
    photo?: string
  }) => {
    const on = leading === side
    return (
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: side === 'mine' ? 0.1 : 0.2 }}
        className="panel tex-wood flex flex-1 flex-col items-center px-[1.5vw] py-[1.2vh]"
        style={{
          borderColor: on ? '#c9a227' : '#170c04',
          boxShadow: on ? '0 0 0 3px rgba(201,162,39,.35), 0 0 40px rgba(201,162,39,.5)' : undefined,
        }}
      >
        <div className="frame-gold" style={{ width: '11vw', height: '16vh' }}>
          <PhotoBox src={photo} label={name} className="h-full w-full" />
        </div>
        <div className="txt-head mt-[0.6vh] text-[1.8vw] leading-none text-brass-100">{name}</div>
        <div className="txt-num txt-gold mt-[0.3vh] text-[6vw] leading-none">
          <RollingNumber value={score} />
          {points && <span className="ml-1 text-[2vw]">{unit}</span>}
        </div>
      </motion.div>
    )
  }

  return (
    <CourtFrame state={state} config={config} gc={gc} g={g} compactHead>
      <div className="flex w-full items-stretch gap-[2vw] px-[3vw]">
        <Side side="mine" name={config.defendant.name} score={mine} photo={config.defendant.photo} />

        <div className="flex shrink-0 flex-col items-center justify-center">
          <div className="txt-head txt-glow-reject anim-thump text-[4vw] leading-none">VS</div>
          <div className="txt-court mt-[0.5vh] text-[1vw] text-white/45">
            {points ? '합산 점수' : '승수'}
          </div>
        </div>

        <Side side="theirs" name="검사단" score={theirs} />
      </div>

      {/* 라운드 표시 */}
      <div className="mt-[2vh] flex items-end gap-[0.9vw]">
        {g.results.map((r, i) => {
          const now = i === g.round && !g.cleared && !g.failed
          return (
            <div key={i} className="flex flex-col items-center gap-[0.3vh]">
              {points ? (
                <div
                  className={`panel flex items-center justify-center ${now ? 'anim-blink' : ''}`}
                  style={{
                    width: '7vw',
                    height: '5.5vh',
                    borderColor: now ? '#c9a227' : '#170c04',
                    background:
                      r === 'pending'
                        ? 'linear-gradient(180deg,#241409,#0d0703)'
                        : 'linear-gradient(180deg,#3a2604,#150b05)',
                  }}
                >
                  {r === 'pending' ? (
                    <span className="txt-court text-[1.4vw] text-white/15">-</span>
                  ) : (
                    <span className="txt-num text-[1.7vw] leading-none">
                      <span className="text-brass-300">{g.mine[i]}</span>
                      <span className="text-white/30"> : </span>
                      <span className="text-white/70">{g.theirs[i]}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className={`panel flex items-center justify-center ${now ? 'anim-blink' : ''}`}
                  style={{
                    width: '7vw',
                    height: '5.5vh',
                    borderColor: now ? '#c9a227' : '#170c04',
                    background:
                      r === 'win'
                        ? 'linear-gradient(180deg,#1f9d55,#06371c)'
                        : r === 'lose'
                          ? 'linear-gradient(180deg,#c0392b,#4a0d08)'
                          : 'linear-gradient(180deg,#241409,#0d0703)',
                  }}
                >
                  <span
                    className="txt-court text-[1.2vw]"
                    style={{
                      color: r === 'pending' ? 'rgba(255,255,255,.25)' : '#fff',
                    }}
                  >
                    {r === 'win' ? '피고인' : r === 'lose' ? '검사단' : '대기'}
                  </span>
                </div>
              )}
              <span className="txt-court text-[0.85vw] text-white/40">{i + 1}회</span>
            </div>
          )
        })}
      </div>
    </CourtFrame>
  )
}
