import { motion } from 'framer-motion'
import { Grunge, SirenLights, PoliceTape, PhotoBox, PrizeBar, PrizeLadder } from '../fx'
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
  const suspects = config.suspects
  const cols = Math.min(suspects.length, 6)

  return (
    <div className="tv-root tex-noise flex flex-col">
      <Grunge />
      <SirenLights intensity={g.picked !== null && !g.revealed ? 1 : 0.4} />

      <PrizeBar earned={state.prize.earned} meta={state.meta} bonus={state.prize.bonus} />

      {/* 헤더 */}
      <div className="relative z-20 flex items-center justify-between px-[2.5vw] pt-[1.2vh]">
        <div>
          <div className="txt-head text-[1.3vw] tracking-[0.3em] text-tape">{gc.no}</div>
          <div className="txt-head txt-glow-red text-[3.6vw] leading-none">{gc.title}</div>
        </div>

        {/* 증거물 */}
        {ev && (
          <motion.div
            key={g.round}
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className="plate tex-plate flex items-center gap-[1vw] px-[1.5vw] py-[0.6vh]"
          >
            <span className="text-[2.6vw]">{ev.emoji || '🍽️'}</span>
            <div>
              <div className="txt-head text-[0.9vw] tracking-widest text-steel">이번 증거물</div>
              <div className="txt-head text-[1.7vw] leading-tight text-steel-lt">
                {ev.real} <span className="text-siren-red-lt">vs</span> {ev.fake}
              </div>
            </div>
          </motion.div>
        )}

        <div className="text-right">
          <div className="txt-head text-[1.2vw] tracking-widest text-white/60">ROUND</div>
          <div className="txt-num txt-glow-gold text-[3.6vw] leading-none">
            {g.round + 1}
            <span className="text-[2vw] text-white/45"> / {g.results.length}</span>
          </div>
        </div>
      </div>

      <PoliceTape
        className="left-[-6%] top-[26vh] w-[120%] opacity-90"
        rotate={-3}
        height={38}
        text="★ 대질신문 진행중 ★ 용의자 라인업 ★ 접근 금지 ★ "
      />

      {/* 라인업 */}
      <div className="relative z-20 flex flex-1 items-center justify-center px-[3vw]">
        <div
          className="grid w-full gap-[1.2vw]"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {suspects.map((s, i) => {
            const picked = g.picked === s.id
            const isGuilty = g.revealed && g.guilty === s.id
            const wrong = g.revealed && picked && g.guilty !== s.id
            return (
              <motion.div
                key={s.id}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 180, damping: 16 }}
                className="relative"
              >
                <div
                  className={`relative overflow-hidden border-[5px] transition-all duration-300 ${
                    picked && !g.revealed
                      ? 'anim-shake-loop border-siren-red shadow-[0_0_0_5px_rgba(225,6,0,.45),0_0_50px_rgba(225,6,0,.85)]'
                      : isGuilty
                        ? 'border-gold shadow-[0_0_0_5px_rgba(255,199,44,.5),0_0_60px_rgba(255,199,44,.9)]'
                        : 'border-black opacity-90'
                  }`}
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(180deg, rgba(255,255,255,.12) 0 2px, transparent 2px 11%)',
                    backgroundColor: '#20262b',
                  }}
                >
                  <PhotoBox
                    src={s.photo}
                    label={s.name}
                    className="w-full"
                    style={{ height: '28vh' }}
                  />

                  {/* 수감번호 명패 */}
                  <div className="absolute bottom-0 left-0 right-0 border-t-4 border-black bg-black/85 py-[0.3vh] text-center">
                    <div className="txt-head text-[1.15vw] text-steel-lt">{s.name}</div>
                    <div className="txt-num text-[0.9vw] text-white/45">
                      NO. {String(s.id).padStart(3, '0')}
                    </div>
                  </div>

                  {/* 조준선 */}
                  {picked && !g.revealed && (
                    <div className="anim-reticle pointer-events-none absolute inset-0">
                      <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-siren-red/85" />
                      <div className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-siren-red/85" />
                      <div className="absolute left-1/2 top-1/2 h-[7vw] w-[7vw] -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-siren-red" />
                    </div>
                  )}

                  {/* 판정 도장 */}
                  {isGuilty && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gold/15">
                      <div className="stamp stamp-gold anim-stamp text-[3.2vw]">유 죄</div>
                    </div>
                  )}
                  {wrong && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-siren-blue/20">
                      <div className="stamp stamp-blue anim-stamp text-[2.2vw]">무죄 석방</div>
                    </div>
                  )}
                </div>

                {/* 지목 표시 */}
                {picked && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute -top-[3.5vh] left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                    <div className="anim-bob txt-head border-[3px] border-black bg-siren-red px-[0.8vw] py-[0.2vh] text-[1.1vw] text-white shadow-lg">
                      👇 지목
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 하단 상태 */}
      <div className="relative z-20 flex items-center justify-center gap-[2vw] pb-[2vh]">
        <div className="flex items-center gap-[0.8vw]">
          {g.results.map((r, i) => (
            <div
              key={i}
              className={`plate flex h-[5vh] w-[7vw] items-center justify-center border-[3px] ${
                r === 'win'
                  ? 'border-gold bg-gold/20'
                  : r === 'lose'
                    ? 'border-siren-red bg-siren-red/20'
                    : i === g.round
                      ? 'border-tape bg-tape/10'
                      : 'border-con-500 bg-black/40'
              }`}
            >
              <span
                className={`txt-head text-[1.2vw] ${
                  r === 'win'
                    ? 'text-gold'
                    : r === 'lose'
                      ? 'text-siren-red-lt'
                      : i === g.round
                        ? 'anim-blink text-tape'
                        : 'text-con-300'
                }`}
              >
                R{i + 1} {r === 'win' ? '⭕' : r === 'lose' ? '❌' : i === g.round ? '진행중' : '⬜'}
              </span>
            </div>
          ))}
        </div>

        <div className="plate tex-plate px-[1.2vw] py-[0.4vh] text-center">
          <div className="txt-head text-[1vw] text-tape">
            성공 조건 · {g.results.length}회 중 {gc.clearThreshold ?? 1}회 이상 적중
          </div>
          <div className="txt-head text-[1.1vw] text-steel">
            성공 시 보석금{' '}
            <span className="txt-num txt-glow-gold text-[1.8vw]">
              {state.meta.next}
              {state.meta.unit}
            </span>{' '}
            도달
          </div>
        </div>

        <PrizeLadder
          ladder={config.prize.ladder}
          cleared={state.meta.cleared}
          unit={state.meta.unit}
          maxTotal={state.meta.maxTotal}
          bonus={state.prize.bonus}
        />
      </div>
    </div>
  )
}
