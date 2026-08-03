import { motion, AnimatePresence } from 'framer-motion'
import { Grunge, PhotoBox, PrizeBar } from '../fx'
import type { AppState, BonusState, Config, GameConfig } from '../types'

/** 배경에 둥둥 뜨는 하트 */
function FloatingHearts() {
  const items = Array.from({ length: 26 }).map((_, i) => ({
    i,
    left: Math.random() * 100,
    size: 14 + Math.random() * 40,
    dur: 6 + Math.random() * 8,
    delay: Math.random() * 8,
    e: ['💗', '💖', '💕', '🌸', '✨', '💘'][i % 6],
  }))
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((h) => (
        <motion.div
          key={h.i}
          className="absolute"
          style={{ left: `${h.left}%`, fontSize: h.size, bottom: -60 }}
          animate={{ y: [-0, -1200], opacity: [0, 0.9, 0.9, 0], rotate: [0, 25, -25, 0] }}
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
    <div className="tv-root tex-noise flex flex-col">
      <Grunge tone="love" />
      <FloatingHearts />

      {/* 반짝이 회전 */}
      <div className="anim-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[220vh] w-[220vh] -translate-x-1/2 -translate-y-1/2 opacity-[0.09]">
        <div
          className="h-full w-full"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, #fff 0deg 6deg, transparent 6deg 16deg)',
          }}
        />
      </div>

      <PrizeBar
        earned={state.prize.earned}
        total={config.prize.totalPool}
        currency={config.prize.currency}
      />

      {/* 제목 */}
      <div className="relative z-20 mt-[1.5vh] flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="anim-hue flex items-center gap-[1vw] rounded-full border-[5px] border-black px-[2.5vw] py-[0.5vh]"
          style={{
            background: 'linear-gradient(90deg,#ff8ac4,#ff3e9d 50%,#ff8ac4)',
            boxShadow: '0 8px 0 rgba(0,0,0,.45), 0 0 50px rgba(255,62,157,.8)',
          }}
        >
          <span className="text-[2vw]">💘</span>
          <span className="txt-head text-[2.4vw] leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,.5)]">
            {gc.no} · {gc.title}
          </span>
          <span className="text-[2vw]">💘</span>
        </motion.div>

        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="txt-head txt-glow-love anim-thump mt-[1vh] text-[5.5vw] leading-none"
        >
          ♡ 천 생 연 분 ♡
        </motion.h1>
        <div className="txt-head mt-[0.3vh] text-[1.5vw] text-white/85">
          예비 신부 <span className="txt-glow-love">{config.bride.name}</span> 님의 답변을 맞혀라
        </div>
      </div>

      {/* 본문 */}
      <div className="relative z-20 flex flex-1 items-center justify-center gap-[3vw] px-[6vw]">
        {/* 신부 사진 */}
        <motion.div
          initial={{ x: -60, opacity: 0, rotate: -6 }}
          animate={{ x: 0, opacity: 1, rotate: -3 }}
          className="relative shrink-0"
        >
          <div className="absolute -inset-4 rounded-2xl bg-love/50 blur-2xl" />
          <div
            className="relative rounded-xl border-[8px] border-white p-[0.5vw]"
            style={{
              background: 'linear-gradient(160deg,#fff,#ffd7ec)',
              boxShadow: '0 16px 40px rgba(0,0,0,.55), 0 0 60px rgba(255,62,157,.6)',
            }}
          >
            <PhotoBox
              src={config.bride.photo}
              label="신부 사진"
              className="rounded-md"
              style={{ width: '20vw', height: '26vh' }}
            />
            <div className="txt-head py-[0.4vh] text-center text-[1.5vw] text-[#c9007a]">
              {config.bride.name} ♡
            </div>
          </div>
          {/* 반짝이 */}
          {['-top-4 -left-4', '-top-4 -right-4', '-bottom-4 -left-4', '-bottom-4 -right-4'].map(
            (c, i) => (
              <motion.div
                key={i}
                className={`absolute ${c} text-[2.2vw]`}
                animate={{ scale: [0.6, 1.3, 0.6], rotate: [0, 180, 360] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
              >
                ✨
              </motion.div>
            )
          )}
        </motion.div>

        {/* 질문 / 답변 카드 */}
        <div className="flex flex-1 flex-col items-center">
          <motion.div
            key={`q-${g.round}`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full rounded-2xl border-[6px] border-black px-[2vw] py-[1.5vh] text-center"
            style={{
              background: 'linear-gradient(160deg,#fff8fc,#ffd7ec 60%,#ffb3da)',
              boxShadow: '0 12px 0 rgba(0,0,0,.35), 0 0 44px rgba(255,62,157,.55)',
            }}
          >
            <div className="txt-head text-[1.1vw] tracking-[0.3em] text-[#c9007a]">
              Q{g.round + 1} / {g.results.length}
            </div>
            <div className="txt-head mt-[0.5vh] text-[2.6vw] leading-tight text-[#4a0028]">
              {g.question || '질문을 입력해주세요'}
            </div>
          </motion.div>

          {/* 답변 카드 뒤집기 */}
          <div className="relative mt-[2vh] w-full" style={{ perspective: 1400, height: '20vh' }}>
            <AnimatePresence mode="wait">
              {!g.revealed ? (
                <motion.div
                  key="back"
                  initial={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-[6px] border-black"
                  style={{
                    background:
                      'repeating-linear-gradient(45deg,#ff3e9d 0 22px,#e0348a 22px 44px)',
                    boxShadow: '0 12px 0 rgba(0,0,0,.4)',
                  }}
                >
                  <div className="anim-bob text-[4vw]">💌</div>
                  <div className="txt-head text-[1.8vw] text-white drop-shadow-[0_2px_0_rgba(0,0,0,.4)]">
                    {config.bride.name} 님의 답변은?
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="front"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-[6px] border-black px-[2vw]"
                  style={{
                    background: 'linear-gradient(160deg,#fffdf5,#fff3c4 60%,#ffe08a)',
                    boxShadow: '0 12px 0 rgba(0,0,0,.4), 0 0 60px rgba(255,199,44,.8)',
                  }}
                >
                  <div className="txt-head text-[1vw] tracking-[0.3em] text-[#8a6508]">
                    ♡ 실제 답변 ♡
                  </div>
                  <div className="txt-head mt-[0.4vh] text-center text-[3.2vw] leading-tight text-[#4a2b00]">
                    {g.answer || '(답변 미입력)'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 결과 표시 */}
          <div className="mt-[1.5vh] flex gap-[0.8vw]">
            {g.results.map((r, i) => (
              <div
                key={i}
                className={`flex h-[4vh] w-[4vh] items-center justify-center rounded-full border-[3px] border-black text-[1.2vw] ${
                  r === 'win'
                    ? 'bg-gold text-black'
                    : r === 'lose'
                      ? 'bg-con-700 text-white/50'
                      : i === g.round
                        ? 'anim-blink bg-white text-[#c9007a]'
                        : 'bg-black/40 text-white/30'
                }`}
              >
                {r === 'win' ? '♥' : r === 'lose' ? '✕' : i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="relative z-20 mb-[2vh] flex justify-center">
        <div
          className="rounded-full border-[5px] border-black px-[2.5vw] py-[0.7vh]"
          style={{
            background: 'linear-gradient(90deg,#ffd7ec,#fff,#ffd7ec)',
            boxShadow: '0 8px 0 rgba(0,0,0,.35)',
          }}
        >
          <span className="txt-head text-[1.8vw] text-[#a30058]">
            🎁 정답 시 실패한 집행에 기회 1회 부활!
          </span>
        </div>
      </div>
    </div>
  )
}
