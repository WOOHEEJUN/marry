import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSync, useFxListener } from './net'
import { FxLayer, RollingNumber, PoliceTape, PrizeLadder } from './fx'
import { initAudio, playFx } from './sound'
import type { GameState } from './types'

/** 폰 관전 모드 — 세로 화면에 맞춘 요약 뷰 */
export default function Spectator() {
  const { state, config, status, fx } = useSync('spectator')
  const [audio, setAudio] = useState(false)

  useFxListener(fx, (f) => {
    if (audio) playFx(f.kind)
  })

  useEffect(() => {
    document.body.dataset.role = 'spectator'
    document.body.dataset.scroll = 'on'
    return () => {
      delete document.body.dataset.scroll
    }
  }, [])

  if (!state || !config) {
    return (
      <div className="tex-concrete flex min-h-full flex-col items-center justify-center">
        <div className="anim-blink text-[60px]">🚨</div>
        <div className="txt-head mt-3 text-[20px] text-tape">교정본부 접속 중...</div>
        {status === 'closed' && (
          <div className="txt-head mt-1 text-[13px] text-white/40">서버 연결 재시도 중</div>
        )}
      </div>
    )
  }

  const m = state.meta
  const pct = m.maxTotal > 0 ? Math.min(100, (state.prize.earned / m.maxTotal) * 100) : 0
  const gc = state.activeGameId ? config.games.find((g) => g.id === state.activeGameId) : null
  const g: GameState | null = state.activeGameId ? state.games[state.activeGameId] : null
  const remain = Math.max(0, m.next - state.prize.earned)

  return (
    <div className="tex-concrete tex-noise relative min-h-full pb-10">
      <FxLayer fx={fx} />

      {/* 헤더 */}
      <div className="relative overflow-hidden border-b-4 border-black bg-black/80 px-4 pb-3 pt-4">
        <PoliceTape
          className="left-[-20%] top-[-6px] w-[150%]"
          rotate={-4}
          height={22}
          text="POLICE LINE ★ DO NOT CROSS ★ "
        />
        <div className="relative mt-4 text-center">
          <div className="txt-head text-[13px] tracking-[0.3em] text-tape">교 정 본 부</div>
          <div className="txt-head txt-glow-red text-[26px] leading-tight">
            {config.groom.name} 검거 작전
          </div>
        </div>
      </div>

      {/* 보석금 */}
      <div className="px-4 pt-4">
        <div className="txt-head text-center text-[14px] tracking-[0.25em] text-tape">
          💰 적립 보석금
        </div>
        <motion.div
          key={state.prize.earned}
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 0.45 }}
          className="relative text-center"
        >
          <div className="absolute -inset-3 rounded-full bg-gold/20 blur-2xl" />
          <div className="txt-num txt-gold-plate relative text-[52px] leading-none">
            <RollingNumber value={state.prize.earned} />
            <span className="text-[22px]">{m.unit}</span>
          </div>
          <div className="txt-head text-[13px] text-white/45">
            집행 {m.cleared} / {m.totalGames} 성공 · 최대 {m.maxTotal}
            {m.unit}
          </div>
        </motion.div>

        <div className="relative mt-3 h-6 overflow-hidden rounded-full border-[3px] border-black bg-con-900">
          <div
            className="anim-sheen relative h-full overflow-hidden transition-[width] duration-1000"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#8a6508,#ffc72c 65%,#fff3c4)',
              boxShadow: '0 0 16px rgba(255,199,44,.7)',
            }}
          />
          <div className="txt-head absolute inset-0 flex items-center justify-center text-[12px] drop-shadow-[0_1px_2px_rgba(0,0,0,.95)]">
            {remain > 0 ? `다음 단계까지 ${remain}${m.unit}` : '최고 단계 도달!'}
          </div>
        </div>

        {/* 상금 사다리 */}
        <div className="no-bar mt-3 flex justify-center overflow-x-auto pb-1">
          <PrizeLadder
            ladder={config.prize.ladder}
            cleared={m.cleared}
            unit={m.unit}
            maxTotal={m.maxTotal}
            bonus={state.prize.bonus}
            size="sm"
          />
        </div>
      </div>

      {/* 현재 집행 */}
      <div className="px-4 pt-5">
        <div className="rounded-xl border-[3px] border-black bg-con-800/90 p-3 shadow-[0_5px_0_rgba(0,0,0,.5)]">
          <div className="txt-head text-[12px] tracking-widest text-tape">
            {gc ? gc.no : '현재 상태'}
          </div>
          <div className="txt-head text-[22px] leading-tight text-steel-lt">
            {gc
              ? gc.title
              : state.phase === 'intro'
                ? '작전 개시 대기'
                : state.phase === 'certificate'
                  ? '출소 심사'
                  : '대기 중'}
          </div>

          {g && (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex h-9 w-9 items-center justify-center rounded border-2 border-black text-[14px] ${
                      r === 'win'
                        ? 'bg-gold text-black'
                        : r === 'lose'
                          ? 'bg-siren-red text-white'
                          : i === g.round
                            ? 'anim-blink bg-tape text-black'
                            : 'bg-con-700 text-white/50'
                    }`}
                  >
                    {r === 'win' ? '○' : r === 'lose' ? '✕' : i + 1}
                  </div>
                ))}
              </div>
              {g.type === 'voice' && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="txt-head text-[13px] text-white/60">🔊 청취 잔여</span>
                  {Array.from({ length: gc?.maxListens ?? 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full border-2 border-black"
                      style={{
                        background:
                          i < (g as any).listensLeft
                            ? 'radial-gradient(circle at 35% 30%,#fff3c4,#ffc72c 50%,#8a6508)'
                            : '#1a1a1a',
                        boxShadow:
                          i < (g as any).listensLeft ? '0 0 10px rgba(255,199,44,.8)' : 'none',
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 집행 현황 */}
      <div className="px-4 pt-4">
        <div className="txt-head mb-2 text-[14px] tracking-widest text-tape">🏛 집행 현황</div>
        <div className="space-y-2">
          {config.games.map((x, i) => {
            const s = state.games[x.id]
            return (
              <div
                key={x.id}
                className={`flex items-center justify-between rounded-lg border-[3px] px-3 py-2 ${
                  s?.cleared
                    ? 'border-gold bg-gold/10'
                    : s?.failed
                      ? 'border-siren-red bg-siren-red/10'
                      : state.activeGameId === x.id
                        ? 'border-tape bg-tape/10'
                        : 'border-black bg-black/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="txt-head truncate text-[15px] text-steel-lt">{x.title}</div>
                  <div className="text-[12px] text-white/40">
                    {x.no}
                    {!x.bonus && ` · ${config.prize.ladder[i] ?? ''}${m.unit}`}
                  </div>
                </div>
                <div className="txt-head shrink-0 text-[15px]">
                  {s?.cleared ? (
                    <span className="text-gold">✅ 성공</span>
                  ) : s?.failed ? (
                    <span className="text-siren-red-lt">❌ 실패</span>
                  ) : state.activeGameId === x.id ? (
                    <span className="anim-blink text-tape">▶ 진행중</span>
                  ) : (
                    <span className="text-white/25">대기</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 기록 */}
      <div className="px-4 pt-4">
        <div className="txt-head mb-2 text-[14px] tracking-widest text-tape">📋 집행 기록</div>
        <div className="space-y-1">
          {state.log.length === 0 && (
            <div className="py-4 text-center text-[13px] text-white/25">아직 기록 없음</div>
          )}
          {state.log.slice(0, 20).map((l) => (
            <motion.div
              key={l.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center justify-between gap-2 rounded border-2 border-black bg-black/45 px-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] text-white/80">{l.label}</div>
                <div className="txt-num text-[11px] text-white/30">
                  {new Date(l.at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {l.delta !== 0 && (
                <div
                  className={`txt-num shrink-0 text-[19px] ${l.delta > 0 ? 'text-cash' : 'text-siren-red-lt'}`}
                >
                  {l.delta > 0 ? '+' : ''}
                  {l.delta}
                  {m.unit}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 사운드 */}
      {!audio && (
        <button
          onClick={() => {
            initAudio()
            setAudio(true)
          }}
          className="btn btn-gold fixed bottom-4 left-1/2 z-50 -translate-x-1/2 text-[15px]"
        >
          🔊 소리 켜기
        </button>
      )}

      {status !== 'open' && (
        <div className="fixed bottom-4 left-3 z-50 flex items-center gap-2 rounded-full border-2 border-black bg-siren-red px-3 py-1">
          <span className="led anim-blink bg-white text-white" />
          <span className="txt-head text-[12px] text-white">연결 끊김</span>
        </div>
      )}
    </div>
  )
}
