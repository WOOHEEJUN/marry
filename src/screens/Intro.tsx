import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { Hall, Curtains, Scales, Gavel, Emblem, Plaque, CourtTicker, PhotoBox } from '../fx'
import type { Config } from '../types'

function calc(target: string) {
  const t = new Date(target + 'T11:00:00+09:00').getTime()
  const diff = t - Date.now()
  return {
    d: Math.max(0, Math.floor(diff / 86400000)),
    h: Math.max(0, Math.floor((diff % 86400000) / 3600000)),
    m: Math.max(0, Math.floor((diff % 3600000) / 60000)),
    s: Math.max(0, Math.floor((diff % 60000) / 1000)),
  }
}

function Qr({ size = 92 }: { size?: number }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    QRCode.toDataURL(location.origin, {
      width: size * 3,
      margin: 1,
      color: { dark: '#150b05', light: '#f4efe3' },
    })
      .then(setUrl)
      .catch(() => {})
  }, [size])
  if (!url) return null
  return (
    <div className="flex flex-col items-center gap-[0.3vh]">
      <div
        className="rounded-sm border-[3px] border-[#6d4f06] p-[3px]"
        style={{ background: '#f4efe3', boxShadow: '0 0 18px rgba(201,162,39,.5)' }}
      >
        <img src={url} alt="방청 접속 QR" style={{ width: size, height: size }} />
      </div>
      <div className="txt-court text-[0.72vw] tracking-widest text-brass-300">방청 접속</div>
    </div>
  )
}

export default function Intro({ config }: { config: Config }) {
  const [dd, setDd] = useState(() => calc(config.court.weddingDate))
  useEffect(() => {
    const id = setInterval(() => setDd(calc(config.court.weddingDate)), 1000)
    return () => clearInterval(id)
  }, [config.court.weddingDate])

  const totalDemand = config.games
    .filter((g) => !g.bonus)
    .reduce((a, g) => a + (g.demand ?? 0), 0)
  const counts = config.games.filter((g) => !g.bonus).length

  return (
    <div className="tv-root tex-noise">
      <Hall />
      <Curtains />

      <div className="relative z-20 flex h-full flex-col items-center pt-[1.5vh]">
        {/* 법원 문장 + 법정 표시 */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          className="flex items-center gap-[1.6vw]"
        >
          <Scales size="5.5vw" />
          <Emblem size="7vw" label="법 원" />
          <div className="anim-bob">
            <Gavel size="7vw" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="txt-court mt-[0.4vh] text-center text-[1.3vw] tracking-[0.35em] text-brass-300"
        >
          {config.court.name || ''} {config.court.room}
          <div className="text-[1vw] tracking-[0.2em] text-white/45">
            사건번호 {config.court.caseNo}
            {config.court.caseName ? ` · ${config.court.caseName}` : ''}
          </div>
        </motion.div>

        {/* 개정 선언 */}
        <motion.h1
          initial={{ scale: 1.9, opacity: 0, filter: 'blur(12px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.2, 1.2, 0.3, 1] }}
          className="txt-court txt-gold mt-[0.6vh] text-center text-[6.4vw] leading-none tracking-[0.16em]"
        >
          공 판 개 시
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="txt-court mt-[0.4vh] text-[1.7vw] text-white/80"
        >
          {config.court.title}
        </motion.div>

        {/* 피고인 */}
        <div className="mt-[1.6vh] flex items-center gap-[2.6vw]">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-right"
          >
            <div className="txt-court text-[1.1vw] tracking-[0.3em] text-brass-300">피 고 인</div>
            <div className="txt-head txt-gold text-[3.6vw] leading-none">
              {config.defendant.name}
            </div>
            <div className="txt-court mt-[0.4vh] text-[1vw] text-white/55">
              {config.defendant.job}
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 160, damping: 15 }}
            className="frame-gold relative"
            style={{ width: '24vw', height: '27vh' }}
          >
            <PhotoBox
              src={config.defendant.photo}
              label="피고인 사진"
              className="h-full w-full"
            />
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-left"
          >
            <div className="txt-court text-[1.1vw] tracking-[0.3em] text-brass-300">총 구형</div>
            <div className="txt-num txt-glow-reject text-[3.6vw] leading-none">
              징역 {totalDemand}년
            </div>
            <div className="txt-court mt-[0.4vh] text-[1vw] text-white/55">
              공소사실 {counts}건 · 검사 {config.prosecutors.length}인
            </div>
          </motion.div>
        </div>

        {/* 선고 예정일 */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-[1.6vh] flex items-center gap-[1.2vw]"
        >
          <Plaque className="px-[1.6vw] py-[0.45vh] text-center">
            <div className="txt-court text-[0.85vw] tracking-[0.3em] text-[#4a3405]">
              최종 선고일
            </div>
            <div className="txt-court text-[1.5vw] leading-none text-[#2a1509]">
              {config.court.weddingDate.replace(/-/g, '. ')}
            </div>
          </Plaque>

          <div className="txt-court flex items-baseline gap-[0.5vw] text-[2vw] text-white">
            선고까지
            <span className="txt-num txt-glow-gold anim-blink text-[3.2vw]">D-{dd.d}</span>
          </div>

          <div className="txt-num text-[1.3vw] tracking-widest text-brass-300">
            {String(dd.h).padStart(2, '0')} : {String(dd.m).padStart(2, '0')} :{' '}
            {String(dd.s).padStart(2, '0')}
          </div>
        </motion.div>

        {/* 개정 선언문 */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 180, damping: 15 }}
          className="panel tex-wood mt-[1.6vh] px-[3vw] py-[0.9vh] text-center"
          style={{ boxShadow: '0 0 40px rgba(201,162,39,.28), 0 10px 0 rgba(0,0,0,.5)' }}
        >
          <div className="txt-court text-[1.5vw] leading-tight text-brass-100">
            지금부터 {config.defendant.name} 피고인에 대한
          </div>
          <div className="txt-court txt-gold text-[2.6vw] leading-tight">
            선물미션 공판을 개정합니다
          </div>
        </motion.div>
      </div>

      {/* 좌하단 QR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-[7vh] left-[15vw] z-30"
      >
        <Qr size={88} />
      </motion.div>

      {/* 하단 게시 */}
      <div className="absolute bottom-0 left-0 z-30 w-full">
        <CourtTicker
          label="공지"
          items={[
            `사건번호 ${config.court.caseNo} · 피고인 ${config.defendant.name}`,
            `검사 ${config.prosecutors.length}인, 공소사실 ${counts}건 제기`,
            `총 구형 징역 ${totalDemand}년`,
            `참고인 ${config.witness.name} 출석 예정`,
            '인용되는 공소사실마다 적립금이 상승합니다',
          ]}
        />
      </div>
    </div>
  )
}
