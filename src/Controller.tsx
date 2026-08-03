import { useEffect, useState } from 'react'
import { useSync } from './net'
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
// 기본 요소
// ══════════════════════════════════════════════════════════════

function Card({
  title,
  desc,
  right,
  active,
  children,
}: {
  title?: string
  desc?: string
  right?: React.ReactNode
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`ops-card${active ? ' is-active' : ''}`}>
      {title && (
        <header className="ops-card-head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div className="ops-card-title">{title}</div>
            {right}
          </div>
          {desc && <div className="ops-card-desc">{desc}</div>}
        </header>
      )}
      <div className="ops-card-body">{children}</div>
    </section>
  )
}

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="ops-card ops-details">
      <summary>{title}</summary>
      <div className="ops-card-body">{children}</div>
    </details>
  )
}

function Btn({
  children,
  onClick,
  kind = '',
  size = '',
  disabled,
  block,
}: {
  children: React.ReactNode
  onClick?: () => void
  kind?: '' | 'primary' | 'success' | 'danger' | 'warn' | 'ghost' | 'on'
  size?: '' | 'sm' | 'lg'
  disabled?: boolean
  block?: boolean
}) {
  return (
    <button
      className={`ops-btn ${kind} ${size} ${block ? 'block' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Ladder({ config, state }: { config: Config; state: AppState }) {
  const m = state.meta
  return (
    <div className="ops-ladder">
      {config.prize.ladder.map((amt, i) => (
        <div key={i} className={`ops-step ${i < m.cleared ? 'done' : i === m.cleared ? 'now' : ''}`}>
          <div className="v">{amt}</div>
          <div className="k">{i + 1}단</div>
        </div>
      ))}
      <div className={`ops-step bonus ${state.prize.bonus > 0 ? 'done' : ''}`}>
        <div className="v">{m.maxTotal}</div>
        <div className="k">보너스</div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PIN
// ══════════════════════════════════════════════════════════════

function PinGate({ onSubmit, denied }: { onSubmit: (p: string) => void; denied: boolean }) {
  const [v, setV] = useState('')
  return (
    <div
      className="ops"
      style={{
        display: 'flex',
        minHeight: '100dvh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700 }}>진행자 관제실</div>
      <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>PIN을 입력하세요</div>

      <input
        value={v}
        onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 8))}
        inputMode="numeric"
        placeholder="••••"
        className="ops-input ops-num"
        style={{
          marginTop: 20,
          width: 220,
          textAlign: 'center',
          fontSize: 30,
          letterSpacing: '0.35em',
          minHeight: 58,
        }}
      />
      {denied && (
        <div style={{ marginTop: 10, fontSize: 13, color: '#fca5a5' }}>PIN이 올바르지 않습니다</div>
      )}

      <div className="ops-grid c3" style={{ marginTop: 18, width: 260 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((k) => (
          <Btn
            key={k}
            kind={k === 'C' || k === '←' ? 'ghost' : ''}
            onClick={() => {
              if (k === 'C') setV('')
              else if (k === '←') setV((s) => s.slice(0, -1))
              else setV((s) => (s.length < 8 ? s + k : s))
            }}
          >
            {k}
          </Btn>
        ))}
      </div>

      <div style={{ width: 260, marginTop: 12 }}>
        <Btn kind="primary" size="lg" block onClick={() => onSubmit(v)}>
          입장
        </Btn>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 게임별 컨트롤
// ══════════════════════════════════════════════════════════════

function SimpleControl({ g, d }: { g: SimpleState; d: (a: any) => void }) {
  return (
    <>
      <div className="ops-grid c2">
        <Btn kind="success" size="lg" disabled={g.cleared} onClick={() => d({ type: 'game.clear' })}>
          성공
        </Btn>
        <Btn
          kind="danger"
          size="lg"
          disabled={g.cleared || g.failed}
          onClick={() => d({ type: 'game.fail' })}
        >
          실패
        </Btn>
      </div>
      <div className="ops-hint" style={{ textAlign: 'center' }}>
        성공을 누르면 보석금이 다음 단계로 올라갑니다
      </div>
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
  const auto = g.guilty !== null && g.picked !== null ? g.guilty === g.picked : null

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="ops-badge accent">
          라운드 {g.round + 1} / {g.results.length}
        </span>
        <span className="ops-badge">
          적중 {wins} · {gc.clearThreshold ?? 1}회면 성공
        </span>
      </div>

      {ev && (
        <div className="ops-note">
          이번 증거물 &nbsp;<b>{ev.emoji} {ev.real}</b> vs <b style={{ color: '#fca5a5' }}>{ev.fake}</b>
        </div>
      )}

      <div>
        <div className="ops-sub" style={{ marginBottom: 6 }}>
          1. 벌칙 음식을 먹은 사람 <span className="ops-hint">— 나만 보임</span>
        </div>
        <div className="ops-grid c3">
          {config.suspects.map((s) => (
            <Btn
              key={s.id}
              kind={g.guilty === s.id ? 'warn' : ''}
              onClick={() => d({ type: 'culprit.setGuilty', suspectId: s.id })}
            >
              {s.name}
            </Btn>
          ))}
        </div>
      </div>

      <div>
        <div className="ops-sub" style={{ marginBottom: 6 }}>
          2. {config.groom.name}이 지목한 사람 <span className="ops-hint">— TV에 표시됨</span>
        </div>
        <div className="ops-grid c3">
          {config.suspects.map((s) => (
            <Btn
              key={s.id}
              kind={g.picked === s.id ? 'primary' : ''}
              disabled={g.revealed}
              onClick={() => d({ type: 'culprit.pick', suspectId: s.id })}
            >
              {s.name}
            </Btn>
          ))}
        </div>
      </div>

      <div>
        <div className="ops-sub" style={{ marginBottom: 6 }}>3. 판정</div>
        {auto !== null && !g.revealed && (
          <div className="ops-note" style={{ marginBottom: 8 }}>
            선택한 값 기준 <b>{auto ? '적중' : '빗나감'}</b> 입니다
          </div>
        )}
        <div className="ops-grid c2">
          <Btn
            kind="success"
            size="lg"
            disabled={g.revealed || g.picked === null}
            onClick={() => d({ type: 'culprit.judge', win: true })}
          >
            적중
          </Btn>
          <Btn
            kind="danger"
            size="lg"
            disabled={g.revealed || g.picked === null}
            onClick={() => d({ type: 'culprit.judge', win: false })}
          >
            빗나감
          </Btn>
        </div>
      </div>

      <Btn kind="primary" block onClick={() => d({ type: 'culprit.next' })}>
        다음 라운드
      </Btn>

      <div className="ops-rounds">
        {g.results.map((r, i) => (
          <button
            key={i}
            className={`ops-round ${r === 'win' ? 'win' : r === 'lose' ? 'lose' : i === g.round ? 'now' : ''}`}
            onClick={() => d({ type: 'culprit.setRound', round: i })}
          >
            {i + 1}
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="ops-badge accent">
          문제 {g.round + 1} / {g.results.length}
        </span>
        <span className="ops-badge">
          정답 {wins} · {gc.clearThreshold ?? 3}문제면 성공
        </span>
        <span className="ops-badge">청취 {g.listensLeft} / {maxL}</span>
      </div>

      <div className="ops-secret">
        <div className="ops-secret-label">정답 · 나만 보임 (TV엔 글자 수만)</div>
        <div className="ops-secret-value">{g.word || '단어 미설정'}</div>
        <div className="ops-hint" style={{ marginTop: 4 }}>{g.wordLength}글자</div>
      </div>

      <div className="ops-grid c2">
        <Btn kind="warn" onClick={() => d({ type: 'voice.countdown' })}>
          발성 신호
        </Btn>
        <Btn
          kind="primary"
          disabled={g.listensLeft <= 0}
          onClick={() => d({ type: 'voice.useListen' })}
        >
          청취 1회 차감
        </Btn>
      </div>
      <div className="ops-hint" style={{ textAlign: 'center', marginTop: -4 }}>
        발성 신호를 누르면 TV에 3-2-1 카운트다운이 뜹니다
      </div>

      <div className="ops-grid c2">
        <Btn kind="success" size="lg" disabled={g.revealed} onClick={() => d({ type: 'voice.judge', win: true })}>
          정답
        </Btn>
        <Btn kind="danger" size="lg" disabled={g.revealed} onClick={() => d({ type: 'voice.judge', win: false })}>
          오답
        </Btn>
      </div>

      <div className="ops-grid c2">
        <Btn size="sm" onClick={() => d({ type: 'voice.reveal' })}>
          정답만 공개
        </Btn>
        <Btn size="sm" kind="primary" onClick={() => d({ type: 'voice.next' })}>
          다음 문제
        </Btn>
      </div>

      <div className="ops-rounds">
        {g.results.map((r, i) => (
          <button
            key={i}
            className={`ops-round ${r === 'win' ? 'win' : r === 'lose' ? 'lose' : i === g.round ? 'now' : ''}`}
            onClick={() => d({ type: 'voice.setRound', round: i })}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div>
        <div className="ops-sub" style={{ marginBottom: 6 }}>청취 잔여 직접 수정</div>
        <div className="ops-grid c4">
          {Array.from({ length: maxL + 1 }).map((_, i) => (
            <Btn
              key={i}
              size="sm"
              kind={g.listensLeft === i ? 'on' : 'ghost'}
              onClick={() => d({ type: 'voice.setListens', value: i })}
            >
              {i}
            </Btn>
          ))}
        </div>
      </div>

      {g.allWords && (
        <details className="ops-details">
          <summary style={{ padding: '8px 0' }}>전체 단어 목록</summary>
          <div className="ops-list" style={{ marginTop: 8 }}>
            {g.allWords.map((w, i) => (
              <div key={i} className="ops-row">
                <span style={{ color: i === g.round ? '#bfdbfe' : 'var(--muted)' }}>
                  {i + 1}. {w}
                </span>
                {i === g.round && <span className="ops-badge accent">현재</span>}
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
  config,
  state,
  d,
}: {
  g: BonusState
  config: Config
  state: AppState
  d: (a: any) => void
}) {
  const failed = config.games.filter((x) => !x.bonus && state.games[x.id]?.failed)
  const step = config.prize.bonusStep ?? 10
  const room = Math.max(0, state.meta.maxTotal - state.prize.earned)
  const amounts = [step, step * 2, room].filter((v, i, a) => v > 0 && a.indexOf(v) === i)

  return (
    <>
      <span className="ops-badge accent">
        질문 {g.round + 1} / {g.results.length}
      </span>

      <div className="ops-note">
        <div className="ops-hint" style={{ marginBottom: 3 }}>질문 — TV에 표시됨</div>
        <b style={{ fontSize: 15 }}>{g.question || '질문 미입력'}</b>
      </div>

      <div className="ops-secret">
        <div className="ops-secret-label">{config.bride.name} 님 답변 · 나만 보임</div>
        <div className="ops-secret-value" style={{ fontSize: 20 }}>
          {g.answer || '답변 미입력 — 설정에서 입력하세요'}
        </div>
      </div>

      <div className="ops-grid c2">
        <Btn kind="success" size="lg" onClick={() => d({ type: 'bonus.judge', win: true })}>
          정답
        </Btn>
        <Btn kind="danger" size="lg" onClick={() => d({ type: 'bonus.judge', win: false })}>
          오답
        </Btn>
      </div>

      <div className="ops-grid c2">
        <Btn size="sm" onClick={() => d({ type: 'bonus.reveal' })}>
          답변만 공개
        </Btn>
        <Btn size="sm" kind="primary" onClick={() => d({ type: 'bonus.next' })}>
          다음 질문
        </Btn>
      </div>

      <div className="ops-divider" />

      <div className="ops-sub">정답 보상 — 둘 중 하나 선택</div>

      <div>
        <div className="ops-hint" style={{ marginBottom: 6 }}>1. 실패한 집행 되살리기</div>
        {failed.length === 0 ? (
          <div className="ops-note">현재 실패한 집행이 없습니다</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {failed.map((x) => (
              <Btn key={x.id} kind="warn" onClick={() => d({ type: 'revive.grant', gameId: x.id })}>
                {x.no} · {x.title} 재도전
              </Btn>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="ops-hint" style={{ marginBottom: 6 }}>
          2. 보너스 상금 지급 — 최대치까지 {room}
          {state.meta.unit} 남음
        </div>
        <div className="ops-grid c3">
          {amounts.map((v) => (
            <Btn
              key={v}
              disabled={room <= 0}
              onClick={() => d({ type: 'prize.bonus', amount: v, label: '천생연분 보너스' })}
            >
              +{v}
              {state.meta.unit}
            </Btn>
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
      <div
        className="ops"
        style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>접속 중…</div>
      </div>
    )
  }

  const d = dispatch
  const m = state.meta
  const gc = state.activeGameId ? config.games.find((g) => g.id === state.activeGameId) : null
  const g: GameState | null = state.activeGameId ? state.games[state.activeGameId] : null
  const pct = m.maxTotal > 0 ? (state.prize.earned / m.maxTotal) * 100 : 0
  const mains = config.games.filter((x) => !x.bonus)
  const bonuses = config.games.filter((x) => x.bonus)
  const remain = Math.max(0, m.next - state.prize.earned)

  const screenBtn = (label: string, phase: string, gameId?: string) => {
    const on = gameId ? state.activeGameId === gameId : state.phase === phase && !state.activeGameId
    return (
      <Btn
        key={label}
        size="sm"
        kind={on ? 'on' : 'ghost'}
        onClick={() => d({ type: 'goto', phase, gameId })}
      >
        {label}
      </Btn>
    )
  }

  return (
    <div className="ops">
      {/* 상단 상태 */}
      <div className="ops-bar">
        <div className="ops-bar-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className={`ops-dot ${status === 'open' ? 'ok' : 'bad'}`} />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {status === 'open' ? '연결됨' : '재접속 중'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--faint)' }}>
              TV {conn.tv} · 폰 {conn.spectator} · 진행자 {conn.control}
            </div>
          </div>

          <div
            style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <div className="ops-num" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
              {state.prize.earned}
              <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 2 }}>{m.unit}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              집행 {m.cleared}/{m.totalGames}
              {remain > 0 && ` · 다음까지 ${remain}${m.unit}`}
            </div>
          </div>

          <div className="ops-progress" style={{ marginTop: 6 }}>
            <div style={{ width: `${Math.min(100, pct)}%` }} />
          </div>

          <div style={{ marginTop: 8 }}>
            <Ladder config={config} state={state} />
          </div>
        </div>
      </div>

      <div className="ops-page">
        {/* 화면 전환 */}
        <Card title="TV 화면" desc="누르면 TV와 친구들 폰이 즉시 바뀝니다">
          <div className="ops-grid c4">
            {screenBtn('인트로', 'intro')}
            {screenBtn('상금 현황', 'dashboard')}
            {screenBtn('머그샷', 'mugshot')}
            {screenBtn('증명서', 'certificate')}
          </div>

          <div className="ops-divider" />

          <div style={{ display: 'grid', gap: 8 }}>
            {mains.map((x, i) => {
              const s = state.games[x.id]
              const on = state.activeGameId === x.id
              return (
                <button
                  key={x.id}
                  className={`ops-btn ${on ? 'on' : 'ghost'}`}
                  style={{ justifyContent: 'space-between', textAlign: 'left' }}
                  onClick={() => d({ type: 'goto', phase: 'game', gameId: x.id })}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span className="ops-num" style={{ color: 'var(--faint)', fontSize: 13 }}>
                      {i + 1}
                    </span>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {x.title}
                    </span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                    <span className="ops-hint">
                      {config.prize.ladder[i] ?? ''}
                      {m.unit}
                    </span>
                    {s?.cleared ? (
                      <span className="ops-badge success">성공</span>
                    ) : s?.failed ? (
                      <span className="ops-badge danger">실패</span>
                    ) : null}
                  </span>
                </button>
              )
            })}

            {bonuses.map((x) => (
              <button
                key={x.id}
                className={`ops-btn ${state.activeGameId === x.id ? 'on' : 'ghost'}`}
                style={{ justifyContent: 'space-between', textAlign: 'left' }}
                onClick={() => d({ type: 'goto', phase: 'game', gameId: x.id })}
              >
                <span>{x.title}</span>
                <span className="ops-hint">부활 전용</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 현재 게임 */}
        {gc && g ? (
          <Card
            active
            title={`${gc.no} · ${gc.title}`}
            desc={gc.rule}
            right={
              g.cleared ? (
                <span className="ops-badge success">성공</span>
              ) : g.failed ? (
                <span className="ops-badge danger">실패</span>
              ) : (
                <span className="ops-badge">진행중</span>
              )
            }
          >
            {gc.win && (
              <div className="ops-note">
                성공 조건 <b>{gc.win}</b>
                {!g.cleared && (
                  <>
                    <br />
                    성공 시 보석금{' '}
                    <b style={{ color: '#ffc72c' }}>
                      {m.next}
                      {m.unit}
                    </b>{' '}
                    도달
                  </>
                )}
              </div>
            )}

            {gc.type === 'culprit' && (
              <CulpritControl g={g as CulpritState} gc={gc} config={config} d={d} />
            )}
            {gc.type === 'voice' && <VoiceControl g={g as VoiceState} gc={gc} d={d} />}
            {gc.type === 'bonus' && (
              <BonusControl g={g as BonusState} config={config} state={state} d={d} />
            )}
            {gc.type === 'simple' && <SimpleControl g={g as SimpleState} d={d} />}

            <details className="ops-details">
              <summary style={{ padding: '8px 0' }}>강제 판정 · 초기화</summary>
              <div style={{ marginTop: 8 }}>
                <div className="ops-grid c3">
                  <Btn size="sm" kind="success" onClick={() => d({ type: 'game.clear' })}>
                    강제 성공
                  </Btn>
                  <Btn size="sm" kind="danger" onClick={() => d({ type: 'game.fail' })}>
                    강제 실패
                  </Btn>
                  <Btn size="sm" kind="ghost" onClick={() => d({ type: 'game.reset' })}>
                    처음부터
                  </Btn>
                </div>
                <div className="ops-hint" style={{ marginTop: 6 }}>
                  판정이 꼬였을 때만 사용하세요
                </div>
              </div>
            </details>
          </Card>
        ) : (
          <Card title="현재 게임">
            <div className="ops-note">위에서 게임을 선택하면 조작 버튼이 나타납니다</div>
          </Card>
        )}

        {/* 부가 기능 */}
        <Fold title="TV에 문구 띄우기">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="ops-input"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="띄울 문구"
            />
            <Btn onClick={() => d({ type: 'banner', text: banner })}>표시</Btn>
            <Btn
              kind="ghost"
              onClick={() => {
                setBanner('')
                d({ type: 'banner', text: '' })
              }}
            >
              끄기
            </Btn>
          </div>
          <div className="ops-grid c2">
            {['벌칙 집행!', '한 번 더!', '역전 찬스!', '조용히!!'].map((t) => (
              <Btn key={t} size="sm" kind="ghost" onClick={() => d({ type: 'banner', text: t })}>
                {t}
              </Btn>
            ))}
          </div>
        </Fold>

        <Fold title="효과 수동 재생">
          <div className="ops-grid c3">
            {(
              [
                ['지폐비', { kind: 'cash' }],
                ['사이렌', { kind: 'siren' }],
                ['실패음', { kind: 'fail' }],
                ['하트', { kind: 'love-win' }],
                ['카운트다운', { kind: 'countdown' }],
                ['유죄 도장', { kind: 'stamp', payload: { text: '유 죄', tone: 'red' } }],
              ] as [string, any][]
            ).map(([label, a]) => (
              <Btn
                key={label}
                size="sm"
                kind="ghost"
                onClick={() => d({ type: 'fx', kind: a.kind, payload: a.payload })}
              >
                {label}
              </Btn>
            ))}
          </div>
          <div className="ops-hint">게임 결과에는 영향이 없습니다</div>
        </Fold>

        <Fold title="진행 기록">
          <div className="ops-list">
            {state.log.length === 0 && <div className="ops-hint">기록 없음</div>}
            {state.log.slice(0, 20).map((l) => (
              <div key={l.id} className="ops-row">
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.label}
                </span>
                {l.delta !== 0 && (
                  <span
                    className="ops-num"
                    style={{
                      flex: 'none',
                      fontWeight: 700,
                      color: l.delta > 0 ? '#86efac' : '#fca5a5',
                    }}
                  >
                    {l.delta > 0 ? '+' : ''}
                    {l.delta}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Fold>

        <div className="ops-grid c2">
          <a className="ops-btn ghost" href="/admin">
            설정
          </a>
          <Btn
            kind="ghost"
            onClick={() => {
              if (confirm('게임 진행과 보석금을 전부 처음 상태로 되돌립니다. 진행할까요?'))
                d({ type: 'prize.reset' })
            }}
          >
            전체 초기화
          </Btn>
        </div>
      </div>

      {/* 하단 고정 — 되돌리기는 항상 손 닿는 곳에 */}
      <div className="ops-footbar">
        <div className="ops-footbar-inner">
          <Btn kind="warn" size="lg" block onClick={() => d({ type: 'undo' })}>
            방금 누른 거 되돌리기
          </Btn>
        </div>
      </div>
    </div>
  )
}
