import { motion } from 'framer-motion'
import { Grunge, SirenLights, PoliceTape, PrizeBar, PrizeLadder } from '../fx'
import type { AppState, Config, GameConfig, SimpleState } from '../types'

/**
 * 규칙이 자유로운 일반 게임 화면.
 * 진행자가 [성공]/[실패]만 눌러 판정하는 방식이라, 룰이 아직 안 정해진 게임도 그대로 쓸 수 있다.
 */
export default function GameSimple({
  state,
  config,
  gc,
}: {
  state: AppState
  config: Config
  gc: GameConfig
}) {
  const g = state.games[gc.id] as SimpleState
  if (!g) return null

  const m = state.meta
  const nextAmount = g.cleared ? m.current : m.next
  const undecided = gc.title === '미정' || !gc.title

  return (
    <div className="tv-root tex-noise flex flex-col">
      <Grunge />
      <SirenLights intensity={g.cleared ? 0.25 : 0.45} />

      <PrizeBar earned={state.prize.earned} meta={m} bonus={state.prize.bonus} />

      {/* 헤더 */}
      <div className="relative z-20 mt-[2vh] flex flex-col items-center">
        <div className="txt-head text-[1.5vw] tracking-[0.35em] text-tape">{gc.no}</div>
        <motion.h1
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 15 }}
          className="txt-head txt-glow-red text-[5.5vw] leading-none"
        >
          {gc.title || '미정'}
        </motion.h1>
        {gc.subtitle && (
          <div className="txt-head mt-[0.3vh] text-[1.6vw] text-white/60">「{gc.subtitle}」</div>
        )}
      </div>

      <PoliceTape
        className="left-[-6%] top-[30vh] w-[120%] opacity-85"
        rotate={-3}
        height={34}
        text="★ 집행 진행중 ★ 교화 프로그램 ★ 접근 금지 ★ "
      />

      {/* 규칙 */}
      <div className="relative z-20 mt-[6vh] flex flex-1 flex-col items-center justify-start px-[10vw]">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="plate tex-plate w-full px-[2.5vw] py-[1.5vh]"
        >
          <div className="txt-head mb-[0.5vh] text-[1.1vw] tracking-[0.3em] text-tape">
            📋 진행 방법
          </div>
          <div
            className={`txt-head leading-snug ${undecided ? 'text-white/35' : 'text-steel-lt'}`}
            style={{ fontSize: undecided ? '1.8vw' : '2.2vw' }}
          >
            {gc.rule || '규칙 미입력'}
          </div>

          {gc.win && (
            <div className="mt-[1vh] border-t-2 border-white/15 pt-[0.8vh]">
              <span className="txt-head text-[1.1vw] tracking-widest text-tape">✅ 성공 조건 </span>
              <span className="txt-head text-[1.8vw] text-white">{gc.win}</span>
            </div>
          )}
        </motion.div>

        {/* 상태 */}
        <motion.div
          key={g.cleared ? 'win' : g.failed ? 'lose' : 'wait'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="mt-[3vh]"
        >
          {g.cleared ? (
            <div className="stamp stamp-gold text-[6vw]">집행 성공</div>
          ) : g.failed ? (
            <div className="stamp text-[6vw]">집행 실패</div>
          ) : (
            <div className="txt-head anim-blink text-[3.4vw] text-tape">
              ▶ 집행 진행 중 ◀
            </div>
          )}
        </motion.div>

        {!g.cleared && !g.failed && (
          <div className="txt-head mt-[1.5vh] text-[1.9vw] text-white/75">
            성공 시 보석금{' '}
            <span className="txt-num txt-glow-gold text-[3vw]">
              {nextAmount}
              {m.unit}
            </span>{' '}
            도달
          </div>
        )}
        {g.failed && (
          <div className="txt-head anim-blink mt-[1.5vh] text-[1.9vw] text-love-lt">
            💗 천생연분으로 부활 기회를 노려라!
          </div>
        )}
      </div>

      {/* 하단 사다리 */}
      <div className="relative z-20 mb-[2.5vh] flex justify-center">
        <PrizeLadder
          ladder={config.prize.ladder}
          cleared={m.cleared}
          unit={m.unit}
          maxTotal={m.maxTotal}
          bonus={state.prize.bonus}
        />
      </div>
    </div>
  )
}
