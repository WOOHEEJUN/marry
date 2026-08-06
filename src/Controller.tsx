import { useEffect, useState } from 'react'
import { useSync } from './net'
import { SOUNDBOARD } from './sound'
import type {
  AppState,
  BonusState,
  Config,
  CulpritState,
  DrawState,
  GameConfig,
  GameState,
  SimpleState,
  TallyState,
  VersusState,
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
          인용
        </Btn>
        <Btn
          kind="danger"
          size="lg"
          disabled={g.cleared || g.failed}
          onClick={() => d({ type: 'game.fail' })}
        >
          기각
        </Btn>
      </div>
      <div className="ops-hint" style={{ textAlign: 'center' }}>
        인용을 누르면 적립금이 다음 단계로 올라갑니다
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
  const joined = g.participants ?? config.prosecutors.map((p) => p.id)
  const members = config.prosecutors.filter((p) => joined.includes(p.id))

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="ops-badge accent">
          라운드 {g.round + 1} / {g.results.length}
        </span>
        <span className="ops-badge">
          적중 {wins} · {gc.clearThreshold ?? 1}회면 인용
        </span>
      </div>

      {ev && (
        <div className="ops-note">
          이번 증거물 &nbsp;<b>{ev.emoji} {ev.real}</b> vs <b style={{ color: '#fca5a5' }}>{ev.fake}</b>
        </div>
      )}

      {/* 참여 인원 */}
      <div>
        <div className="ops-sub" style={{ marginBottom: 6 }}>
          1. 이번 라운드 참여 인원{' '}
          <span className="ops-hint">— 고른 사람만 TV 라인업에 뜹니다 ({joined.length}명)</span>
        </div>
        <div className="ops-grid c3">
          {config.prosecutors.map((s) => (
            <Btn
              key={s.id}
              size="sm"
              kind={joined.includes(s.id) ? 'on' : 'ghost'}
              onClick={() => d({ type: 'culprit.toggleParticipant', id: s.id })}
            >
              {joined.includes(s.id) ? '✓ ' : ''}
              {s.name}
            </Btn>
          ))}
        </div>
        <Btn
          size="sm"
          kind="ghost"
          block
          onClick={() => d({ type: 'culprit.setParticipants', ids: null })}
        >
          전원 참여로 되돌리기
        </Btn>
      </div>

      <div>
        <div className="ops-sub" style={{ marginBottom: 6 }}>
          2. 벌칙 음식을 먹은 사람 <span className="ops-hint">— 나만 보임</span>
        </div>
        <div className="ops-grid c3">
          {members.map((s) => (
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
          3. {config.defendant.name}이 지목한 사람 <span className="ops-hint">— TV에 표시됨</span>
        </div>
        <div className="ops-grid c3">
          {members.map((s) => (
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
        <div className="ops-sub" style={{ marginBottom: 6 }}>4. 판정</div>
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
          정답 {wins} · {gc.clearThreshold ?? 3}문제면 인용
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

/** 합산형 — 라운드마다 숫자 기록 (눈 가리고 셀카 등) */
function TallyControl({ g, gc, d }: { g: TallyState; gc: GameConfig; d: (a: any) => void }) {
  const [v, setV] = useState(0)
  const unit = gc.tallyUnit || '개'
  const target = gc.target ?? 0
  const total = g.values.reduce((a, b) => a + (b || 0), 0)

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="ops-badge accent">
          {g.round + 1}회차 / {g.results.length}
        </span>
        <span className="ops-badge">
          누계 {total} / {target}
          {unit}
        </span>
      </div>

      <div>
        <div className="ops-sub" style={{ marginBottom: 6 }}>
          이번 회차 {gc.tallyLabel || '기록'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn kind="ghost" onClick={() => setV((x) => Math.max(0, x - 1))}>
            −
          </Btn>
          <input
            className="ops-input ops-num"
            type="number"
            value={v}
            onChange={(e) => setV(Math.max(0, Number(e.target.value) || 0))}
            style={{ textAlign: 'center', fontSize: 24, minHeight: 54 }}
          />
          <Btn kind="ghost" onClick={() => setV((x) => x + 1)}>
            ＋
          </Btn>
        </div>
        <div className="ops-grid c4" style={{ marginTop: 8 }}>
          {[0, 1, 2, 3].map((n) => (
            <Btn key={n} size="sm" kind={v === n ? 'on' : 'ghost'} onClick={() => setV(n)}>
              {n}
              {unit}
            </Btn>
          ))}
        </div>
      </div>

      <Btn
        kind="success"
        size="lg"
        block
        disabled={g.cleared || g.failed}
        onClick={() => {
          d({ type: 'tally.record', value: v })
          setV(0)
        }}
      >
        {g.round + 1}회차 기록 ({v}
        {unit})
      </Btn>
      <div className="ops-hint" style={{ textAlign: 'center' }}>
        누계가 {target}
        {unit}에 닿으면 자동으로 인용 선고됩니다
      </div>

      <div className="ops-rounds">
        {g.values.map((val, i) => (
          <button
            key={i}
            className={`ops-round ${g.results[i] !== 'pending' ? 'win' : i === g.round ? 'now' : ''}`}
            onClick={() => d({ type: 'tally.setRound', round: i })}
          >
            {i + 1}회
            <br />
            {g.results[i] !== 'pending' ? `${val}${unit}` : '-'}
          </button>
        ))}
      </div>
    </>
  )
}

/** 대결형 — 피고인 vs 검사단 */
function VersusControl({
  g,
  gc,
  config,
  d,
}: {
  g: VersusState
  gc: GameConfig
  config: Config
  d: (a: any) => void
}) {
  const points = gc.scoring === 'points'
  const [mine, setMine] = useState(0)
  const [theirs, setTheirs] = useState(0)
  const unit = gc.tallyUnit || '점'
  const sumMine = g.mine.reduce((a, b) => a + (b || 0), 0)
  const sumTheirs = g.theirs.reduce((a, b) => a + (b || 0), 0)

  if (!points) {
    return (
      <>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="ops-badge accent">
            {g.round + 1}회 / {g.results.length}
          </span>
          <span className="ops-badge">
            {config.defendant.name} {g.results.filter((r) => r === 'win').length} : 검사단{' '}
            {g.results.filter((r) => r === 'lose').length}
          </span>
        </div>
        <div className="ops-grid c2">
          <Btn
            kind="success"
            size="lg"
            disabled={g.cleared || g.failed}
            onClick={() => d({ type: 'versus.judge', win: true })}
          >
            {config.defendant.name} 승
          </Btn>
          <Btn
            kind="danger"
            size="lg"
            disabled={g.cleared || g.failed}
            onClick={() => d({ type: 'versus.judge', win: false })}
          >
            검사단 승
          </Btn>
        </div>
        <div className="ops-hint" style={{ textAlign: 'center' }}>
          {gc.clearThreshold ?? 1}회 승리하면 인용 선고됩니다
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="ops-badge accent">
          {g.round + 1}회 / {g.results.length}
        </span>
        <span className="ops-badge">
          누계 {sumMine} : {sumTheirs}
        </span>
      </div>

      <div className="ops-grid c2">
        <div className="ops-field">
          <label className="ops-label">{config.defendant.name} 점수</label>
          <input
            className="ops-input ops-num"
            type="number"
            value={mine}
            onChange={(e) => setMine(Number(e.target.value) || 0)}
            style={{ textAlign: 'center', fontSize: 22, minHeight: 52 }}
          />
        </div>
        <div className="ops-field">
          <label className="ops-label">검사단 점수</label>
          <input
            className="ops-input ops-num"
            type="number"
            value={theirs}
            onChange={(e) => setTheirs(Number(e.target.value) || 0)}
            style={{ textAlign: 'center', fontSize: 22, minHeight: 52 }}
          />
        </div>
      </div>

      <Btn
        kind="success"
        size="lg"
        block
        disabled={g.cleared || g.failed}
        onClick={() => {
          d({ type: 'versus.record', mine, theirs })
          setMine(0)
          setTheirs(0)
        }}
      >
        {g.round + 1}회 기록 ({mine} : {theirs})
      </Btn>
      <div className="ops-hint" style={{ textAlign: 'center' }}>
        {g.results.length}회 모두 마치면 합산 점수가 높은 쪽이 승리합니다 (단위 {unit})
      </div>

      <div className="ops-rounds">
        {g.results.map((r, i) => (
          <button
            key={i}
            className={`ops-round ${r === 'win' ? 'win' : r === 'lose' ? 'lose' : i === g.round ? 'now' : ''}`}
            onClick={() => d({ type: 'versus.setRound', round: i })}
          >
            {i + 1}회
            <br />
            {r !== 'pending' ? `${g.mine[i]}:${g.theirs[i]}` : '-'}
          </button>
        ))}
      </div>
    </>
  )
}

/** 제비뽑기 노역 */
function DrawControl({
  g,
  gc,
  state,
  d,
}: {
  g: DrawState
  gc: GameConfig
  state: AppState
  d: (a: any) => void
}) {
  const missions = gc.missions || []
  const left = missions.length - g.drawn.length
  const m = state.meta

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="ops-badge warn">
          미확보 {m.shortfall}
          {m.unit}
        </span>
        <span className="ops-badge">남은 항목 {left}개</span>
      </div>

      {g.current === null ? (
        <>
          <Btn
            kind="warn"
            size="lg"
            block
            disabled={left <= 0}
            onClick={() => d({ type: 'draw.pick' })}
          >
            {left > 0 ? '추첨하기' : '남은 항목 없음'}
          </Btn>
          <div className="ops-hint" style={{ textAlign: 'center' }}>
            피고인이 「도전」을 외치면 누르세요. 이미 나온 항목은 다시 뽑히지 않습니다.
          </div>
        </>
      ) : (
        <>
          <div className="ops-note" style={{ borderColor: 'var(--warn)' }}>
            <b style={{ color: '#fcd34d' }}>
              제{g.current + 1}호 · {g.mission?.title}
            </b>
            <br />
            {g.mission?.desc}
            <br />
            <span className="ops-hint">
              완수 시 +{g.mission?.reward ?? gc.missions?.[0]?.reward ?? 15}
              {m.unit}
            </span>
          </div>
          <div className="ops-grid c2">
            <Btn kind="success" size="lg" onClick={() => d({ type: 'draw.judge', win: true })}>
              완수
            </Btn>
            <Btn kind="danger" size="lg" onClick={() => d({ type: 'draw.judge', win: false })}>
              미완수
            </Btn>
          </div>
          <Btn kind="ghost" size="sm" block onClick={() => d({ type: 'draw.undoPick' })}>
            추첨 취소 (다시 뽑기)
          </Btn>
        </>
      )}

      <div className="ops-divider" />
      <div className="ops-sub">노역 항목</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {missions.map((ms, i) => (
          <div key={i} className="ops-row">
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              제{i + 1}호 · {ms.title}
            </span>
            <span className="ops-badge" style={{ flex: 'none' }}>
              {g.results[i] === 'win' ? '완수' : g.results[i] === 'lose' ? '미완수' : '대기'}
            </span>
          </div>
        ))}
      </div>
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
  const itvs = config.games.find((x) => x.id === 'witnessq')?.interviews || []

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="ops-badge accent">
          신문 {g.round + 1} / {g.results.length}
        </span>
        {g.category && <span className="ops-badge">{g.category}</span>}
        <span className="ops-badge warn">남은 문항 {g.remaining ?? 0}</span>
      </div>

      <Btn
        kind="warn"
        size="lg"
        block
        disabled={(g.remaining ?? 0) <= 0}
        onClick={() => d({ type: 'bonus.pick' })}
      >
        {(g.remaining ?? 0) > 0 ? '무작위 신문 사항 뽑기' : '남은 문항 없음'}
      </Btn>
      <div className="ops-hint" style={{ textAlign: 'center', marginTop: -4 }}>
        이미 나온 문항은 다시 뽑히지 않습니다
      </div>

      <div className="ops-note">
        <div className="ops-hint" style={{ marginBottom: 3 }}>신문 사항 — TV에 표시됨</div>
        <b style={{ fontSize: 15 }}>{g.question || '신문 사항 미입력'}</b>
      </div>

      <div className="ops-secret">
        <div className="ops-secret-label">
          증인 {config.witness.name} 진술 · 나만 보임
        </div>
        <div className="ops-secret-value" style={{ fontSize: 20 }}>
          {g.answer || '진술 미입력 — 설정에서 입력하세요'}
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

      {/* 신문 사항 고르기 */}
      <details className="ops-details">
        <summary style={{ padding: '8px 0' }}>
          신문 사항 직접 고르기 ({itvs.length}개)
        </summary>
        <div className="ops-list" style={{ marginTop: 8, maxHeight: 320 }}>
          {itvs.map((it, i) => (
            <button
              key={i}
              className="ops-row"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor:
                  i === g.round
                    ? 'var(--accent)'
                    : g.results[i] === 'win'
                      ? 'var(--success)'
                      : g.results[i] === 'lose'
                        ? 'var(--danger)'
                        : 'var(--border)',
              }}
              onClick={() => d({ type: 'bonus.setRound', round: i })}
            >
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className="ops-hint">
                  {it.cat} {(g.asked || []).includes(i) ? '· 출제됨' : ''} ·{' '}
                </span>
                {it.q}
              </span>
              {g.results[i] !== 'pending' && (
                <span
                  className={`ops-badge ${g.results[i] === 'win' ? 'success' : 'danger'}`}
                  style={{ flex: 'none' }}
                >
                  {g.results[i] === 'win' ? '일치' : '불일치'}
                </span>
              )}
            </button>
          ))}
        </div>
        <Btn
          size="sm"
          kind="ghost"
          block
          onClick={() => d({ type: 'bonus.resetAsked' })}
        >
          출제 이력 초기화 (전부 다시 뽑기 가능)
        </Btn>
      </details>

      <div className="ops-divider" />

      <div className="ops-sub">진술이 일치하면 기각된 공소사실 재심 개시</div>
      <div className="ops-hint">공소사실 1건당 재심은 1회만 허가됩니다</div>
      {failed.length === 0 ? (
        <div className="ops-note">현재 기각된 공소사실이 없습니다</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {failed.map((x) => {
            const used = (state.games[x.id]?.revives || 0) >= 1
            return (
              <Btn
                key={x.id}
                kind={used ? 'ghost' : 'warn'}
                disabled={used}
                onClick={() => d({ type: 'revive.grant', gameId: x.id })}
              >
                {x.no} · {x.charge || x.title} {used ? '(재심 완료)' : '재심'}
              </Btn>
            )
          })}
        </div>
      )}
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
  const [vol, setVol] = useState(1.6)

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
              TV {conn.tv} · 방청 {conn.spectator} · 판사 {conn.control}
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
              인용 {m.cleared}/{m.totalGames}
              {m.demandStanding > 0 && ` · 확정 ${m.demandStanding}년`}
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
        {/* 진행 순서 */}
        <div className="ops-note" style={{ borderColor: 'var(--warn)' }}>
          <b style={{ color: '#fcd34d' }}>재판 진행 순서</b>
          <br />① 아래에서 <b>공소사실</b> 선택 → 담당 검사가 죄명·구형 낭독 → ② 게임 진행 후{' '}
          <b>인용 / 기각</b> 선고 → ③ 인용되면 적립금이 다음 단계로 자동 상승 → ④ 기각되면{' '}
          <b>증인 신문</b>으로 재심 신청
        </div>

        {/* 화면 전환 */}
        <Card title="TV 화면" desc="누르면 TV와 방청석 폰이 즉시 바뀝니다">
          <div className="ops-grid c4">
            {screenBtn('개정', 'intro')}
            {screenBtn('진행표', 'dashboard')}
            {screenBtn('피고인', 'defendant')}
            {screenBtn('판결문', 'verdict')}
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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        minWidth: 0,
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {x.charge || x.title}
                      </span>
                      <span className="ops-hint">
                        {x.prosecutor} · 징역 {x.demand ?? 0}년
                      </span>
                    </span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                    <span className="ops-hint">
                      {config.prize.ladder[i] ?? ''}
                      {m.unit}
                    </span>
                    {s?.cleared ? (
                      <span className="ops-badge success">인용</span>
                    ) : s?.failed ? (
                      <span className="ops-badge danger">기각</span>
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
                <span className="ops-hint">재심 전용</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 현재 게임 */}
        {gc && g ? (
          <Card
            active
            title={`${gc.no} · ${gc.charge || gc.title}`}
            desc={gc.rule}
            right={
              g.cleared ? (
                <span className="ops-badge success">인용</span>
              ) : g.failed ? (
                <span className="ops-badge danger">기각</span>
              ) : (
                <span className="ops-badge">심리중</span>
              )
            }
          >
            {gc.indictment && (
              <div className="ops-note">
                <span className="ops-hint">공소사실</span>
                <br />
                {gc.indictment}
              </div>
            )}
            {gc.win && (
              <div className="ops-note">
                인용 조건 <b>{gc.win}</b> · 구형 <b>징역 {gc.demand ?? 0}년</b>
                {!g.cleared && (
                  <>
                    <br />
                    인용 시 적립금{' '}
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
            {gc.type === 'tally' && <TallyControl g={g as TallyState} gc={gc} d={d} />}
            {gc.type === 'versus' && (
              <VersusControl g={g as VersusState} gc={gc} config={config} d={d} />
            )}
            {gc.type === 'draw' && (
              <DrawControl g={g as DrawState} gc={gc} state={state} d={d} />
            )}
            {gc.type === 'simple' && <SimpleControl g={g as SimpleState} d={d} />}

            {gc.type !== 'draw' && (
              <>
                <div className="ops-divider" />
                <Btn
                  kind="warn"
                  size="lg"
                  block
                  onClick={() => {
                    if (confirm(`${gc.charge || gc.title} 판정을 지우고 처음부터 다시 진행합니다.`))
                      d({ type: 'game.retry' })
                  }}
                >
                  이 게임 재도전
                </Btn>
                <div className="ops-hint" style={{ textAlign: 'center', marginTop: -4 }}>
                  라운드 기록만 지웁니다. 참여 인원과 출제 이력은 그대로 유지됩니다.
                </div>
              </>
            )}

            <details className="ops-details">
              <summary style={{ padding: '8px 0' }}>직권 선고 · 완전 초기화</summary>
              <div style={{ marginTop: 8 }}>
                <div className="ops-grid c3">
                  <Btn size="sm" kind="success" onClick={() => d({ type: 'game.clear' })}>
                    직권 인용
                  </Btn>
                  <Btn size="sm" kind="danger" onClick={() => d({ type: 'game.fail' })}>
                    직권 기각
                  </Btn>
                  <Btn size="sm" kind="ghost" onClick={() => d({ type: 'game.reset' })}>
                    완전 초기화
                  </Btn>
                </div>
                <div className="ops-hint" style={{ marginTop: 6 }}>
                  완전 초기화는 참여 인원·출제 이력까지 전부 지웁니다
                </div>
              </div>
            </details>
          </Card>
        ) : (
          <Card title="현재 공소사실">
            <div className="ops-note">위에서 공소사실을 선택하면 조작 버튼이 나타납니다</div>
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

        {/* 사운드보드 */}
        <Card title="효과음" desc="TV 스피커로 즉시 재생됩니다. 게임 결과에는 영향 없음">
          <div>
            <div className="ops-sub" style={{ marginBottom: 6 }}>TV 볼륨</div>
            <div className="ops-grid c4">
              {(
                [
                  ['작게', 0.7],
                  ['보통', 1.2],
                  ['크게', 1.6],
                  ['최대', 2.4],
                ] as [string, number][]
              ).map(([label, v]) => (
                <Btn
                  key={label}
                  size="sm"
                  kind={vol === v ? 'on' : 'ghost'}
                  onClick={() => {
                    setVol(v)
                    d({ type: 'fx', kind: 'volume', payload: { value: v } })
                  }}
                >
                  {label}
                </Btn>
              ))}
            </div>
          </div>

          <div className="ops-divider" />

          <div className="ops-sub">사운드보드</div>
          <div className="ops-grid c3">
            {SOUNDBOARD.map((s) => (
              <Btn
                key={s.id}
                size="sm"
                kind="ghost"
                onClick={() => d({ type: 'fx', kind: 'sfx', payload: { name: s.id } })}
              >
                {s.label}
              </Btn>
            ))}
          </div>
        </Card>

        <Fold title="화면 연출 수동 재생">
          <div className="ops-grid c3">
            {(
              [
                ['지폐비', { kind: 'cash' }],
                ['인용 연출', { kind: 'clear', payload: { title: '직권', total: 0, unit: '만원' } }],
                ['기각 연출', { kind: 'fail' }],
                ['하트 폭발', { kind: 'love-win' }],
                ['카운트다운', { kind: 'countdown' }],
                ['인용 도장', { kind: 'stamp', payload: { text: '인 용', tone: 'grant' } }],
                ['기각 도장', { kind: 'stamp', payload: { text: '기 각', tone: 'red' } }],
                ['추첨 드럼롤', { kind: 'draw' }],
                ['재심 종', { kind: 'revive' }],
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
              if (confirm('심리 진행과 적립금을 전부 처음 상태로 되돌립니다. 진행할까요?'))
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
