import { motion } from 'framer-motion'
import { Grunge, PrisonBars, Chain, RollingNumber, PhotoBox, PoliceTape, PrizeLadder } from '../fx'
import type { AppState, Config, GameConfig, GameState } from '../types'

function statusOf(g?: GameState) {
  if (!g) return { label: '대기', tone: 'idle' as const }
  if (g.cleared) return { label: '성공', tone: 'win' as const }
  if (g.failed) return { label: '실패', tone: 'lose' as const }
  if (g.results.some((r) => r !== 'pending')) return { label: '진행중', tone: 'live' as const }
  return { label: '대기', tone: 'idle' as const }
}

function GameCard({
  gc,
  g,
  active,
  index,
  compact,
}: {
  gc: GameConfig
  g?: GameState
  active: boolean
  index: number
  compact?: boolean
}) {
  const st = statusOf(g)
  const tone =
    st.tone === 'win'
      ? 'border-gold text-gold'
      : st.tone === 'lose'
        ? 'border-siren-red text-siren-red-lt'
        : st.tone === 'live'
          ? 'border-siren-blue text-siren-blue-lt'
          : 'border-con-400 text-con-300'
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.06 * index }}
      className={`plate tex-plate relative flex-1 overflow-hidden p-[0.6vw] ${
        active ? 'ring-4 ring-tape' : ''
      }`}
    >
      {st.tone === 'win' && (
        <div className="stamp stamp-gold absolute right-[0.3vw] top-[0.3vw] rotate-[-14deg] text-[1vw]">
          성공
        </div>
      )}
      {st.tone === 'lose' && (
        <div className="stamp absolute right-[0.3vw] top-[0.3vw] rotate-[-14deg] text-[1vw]">
          실패
        </div>
      )}
      <div className="txt-head text-[0.85vw] tracking-widest text-tape">{gc.no}</div>
      <div className="txt-head text-[1.35vw] leading-tight text-steel-lt">{gc.title}</div>
      {gc.subtitle && (
        <div className="txt-head truncate text-[0.85vw] text-white/40">「{gc.subtitle}」</div>
      )}

      {!compact && !!g?.results.length && (
        <div className="mt-[0.4vh] flex flex-wrap items-center gap-[0.25vw]">
          {g.results.map((r, idx) => (
            <div
              key={idx}
              className={`flex h-[1.5vw] w-[1.5vw] items-center justify-center rounded border-2 border-black text-[0.8vw] ${
                r === 'win'
                  ? 'bg-gold text-black'
                  : r === 'lose'
                    ? 'bg-siren-red text-white'
                    : 'bg-con-700 text-con-300'
              }`}
            >
              {r === 'win' ? '○' : r === 'lose' ? '✕' : idx + 1}
            </div>
          ))}
        </div>
      )}

      <div className="mt-[0.4vh] flex items-center gap-[0.3vw]">
        <span className={`txt-head inline-block border-2 px-1 text-[0.85vw] ${tone}`}>
          {st.label}
        </span>
        {!!g?.revives && (
          <span className="txt-head text-[0.8vw] text-love-lt">↩{g.revives}</span>
        )}
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
      <Grunge tone="steel" />
      <PrisonBars opacity={0.25} />
      <Chain className="left-[2.5%] top-0" vertical />
      <Chain className="right-[2.5%] top-0" vertical />

      {/* 헤더 */}
      <div className="relative z-20 flex items-center justify-center gap-[1.2vw] pt-[1.5vh]">
        <span className="text-[2.4vw]">⛓️</span>
        <h1 className="txt-head txt-chrome text-[4vw] leading-none tracking-[0.14em]">
          교 정 본 부
        </h1>
        <span className="text-[2.4vw]">⛓️</span>
      </div>

      <div className="relative z-20 mt-[0.5vh] flex justify-center">
        <div className="plate tex-plate anim-sheen relative overflow-hidden px-[2vw] py-[0.3vh]">
          <span className="txt-head text-[0.9vw] tracking-[0.3em] text-steel">수감자 </span>
          <span className="txt-num text-[1.8vw] leading-none text-steel-lt">
            {config.groom.prisonNo}
          </span>
        </div>
      </div>

      {/* 메인 */}
      <div className="relative z-20 mt-[1vh] flex flex-1 items-start justify-center gap-[1.5vw] px-[3vw]">
        {/* 좌 — 수감자 */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="plate tex-plate flex w-[16vw] shrink-0 flex-col items-center p-[0.7vw]"
        >
          <PhotoBox
            src={config.groom.photo}
            label="신랑"
            className="w-full rounded-sm border-4 border-black"
            style={{ height: '17vh' }}
          />
          <div className="txt-head mt-[0.6vh] text-[1.7vw] text-steel-lt">{config.groom.name}</div>
          <div className="mt-[0.4vh] w-full space-y-[0.3vh] text-[0.85vw]">
            {[
              ['죄 명', config.groom.crimeName],
              ['형 량', config.groom.sentence],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-[0.3vw]">
                <span className="txt-head w-[3.5vw] shrink-0 border-2 border-black bg-con-800 px-1 text-center text-steel">
                  {k}
                </span>
                <span className="flex-1 truncate border-2 border-black bg-black/50 px-1 text-white/90">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 중앙 */}
        <div className="flex flex-1 flex-col items-center">
          <div className="txt-head text-[1.4vw] tracking-[0.25em] text-tape">
            💰 적 립 보 석 금 💰
          </div>

          <motion.div
            key={state.prize.earned}
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-5 rounded-full bg-gold/25 blur-3xl" />
            <div className="txt-num txt-gold-plate relative text-[8vw] leading-none">
              <RollingNumber value={state.prize.earned} />
              <span className="ml-1 text-[3vw]">{m.unit}</span>
            </div>
          </motion.div>

          <div className="txt-head -mt-[0.5vh] text-[1.2vw] text-white/60">
            집행 {m.cleared} / {m.totalGames} 성공
            {remain > 0 ? (
              <>
                {' '}
                · 다음 단계까지 <span className="text-tape">{remain}{m.unit}</span>
              </>
            ) : (
              <span className="text-gold"> · 최고 단계 도달!</span>
            )}
          </div>

          {/* 상금 사다리 */}
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

          {/* 게임 목록 */}
          <div className="mt-[1.5vh] flex w-full gap-[0.6vw]">
            {mains.map((gc, i) => (
              <GameCard
                key={gc.id}
                gc={gc}
                g={state.games[gc.id]}
                active={state.activeGameId === gc.id}
                index={i}
              />
            ))}
          </div>
          {bonuses.length > 0 && (
            <div className="mt-[0.6vh] flex w-full gap-[0.6vw]">
              {bonuses.map((gc, i) => (
                <div
                  key={gc.id}
                  className={`plate relative flex flex-1 items-center gap-[0.8vw] overflow-hidden px-[0.8vw] py-[0.4vh] ${
                    state.activeGameId === gc.id ? 'ring-4 ring-love' : ''
                  }`}
                  style={{ background: 'linear-gradient(180deg,#5a0030,#2a0018)' }}
                >
                  <span className="text-[1.4vw]">💗</span>
                  <span className="txt-head text-[1.1vw] text-love-lt">{gc.no}</span>
                  <span className="txt-head text-[1.3vw] text-white">{gc.title}</span>
                  <span className="txt-head ml-auto text-[0.9vw] text-white/50">
                    실패한 집행 부활용
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 우 — 기록 */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="plate tex-plate flex w-[18vw] shrink-0 flex-col p-[0.7vw]"
          style={{ maxHeight: '62vh' }}
        >
          <div className="txt-head mb-[0.4vh] border-b-2 border-white/20 pb-[0.3vh] text-[1.1vw] tracking-widest text-tape">
            📋 집행 기록
          </div>
          <div className="no-bar flex-1 space-y-[0.4vh] overflow-y-auto">
            {state.log.length === 0 && (
              <div className="txt-head py-[2vh] text-center text-[0.95vw] text-white/30">
                기록 없음
              </div>
            )}
            {state.log.map((l) => (
              <motion.div
                key={l.id}
                initial={{ x: 25, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="border-2 border-black bg-black/45 px-2 py-[0.25vh]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[0.8vw] text-white/85">
                    {l.label}
                  </span>
                  {l.delta !== 0 && (
                    <span
                      className={`txt-num shrink-0 text-[1.2vw] leading-none ${
                        l.delta > 0 ? 'text-cash' : 'text-siren-red-lt'
                      }`}
                    >
                      {l.delta > 0 ? '+' : ''}
                      {l.delta}
                    </span>
                  )}
                </div>
                <div className="txt-num text-[0.65vw] text-white/30">
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
      <div className="relative z-20 mb-[1vh] flex justify-center">
        <div className="plate tex-plate anim-sheen relative w-[66vw] overflow-hidden py-[0.5vh] text-center">
          <div className="txt-head text-[1.9vw] text-steel-lt">
            이제 너의 인생은 <span className="txt-glow-love">{config.bride.name}</span> 님이
            관리한다.
          </div>
        </div>
      </div>

      <PoliceTape
        className="left-[-10%] top-[-2%] w-[130%]"
        rotate={-3}
        height={30}
        speed="none"
        text="※ 교정본부 관계자 외 출입 금지 ※ "
      />
    </div>
  )
}
