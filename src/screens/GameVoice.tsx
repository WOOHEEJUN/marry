import { motion } from 'framer-motion'
import CourtFrame from './CourtFrame'
import { Plaque } from '../fx'
import type { AppState, Config, GameConfig, VoiceState } from '../types'

/** 진술 파형 */
function Waveform({ active }: { active: boolean }) {
  const bars = 56
  return (
    <div className="flex h-[6vh] items-center justify-center gap-[0.25vw]">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[0.45vw] rounded-sm"
          style={{
            background: active
              ? 'linear-gradient(180deg,#ffd97a,#c9a227)'
              : 'linear-gradient(180deg,#3a2010,#1a0d05)',
            boxShadow: active ? '0 0 8px rgba(201,162,39,.6)' : 'none',
          }}
          animate={
            active
              ? {
                  height: [
                    `${8 + Math.random() * 12}%`,
                    `${30 + Math.random() * 70}%`,
                    `${8 + Math.random() * 12}%`,
                  ],
                }
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
  const word = g.word
  const wins = g.results.filter((r) => r === 'win').length
  const need = gc.clearThreshold ?? 3
  const listening = g.listensLeft < maxL && !g.revealed

  return (
    <CourtFrame state={state} config={config} gc={gc} g={g} compactHead>
      {/* 상태 */}
      <div className="mb-[0.8vh] flex items-center gap-[1.2vw]">
        <Plaque className="px-[1vw] py-[0.3vh] text-center">
          <div className="txt-court text-[0.75vw] text-[#4a3405]">신문 사항</div>
          <div className="txt-num text-[1.5vw] leading-none text-[#2a1509]">
            {g.round + 1} / {g.results.length}
          </div>
        </Plaque>
        <Plaque className="px-[1vw] py-[0.3vh] text-center">
          <div className="txt-court text-[0.75vw] text-[#4a3405]">진술 확인</div>
          <div className="txt-num text-[1.5vw] leading-none text-[#2a1509]">
            {wins} / {need}
          </div>
        </Plaque>
      </div>

      <Waveform active={listening} />

      {/* 글자 블록 */}
      <div className="mt-[1vh] flex items-center gap-[1.2vw]">
        {Array.from({ length: len }).map((_, i) => {
          const ch = word ? word[i] : null
          return (
            <motion.div
              key={i}
              animate={g.listensLeft === 0 && !g.revealed ? { scale: [1, 1.04, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.7 }}
              style={{ perspective: 900 }}
            >
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: g.revealed ? 360 : 0 }}
                transition={{ delay: i * 0.16, duration: 0.6 }}
                className={`panel flex items-center justify-center ${
                  g.listensLeft === 0 && !g.revealed ? 'anim-blink-fast' : ''
                }`}
                style={{
                  width: '9.5vw',
                  height: '9.5vw',
                  borderColor: g.revealed ? '#c9a227' : g.listensLeft === 0 ? '#c0392b' : '#170c04',
                  background: g.revealed
                    ? 'linear-gradient(180deg,#3a2604,#150b05)'
                    : 'linear-gradient(180deg,#241409,#0d0703)',
                  boxShadow: g.revealed
                    ? '0 0 0 4px rgba(201,162,39,.35), 0 0 52px rgba(201,162,39,.7)'
                    : 'inset 0 6px 20px rgba(0,0,0,.95)',
                }}
              >
                {ch ? (
                  <span className="txt-head txt-glow-gold text-[6vw] leading-none">{ch}</span>
                ) : (
                  <span className="txt-court text-[5vw] leading-none text-white/8">?</span>
                )}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      <div className="txt-court mt-[1.2vh] text-[1.6vw] tracking-[0.3em] text-white/65">
        {len} 글 자
      </div>

      {/* 청취 잔여 */}
      <div className="mt-[1.4vh] flex items-center gap-[1vw]">
        <span className="txt-court text-[1.5vw] tracking-widest text-brass-300">청취 잔여</span>
        <div className="flex gap-[0.6vw]">
          {Array.from({ length: maxL }).map((_, i) => {
            const on = i < g.listensLeft
            return (
              <motion.div
                key={i}
                animate={on ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: on ? Infinity : 0, duration: 1.8, delay: i * 0.2 }}
                className="rounded-full border-[4px] border-[#170c04]"
                style={{
                  width: '2.6vw',
                  height: '2.6vw',
                  background: on
                    ? 'radial-gradient(circle at 35% 30%, #fff3c4, #c9a227 45%, #6d4f06 100%)'
                    : 'radial-gradient(circle at 35% 30%, #3a2010, #150b05 70%)',
                  boxShadow: on ? '0 0 22px rgba(201,162,39,.85)' : 'inset 0 3px 10px #000',
                }}
              />
            )
          })}
        </div>
        {g.listensLeft === 0 && !g.revealed && (
          <span className="txt-court anim-blink-fast text-[1.6vw] text-reject-lt">
            청취 종료 — 진술하십시오
          </span>
        )}
      </div>

      {/* 문항 표시 */}
      <div className="mt-[1.2vh] flex items-center gap-[0.5vw]">
        {g.results.map((r, i) => (
          <div
            key={i}
            className="panel flex h-[3.4vh] w-[4.4vw] items-center justify-center"
            style={{
              background:
                r === 'win'
                  ? 'linear-gradient(180deg,#1f9d55,#06371c)'
                  : r === 'lose'
                    ? 'linear-gradient(180deg,#c0392b,#4a0d08)'
                    : 'linear-gradient(180deg,#241409,#150b05)',
              borderColor: i === g.round ? '#c9a227' : '#170c04',
            }}
          >
            <span
              className={`txt-court text-[0.95vw] ${i === g.round && r === 'pending' ? 'anim-blink' : ''}`}
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
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    </CourtFrame>
  )
}
