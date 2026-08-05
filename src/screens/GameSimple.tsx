import { motion } from 'framer-motion'
import CourtFrame from './CourtFrame'
import { Gavel } from '../fx'
import type { AppState, Config, GameConfig, SimpleState } from '../types'

/** 규칙이 자유로운 공소사실. 판사가 인용/기각만 선고한다. */
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
  const undecided = !gc.charge || gc.charge === '미정'

  return (
    <CourtFrame state={state} config={config} gc={gc} g={g}>
      {/* 진행 방법 */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="panel tex-wood w-full px-[2.5vw] py-[1.6vh]"
      >
        <div className="txt-court mb-[0.5vh] text-[1vw] tracking-[0.3em] text-brass-300">
          심 리 방 법
        </div>
        <div
          className={`txt-court leading-snug ${undecided ? 'text-white/35' : 'text-brass-100'}`}
          style={{ fontSize: undecided ? '1.7vw' : '2.1vw' }}
        >
          {gc.rule || '심리 방법 미입력'}
        </div>
      </motion.div>

      {/* 선고 상태 */}
      <motion.div
        key={g.cleared ? 'win' : g.failed ? 'lose' : 'wait'}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="mt-[3vh] flex flex-col items-center"
      >
        {g.cleared ? (
          <>
            <Gavel size="8vw" strike />
            <div className="stamp stamp-grant -mt-[1vh] text-[5.5vw]">인 용</div>
          </>
        ) : g.failed ? (
          <>
            <Gavel size="8vw" />
            <div className="stamp -mt-[1vh] text-[5.5vw]">기 각</div>
          </>
        ) : (
          <>
            <div className="anim-bob">
              <Gavel size="7vw" />
            </div>
            <div className="txt-court anim-blink mt-[0.5vh] text-[3vw] text-brass-300">
              심 리 중
            </div>
          </>
        )}
      </motion.div>

      {g.failed && (
        <div className="txt-court anim-blink mt-[1.2vh] text-[1.7vw] text-love-lt">
          증인 신문으로 재심을 신청할 수 있습니다
        </div>
      )}
    </CourtFrame>
  )
}
