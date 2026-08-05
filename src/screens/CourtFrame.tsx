import { motion } from 'framer-motion'
import { Hall, Curtains, PrizeBar, PrizeLadder, Plaque } from '../fx'
import type { AppState, Config, GameConfig, GameState } from '../types'

/**
 * 모든 공소사실(게임) 화면의 공통 골격.
 * 상단 적립금 바 → 공소장 머리글 → 게임 영역 → 하단 사다리
 */
export default function CourtFrame({
  state,
  config,
  gc,
  g,
  tone = 'hall',
  children,
  compactHead,
}: {
  state: AppState
  config: Config
  gc: GameConfig
  g: GameState
  tone?: 'hall' | 'love'
  children: React.ReactNode
  /** 게임 영역이 넓어야 할 때 공소장 머리글을 한 줄로 줄인다 */
  compactHead?: boolean
}) {
  const m = state.meta

  return (
    <div className="tv-root tex-noise flex flex-col">
      <Hall tone={tone} />
      <Curtains width="7vw" />

      <PrizeBar earned={state.prize.earned} meta={m} />

      {/* 공소장 머리글 */}
      <div className="relative z-20 mt-[1vh] flex items-center justify-center gap-[1.2vw] px-[9vw]">
        <Plaque className="shrink-0 px-[1.2vw] py-[0.35vh] text-center">
          <div className="txt-court text-[0.8vw] tracking-[0.25em] text-[#4a3405]">
            {gc.prosecutor || '검사'}
          </div>
          <div className="txt-court text-[1.25vw] leading-none text-[#2a1509]">{gc.no}</div>
        </Plaque>

        <div className="min-w-0 flex-1 text-center">
          <motion.div
            key={gc.id}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="txt-head txt-gold truncate text-[3.4vw] leading-none"
          >
            {gc.charge || gc.title}
          </motion.div>
          <div className="txt-court truncate text-[1.05vw] text-white/55">{gc.title}</div>
        </div>

        <div className="shrink-0 text-center">
          <div className="txt-court text-[0.8vw] tracking-[0.25em] text-brass-300">구 형</div>
          <div className="txt-num txt-glow-reject text-[2.4vw] leading-none">
            징역 {gc.demand ?? 0}년
          </div>
        </div>
      </div>

      {/* 공소사실 */}
      {!compactHead && gc.indictment && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative z-20 mx-[10vw] mt-[0.8vh] border-y-2 border-brass/25 px-[1.5vw] py-[0.5vh]"
        >
          <span className="txt-court text-[0.85vw] tracking-[0.3em] text-brass-300">공소사실 </span>
          <span className="txt-court text-[1.2vw] leading-snug text-white/80">
            {gc.indictment}
          </span>
        </motion.div>
      )}

      {/* 게임 영역 */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-[9vw]">
        {children}
      </div>

      {/* 하단 */}
      <div className="relative z-20 mb-[1.6vh] flex items-center justify-center gap-[1.4vw]">
        <Plaque className="px-[1.1vw] py-[0.3vh] text-center">
          <div className="txt-court text-[0.78vw] text-[#4a3405]">인용 조건</div>
          <div className="txt-court text-[1.05vw] leading-none text-[#2a1509]">
            {gc.win || '-'}
          </div>
        </Plaque>

        {!g.cleared && (
          <div className="txt-court text-[1.15vw] text-white/70">
            인용 시 적립금{' '}
            <span className="txt-num txt-glow-gold text-[1.9vw]">
              {m.next}
              {m.unit}
            </span>{' '}
            도달
          </div>
        )}

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
