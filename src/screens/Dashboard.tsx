import { motion } from 'framer-motion'
import { Grunge, PrisonBars, Chain, RollingNumber, PhotoBox, PoliceTape } from '../fx'
import type { AppState, Config, GameState } from '../types'

function statusOf(g?: GameState) {
  if (!g) return { label: '대기', tone: 'idle' as const }
  if (g.cleared) return { label: '성공', tone: 'win' as const }
  const done = g.results.every((r) => r !== 'pending')
  if (done) return { label: '실패', tone: 'lose' as const }
  if (g.results.some((r) => r !== 'pending')) return { label: '진행중', tone: 'live' as const }
  return { label: '대기', tone: 'idle' as const }
}

export default function Dashboard({ state, config }: { state: AppState; config: Config }) {
  const total = config.prize.totalPool
  const earned = state.prize.earned
  const pct = total > 0 ? Math.min(100, (earned / total) * 100) : 0

  return (
    <div className="tv-root tex-noise flex flex-col">
      <Grunge tone="steel" />
      <PrisonBars opacity={0.28} />
      <Chain className="left-[3%] top-0" vertical />
      <Chain className="right-[3%] top-0" vertical />

      {/* 헤더 */}
      <div className="relative z-20 flex items-center justify-center pt-[2vh]">
        <div className="relative flex items-center gap-[1.5vw]">
          <span className="text-[3vw]">⛓️</span>
          <h1 className="txt-head txt-chrome text-[5vw] leading-none tracking-[0.14em]">
            교 정 본 부
          </h1>
          <span className="text-[3vw]">⛓️</span>
        </div>
      </div>

      <div className="relative z-20 mt-[1vh] flex justify-center">
        <div className="plate tex-plate anim-sheen relative overflow-hidden px-[2.5vw] py-[0.6vh]">
          <div className="txt-head text-center text-[1.1vw] tracking-[0.3em] text-steel">
            수감자 번호
          </div>
          <div className="txt-num text-center text-[2.6vw] leading-none text-steel-lt">
            {config.groom.prisonNo}
          </div>
        </div>
      </div>

      {/* 메인: 보석금 금고 */}
      <div className="relative z-20 mt-[2vh] flex flex-1 items-start justify-center gap-[2vw] px-[3vw]">
        {/* 좌 — 수감자 카드 */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="plate tex-plate flex w-[19vw] shrink-0 flex-col items-center p-[1vw]"
        >
          <PhotoBox
            src={config.groom.photo}
            label="신랑"
            className="w-full rounded-sm border-4 border-black"
            style={{ height: '20vh' }}
          />
          <div className="txt-head mt-[1vh] text-[2vw] text-steel-lt">{config.groom.name}</div>
          <div className="mt-[0.5vh] w-full space-y-[0.4vh] text-[0.95vw]">
            {[
              ['죄 명', config.groom.crimeName],
              ['형 량', config.groom.sentence],
              ['가석방', config.groom.parole],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-[0.5vw]">
                <span className="txt-head w-[4vw] shrink-0 border-2 border-black bg-con-800 px-1 text-center text-steel">
                  {k}
                </span>
                <span className="flex-1 border-2 border-black bg-black/50 px-2 text-white/90">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 중앙 — 금고 */}
        <div className="flex flex-1 flex-col items-center">
          <div className="txt-head text-[1.7vw] tracking-[0.25em] text-tape">
            💰 적 립 보 석 금 💰
          </div>

          <motion.div
            key={earned}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 0.5 }}
            className="relative mt-[0.5vh]"
          >
            <div className="absolute -inset-6 rounded-full bg-gold/25 blur-3xl" />
            <div className="txt-num txt-gold-plate relative text-[9vw] leading-none">
              <RollingNumber value={earned} />
              <span className="ml-2 text-[3.5vw]">{config.prize.currency}</span>
            </div>
          </motion.div>

          {/* 감형 게이지 */}
          <div className="mt-[1vh] w-full px-[2vw]">
            <div className="relative h-[4.5vh] overflow-hidden rounded-full border-[5px] border-black bg-con-900 shadow-[inset_0_4px_12px_rgba(0,0,0,.9)]">
              <div
                className="anim-sheen relative h-full overflow-hidden transition-[width] duration-1000 ease-out"
                style={{
                  width: `${pct}%`,
                  background:
                    'linear-gradient(90deg,#8a6508,#b8860b 20%,#ffc72c 65%,#fff3c4 100%)',
                  boxShadow: '0 0 28px rgba(255,199,44,.7)',
                }}
              />
              <div className="txt-head absolute inset-0 flex items-center justify-center text-[1.5vw] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,.95)]">
                형량 감형률 {pct.toFixed(1)}% · 목표 {total.toLocaleString('ko-KR')}
                {config.prize.currency}
              </div>
            </div>
          </div>

          {/* 집행 목록 */}
          <div className="mt-[1.5vh] flex w-full gap-[1vw] px-[1vw]">
            {config.games.map((gc, i) => {
              const g = state.games[gc.id]
              const st = statusOf(g)
              const tone =
                st.tone === 'win'
                  ? 'border-gold text-gold'
                  : st.tone === 'lose'
                    ? 'border-siren-red text-siren-red'
                    : st.tone === 'live'
                      ? 'border-siren-blue text-siren-blue'
                      : 'border-con-400 text-con-300'
              return (
                <motion.div
                  key={gc.id}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className={`plate tex-plate relative flex-1 overflow-hidden p-[0.9vw] ${
                    state.activeGameId === gc.id ? 'ring-4 ring-tape' : ''
                  }`}
                >
                  {st.tone === 'win' && (
                    <div className="stamp stamp-gold absolute right-[0.6vw] top-[0.6vw] rotate-[-14deg] text-[1.3vw]">
                      감형
                    </div>
                  )}
                  {st.tone === 'lose' && (
                    <div className="stamp absolute right-[0.6vw] top-[0.6vw] rotate-[-14deg] text-[1.3vw]">
                      징계
                    </div>
                  )}
                  <div className="txt-head text-[1vw] tracking-widest text-tape">{gc.no}</div>
                  <div className="txt-head text-[1.9vw] leading-tight text-steel-lt">
                    {gc.title}
                  </div>
                  {gc.subtitle && (
                    <div className="txt-head text-[1vw] text-white/45">「{gc.subtitle}」</div>
                  )}
                  <div className="mt-[0.6vh] flex items-center gap-[0.4vw]">
                    {g?.results.map((r, idx) => (
                      <div
                        key={idx}
                        className={`flex h-[1.9vw] w-[1.9vw] items-center justify-center rounded border-2 border-black text-[0.95vw] ${
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
                  <div
                    className={`txt-head mt-[0.5vh] inline-block border-2 px-2 text-[0.95vw] ${tone}`}
                  >
                    {st.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* 우 — 적립 이력 */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="plate tex-plate flex w-[20vw] shrink-0 flex-col p-[0.9vw]"
          style={{ maxHeight: '58vh' }}
        >
          <div className="txt-head mb-[0.6vh] border-b-2 border-white/20 pb-[0.4vh] text-[1.2vw] tracking-widest text-tape">
            📋 집행 기록
          </div>
          <div className="no-bar flex-1 space-y-[0.5vh] overflow-y-auto">
            {state.log.length === 0 && (
              <div className="txt-head py-[2vh] text-center text-[1vw] text-white/30">
                기록 없음
              </div>
            )}
            {state.log.map((l) => (
              <motion.div
                key={l.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center justify-between gap-2 border-2 border-black bg-black/45 px-2 py-[0.3vh]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.85vw] text-white/85">{l.label}</div>
                  <div className="txt-num text-[0.7vw] text-white/35">
                    {new Date(l.at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div
                  className={`txt-num shrink-0 text-[1.4vw] leading-none ${
                    l.amount >= 0 ? 'text-cash' : 'text-siren-red-lt'
                  }`}
                >
                  {l.amount >= 0 ? '+' : ''}
                  {l.amount.toLocaleString('ko-KR')}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 하단 명패 */}
      <div className="relative z-20 mb-[1.5vh] mt-[1vh] flex justify-center">
        <div className="plate tex-plate anim-sheen relative w-[70vw] overflow-hidden py-[0.7vh] text-center">
          <div className="txt-head text-[2.1vw] text-steel-lt">
            이제 너의 인생은 <span className="txt-glow-love">{config.bride.name}</span> 님이
            관리한다.
          </div>
        </div>
      </div>

      <PoliceTape
        className="left-[-10%] top-[-2%] w-[130%]"
        rotate={-3}
        height={34}
        speed="none"
        text="※ 교정본부 관계자 외 출입 금지 ※ "
      />
    </div>
  )
}
