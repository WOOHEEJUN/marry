import { motion } from 'framer-motion'
import { Grunge, PrisonBars, Chain, PhotoBox } from '../fx'
import type { Config } from '../types'

const TICKS = [190, 180, 170, 160, 150, 140]

export default function Mugshot({ config }: { config: Config }) {
  const g = config.groom
  return (
    <div className="tv-root tex-noise flex flex-col">
      <Grunge tone="steel" />
      <PrisonBars opacity={0.2} />
      <Chain className="left-[2%] top-0" vertical />
      <Chain className="right-[2%] top-0" vertical />

      {/* 제목 */}
      <div className="relative z-20 flex items-center justify-center gap-[1.2vw] pt-[2.5vh]">
        <span className="text-[2.6vw]">⛓️</span>
        <h1 className="txt-head txt-chrome text-[5vw] leading-none tracking-[0.16em]">
          교 정 본 부
        </h1>
        <span className="text-[2.6vw]">⛓️</span>
      </div>

      <div className="relative z-20 mt-[1vh] flex justify-center">
        <div className="plate tex-plate px-[3vw] py-[0.5vh] text-center">
          <div className="txt-head text-[1vw] tracking-[0.35em] text-steel">수감자 번호</div>
          <div className="txt-num anim-flicker text-[3vw] leading-none text-steel-lt">
            {g.prisonNo}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="relative z-20 mt-[2vh] flex flex-1 items-start justify-center gap-[2.5vw] px-[5vw]">
        {/* 신장 눈금 + 사진 */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 16 }}
          className="relative flex"
        >
          {/* 눈금자 */}
          <div className="relative mr-[0.6vw] flex w-[4vw] flex-col justify-between py-[1vh]">
            {TICKS.map((t) => (
              <div key={t} className="relative flex items-center">
                <span className="txt-num w-full text-right text-[1.15vw] text-white/70">
                  {t}cm
                </span>
                <div className="ml-1 h-[3px] w-[1.2vw] bg-white/45" />
              </div>
            ))}
          </div>

          {/* 사진 (배경에 미세 눈금선) */}
          <div
            className="relative border-[6px] border-black shadow-[0_16px_44px_rgba(0,0,0,.85)]"
            style={{
              width: '34vw',
              height: '52vh',
              backgroundImage:
                'repeating-linear-gradient(180deg, rgba(255,255,255,.14) 0 2px, transparent 2px 9.5%)',
              backgroundColor: '#20262b',
            }}
          >
            <PhotoBox
              src={g.photo}
              label="신랑 사진"
              className="h-full w-full"
              style={{ borderStyle: g.photo ? 'none' : undefined }}
            />
            {/* 촬영 눈금 */}
            <div className="pointer-events-none absolute inset-0 border-[3px] border-white/15" />
          </div>
        </motion.div>

        {/* 정보 테이블 */}
        <motion.div
          initial={{ x: 70, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex w-[38vw] flex-col gap-[0.9vh]"
        >
          {(
            [
              ['죄  명', g.crimeName, false],
              ['형  량', g.sentence, false],
              ['수감일', config.party.weddingDate.replace(/-/g, '. '), false],
              ['가석방', g.parole, false],
              ['특이사항', g.note, true],
            ] as [string, string, boolean][]
          ).map(([k, v, warn], i) => (
            <motion.div
              key={k}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-stretch gap-[0.6vw]"
            >
              <div className="plate tex-plate flex w-[8vw] shrink-0 items-center justify-center py-[0.7vh]">
                <span className="txt-head text-[1.35vw] tracking-[0.2em] text-steel">{k}</span>
              </div>
              <div className="flex flex-1 items-center border-[3px] border-black bg-black/55 px-[1vw] py-[0.7vh]">
                <span
                  className={`txt-head text-[1.6vw] ${warn ? 'txt-glow-red' : 'text-white/92'}`}
                >
                  {v}
                </span>
              </div>
            </motion.div>
          ))}

          {/* 여죄 목록 */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-[0.8vh] border-[3px] border-black bg-black/55 p-[1vw]"
          >
            <div className="txt-head mb-[0.5vh] text-[1.2vw] tracking-widest text-tape">
              ⚠️ 여죄 (친구 진술)
            </div>
            <ul className="space-y-[0.3vh]">
              {g.crimes.map((c, i) => (
                <motion.li
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.75 + i * 0.1 }}
                  className="txt-head text-[1.35vw] text-white/85"
                >
                  <span className="mr-2 text-siren-red-lt">▸</span>
                  {c}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>

      {/* 하단 명패 */}
      <div className="relative z-20 mb-[2vh] flex justify-center">
        <div className="plate tex-plate anim-sheen relative w-[76vw] overflow-hidden py-[0.9vh] text-center">
          <div className="txt-head text-[2.3vw] text-steel-lt">
            이제 너의 인생은 <span className="txt-glow-love">{config.bride.name}</span> 님이
            관리한다.
          </div>
        </div>
      </div>
    </div>
  )
}
