import { motion } from 'framer-motion'
import { Grunge, SirenLights, PrizeBar, PoliceTape } from '../fx'
import type { AppState, Config, GameConfig, VoiceState } from '../types'

/** 감청 파형 (가짜 오실로스코프) */
function Waveform({ active }: { active: boolean }) {
  const bars = 64
  return (
    <div className="flex h-[7vh] items-center justify-center gap-[0.25vw]">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[0.5vw] rounded-sm"
          style={{
            background: active
              ? 'linear-gradient(180deg,#ff4437,#ffd400)'
              : 'linear-gradient(180deg,#3a3a3a,#1e1e1e)',
            boxShadow: active ? '0 0 8px rgba(255,212,0,.6)' : 'none',
          }}
          animate={
            active
              ? { height: [`${8 + Math.random() * 12}%`, `${30 + Math.random() * 70}%`, `${8 + Math.random() * 12}%`] }
              : { height: '12%' }
          }
          transition={{
            duration: 0.4 + Math.random() * 0.5,
            repeat: active ? Infinity : 0,
            delay: i * 0.012,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function GameVoice({
  state,
  config,
  gc,
}: {
  state: AppState
  config: Config
  gc: GameConfig
}) {
  const g = state.games[gc.id] as VoiceState
  if (!g) return null

  const maxL = gc.maxListens ?? 3
  const len = g.wordLength || 0
  const word = g.word // 공개 전에는 null (서버가 안 보냄)
  const wins = g.results.filter((r) => r === 'win').length
  const need = gc.clearThreshold ?? 3
  const listening = g.listensLeft < maxL && !g.revealed

  return (
    <div className="tv-root tex-noise flex flex-col">
      <Grunge />
      <SirenLights intensity={0.3} />

      <PrizeBar
        earned={state.prize.earned}
        total={config.prize.totalPool}
        currency={config.prize.currency}
      />

      {/* 헤더 */}
      <div className="relative z-20 flex items-center justify-between px-[2.5vw] pt-[1.2vh]">
        <div>
          <div className="txt-head text-[1.3vw] tracking-[0.3em] text-tape">{gc.no}</div>
          <div className="txt-head txt-glow-blue text-[3.6vw] leading-none">{gc.title}</div>
        </div>

        <div className="plate tex-plate px-[1.5vw] py-[0.5vh] text-center">
          <div className="txt-head text-[0.95vw] tracking-widest text-steel">현재 성과</div>
          <div className="txt-num text-[2.2vw] leading-none text-steel-lt">
            <span className={wins >= need ? 'text-gold' : 'text-white'}>{wins}</span>
            <span className="text-white/40"> / {need}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="txt-head text-[1.2vw] tracking-widest text-white/60">QUESTION</div>
          <div className="txt-num txt-glow-gold text-[3.6vw] leading-none">
            {g.round + 1}
            <span className="text-[2vw] text-white/45"> / {g.results.length}</span>
          </div>
        </div>
      </div>

      <PoliceTape
        className="left-[-6%] top-[24vh] w-[120%] opacity-70"
        rotate={2}
        height={32}
        speed="fast"
        text="※ 감청 진행중 ※ 통신 보안 ※ 대외비 ※ "
      />

      {/* 파형 */}
      <div className="relative z-20 mt-[3vh] px-[8vw]">
        <Waveform active={listening} />
      </div>

      {/* 글자 블록 */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center">
        <div className="flex items-center gap-[1.4vw]">
          {Array.from({ length: len }).map((_, i) => {
            const ch = word ? word[i] : null
            return (
              <motion.div
                key={i}
                initial={false}
                animate={
                  g.revealed
                    ? { rotateY: 0, scale: 1 }
                    : g.listensLeft === 0
                      ? { scale: [1, 1.04, 1] }
                      : {}
                }
                transition={
                  g.revealed
                    ? { delay: i * 0.18, type: 'spring', stiffness: 200, damping: 14 }
                    : { repeat: Infinity, duration: 0.7 }
                }
                className="relative"
                style={{ perspective: 900 }}
              >
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: g.revealed ? 360 : 0 }}
                  transition={{ delay: i * 0.18, duration: 0.6 }}
                  className={`plate flex items-center justify-center border-[6px] ${
                    g.revealed
                      ? 'border-gold bg-gradient-to-b from-[#3a2c00] to-black'
                      : g.listensLeft === 0
                        ? 'anim-blink-fast border-siren-red bg-black'
                        : 'border-con-400 bg-black'
                  }`}
                  style={{
                    width: '11vw',
                    height: '11vw',
                    boxShadow: g.revealed
                      ? '0 0 0 4px rgba(255,199,44,.35), 0 0 60px rgba(255,199,44,.75)'
                      : 'inset 0 6px 20px rgba(0,0,0,.95), 0 8px 24px rgba(0,0,0,.7)',
                  }}
                >
                  {ch ? (
                    <span className="txt-head txt-glow-gold text-[7vw] leading-none">{ch}</span>
                  ) : (
                    <span className="txt-head text-[6vw] leading-none text-white/8">?</span>
                  )}
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <div className="txt-head mt-[2vh] text-[1.9vw] tracking-[0.3em] text-white/70">
          {len} 글 자
        </div>

        {/* 청취 잔여 */}
        <div className="mt-[2vh] flex items-center gap-[1.2vw]">
          <span className="txt-head text-[1.8vw] tracking-widest text-tape">🔊 청취 잔여</span>
          <div className="flex gap-[0.7vw]">
            {Array.from({ length: maxL }).map((_, i) => {
              const on = i < g.listensLeft
              return (
                <motion.div
                  key={i}
                  animate={on ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ repeat: on ? Infinity : 0, duration: 1.6, delay: i * 0.2 }}
                  className="rounded-full border-[4px] border-black"
                  style={{
                    width: '3vw',
                    height: '3vw',
                    background: on
                      ? 'radial-gradient(circle at 35% 30%, #fff3c4, #ffc72c 45%, #8a6508 100%)'
                      : 'radial-gradient(circle at 35% 30%, #3a3a3a, #141414 70%)',
                    boxShadow: on ? '0 0 22px rgba(255,199,44,.85)' : 'inset 0 3px 10px #000',
                  }}
                />
              )
            })}
          </div>
          {g.listensLeft === 0 && !g.revealed && (
            <span className="txt-head anim-blink-fast text-[1.8vw] text-siren-red-lt">
              ⚠️ 청취 종료 — 정답 제출!
            </span>
          )}
        </div>
      </div>

      {/* 하단 진행 상태 */}
      <div className="relative z-20 flex items-center justify-center gap-[1.5vw] pb-[2vh]">
        <div className="flex items-center gap-[0.7vw]">
          {g.results.map((r, i) => (
            <div
              key={i}
              className={`plate flex h-[5vh] w-[5.5vw] items-center justify-center border-[3px] ${
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
                className={`txt-head text-[1.1vw] ${
                  r === 'win'
                    ? 'text-gold'
                    : r === 'lose'
                      ? 'text-siren-red-lt'
                      : i === g.round
                        ? 'anim-blink text-tape'
                        : 'text-con-300'
                }`}
              >
                Q{i + 1} {r === 'win' ? '⭕' : r === 'lose' ? '❌' : i === g.round ? '▶' : '⬜'}
              </span>
            </div>
          ))}
        </div>

        <div className="plate tex-plate px-[1.5vw] py-[0.5vh]">
          <span className="txt-head text-[1.1vw] text-steel">정답 </span>
          <span className="txt-num txt-glow-gold text-[1.9vw]">
            +{(gc.prizePerRound || 0).toLocaleString('ko-KR')}
          </span>
          <span className="txt-head text-[1vw] text-steel"> · 1회청취 </span>
          <span className="txt-num text-[1.5vw] text-cash">
            +{(gc.perfectBonus || 0).toLocaleString('ko-KR')}
          </span>
          <span className="txt-head text-[1vw] text-steel"> · 클리어 </span>
          <span className="txt-num txt-glow-gold text-[1.7vw]">
            +{(gc.clearBonus || 0).toLocaleString('ko-KR')}
          </span>
        </div>
      </div>
    </div>
  )
}
