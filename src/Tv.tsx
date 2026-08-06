import { useEffect, useState } from 'react'
import { useSync, useFxListener } from './net'
import { FxLayer, Gavel } from './fx'
import { initAudio, playFx, sfxGavel, sfxCourtBell } from './sound'
import Intro from './screens/Intro'
import Dashboard from './screens/Dashboard'
import Defendant from './screens/Defendant'
import GameCulprit from './screens/GameCulprit'
import GameVoice from './screens/GameVoice'
import GameBonus from './screens/GameBonus'
import GameSimple from './screens/GameSimple'
import GameTally from './screens/GameTally'
import GameVersus from './screens/GameVersus'
import GameDraw from './screens/GameDraw'
import Verdict from './screens/Verdict'
import { motion, AnimatePresence } from 'framer-motion'
import type { Role } from './types'

export default function Tv({ role = 'tv' }: { role?: Role }) {
  const { state, config, status, fx } = useSync(role)
  const [audioReady, setAudioReady] = useState(false)

  useEffect(() => {
    document.body.dataset.role = role === 'tv' ? 'tv' : 'spectator'
    return () => {
      delete document.body.dataset.role
    }
  }, [role])

  useFxListener(fx, (f) => {
    if (audioReady) playFx(f.kind, f)
  })

  const enable = () => {
    initAudio()
    setAudioReady(true)
    setTimeout(() => sfxGavel(3), 140)
    setTimeout(() => sfxCourtBell(), 900)
  }

  if (!state || !config) {
    return (
      <div className="tv-root tex-hall flex flex-col items-center justify-center">
        <div className="anim-bob">
          <Gavel size="9vw" />
        </div>
        <div className="txt-court mt-4 text-[2.2vw] text-brass-300">법정 개정 준비 중…</div>
        <div className="txt-court mt-2 text-[1.1vw] text-white/35">
          {status === 'closed' ? '연결이 끊어졌습니다 — 재시도 중' : '잠시만 기다려 주십시오'}
        </div>
      </div>
    )
  }

  const gc = state.activeGameId ? config.games.find((g) => g.id === state.activeGameId) : null

  const screen = (() => {
    switch (state.phase) {
      case 'intro':
        return <Intro config={config} />
      case 'defendant':
        return <Defendant state={state} config={config} />
      case 'verdict':
        return <Verdict state={state} config={config} />
      case 'game':
        if (!gc) return <Dashboard state={state} config={config} />
        if (gc.type === 'culprit') return <GameCulprit state={state} config={config} gc={gc} />
        if (gc.type === 'voice') return <GameVoice state={state} config={config} gc={gc} />
        if (gc.type === 'bonus') return <GameBonus state={state} config={config} gc={gc} />
        if (gc.type === 'tally') return <GameTally state={state} config={config} gc={gc} />
        if (gc.type === 'versus') return <GameVersus state={state} config={config} gc={gc} />
        if (gc.type === 'draw') return <GameDraw state={state} config={config} gc={gc} />
        return <GameSimple state={state} config={config} gc={gc} />
      case 'dashboard':
      default:
        return <Dashboard state={state} config={config} />
    }
  })()

  const key = state.phase === 'game' ? `game:${state.activeGameId}` : state.phase

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/*
        화면 전환은 CSS 애니메이션으로만 처리한다.
        AnimatePresence(mode="wait") 는 exit 애니메이션이 끝나야 다음 화면을 그리는데,
        탭이 백그라운드로 가면 rAF 가 멈춰 전환이 영원히 완료되지 않는다.
      */}
      <div key={key} className="screen-in h-full w-full">
        {screen}
      </div>

      <FxLayer fx={fx} cry={config.defendant.cryPhoto} />

      {/* 재판장 공지 */}
      <AnimatePresence>
        {state.banner && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            className="pointer-events-none fixed left-1/2 top-[13vh] z-[93] -translate-x-1/2"
          >
            <div
              className="anim-shake-loop border-[5px] border-[#170c04] px-[3vw] py-[1vh]"
              style={{
                background: 'linear-gradient(180deg,#ffd97a,#c9a227 55%,#8a6508)',
                boxShadow: '0 10px 0 rgba(0,0,0,.55), 0 0 50px rgba(201,162,39,.7)',
              }}
            >
              <div className="txt-court text-[3vw] leading-none text-[#2a1509]">{state.banner}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status !== 'open' && (
        <div className="fixed bottom-3 left-3 z-[99] flex items-center gap-2 rounded-sm border-2 border-[#170c04] bg-reject px-3 py-1">
          <span className="anim-blink h-2 w-2 rounded-full bg-white" />
          <span className="txt-court text-[13px] text-white">연결 끊김 — 재접속 중</span>
        </div>
      )}

      {!audioReady && (
        <button
          onClick={enable}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/93"
          style={{ cursor: 'pointer' }}
        >
          <div className="anim-bob">
            <Gavel size="12vw" />
          </div>
          <div className="txt-court txt-gold mt-4 text-[4vw]">화면을 클릭하십시오</div>
          <div className="txt-court mt-2 text-[1.5vw] text-brass-300">
            소리를 켜고 공판을 개정합니다
          </div>
        </button>
      )}
    </div>
  )
}
