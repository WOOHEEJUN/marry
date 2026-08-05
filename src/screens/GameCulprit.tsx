import { motion } from 'framer-motion'
import CourtFrame from './CourtFrame'
import { PhotoBox, Plaque } from '../fx'
import type { AppState, Config, CulpritState, GameConfig } from '../types'

export default function GameCulprit({
  state,
  config,
  gc,
}: {
  state: AppState
  config: Config
  gc: GameConfig
}) {
  const g = state.games[gc.id] as CulpritState
  if (!g) return null

  const ev = (gc.evidences || [])[g.round % (gc.evidences?.length || 1)]
  // 이번 라운드에 실제로 음식을 먹는 사람만 라인업에 세운다
  const people = g.participants
    ? config.prosecutors.filter((p) => g.participants!.includes(p.id))
    : config.prosecutors
  // 인원이 많으면 두 줄로 나누고 카드 높이를 줄인다
  const cols = people.length > 6 ? Math.ceil(people.length / 2) : Math.max(people.length, 1)
  const rows = Math.ceil(people.length / cols)
  const cardH = rows > 1 ? '15vh' : people.length <= 4 ? '28vh' : '24vh'

  return (
    <CourtFrame state={state} config={config} gc={gc} g={g} compactHead>
      {/* 증거물 + 라운드 */}
      <div className="mb-[1.2vh] flex items-center gap-[1.5vw]">
        {ev && (
          <motion.div
            key={g.round}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Plaque className="flex items-center gap-[0.8vw] px-[1.2vw] py-[0.35vh]">
              <span className="text-[2vw]">{ev.emoji || '🍽️'}</span>
              <div>
                <div className="txt-court text-[0.75vw] tracking-widest text-[#4a3405]">증 거 물</div>
                <div className="txt-court text-[1.35vw] leading-tight text-[#2a1509]">
                  {ev.real} <span className="text-[#a32020]">vs</span> {ev.fake}
                </div>
              </div>
            </Plaque>
          </motion.div>
        )}

        <Plaque className="px-[1vw] py-[0.3vh] text-center">
          <div className="txt-court text-[0.75vw] tracking-widest text-[#4a3405]">참여 인원</div>
          <div className="txt-num text-[1.5vw] leading-none text-[#2a1509]">{people.length}명</div>
        </Plaque>

        <div className="flex items-center gap-[0.5vw]">
          {g.results.map((r, i) => (
            <div
              key={i}
              className="panel flex h-[4vh] w-[5.5vw] items-center justify-center"
              style={{
                background:
                  r === 'win'
                    ? 'linear-gradient(180deg,#1f9d55,#06371c)'
                    : r === 'lose'
                      ? 'linear-gradient(180deg,#c0392b,#4a0d08)'
                      : i === g.round
                        ? 'linear-gradient(180deg,#3a2010,#150b05)'
                        : 'linear-gradient(180deg,#241409,#150b05)',
                borderColor: i === g.round ? '#c9a227' : '#170c04',
              }}
            >
              <span
                className={`txt-court text-[1vw] ${i === g.round && r === 'pending' ? 'anim-blink' : ''}`}
                style={{
                  color:
                    r === 'win'
                      ? '#eafff2'
                      : r === 'lose'
                        ? '#fff'
                        : i === g.round
                          ? '#ffd97a'
                          : 'rgba(255,255,255,.28)',
                }}
              >
                {i + 1}차 {r === 'win' ? '적중' : r === 'lose' ? '불발' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 검사 라인업 */}
      <div
        className="grid w-full gap-[0.9vw]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {people.map((p, i) => {
          const picked = g.picked === p.id
          const isGuilty = g.revealed && g.guilty === p.id
          const wrong = g.revealed && picked && g.guilty !== p.id
          return (
            <motion.div
              key={p.id}
              initial={{ y: 46, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 180, damping: 16 }}
              className="relative"
            >
              <div
                className="panel relative overflow-hidden transition-all duration-300"
                style={{
                  borderColor: picked && !g.revealed ? '#c9a227' : isGuilty ? '#1f9d55' : '#170c04',
                  boxShadow:
                    picked && !g.revealed
                      ? '0 0 0 4px rgba(201,162,39,.45), 0 0 44px rgba(201,162,39,.7)'
                      : isGuilty
                        ? '0 0 0 4px rgba(31,157,85,.45), 0 0 48px rgba(31,157,85,.7)'
                        : undefined,
                  background: '#241409',
                }}
              >
                <PhotoBox src={p.photo} label={p.name} className="w-full" style={{ height: cardH }} />

                <div
                  className="tex-brass border-t-[3px] border-[#170c04] py-[0.25vh] text-center"
                  style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35)' }}
                >
                  <div className="txt-court text-[1.05vw] leading-tight text-[#2a1509]">
                    {p.name}
                  </div>
                </div>

                {picked && !g.revealed && (
                  <div className="anim-reticle pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-brass/85" />
                    <div className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-brass/85" />
                    <div className="absolute left-1/2 top-1/2 h-[6vw] w-[6vw] -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-brass" />
                  </div>
                )}

                {isGuilty && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-grant/20">
                    <div className="stamp stamp-grant anim-stamp text-[2.4vw]">적 중</div>
                  </div>
                )}
                {wrong && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55">
                    <div className="stamp stamp-blue anim-stamp text-[2vw]">불 발</div>
                  </div>
                )}
              </div>

              {picked && (
                <motion.div
                  initial={{ y: -16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute -top-[3.2vh] left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <div className="anim-bob txt-court border-[3px] border-[#170c04] bg-brass px-[0.7vw] py-[0.15vh] text-[1vw] text-[#2a1509]">
                    지목
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </CourtFrame>
  )
}
