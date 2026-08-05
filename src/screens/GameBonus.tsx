import { motion, AnimatePresence } from 'framer-motion'
import CourtFrame from './CourtFrame'
import { PhotoBox, Plaque } from '../fx'
import type { AppState, BonusState, Config, GameConfig } from '../types'

function FloatingHearts() {
  const items = Array.from({ length: 22 }).map((_, i) => ({
    i,
    left: Math.random() * 100,
    size: 14 + Math.random() * 34,
    dur: 7 + Math.random() * 8,
    delay: Math.random() * 8,
    e: ['💗', '💖', '💕', '🌸', '✨'][i % 5],
  }))
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((h) => (
        <motion.div
          key={h.i}
          className="absolute"
          style={{ left: `${h.left}%`, fontSize: h.size, bottom: -60 }}
          animate={{ y: [0, -1200], opacity: [0, 0.85, 0.85, 0], rotate: [0, 25, -25, 0] }}
          transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'linear' }}
        >
          {h.e}
        </motion.div>
      ))}
    </div>
  )
}

export default function GameBonus({
  state,
  config,
  gc,
}: {
  state: AppState
  config: Config
  gc: GameConfig
}) {
  const g = state.games[gc.id] as BonusState
  if (!g) return null

  return (
    <CourtFrame state={state} config={config} gc={gc} g={g} tone="love" compactHead>
      <FloatingHearts />

      <div className="relative z-10 -mt-[1vh] flex w-full items-center justify-center gap-[2.5vw]">
        {/* 증인석 */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="shrink-0"
        >
          <div
            className="relative rounded-sm border-[8px] border-[#fff0f6] p-[0.4vw]"
            style={{
              background: 'linear-gradient(160deg,#fff,#ffd9ea)',
              boxShadow: '0 14px 38px rgba(0,0,0,.55), 0 0 54px rgba(217,79,138,.55)',
            }}
          >
            <PhotoBox
              src={config.witness.photo}
              label="증인 사진"
              className="rounded-sm"
              style={{ width: '17vw', height: '23vh' }}
            />
          </div>
          <Plaque className="mt-[0.6vh] w-full py-[0.3vh] text-center">
            <div className="txt-court text-[0.75vw] text-[#4a3405]">
              {config.witness.role || '참고인'}
            </div>
            <div className="txt-court text-[1.4vw] leading-none text-[#2a1509]">
              {config.witness.name}
            </div>
          </Plaque>
        </motion.div>

        {/* 신문 사항 / 답변 */}
        <div className="flex flex-1 flex-col items-center">
          <motion.div
            key={`q-${g.round}`}
            initial={{ scale: 0.85, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full rounded-sm border-[5px] border-[#5c0a30] px-[2vw] py-[1.2vh] text-center"
            style={{
              background: 'linear-gradient(160deg,#fff8fc,#ffdcec 60%,#ffbcd8)',
              boxShadow: '0 10px 0 rgba(0,0,0,.35), 0 0 42px rgba(217,79,138,.5)',
            }}
          >
            <div className="txt-court text-[0.95vw] tracking-[0.3em] text-[#a3005c]">
              신문 사항 {g.round + 1} / {g.results.length}
              {g.category ? ` · ${g.category}` : ''}
              {typeof g.remaining === 'number' ? ` · 남은 문항 ${g.remaining}` : ''}
            </div>
            <div className="txt-court mt-[0.3vh] text-[2.3vw] leading-tight text-[#4a0028]">
              {g.question || '신문 사항 미입력'}
            </div>
          </motion.div>

          <div className="relative mt-[1.4vh] w-full" style={{ perspective: 1400, height: '17vh' }}>
            <AnimatePresence mode="wait">
              {!g.revealed ? (
                <motion.div
                  key="back"
                  initial={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-sm border-[5px] border-[#5c0a30]"
                  style={{
                    background: 'repeating-linear-gradient(45deg,#d94f8a 0 20px,#b83a72 20px 40px)',
                    boxShadow: '0 10px 0 rgba(0,0,0,.4)',
                  }}
                >
                  <div className="anim-bob text-[3.4vw]">📜</div>
                  <div className="txt-court text-[1.6vw] text-white drop-shadow-[0_2px_0_rgba(0,0,0,.4)]">
                    증인 진술서 · 봉인
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="front"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                  className="tex-paper absolute inset-0 flex flex-col items-center justify-center rounded-sm border-[5px] border-[#6d4f06] px-[2vw]"
                  style={{ boxShadow: '0 10px 0 rgba(0,0,0,.4), 0 0 54px rgba(201,162,39,.7)' }}
                >
                  <div className="txt-court text-[0.9vw] tracking-[0.3em] text-[#8a6508]">
                    증 인 진 술
                  </div>
                  <div className="txt-court mt-[0.2vh] text-center text-[2.8vw] leading-tight text-[#2a1509]">
                    {g.answer || '(진술 미입력)'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-[1.2vh] flex gap-[0.6vw]">
            {g.results.map((r, i) => (
              <div
                key={i}
                className="flex h-[3.4vh] w-[3.4vh] items-center justify-center rounded-full border-[3px] border-[#5c0a30]"
                style={{
                  background:
                    r === 'win'
                      ? 'linear-gradient(180deg,#ffd97a,#8a6508)'
                      : r === 'lose'
                        ? 'linear-gradient(180deg,#4a1030,#2a0616)'
                        : i === g.round
                          ? '#fff'
                          : 'rgba(0,0,0,.35)',
                }}
              >
                <span
                  className={`txt-court text-[1vw] ${i === g.round && r === 'pending' ? 'anim-blink' : ''}`}
                  style={{
                    color:
                      r === 'win'
                        ? '#2a1509'
                        : r === 'lose'
                          ? 'rgba(255,255,255,.4)'
                          : i === g.round
                            ? '#a3005c'
                            : 'rgba(255,255,255,.3)',
                  }}
                >
                  {r === 'win' ? '○' : r === 'lose' ? '✕' : i + 1}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-[1.2vh] rounded-full border-[4px] border-[#5c0a30] px-[2vw] py-[0.4vh]"
            style={{ background: 'linear-gradient(90deg,#ffdcec,#fff,#ffdcec)' }}
          >
            <span className="txt-court text-[1.5vw] text-[#a3005c]">
              진술 일치 시 기각된 공소사실 1건 재심
            </span>
          </div>
        </div>
      </div>
    </CourtFrame>
  )
}
