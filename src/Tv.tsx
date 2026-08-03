import { useEffect, useState } from 'react'
import { useSync, useFxListener } from './net'
import { FxLayer } from './fx'
import { initAudio, playFx, sfxSiren } from './sound'
import Intro from './screens/Intro'
import Dashboard from './screens/Dashboard'
import Mugshot from './screens/Mugshot'
import GameCulprit from './screens/GameCulprit'
import GameVoice from './screens/GameVoice'
import GameBonus from './screens/GameBonus'
import Certificate from './screens/Certificate'
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
    if (audioReady) playFx(f.kind)
  })

  const enable = () => {
    initAudio()
    setAudioReady(true)
    setTimeout(() => sfxSiren(2), 120)
  }

  if (!state || !config) {
    return (
      <div className="tv-root tex-concrete flex flex-col items-center justify-center">
        <div className="anim-blink text-[6vw]">🚨</div>
        <div className="txt-head mt-4 text-[2.5vw] text-tape">교정본부 접속 중...</div>
        <div className="txt-head mt-2 text-[1.2vw] text-white/40">
          {status === 'closed' ? '서버 연결 끊김 — 재시도 중' : '잠시만 기다려주세요'}
        </div>
      </div>
    )
  }

  const gc = state.activeGameId ? config.games.find((g) => g.id === state.activeGameId) : null

  const screen = (() => {
    switch (state.phase) {
      case 'intro':
        return <Intro config={config} />
      case 'mugshot':
        return <Mugshot config={config} />
      case 'certificate':
        return <Certificate state={state} config={config} />
      case 'game':
        if (!gc) return <Dashboard state={state} config={config} />
        if (gc.type === 'culprit') return <GameCulprit state={state} config={config} gc={gc} />
        if (gc.type === 'voice') return <GameVoice state={state} config={config} gc={gc} />
        if (gc.type === 'bonus') return <GameBonus state={state} config={config} gc={gc} />
        return <Dashboard state={state} config={config} />
      case 'dashboard':
      default:
        return <Dashboard state={state} config={config} />
    }
  })()

  const key = state.phase === 'game' ? `game:${state.activeGameId}` : state.phase

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35 }}
          className="h-full w-full"
        >
          {screen}
        </motion.div>
      </AnimatePresence>

      <FxLayer fx={fx} />

      {/* 진행자 공지 배너 */}
      <AnimatePresence>
        {state.banner && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            className="pointer-events-none fixed left-1/2 top-[12vh] z-[93] -translate-x-1/2"
          >
            <div
              className="anim-shake-loop border-[5px] border-black px-[3vw] py-[1vh]"
              style={{
                background: 'linear-gradient(180deg,#ff4437,#e10600 55%,#8f0400)',
                boxShadow: '0 10px 0 rgba(0,0,0,.55), 0 0 50px rgba(225,6,0,.7)',
              }}
            >
              <div className="txt-head text-[3vw] leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,.6)]">
                {state.banner}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 연결 상태 */}
      {status !== 'open' && (
        <div className="fixed bottom-3 left-3 z-[99] flex items-center gap-2 rounded-full border-2 border-black bg-siren-red px-3 py-1">
          <span className="led anim-blink bg-white text-white" />
          <span className="txt-head text-[13px] text-white">서버 연결 끊김 — 재접속 중</span>
        </div>
      )}

      {/* 사운드 활성화 */}
      {!audioReady && (
        <button
          onClick={enable}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/92"
          style={{ cursor: 'pointer' }}
        >
          <div className="anim-thump text-[9vw]">🔊</div>
          <div className="txt-head txt-glow-red mt-4 text-[4vw]">화면을 클릭하세요</div>
          <div className="txt-head mt-2 text-[1.6vw] text-tape">
            사운드를 켜고 작전을 시작합니다
          </div>
        </button>
      )}
    </div>
  )
}
