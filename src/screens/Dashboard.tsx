import { motion } from 'framer-motion'
import { Hall, Curtains, Scales, RollingNumber, PhotoBox, PrizeLadder, Plaque } from '../fx'
import type { AppState, Config, GameConfig, GameState } from '../types'

function CountCard({
  gc,
  g,
  active,
  index,
}: {
  gc: GameConfig
  g?: GameState
  active: boolean
  index: number
}) {
  const state = g?.cleared ? 'grant' : g?.failed ? 'reject' : active ? 'live' : 'wait'
  return (
    <motion.div
      initial={{ y: 26, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 * index }}
      className="panel tex-wood relative flex-1 overflow-hidden px-[0.55vw] py-[0.5vh]"
      style={{
        borderColor: state === 'grant' ? '#1f9d55' : state === 'reject' ? '#c0392b' : '#170c04',
        boxShadow:
          state === 'grant'
            ? '0 0 22px rgba(31,157,85,.55)'
            : state === 'reject'
              ? '0 0 22px rgba(192,57,43,.45)'
              : active
                ? '0 0 22px rgba(201,162,39,.6)'
                : undefined,
        outline: active ? '3px solid #c9a227' : undefined,
      }}
    >
      <div className="txt-court text-[0.72vw] tracking-widest text-brass-300">
        제{index + 1}항
      </div>
      <div className="txt-head truncate text-[1.15vw] leading-tight text-brass-100">
        {gc.charge || gc.title}
      </div>
      <div className="txt-court truncate text-[0.72vw] text-white/40">{gc.prosecutor}</div>

      <div className="mt-[0.35vh] flex items-center justify-between">
        <span className="txt-num text-[0.95vw] text-reject-lt">징역 {gc.demand ?? 0}년</span>
        <span
          className="txt-court text-[0.8vw]"
          style={{
            color:
              state === 'grant'
                ? '#4ade80'
                : state === 'reject'
                  ? '#ef5a48'
                  : state === 'live'
                    ? '#ffd97a'
                    : 'rgba(255,255,255,.28)',
          }}
        >
          {state === 'grant' ? '인용' : state === 'reject' ? '기각' : state === 'live' ? '심리중' : '대기'}
        </span>
      </div>
    </motion.div>
  )
}

export default function Dashboard({ state, config }: { state: AppState; config: Config }) {
  const m = state.meta
  const mains = config.games.filter((g) => !g.bonus)
  const bonuses = config.games.filter((g) => g.bonus)
  const remain = Math.max(0, m.next - state.prize.earned)

  return (
    <div className="tv-root tex-noise flex flex-col">
      <Hall />
      <Curtains width="9vw" />

      {/* 헤더 */}
      <div className="relative z-20 flex items-center justify-center gap-[1.2vw] pt-[1.4vh]">
        <Scales size="3.4vw" />
        <div className="text-center">
          <h1 className="txt-court txt-gold text-[3.2vw] leading-none tracking-[0.18em]">
            공 판 진 행 표
          </h1>
          <div className="txt-court mt-[0.2vh] text-[0.95vw] tracking-[0.3em] text-brass-300">
            {config.court.room} · {config.court.caseNo}
          </div>
        </div>
        <Scales size="3.4vw" />
      </div>

      <div className="relative z-20 mt-[1vh] flex flex-1 items-start justify-center gap-[1.4vw] px-[10.5vw]">
        {/* 좌 — 피고인 */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="panel tex-wood flex w-[15vw] shrink-0 flex-col items-center p-[0.7vw]"
        >
          <PhotoBox
            src={config.defendant.photo}
            label="피고인"
            className="w-full border-[3px] border-[#6d4f06]"
            style={{ height: '16vh' }}
          />
          <div className="txt-head mt-[0.5vh] text-[1.6vw] text-brass-100">
            {config.defendant.name}
          </div>
          <div className="txt-court text-[0.8vw] text-white/45">피고인</div>

          <div className="mt-[0.6vh] w-full space-y-[0.3vh]">
            <Plaque className="px-[0.5vw] py-[0.25vh] text-center">
              <div className="txt-court text-[0.7vw] text-[#4a3405]">확정 징역</div>
              <div className="txt-num text-[1.5vw] leading-none text-[#2a1509]">
                {m.demandStanding}년
              </div>
            </Plaque>
            <div className="txt-court text-center text-[0.75vw] text-white/40">
              총 구형 {m.demandTotal}년
            </div>
          </div>
        </motion.div>

        {/* 중앙 */}
        <div className="flex flex-1 flex-col items-center">
          <div className="txt-court text-[1.3vw] tracking-[0.3em] text-brass-300">
            누 적 적 립 금
          </div>

          <motion.div
            key={state.prize.earned}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-5 rounded-full bg-brass/25 blur-3xl" />
            <div className="txt-num txt-gold relative text-[7.5vw] leading-none">
              <RollingNumber value={state.prize.earned} />
              <span className="ml-1 text-[2.8vw]">{m.unit}</span>
            </div>
          </motion.div>

          <div className="txt-court -mt-[0.3vh] text-[1.15vw] text-white/60">
            공소사실 {m.cleared} / {m.totalGames} 인용
            {remain > 0 ? (
              <>
                {' '}
                · 다음 단계까지 <span className="text-brass-300">{remain}{m.unit}</span>
              </>
            ) : (
              <span className="text-brass-300"> · 최고 단계 도달</span>
            )}
          </div>

          <div className="mt-[1.2vh]">
            <PrizeLadder
              ladder={config.prize.ladder}
              cleared={m.cleared}
              unit={m.unit}
              maxTotal={m.maxTotal}
              bonus={state.prize.bonus}
              size="lg"
            />
          </div>

          {/* 공소사실 목록 */}
          <div className="mt-[1.4vh] w-full">
            <div className="txt-court mb-[0.4vh] text-[0.9vw] tracking-[0.25em] text-brass-300">
              공 소 사 실
            </div>
            <div className="flex w-full gap-[0.45vw]">
              {mains.map((gc, i) => (
                <CountCard
                  key={gc.id}
                  gc={gc}
                  g={state.games[gc.id]}
                  active={state.activeGameId === gc.id}
                  index={i}
                />
              ))}
            </div>

            {bonuses.map((gc) => (
              <div
                key={gc.id}
                className="panel mt-[0.5vh] flex items-center gap-[0.8vw] px-[1vw] py-[0.35vh]"
                style={{
                  background: 'linear-gradient(180deg,#6b1440,#2a0616)',
                  borderColor: state.activeGameId === gc.id ? '#d94f8a' : '#170c04',
                  outline: state.activeGameId === gc.id ? '3px solid #d94f8a' : undefined,
                }}
              >
                <span className="txt-court text-[0.95vw] text-love-lt">{gc.no}</span>
                <span className="txt-head text-[1.2vw] text-white">{gc.title}</span>
                <span className="txt-court ml-auto text-[0.8vw] text-white/50">
                  기각된 공소사실 재심용
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 우 — 심리 기록 */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="panel tex-wood flex w-[16vw] shrink-0 flex-col p-[0.65vw]"
          style={{ maxHeight: '64vh' }}
        >
          <div className="txt-court mb-[0.4vh] border-b-2 border-brass/30 pb-[0.25vh] text-[1vw] tracking-widest text-brass-300">
            심 리 기 록
          </div>
          <div className="no-bar flex-1 space-y-[0.35vh] overflow-y-auto">
            {state.log.length === 0 && (
              <div className="txt-court py-[2vh] text-center text-[0.9vw] text-white/25">
                기록 없음
              </div>
            )}
            {state.log.map((l) => (
              <motion.div
                key={l.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="border-2 border-[#170c04] bg-black/45 px-2 py-[0.2vh]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="txt-court min-w-0 flex-1 truncate text-[0.78vw] text-white/85">
                    {l.label}
                  </span>
                  {l.delta !== 0 && (
                    <span
                      className={`txt-num shrink-0 text-[1.1vw] leading-none ${
                        l.delta > 0 ? 'text-grant-lt' : 'text-reject-lt'
                      }`}
                    >
                      {l.delta > 0 ? '+' : ''}
                      {l.delta}
                    </span>
                  )}
                </div>
                <div className="txt-num text-[0.62vw] text-white/28">
                  {new Date(l.at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {l.delta !== 0 && ` · 누적 ${l.total}${m.unit}`}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 하단 */}
      <div className="relative z-20 mb-[1.2vh] flex justify-center">
        <Plaque className="w-[58vw] py-[0.5vh] text-center">
          <div className="txt-court text-[1.7vw] text-[#2a1509]">
            피고인의 여생은 <b>{config.witness.name}</b> 참고인이 관리한다
          </div>
        </Plaque>
      </div>
    </div>
  )
}
