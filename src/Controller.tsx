import { useEffect, useState } from 'react'
import { useSync } from './net'
import { PrizeLadder } from './fx'
import type {
  AppState,
  BonusState,
  Config,
  CulpritState,
  GameConfig,
  GameState,
  SimpleState,
  VoiceState,
} from './types'

const PIN_KEY = 'marry.pin'

// ══════════════════════════════════════════════════════════════
// 공용 소품
// ══════════════════════════════════════════════════════════════

function Section({
  title,
  desc,
  children,
  tone = 'steel',
}: {
  title: string
  desc?: string
  children: React.ReactNode
  tone?: 'steel' | 'red' | 'love' | 'gold'
}) {
  const border =
    tone === 'red'
      ? 'border-siren-red/70'
      : tone === 'love'
        ? 'border-love/70'
        : tone === 'gold'
          ? 'border-gold/70'
          : 'border-black'
  return (
    <div className={`rounded-xl border-[3px] ${border} bg-con-800/90 p-3 shadow-[0_5px_0_rgba(0,0,0,.5)]`}>
      <div className="txt-head text-[15px] tracking-widest text-tape">{title}</div>
      {desc && <div className="mb-2 mt-0.5 text-[12px] font-normal leading-snug text-white/45">{desc}</div>}
      {!desc && <div className="mb-2" />}
      {children}
    </div>
  )
}

function B({
  children,
  onClick,
  tone = 'steel',
  disabled,
  className = '',
  small,
}: {
  children: React.ReactNode
  onClick?: () => void
  tone?: 'red' | 'blue' | 'gold' | 'steel' | 'love' | 'green'
  disabled?: boolean
  className?: string
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${tone} ${small ? 'text-[13px] !py-2' : 'text-[16px]'} ${className}`}
    >
      {children}
    </button>
  )
}

/** 버튼 아래 붙는 한 줄 설명 */
function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-center text-[11px] font-normal text-white/40">{children}</div>
}

// ══════════════════════════════════════════════════════════════
// PIN 게이트
// ══════════════════════════════════════════════════════════════

function PinGate({ onSubmit, denied }: { onSubmit: (p: string) => void; denied: boolean }) {
  const [v, setV] = useState('')
  return (
    <div className="tex-concrete flex min-h-full flex-col items-center justify-center p-6">
      <div className="text-[64px]">🔒</div>
      <div className="txt-head txt-glow-red mt-2 text-[30px]">교정본부 관제실</div>
      <div className="txt-head mt-1 text-[14px] text-white/50">진행자 전용 · PIN 입력</div>

      <input
        value={v}
        onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 8))}
        inputMode="numeric"
        placeholder="••••"
        className="txt-num mt-6 w-[220px] rounded-lg border-[4px] border-black bg-black/70 px-4 py-3 text-center text-[36px] tracking-[0.4em] text-tape outline-none focus:border-tape"
      />
      {denied && (
        <div className="txt-head anim-blink mt-3 text-[15px] text-siren-red-lt">
          ⚠️ PIN이 틀렸습니다
        </div>
      )}
      <div className="mt-5 grid w-[260px] grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((k) => (
          <B
            key={k}
            tone={k === 'C' ? 'red' : k === '←' ? 'blue' : 'steel'}
            onClick={() => {
              if (k === 'C') setV('')
              else if (k === '←') setV((s) => s.slice(0, -1))
              else setV((s) => (s.length < 8 ? s + k : s))
            }}
          >
            {k}
          </B>
        ))}
      </div>
      <B tone="gold" className="mt-4 w-[260px] !py-4 text-[20px]" onClick={() => onSubmit(v)}>
        🚨 관제실 입장
      </B>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 게임별 컨트롤
// ══════════════════════════════════════════════════════════════

/** 모든 게임 상단에 공통으로 붙는 현재 상태 + 규칙 */
function GameHeader({ gc, g, meta }: { gc: GameConfig; g: GameState; meta: AppState['meta'] }) {
  return (
    <div className="mb-3 rounded-lg border-2 border-tape/40 bg-black/50 p-2">
      <div className="flex items-center justify-between">
        <span className="txt-head text-[13px] text-tape">{gc.no}</span>
        <span
          className={`txt-head rounded border-2 px-2 text-[12px] ${
            g.cleared
              ? 'border-gold text-gold'
              : g.failed
                ? 'border-siren-red text-siren-red-lt'
                : 'border-con-400 text-white/60'
          }`}
        >
          {g.cleared ? '✅ 성공' : g.failed ? '❌ 실패' : '진행중'}
        </span>
      </div>
      <div className="txt-head text-[18px] text-white">{gc.title}</div>
      {gc.rule && (
        <div className="mt-1 text-[12px] font-normal leading-snug text-white/50">{gc.rule}</div>
      )}
      {gc.win && (
        <div className="mt-1 text-[12px] font-normal text-tape">✅ 성공 조건: {gc.win}</div>
      )}
      {!g.cleared && (
        <div className="mt-1 text-[12px] font-normal text-cash">
          이 게임 성공 시 보석금 {meta.next}
          {meta.unit} 도달
        </div>
      )}
    </div>
  )
}

function SimpleControl({ gc, g, d }: { gc: GameConfig; g: SimpleState; d: (a: any) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <B tone="green" disabled={g.cleared} onClick={() => d({ type: 'game.clear' })}>
          ✅ 집행 성공
        </B>
        <B tone="red" disabled={g.cleared || g.failed} onClick={() => d({ type: 'game.fail' })}>
          ❌ 집행 실패
        </B>
      </div>
      <Hint>성공을 누르면 보석금이 다음 단계로 올라갑니다</Hint>
    </>
  )
}

function CulpritControl({
  g,
  gc,
  config,
  d,
}: {
  g: CulpritState
  gc: GameConfig
  config: Config
  d: (a: any) => void
}) {
  const ev = (gc.evidences || [])[g.round % (gc.evidences?.length || 1)]
  const wins = g.results.filter((r) => r === 'win').length
  return (
    <>
      <div className="mb-2 flex items-center justify-between rounded-lg bg-black/50 px-2 py-1">
        <span className="text-[13px] text-white/60">
          ROUND {g.round + 1} / {g.results.length}
        </span>
        <span className="text-[13px] text-tape">
          적중 {wins} / {gc.clearThreshold ?? 1} 필요
        </span>
      </div>

      {ev && (
        <div className="mb-3 rounded-lg border-2 border-tape/50 bg-black/50 p-2 text-center">
          <div className="text-[12px] text-white/50">이번 라운드 증거물</div>
          <div className="txt-head text-[17px] text-tape">
            {ev.emoji} {ev.real} vs {ev.fake}
          </div>
        </div>
      )}

      <div className="mb-1 text-[13px] text-white/60">① 벌칙 음식 먹은 사람 🔒 나만 보임</div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {config.suspects.map((s) => (
          <B
            key={s.id}
            small
            tone={g.guilty === s.id ? 'gold' : 'steel'}
            onClick={() => d({ type: 'culprit.setGuilty', suspectId: s.id })}
          >
            {g.guilty === s.id ? '🩸 ' : ''}
            {s.name}
          </B>
        ))}
      </div>

      <div className="mb-1 text-[13px] text-white/60">
        ② {config.groom.name}이 지목한 사람 — TV에 조준선이 뜹니다
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {config.suspects.map((s) => (
          <B
            key={s.id}
            small
            tone={g.picked === s.id ? 'red' : 'steel'}
            disabled={g.revealed}
            onClick={() => d({ type: 'culprit.pick', suspectId: s.id })}
          >
            {g.picked === s.id ? '🎯 ' : ''}
            {s.name}
          </B>
        ))}
      </div>

      <div className="mb-1 text-[13px] text-white/60">③ 판정</div>
      {g.guilty !== null && g.picked !== null && !g.revealed && (
        <div className="mb-2 rounded bg-tape/15 py-1 text-center text-[13px] text-tape">
          자동 판정: {g.guilty === g.picked ? '⭕ 적중' : '❌ 빗나감'}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <B
          tone="green"
          disabled={g.revealed || g.picked === null}
          onClick={() => d({ type: 'culprit.judge', win: true })}
        >
          ⭕ 적중!
        </B>
        <B
          tone="red"
          disabled={g.revealed || g.picked === null}
          onClick={() => d({ type: 'culprit.judge', win: false })}
        >
          ❌ 빗나감
        </B>
      </div>
      <Hint>{gc.clearThreshold ?? 1}회 적중하면 자동으로 게임 성공 처리됩니다</Hint>

      <B tone="blue" small className="mt-3 w-full" onClick={() => d({ type: 'culprit.next' })}>
        ▶ 다음 라운드
      </B>
      <div className="mt-2 flex gap-2">
        {g.results.map((r, i) => (
          <button
            key={i}
            onClick={() => d({ type: 'culprit.setRound', round: i })}
            className={`flex-1 rounded border-2 border-black py-1 text-[13px] ${
              r === 'win'
                ? 'bg-gold text-black'
                : r === 'lose'
                  ? 'bg-siren-red text-white'
                  : i === g.round
                    ? 'bg-tape text-black'
                    : 'bg-con-700 text-white/60'
            }`}
          >
            R{i + 1}
          </button>
        ))}
      </div>
    </>
  )
}

function VoiceControl({ g, gc, d }: { g: VoiceState; gc: GameConfig; d: (a: any) => void }) {
  const maxL = gc.maxListens ?? 3
  const wins = g.results.filter((r) => r === 'win').length
  return (
    <>
      <div className="mb-2 flex items-center justify-between rounded-lg bg-black/50 px-2 py-1">
        <span className="text-[13px] text-white/60">
          Q {g.round + 1} / {g.results.length}
        </span>
        <span className="text-[13px] text-tape">
          정답 {wins} / {gc.clearThreshold ?? 3} 필요
        </span>
      </div>

      <div className="mb-3 rounded-lg border-[3px] border-siren-red bg-siren-red/15 p-3 text-center">
        <div className="txt-head text-[12px] tracking-widest text-siren-red-lt">
          🔒 정답 — 나만 보임 (TV엔 글자 수만 표시)
        </div>
        <div className="txt-head mt-1 text-[34px] leading-none tracking-[0.15em] text-white">
          {g.word || '(단어 미설정)'}
        </div>
        <div className="mt-1 text-[13px] text-white/50">{g.wordLength}글자</div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <B tone="gold" onClick={() => d({ type: 'voice.countdown' })}>
          📣 발성 신호
        </B>
        <B tone="blue" disabled={g.listensLeft <= 0} onClick={() => d({ type: 'voice.useListen' })}>
          🔊 청취 1회 차감 ({g.listensLeft})
        </B>
      </div>
      <Hint>발성 신호를 누르면 TV에 3-2-1 카운트다운이 뜹니다</Hint>

      <div className="mb-3 mt-3 flex items-center gap-2">
        <span className="text-[13px] text-white/60">청취 잔여 수정</span>
        {Array.from({ length: maxL + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => d({ type: 'voice.setListens', value: i })}
            className={`h-8 w-8 rounded-full border-2 border-black text-[13px] ${
              g.listensLeft === i ? 'bg-tape text-black' : 'bg-con-700 text-white/60'
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <B tone="green" disabled={g.revealed} onClick={() => d({ type: 'voice.judge', win: true })}>
          ⭕ 정답!
        </B>
        <B tone="red" disabled={g.revealed} onClick={() => d({ type: 'voice.judge', win: false })}>
          ❌ 오답
        </B>
      </div>
      <Hint>{gc.clearThreshold ?? 3}문제 맞히면 자동으로 게임 성공 처리됩니다</Hint>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <B tone="steel" small onClick={() => d({ type: 'voice.reveal' })}>
          👁 정답만 공개
        </B>
        <B tone="blue" small onClick={() => d({ type: 'voice.next' })}>
          ▶ 다음 문제
        </B>
      </div>

      <div className="mt-2 flex gap-2">
        {g.results.map((r, i) => (
          <button
            key={i}
            onClick={() => d({ type: 'voice.setRound', round: i })}
            className={`flex-1 rounded border-2 border-black py-1 text-[13px] ${
              r === 'win'
                ? 'bg-gold text-black'
                : r === 'lose'
                  ? 'bg-siren-red text-white'
                  : i === g.round
                    ? 'bg-tape text-black'
                    : 'bg-con-700 text-white/60'
            }`}
          >
            Q{i + 1}
          </button>
        ))}
      </div>

      {g.allWords && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] text-white/50">
            전체 단어 목록 보기 🔒
          </summary>
          <div className="mt-2 space-y-1">
            {g.allWords.map((w, i) => (
              <div
                key={i}
                className={`rounded border-2 border-black px-2 py-1 text-[14px] ${
                  i === g.round ? 'bg-tape/20 text-tape' : 'bg-black/40 text-white/70'
                }`}
              >
                Q{i + 1}. {w}
              </div>
            ))}
          </div>
        </details>
      )}
    </>
  )
}

function BonusControl({
  g,
  gc,
  config,
  state,
  d,
}: {
  g: BonusState
  gc: GameConfig
  config: Config
  state: AppState
  d: (a: any) => void
}) {
  const failed = config.games.filter((x) => !x.bonus && state.games[x.id]?.failed)
  const step = config.prize.bonusStep ?? 10
  const room = Math.max(0, state.meta.maxTotal - state.prize.earned)

  return (
    <>
      <div className="mb-2 rounded-lg border-2 border-love/60 bg-love/10 p-2">
        <div className="text-[12px] text-love-lt">
          질문 {g.round + 1} / {g.results.length} — TV에 표시됨
        </div>
        <div className="txt-head text-[17px] leading-snug text-white">
          {g.question || '(질문 미입력)'}
        </div>
      </div>
      <div className="mb-3 rounded-lg border-[3px] border-siren-red bg-siren-red/15 p-2">
        <div className="text-[12px] text-siren-red-lt">
          🔒 {config.bride.name} 님 답변 — 나만 보임
        </div>
        <div className="txt-head text-[20px] leading-snug text-white">
          {g.answer || '(답변 미입력 — 설정에서 입력)'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <B tone="green" onClick={() => d({ type: 'bonus.judge', win: true })}>
          ⭕ 정답!
        </B>
        <B tone="red" onClick={() => d({ type: 'bonus.judge', win: false })}>
          ❌ 오답
        </B>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <B tone="love" small onClick={() => d({ type: 'bonus.reveal' })}>
          💌 답변만 공개
        </B>
        <B tone="blue" small onClick={() => d({ type: 'bonus.next' })}>
          ▶ 다음 질문
        </B>
      </div>

      <div className="mt-4 border-t-2 border-white/10 pt-3">
        <div className="txt-head text-[14px] text-tape">🎁 정답 보상 — 둘 중 하나 선택</div>

        <div className="mt-2 text-[12px] text-white/50">① 실패한 집행을 되살리기</div>
        <div className="mt-1 grid gap-2">
          {failed.length === 0 && (
            <div className="rounded bg-black/40 py-2 text-center text-[13px] text-white/30">
              현재 실패한 집행 없음
            </div>
          )}
          {failed.map((x) => (
            <B key={x.id} tone="gold" small onClick={() => d({ type: 'revive.grant', gameId: x.id })}>
              ↩ {x.no} · {x.title} 재도전
            </B>
          ))}
        </div>

        <div className="mt-3 text-[12px] text-white/50">
          ② 보너스 상금 지급 (최대치까지 {room}
          {state.meta.unit} 남음)
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {[step, step * 2, room].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => (
            <B
              key={v}
              tone="love"
              small
              disabled={room <= 0}
              onClick={() => d({ type: 'prize.bonus', amount: v, label: '천생연분 보너스' })}
            >
              +{v}
              {state.meta.unit}
            </B>
          ))}
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════

export default function Controller() {
  const [pin, setPin] = useState<string | undefined>(
    () => localStorage.getItem(PIN_KEY) || undefined
  )
  const { state, config, conn, status, dispatch } = useSync('control', pin)
  const [banner, setBanner] = useState('')

  useEffect(() => {
    if (status === 'denied') localStorage.removeItem(PIN_KEY)
  }, [status])

  useEffect(() => {
    document.body.dataset.scroll = 'on'
    return () => {
      delete document.body.dataset.scroll
    }
  }, [])

  if (!pin || status === 'denied') {
    return (
      <PinGate
        denied={status === 'denied'}
        onSubmit={(p) => {
          localStorage.setItem(PIN_KEY, p)
          setPin(p)
          location.reload()
        }}
      />
    )
  }

  if (!state || !config) {
    return (
      <div className="tex-concrete flex min-h-full flex-col items-center justify-center">
        <div className="anim-blink text-[50px]">🚨</div>
        <div className="txt-head mt-2 text-[18px] text-tape">관제실 접속 중...</div>
      </div>
    )
  }

  const d = dispatch
  const m = state.meta
  const gc = state.activeGameId ? config.games.find((g) => g.id === state.activeGameId) : null
  const g = state.activeGameId ? state.games[state.activeGameId] : null
  const pct = m.maxTotal > 0 ? (state.prize.earned / m.maxTotal) * 100 : 0
  const mains = config.games.filter((x) => !x.bonus)
  const bonuses = config.games.filter((x) => x.bonus)

  return (
    <div className="tex-concrete min-h-full pb-24">
      {/* 상단 고정 */}
      <div className="sticky top-0 z-40 border-b-[3px] border-black bg-black/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`led ${status === 'open' ? 'bg-cash text-cash' : 'anim-blink bg-siren-red text-siren-red'}`}
            />
            <span className="txt-head text-[13px] text-white/70">
              {status === 'open' ? '연결됨' : '재접속 중'}
            </span>
          </div>
          <div className="txt-head text-[12px] text-white/45">
            📺 {conn.tv} · 📱 {conn.spectator} · 🎛 {conn.control}
          </div>
        </div>

        <div className="mt-1 flex items-end justify-between">
          <div className="txt-num txt-gold-plate text-[30px] leading-none">
            {state.prize.earned}
            <span className="text-[14px]">{m.unit}</span>
          </div>
          <div className="txt-head text-[12px] text-white/45">
            집행 {m.cleared}/{m.totalGames} · 최대 {m.maxTotal}
            {m.unit}
          </div>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full border-2 border-black bg-con-800">
          <div
            className="h-full transition-[width] duration-700"
            style={{
              width: `${Math.min(100, pct)}%`,
              background: 'linear-gradient(90deg,#b8860b,#ffc72c,#fff3c4)',
            }}
          />
        </div>
        <div className="mt-2 flex justify-center">
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

      <div className="space-y-3 p-3">
        {/* 진행 순서 안내 */}
        <div className="rounded-xl border-[3px] border-tape/50 bg-tape/10 p-3">
          <div className="txt-head text-[14px] text-tape">📖 진행 순서</div>
          <div className="mt-1 text-[12px] font-normal leading-relaxed text-white/60">
            ① 아래 <b className="text-white">TV 화면 바꾸기</b>에서 게임 선택 →
            ② 게임 진행하며 <b className="text-white">판정</b> →
            ③ 성공하면 보석금이 <b className="text-tape">다음 단계</b>로 자동 상승 →
            ④ 실패하면 <b className="text-love-lt">천생연분</b>으로 부활
          </div>
        </div>

        {/* 화면 전환 */}
        <Section title="📺 TV 화면 바꾸기" desc="누르면 TV와 친구들 폰 화면이 즉시 바뀝니다">
          <div className="grid grid-cols-3 gap-2">
            <B
              small
              tone={state.phase === 'intro' ? 'gold' : 'steel'}
              onClick={() => d({ type: 'goto', phase: 'intro' })}
            >
              🚨 인트로
            </B>
            <B
              small
              tone={state.phase === 'dashboard' ? 'gold' : 'steel'}
              onClick={() => d({ type: 'goto', phase: 'dashboard' })}
            >
              🏛 상금 현황
            </B>
            <B
              small
              tone={state.phase === 'mugshot' ? 'gold' : 'steel'}
              onClick={() => d({ type: 'goto', phase: 'mugshot' })}
            >
              📸 머그샷
            </B>
          </div>

          <div className="mt-2 grid gap-2">
            {mains.map((x, i) => {
              const s = state.games[x.id]
              return (
                <B
                  key={x.id}
                  small
                  tone={state.activeGameId === x.id ? 'red' : 'blue'}
                  onClick={() => d({ type: 'goto', phase: 'game', gameId: x.id })}
                >
                  {s?.cleared ? '✅' : s?.failed ? '❌' : `${i + 1}️⃣`} {x.no} · {x.title}
                  <span className="ml-1 text-[11px] opacity-70">
                    → {config.prize.ladder[i] ?? ''}
                    {m.unit}
                  </span>
                </B>
              )
            })}
          </div>

          <div className="mt-2 grid gap-2">
            {bonuses.map((x) => (
              <B
                key={x.id}
                small
                tone={state.activeGameId === x.id ? 'red' : 'love'}
                onClick={() => d({ type: 'goto', phase: 'game', gameId: x.id })}
              >
                💗 {x.no} · {x.title}
              </B>
            ))}
          </div>

          <B
            small
            tone={state.phase === 'certificate' ? 'gold' : 'steel'}
            className="mt-2 w-full"
            onClick={() => d({ type: 'goto', phase: 'certificate' })}
          >
            📜 출소 증명서 (최종 발표)
          </B>
        </Section>

        {/* 현재 게임 */}
        {gc && g ? (
          <Section title="🎮 현재 게임 진행" tone={gc.bonus ? 'love' : 'red'}>
            <GameHeader gc={gc} g={g} meta={m} />
            {gc.type === 'culprit' && (
              <CulpritControl g={g as CulpritState} gc={gc} config={config} d={d} />
            )}
            {gc.type === 'voice' && <VoiceControl g={g as VoiceState} gc={gc} d={d} />}
            {gc.type === 'bonus' && (
              <BonusControl g={g as BonusState} gc={gc} config={config} state={state} d={d} />
            )}
            {gc.type === 'simple' && <SimpleControl g={g as SimpleState} gc={gc} d={d} />}

            {/* 강제 판정 */}
            <details className="mt-4">
              <summary className="cursor-pointer text-[12px] text-white/40">
                이 게임 강제로 성공/실패 처리하기
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <B small tone="green" onClick={() => d({ type: 'game.clear' })}>
                  강제 성공
                </B>
                <B small tone="red" onClick={() => d({ type: 'game.fail' })}>
                  강제 실패
                </B>
                <B small tone="steel" onClick={() => d({ type: 'game.reset' })}>
                  처음부터
                </B>
              </div>
              <Hint>판정이 꼬였을 때만 사용하세요</Hint>
            </details>
          </Section>
        ) : (
          <Section title="🎮 현재 게임 진행" desc="위에서 게임을 선택하면 조작 버튼이 나타납니다">
            <div className="py-4 text-center text-[14px] text-white/30">선택된 게임 없음</div>
          </Section>
        )}

        {/* 실수 되돌리기 */}
        <Section
          title="↩️ 실수 되돌리기"
          desc="방금 누른 판정을 취소하고 직전 상태로 되돌립니다. 잘못 눌렀을 때 쓰세요."
          tone="gold"
        >
          <B tone="gold" className="w-full !py-4 text-[18px]" onClick={() => d({ type: 'undo' })}>
            ↩️ 방금 누른 거 취소
          </B>
        </Section>

        {/* TV 공지 */}
        <Section title="📢 TV에 문구 띄우기" desc="TV 화면 위에 큰 빨간 배너로 표시됩니다">
          <div className="flex gap-2">
            <input
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="띄울 문구 입력"
              className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
            />
            <B small tone="gold" onClick={() => d({ type: 'banner', text: banner })}>
              송출
            </B>
            <B
              small
              tone="steel"
              onClick={() => {
                setBanner('')
                d({ type: 'banner', text: '' })
              }}
            >
              끄기
            </B>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {['벌칙 집행!', '한 번 더!', '역전 찬스!', '조용히!!'].map((t) => (
              <B key={t} small tone="steel" onClick={() => d({ type: 'banner', text: t })}>
                {t}
              </B>
            ))}
          </div>
        </Section>

        {/* 연출 */}
        <Section title="🎆 효과 수동 재생" desc="분위기 띄울 때. 게임 결과에는 영향 없습니다">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['💵 지폐비', { kind: 'cash' }],
                ['🚨 사이렌', { kind: 'siren' }],
                ['💥 실패음', { kind: 'fail' }],
                ['💗 하트', { kind: 'love-win' }],
                ['🔢 카운트다운', { kind: 'countdown' }],
                ['🖃 유죄 도장', { kind: 'stamp', payload: { text: '유 죄', tone: 'red' } }],
              ] as [string, any][]
            ).map(([label, a]) => (
              <B
                key={label}
                small
                tone="steel"
                onClick={() => d({ type: 'fx', kind: a.kind, payload: a.payload })}
              >
                {label}
              </B>
            ))}
          </div>
        </Section>

        {/* 기록 */}
        <Section title="📋 진행 기록">
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {state.log.length === 0 && <div className="text-[13px] text-white/30">없음</div>}
            {state.log.slice(0, 15).map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded border-2 border-black bg-black/40 px-2 py-1"
              >
                <span className="truncate text-[13px] text-white/75">{l.label}</span>
                {l.delta !== 0 && (
                  <span
                    className={`txt-num shrink-0 text-[17px] ${l.delta > 0 ? 'text-cash' : 'text-siren-red-lt'}`}
                  >
                    {l.delta > 0 ? '+' : ''}
                    {l.delta}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* 설정 / 초기화 */}
        <div className="grid grid-cols-2 gap-2">
          <a href="/admin" className="btn btn-steel block text-center text-[15px] no-underline">
            ⚙️ 설정 열기
          </a>
          <B
            tone="red"
            onClick={() => {
              if (confirm('게임 진행과 보석금을 전부 처음 상태로 되돌립니다. 진행할까요?'))
                d({ type: 'prize.reset' })
            }}
          >
            🗑 전체 초기화
          </B>
        </div>
      </div>
    </div>
  )
}
