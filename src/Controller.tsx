import { useEffect, useState } from 'react'
import { useSync } from './net'
import type { AppState, BonusState, Config, CulpritState, GameConfig, VoiceState } from './types'

const PIN_KEY = 'marry.pin'

// ══════════════════════════════════════════════════════════════
// 공용 소품
// ══════════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-[3px] border-black bg-con-800/90 p-3 shadow-[0_5px_0_rgba(0,0,0,.5)]">
      <div className="txt-head mb-2 text-[15px] tracking-widest text-tape">{title}</div>
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
  return (
    <>
      <Section title={`🔴 ${gc.no} · ROUND ${g.round + 1} / ${g.results.length}`}>
        {ev && (
          <div className="mb-3 rounded-lg border-2 border-tape/50 bg-black/50 p-2 text-center">
            <div className="text-[13px] text-white/50">이번 증거물</div>
            <div className="txt-head text-[18px] text-tape">
              {ev.emoji} {ev.real} vs {ev.fake}
            </div>
          </div>
        )}

        <div className="mb-1 text-[13px] text-white/60">
          ① 벌칙 음식 먹은 사람 (진범) — 나만 보임 🔒
        </div>
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
          ② {config.groom.name}이 지목한 사람 (TV에 표시됨)
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
        {g.guilty !== null && g.picked !== null && !g.revealed && (
          <div className="mt-2 text-center text-[13px] text-tape">
            자동 판정: {g.guilty === g.picked ? '⭕ 적중' : '❌ 빗나감'}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <B tone="blue" small onClick={() => d({ type: 'culprit.next' })}>
            ▶ 다음 라운드
          </B>
          <B tone="steel" small onClick={() => d({ type: 'culprit.addRound' })}>
            ➕ 라운드 추가
          </B>
        </div>
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
      </Section>
    </>
  )
}

function VoiceControl({ g, gc, d }: { g: VoiceState; gc: GameConfig; d: (a: any) => void }) {
  const maxL = gc.maxListens ?? 3
  return (
    <Section title={`🎧 ${gc.no} · Q${g.round + 1} / ${g.results.length}`}>
      {/* 정답 — 진행자만 */}
      <div className="mb-3 rounded-lg border-[3px] border-siren-red bg-siren-red/15 p-3 text-center">
        <div className="txt-head text-[12px] tracking-widest text-siren-red-lt">
          🔒 정답 (나만 보임 · TV엔 안 뜸)
        </div>
        <div className="txt-head mt-1 text-[34px] leading-none tracking-[0.15em] text-white">
          {g.word || '(단어 미설정)'}
        </div>
        <div className="mt-1 text-[13px] text-white/50">{g.wordLength}글자</div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <B tone="gold" onClick={() => d({ type: 'voice.countdown' })}>
          📣 발성 신호 (3-2-1)
        </B>
        <B
          tone="blue"
          disabled={g.listensLeft <= 0}
          onClick={() => d({ type: 'voice.useListen' })}
        >
          🔊 청취 차감 ({g.listensLeft})
        </B>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-[13px] text-white/60">청취 잔여</span>
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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <B tone="steel" small onClick={() => d({ type: 'voice.reveal' })}>
          👁 정답 공개만
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
    </Section>
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
  const failed = config.games.filter((x) => {
    const s = state.games[x.id]
    return s && x.type !== 'bonus' && !s.cleared
  })
  return (
    <Section title={`💗 ${gc.no} · Q${g.round + 1} / ${g.results.length}`}>
      <div className="mb-2 rounded-lg border-2 border-love/60 bg-love/10 p-2">
        <div className="text-[12px] text-love-lt">질문 (TV에 표시됨)</div>
        <div className="txt-head text-[17px] leading-snug text-white">{g.question || '(미설정)'}</div>
      </div>
      <div className="mb-3 rounded-lg border-[3px] border-siren-red bg-siren-red/15 p-2">
        <div className="text-[12px] text-siren-red-lt">🔒 {config.bride.name} 님 답변 (나만 보임)</div>
        <div className="txt-head text-[20px] leading-snug text-white">
          {g.answer || '(답변 미입력 — 어드민에서 입력)'}
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
          💌 답변 공개만
        </B>
        <B tone="blue" small onClick={() => d({ type: 'bonus.next' })}>
          ▶ 다음 질문
        </B>
      </div>

      <div className="mt-3 border-t-2 border-white/10 pt-3">
        <div className="mb-1 text-[13px] text-white/60">🎁 부활 기회 부여 (라운드 1회 추가)</div>
        <div className="grid grid-cols-1 gap-2">
          {failed.length === 0 && (
            <div className="text-[13px] text-white/30">부활 대상 게임 없음</div>
          )}
          {failed.map((x) => (
            <B key={x.id} tone="gold" small onClick={() => d({ type: 'revive.grant', gameId: x.id })}>
              ↩ {x.no} · {x.title} 부활
            </B>
          ))}
        </div>
      </div>
    </Section>
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
  const [amount, setAmount] = useState(10000)
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
  const gc = state.activeGameId ? config.games.find((g) => g.id === state.activeGameId) : null
  const g = state.activeGameId ? state.games[state.activeGameId] : null
  const pct =
    config.prize.totalPool > 0 ? (state.prize.earned / config.prize.totalPool) * 100 : 0

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
            {state.prize.earned.toLocaleString('ko-KR')}
            <span className="text-[14px]">{config.prize.currency}</span>
          </div>
          <div className="txt-head text-[12px] text-white/45">
            {pct.toFixed(1)}% / {config.prize.totalPool.toLocaleString('ko-KR')}
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
      </div>

      <div className="space-y-3 p-3">
        {/* 화면 전환 */}
        <Section title="🎬 화면 전환">
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
              🏛 대시보드
            </B>
            <B
              small
              tone={state.phase === 'mugshot' ? 'gold' : 'steel'}
              onClick={() => d({ type: 'goto', phase: 'mugshot' })}
            >
              📸 머그샷
            </B>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {config.games.map((x) => (
              <B
                key={x.id}
                small
                tone={state.activeGameId === x.id ? 'red' : x.type === 'bonus' ? 'love' : 'blue'}
                onClick={() => d({ type: 'goto', phase: 'game', gameId: x.id })}
              >
                {x.type === 'bonus' ? '💗' : x.type === 'voice' ? '🎧' : '🔴'} {x.no} · {x.title}
              </B>
            ))}
          </div>
          <B
            small
            tone={state.phase === 'certificate' ? 'gold' : 'steel'}
            className="mt-2 w-full"
            onClick={() => d({ type: 'goto', phase: 'certificate' })}
          >
            📜 출소 증명서 (최종)
          </B>
        </Section>

        {/* 게임별 컨트롤 */}
        {gc && g && gc.type === 'culprit' && (
          <CulpritControl g={g as CulpritState} gc={gc} config={config} d={d} />
        )}
        {gc && g && gc.type === 'voice' && <VoiceControl g={g as VoiceState} gc={gc} d={d} />}
        {gc && g && gc.type === 'bonus' && (
          <BonusControl g={g as BonusState} gc={gc} config={config} state={state} d={d} />
        )}

        {/* 즉흥 대응 */}
        <Section title="⚡ 즉흥 대응">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="number"
              value={amount}
              step={5000}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="txt-num w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[22px] text-tape outline-none focus:border-tape"
            />
            <span className="txt-head text-[15px] text-white/60">{config.prize.currency}</span>
          </div>
          <div className="mb-2 grid grid-cols-4 gap-1">
            {[10000, 30000, 50000, 100000].map((v) => (
              <B key={v} small tone="steel" onClick={() => setAmount(v)}>
                {v / 10000}만
              </B>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <B
              tone="green"
              onClick={() => d({ type: 'prize.add', amount, label: '진행자 특별 지급' })}
            >
              💰 지급
            </B>
            <B
              tone="red"
              onClick={() => d({ type: 'prize.add', amount: -amount, label: '진행자 차감' })}
            >
              💸 차감
            </B>
          </div>
          <B tone="blue" className="mt-2 w-full" onClick={() => d({ type: 'prize.undo' })}>
            ↩️ 직전 기록 되돌리기
          </B>
        </Section>

        {/* 배너 */}
        <Section title="📢 화면 공지">
          <div className="flex gap-2">
            <input
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="TV에 띄울 문구"
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

        {/* 연출 수동 */}
        <Section title="🎆 연출 수동 재생">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['💵 지폐비', { kind: 'cash' }],
                ['🚨 사이렌', { kind: 'siren' }],
                ['💥 실패', { kind: 'fail' }],
                ['🏆 클리어', { kind: 'clear', payload: { amount: 0, title: '특별 감형' } }],
                ['💗 하트', { kind: 'love-win' }],
                ['🔢 카운트', { kind: 'countdown' }],
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
          <div className="mt-2 grid grid-cols-3 gap-2">
            {['유 죄', '무죄 석방', '징계'].map((t) => (
              <B
                key={t}
                small
                tone="red"
                onClick={() =>
                  d({ type: 'fx', kind: 'stamp', payload: { text: t, tone: 'red' } })
                }
              >
                🖃 {t}
              </B>
            ))}
          </div>
        </Section>

        {/* 위험 구역 */}
        <details className="rounded-xl border-[3px] border-siren-red/60 bg-siren-red/10 p-3">
          <summary className="txt-head cursor-pointer text-[15px] text-siren-red-lt">
            ⚠️ 위험 — 전체 초기화
          </summary>
          <B
            tone="red"
            className="mt-3 w-full"
            onClick={() => {
              if (confirm('정말 보석금과 기록을 전부 초기화할까요?')) d({ type: 'prize.reset' })
            }}
          >
            🗑 보석금·기록 전체 초기화
          </B>
          <a
            href="/admin"
            className="btn btn-steel mt-2 block w-full text-center text-[15px] no-underline"
          >
            ⚙️ 설정(어드민) 열기
          </a>
        </details>

        {/* 최근 기록 */}
        <Section title="📋 최근 기록">
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {state.log.length === 0 && <div className="text-[13px] text-white/30">없음</div>}
            {state.log.slice(0, 12).map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded border-2 border-black bg-black/40 px-2 py-1"
              >
                <span className="truncate text-[13px] text-white/75">{l.label}</span>
                <span
                  className={`txt-num shrink-0 text-[17px] ${l.amount >= 0 ? 'text-cash' : 'text-siren-red-lt'}`}
                >
                  {l.amount >= 0 ? '+' : ''}
                  {l.amount.toLocaleString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
