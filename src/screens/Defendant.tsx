import { motion } from 'framer-motion'
import { Hall, Curtains, PhotoBox, Plaque, Emblem } from '../fx'
import type { AppState, Config } from '../types'

export default function Defendant({ state, config }: { state: AppState; config: Config }) {
  const d = config.defendant
  const m = state.meta
  const rows: [string, string][] = [
    ['성 명', d.name],
    ['직 업', d.job || '-'],
    ['주 거', d.address || '-'],
    ['총 구형', `징역 ${m.demandTotal}년`],
    ['확정 징역', `${m.demandStanding}년`],
  ]

  return (
    <div className="tv-root tex-noise flex flex-col">
      <Hall />
      <Curtains width="9vw" />

      {/* 제목 */}
      <div className="relative z-20 flex items-center justify-center gap-[1.4vw] pt-[2vh]">
        <Emblem size="5vw" label="법 원" />
        <div className="text-center">
          <h1 className="txt-court txt-gold text-[3.6vw] leading-none tracking-[0.2em]">
            피 고 인 신 문
          </h1>
          <div className="txt-court mt-[0.3vh] text-[1vw] tracking-[0.3em] text-brass-300">
            {config.court.caseNo} · {config.court.room}
          </div>
        </div>
        <Emblem size="5vw" label="법 원" />
      </div>

      {/* 본문 */}
      <div className="relative z-20 mt-[2vh] flex flex-1 items-start justify-center gap-[2.5vw] px-[13vw]">
        {/* 사진 */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 16 }}
          className="shrink-0"
        >
          <div
            className="frame-gold relative flex items-center justify-center"
            style={{ width: '34vw', height: '42vh', background: '#150b05' }}
          >
            <PhotoBox
              src={d.photo}
              label="피고인 사진"
              fit="contain"
              className="h-full w-full"
            />
          </div>
          <Plaque className="mt-[0.8vh] w-full py-[0.4vh] text-center">
            <div className="txt-court text-[1.5vw] leading-none text-[#2a1509]">
              피고인 {d.name}
            </div>
          </Plaque>
        </motion.div>

        {/* 인적사항 */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-1 flex-col gap-[0.7vh]"
        >
          {rows.map(([k, v], i) => (
            <motion.div
              key={k}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="flex items-stretch gap-[0.5vw]"
            >
              <Plaque className="flex w-[8vw] shrink-0 items-center justify-center py-[0.55vh]">
                <span className="txt-court text-[1.2vw] tracking-[0.2em] text-[#2a1509]">{k}</span>
              </Plaque>
              <div className="panel tex-wood flex flex-1 items-center px-[1vw] py-[0.55vh]">
                <span
                  className={`txt-court text-[1.5vw] ${
                    k === '확정 징역' && m.demandStanding > 0
                      ? 'txt-glow-reject'
                      : 'text-brass-100'
                  }`}
                >
                  {v}
                </span>
              </div>
            </motion.div>
          ))}

          {/* 전과 */}
          <motion.div
            initial={{ y: 26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="panel tex-wood mt-[0.5vh] p-[1vw]"
          >
            <div className="txt-court mb-[0.4vh] text-[1.1vw] tracking-widest text-brass-300">
              전과 및 여죄 (검사 진술)
            </div>
            <ul className="space-y-[0.25vh]">
              {d.record.map((c, i) => (
                <motion.li
                  key={i}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.09 }}
                  className="txt-court text-[1.25vw] text-white/85"
                >
                  <span className="mr-2 text-reject-lt">一.</span>
                  {c}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="panel mt-[0.3vh] px-[1vw] py-[0.5vh]"
            style={{ background: 'linear-gradient(180deg,#4a0d10,#200407)' }}
          >
            <span className="txt-court text-[1vw] tracking-widest text-reject-lt">특이사항 </span>
            <span className="txt-court text-[1.3vw] text-white">{d.note}</span>
          </motion.div>
        </motion.div>
      </div>

      {/* 하단 */}
      <div className="relative z-20 mb-[2vh] flex justify-center">
        <Plaque className="w-[62vw] py-[0.55vh] text-center">
          <div className="txt-court text-[1.8vw] text-[#2a1509]">
            피고인은 진술을 거부할 권리가 없다
          </div>
        </Plaque>
      </div>
    </div>
  )
}
