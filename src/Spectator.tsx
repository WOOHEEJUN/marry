import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSync, useFxListener } from './net'
import { FxLayer, RollingNumber, PrizeLadder, Scales } from './fx'
import { initAudio, playFx, setSoundMap } from './sound'
import type { GameState } from './types'

/** 폰 방청 모드 — 세로 화면 요약 뷰 */
export default function Spectator() {
  const { state, config, status, fx } = useSync('spectator')
  const [audio, setAudio] = useState(false)

  useFxListener(fx, (f) => {
    if (audio) playFx(f.kind, f)
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
      <div className="tex-hall flex min-h-full flex-col items-center justify-center">
        <div className="anim-bob text-[52px]">⚖️</div>
        <div className="txt-court mt-3 text-[18px] text-brass-300">법정 접속 중…</div>
        {status === 'closed' && (
          <div className="txt-court mt-1 text-[13px] text-white/35">연결 재시도 중</div>
        )}
      </div>
    )
  }

  const m = state.meta
  const pct = m.maxTotal > 0 ? Math.min(100, (state.prize.earned / m.maxTotal) * 100) : 0
  const gc = state.activeGameId ? config.games.find((g) => g.id === state.activeGameId) : null
  const g: GameState | null = state.activeGameId ? state.games[state.activeGameId] : null
  const remain = Math.max(0, m.next - state.prize.earned)
  const mains = config.games.filter((x) => !x.bonus)

  return (
    <div className="tex-hall tex-noise relative min-h-full pb-12">
      <FxLayer fx={fx} cry={config.defendant.cryPhoto} />

      {/* 헤더 */}
      <div className="relative border-b-[3px] border-[#170c04] bg-[#150b05]/85 px-4 pb-3 pt-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Scales size="34px" />
          <div>
            <div className="txt-court text-[11px] tracking-[0.3em] text-brass-300">
              {config.court.room} · {config.court.caseNo}
            </div>
            <div className="txt-court txt-gold text-[22px] leading-tight">
              {config.court.title}
            </div>
          </div>
          <Scales size="34px" />
        </div>
        <div className="txt-court mt-1 text-[13px] text-white/50">
          피고인 {config.defendant.name}
        </div>
      </div>

      {/* 적립금 */}
      <div className="px-4 pt-4">
        <div className="txt-court text-center text-[13px] tracking-[0.3em] text-brass-300">
          누 적 적 립 금
        </div>
        <motion.div
          key={state.prize.earned}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 0.45 }}
          className="relative text-center"
        >
          <div className="absolute -inset-3 rounded-full bg-brass/20 blur-2xl" />
          <div className="txt-num txt-gold relative text-[50px] leading-none">
            <RollingNumber value={state.prize.earned} />
            <span className="text-[20px]">{m.unit}</span>
          </div>
          <div className="txt-court text-[12px] text-white/45">
            공소사실 {m.cleared} / {m.totalGames} 인용 · 최대 {m.maxTotal}
            {m.unit}
          </div>
        </motion.div>

        <div
          className="relative mt-3 h-6 overflow-hidden rounded-sm border-[3px] border-[#170c04]"
          style={{ background: '#241409' }}
        >
          <div
            className="anim-sheen relative h-full overflow-hidden transition-[width] duration-1000"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#6d4f06,#c9a227 65%,#fff3c4)',
              boxShadow: '0 0 16px rgba(201,162,39,.7)',
            }}
          />
          <div className="txt-court absolute inset-0 flex items-center justify-center text-[12px] drop-shadow-[0_1px_2px_rgba(0,0,0,.95)]">
            {remain > 0 ? `다음 단계까지 ${remain}${m.unit}` : '최고 단계 도달'}
          </div>
        </div>

        {m.demandStanding > 0 && (
          <div className="txt-court mt-2 text-center text-[13px] text-reject-lt">
            확정 징역 {m.demandStanding}년 · 총 구형 {m.demandTotal}년
          </div>
        )}

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

      {/* 현재 심리 */}
      <div className="px-4 pt-5">
        <div className="panel tex-wood p-3">
          <div className="txt-court text-[11px] tracking-widest text-brass-300">
            {gc ? `${gc.no} · ${gc.prosecutor || ''}` : '현재 상태'}
          </div>
          <div className="txt-head text-[20px] leading-tight text-brass-100">
            {gc
              ? gc.charge || gc.title
              : state.phase === 'intro'
                ? '개정 대기'
                : state.phase === 'verdict'
                  ? '판결 선고'
                  : '휴정'}
          </div>
          {gc?.demand ? (
            <div className="txt-num mt-1 text-[14px] text-reject-lt">구형 징역 {gc.demand}년</div>
          ) : null}

          {g && g.results.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {g.results.map((r, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-[#170c04]"
                  style={{
                    background:
                      r === 'win'
                        ? 'linear-gradient(180deg,#1f9d55,#06371c)'
                        : r === 'lose'
                          ? 'linear-gradient(180deg,#c0392b,#4a0d08)'
                          : i === g.round
                            ? 'linear-gradient(180deg,#c9a227,#6d4f06)'
                            : '#241409',
                  }}
                >
                  <span
                    className="txt-court text-[13px]"
                    style={{
                      color:
                        r === 'pending' && i !== g.round ? 'rgba(255,255,255,.3)' : '#fff',
                    }}
                  >
                    {r === 'win' ? '○' : r === 'lose' ? '✕' : i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {g && g.type === 'voice' && (
            <div className="mt-3 flex items-center gap-2">
              <span className="txt-court text-[12px] text-white/55">청취 잔여</span>
              {Array.from({ length: gc?.maxListens ?? 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-full border-2 border-[#170c04]"
                  style={{
                    background:
                      i < (g as any).listensLeft
                        ? 'radial-gradient(circle at 35% 30%,#fff3c4,#c9a227 50%,#6d4f06)'
                        : '#1a0d05',
                    boxShadow: i < (g as any).listensLeft ? '0 0 10px rgba(201,162,39,.8)' : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 공소사실 목록 */}
      <div className="px-4 pt-4">
        <div className="txt-court mb-2 text-[13px] tracking-widest text-brass-300">공 소 사 실</div>
        <div className="space-y-2">
          {mains.map((x, i) => {
            const s = state.games[x.id]
            return (
              <div
                key={x.id}
                className="panel flex items-center justify-between px-3 py-2"
                style={{
                  background: 'linear-gradient(180deg,#2e1a0c,#150b05)',
                  borderColor: s?.cleared
                    ? '#1f9d55'
                    : s?.failed
                      ? '#c0392b'
                      : state.activeGameId === x.id
                        ? '#c9a227'
                        : '#170c04',
                }}
              >
                <div className="min-w-0">
                  <div className="txt-head truncate text-[15px] text-brass-100">
                    {x.charge || x.title}
                  </div>
                  <div className="txt-court text-[11px] text-white/40">
                    제{i + 1}항 · {x.prosecutor} · 징역 {x.demand ?? 0}년 ·{' '}
                    {config.prize.ladder[i] ?? ''}
                    {m.unit}
                  </div>
                </div>
                <div className="txt-court shrink-0 text-[14px]">
                  {s?.cleared ? (
                    <span className="text-grant-lt">인용</span>
                  ) : s?.failed ? (
                    <span className="text-reject-lt">기각</span>
                  ) : state.activeGameId === x.id ? (
                    <span className="anim-blink text-brass-300">심리중</span>
                  ) : (
                    <span className="text-white/25">대기</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 심리 기록 */}
      <div className="px-4 pt-4">
        <div className="txt-court mb-2 text-[13px] tracking-widest text-brass-300">심 리 기 록</div>
        <div className="space-y-1">
          {state.log.length === 0 && (
            <div className="txt-court py-4 text-center text-[13px] text-white/25">
              아직 기록 없음
            </div>
          )}
          {state.log.slice(0, 20).map((l) => (
            <motion.div
              key={l.id}
              initial={{ x: 16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center justify-between gap-2 border-2 border-[#170c04] bg-black/45 px-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="txt-court truncate text-[13px] text-white/80">{l.label}</div>
                <div className="txt-num text-[11px] text-white/28">
                  {new Date(l.at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {l.delta !== 0 && (
                <div
                  className={`txt-num shrink-0 text-[18px] ${
                    l.delta > 0 ? 'text-grant-lt' : 'text-reject-lt'
                  }`}
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

      {!audio && (
        <button
          onClick={() => {
            initAudio()
            setSoundMap(config.sounds)
            setAudio(true)
          }}
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-sm border-[3px] border-[#170c04] px-4 py-2"
          style={{ background: 'linear-gradient(180deg,#ffd97a,#c9a227)' }}
        >
          <span className="txt-court text-[15px] text-[#2a1509]">소리 켜기</span>
        </button>
      )}

      {status !== 'open' && (
        <div className="fixed bottom-4 left-3 z-50 flex items-center gap-2 rounded-sm border-2 border-[#170c04] bg-reject px-3 py-1">
          <span className="anim-blink h-2 w-2 rounded-full bg-white" />
          <span className="txt-court text-[12px] text-white">연결 끊김</span>
        </div>
      )}
    </div>
  )
}
