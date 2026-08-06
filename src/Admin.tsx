import { useEffect, useMemo, useState } from 'react'
import { useSync } from './net'
import { SLOTS, DEFAULT_SOUNDS, initAudio, playFile, setVolume } from './sound'
import type { Config, GameConfig } from './types'

const PIN_KEY = 'marry.pin'

// ══════════════════════════════════════════════════════════════
// 기본 요소
// ══════════════════════════════════════════════════════════════

function Card({
  title,
  desc,
  children,
  defaultOpen = true,
}: {
  title: string
  desc?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="ops-card ops-details" open={defaultOpen}>
      <summary>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          {desc && <span className="ops-hint">{desc}</span>}
        </span>
      </summary>
      <div className="ops-card-body">{children}</div>
    </details>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  area,
  secret,
  placeholder,
}: {
  label?: string
  hint?: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  area?: boolean
  secret?: boolean
  placeholder?: string
}) {
  return (
    <div className="ops-field">
      {label && (
        <label className="ops-label">
          {label}
          {hint && <span className="ops-hint">{hint}</span>}
        </label>
      )}
      {area ? (
        <textarea
          className="ops-textarea"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={`ops-input ${secret ? 'secret' : ''} ${type === 'number' ? 'ops-num' : ''}`}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
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
  kind?: '' | 'primary' | 'success' | 'danger' | 'warn' | 'ghost'
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

/** 목록 항목 한 줄 (입력 + 삭제) */
function RowItem({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 8 }}>{children}</div>
      <button
        className="ops-btn ghost sm"
        style={{ flex: 'none', minWidth: 44, color: '#fca5a5', borderColor: '#5c2b2b' }}
        onClick={onDelete}
        aria-label="삭제"
      >
        삭제
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════

export default function Admin() {
  const pin = localStorage.getItem(PIN_KEY) || undefined
  const { config: live, status } = useSync('admin', pin)
  const [cfg, setCfg] = useState<Config | null>(null)
  const [saved, setSaved] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [raw, setRaw] = useState(false)
  const [rawText, setRawText] = useState('')
  const [sfxFiles, setSfxFiles] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/sfx')
      .then((r) => r.json())
      .then((j) => setSfxFiles(j.files || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (live && !cfg) {
      setCfg(structuredClone(live))
      setSaved(JSON.stringify(live))
      setRawText(JSON.stringify(live, null, 2))
    }
  }, [live, cfg])

  useEffect(() => {
    document.body.dataset.scroll = 'on'
    return () => {
      delete document.body.dataset.scroll
    }
  }, [])

  const dirty = useMemo(() => (cfg ? JSON.stringify(cfg) !== saved : false), [cfg, saved])

  if (status === 'denied' || !pin) {
    return (
      <div
        className="ops"
        style={{
          display: 'flex',
          minHeight: '100dvh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>인증이 필요합니다</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          컨트롤러에서 PIN을 먼저 입력해주세요
        </div>
        <a className="ops-btn primary" href="/control">
          컨트롤러로 이동
        </a>
      </div>
    )
  }

  if (!cfg) {
    return (
      <div
        className="ops"
        style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>설정 불러오는 중…</div>
      </div>
    )
  }

  const up = (fn: (c: Config) => void) => {
    const next = structuredClone(cfg)
    fn(next)
    setCfg(next)
  }
  const G = (c: Config, id: string) => c.games.find((x) => x.id === id)!

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const body = raw ? JSON.parse(rawText) : cfg
      const r = await fetch('/api/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin, config: body }),
      })
      const j = await r.json()
      if (j.ok) {
        setMsg({ ok: true, text: '저장했습니다. 모든 화면에 반영됩니다.' })
        setSaved(JSON.stringify(body))
        if (!raw) setRawText(JSON.stringify(body, null, 2))
        else setCfg(body)
      } else {
        setMsg({ ok: false, text: `저장 실패: ${j.error}` })
      }
    } catch (e) {
      setMsg({ ok: false, text: `오류: ${e}` })
    }
    setSaving(false)
  }

  const mains = cfg.games.filter((g) => !g.bonus)
  const unit = cfg.prize.unit

  return (
    <div className="ops">
      {/* 상단 */}
      <div className="ops-bar">
        <div
          className="ops-bar-inner"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>설정</span>
            {dirty && <span className="ops-badge warn">저장 안 됨</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
            <Btn size="sm" kind="ghost" onClick={() => setRaw((v) => !v)}>
              {raw ? '양식' : 'JSON'}
            </Btn>
            <a className="ops-btn ghost sm" href="/control">
              컨트롤러
            </a>
          </div>
        </div>
      </div>

      <div className="ops-page">
        {msg && (
          <div
            className="ops-note"
            style={{
              borderColor: msg.ok ? 'var(--success)' : 'var(--danger)',
              color: msg.ok ? '#86efac' : '#fca5a5',
            }}
          >
            {msg.text}
          </div>
        )}

        {raw ? (
          <>
            <textarea
              className="ops-textarea"
              spellCheck={false}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              style={{ minHeight: '62vh', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 13 }}
            />
            <div className="ops-hint">JSON 문법이 올바르지 않으면 저장되지 않습니다.</div>
          </>
        ) : (
          <>
            {/* 상금 */}
            <Card
              title="적립금 사다리"
              desc="공소사실을 몇 건 인용받았는지에 따라 누적 금액이 결정됩니다. 라운드당 적립은 없습니다."
            >
              <div className="ops-grid c2">
                <Field
                  label="단위"
                  hint="예: 만원"
                  value={cfg.prize.unit}
                  onChange={(v) => up((c) => void (c.prize.unit = v))}
                />
                <Field
                  label="최대 금액"
                  hint="보너스 포함"
                  type="number"
                  value={cfg.prize.maxTotal}
                  onChange={(v) => up((c) => void (c.prize.maxTotal = Number(v) || 0))}
                />
              </div>

              <div className="ops-divider" />

              <div className="ops-sub">단계별 누적 금액</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cfg.prize.ladder.map((amt, i) => (
                  <RowItem key={i} onDelete={() => up((c) => void c.prize.ladder.splice(i, 1))}>
                    <span
                      style={{
                        flex: 'none',
                        alignSelf: 'center',
                        width: 62,
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}
                    >
                      {i + 1}건 인용
                    </span>
                    <input
                      className="ops-input ops-num"
                      type="number"
                      value={amt}
                      onChange={(e) =>
                        up((c) => void (c.prize.ladder[i] = Number(e.target.value) || 0))
                      }
                    />
                    <span
                      style={{
                        flex: 'none',
                        alignSelf: 'center',
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}
                    >
                      {unit}
                    </span>
                  </RowItem>
                ))}
              </div>
              <Btn kind="ghost" block onClick={() => up((c) => void c.prize.ladder.push(0))}>
                단계 추가
              </Btn>

              {cfg.prize.ladder.length !== mains.length && (
                <div
                  className="ops-note"
                  style={{ borderColor: 'var(--warn)', color: '#fcd34d' }}
                >
                  단계 {cfg.prize.ladder.length}개 / 공소사실 {mains.length}건 — 개수를 맞춰주세요
                </div>
              )}

              <Field
                label="직권 가산 단위"
                hint="증인 신문 성공 시 지급 버튼 금액"
                type="number"
                value={cfg.prize.bonusStep ?? 10}
                onChange={(v) => up((c) => void (c.prize.bonusStep = Number(v) || 0))}
              />
            </Card>

            {/* 게임 */}
            {cfg.games.map((gc: GameConfig) => {
              const idx = mains.findIndex((x) => x.id === gc.id)
              return (
                <Card
                  key={gc.id}
                  title={`${gc.no} · ${gc.charge || gc.title}`}
                  desc={
                    gc.bonus
                      ? '재심 전용 (적립금 사다리 미포함)'
                      : `${idx + 1}번째 · 인용 시 누적 ${cfg.prize.ladder[idx] ?? '?'}${unit} · 구형 징역 ${gc.demand ?? 0}년`
                  }
                  defaultOpen={false}
                >
                  <div className="ops-grid c2">
                    <Field
                      label="항목 표기"
                      hint="예: 공소사실 제1항"
                      value={gc.no}
                      onChange={(v) => up((c) => void (G(c, gc.id).no = v))}
                    />
                    <Field
                      label="담당 검사"
                      value={gc.prosecutor || ''}
                      onChange={(v) => up((c) => void (G(c, gc.id).prosecutor = v))}
                    />
                  </div>
                  <div className="ops-grid c2">
                    <Field
                      label="죄명"
                      hint="TV에 크게 표시"
                      value={gc.charge || ''}
                      onChange={(v) => up((c) => void (G(c, gc.id).charge = v))}
                    />
                    <Field
                      label="구형 징역 (년)"
                      type="number"
                      value={gc.demand ?? 0}
                      onChange={(v) => up((c) => void (G(c, gc.id).demand = Number(v) || 0))}
                    />
                  </div>
                  <Field
                    label="공소사실"
                    hint="억까 사유 · TV에 표시"
                    area
                    value={gc.indictment || ''}
                    onChange={(v) => up((c) => void (G(c, gc.id).indictment = v))}
                  />
                  <Field
                    label="게임 이름"
                    value={gc.title}
                    onChange={(v) => up((c) => void (G(c, gc.id).title = v))}
                  />
                  <Field
                    label="심리 방법"
                    hint="게임 진행 방법 · TV와 컨트롤러에 표시"
                    area
                    value={gc.rule || ''}
                    onChange={(v) => up((c) => void (G(c, gc.id).rule = v))}
                  />
                  <Field
                    label="인용 조건"
                    hint="예: 3라운드 중 1회 이상 적중"
                    value={gc.win || ''}
                    onChange={(v) => up((c) => void (G(c, gc.id).win = v))}
                  />

                  {gc.type === 'culprit' && (
                    <>
                      <div className="ops-divider" />
                      <div className="ops-grid c2">
                        <Field
                          label="라운드 수"
                          type="number"
                          value={gc.rounds ?? 3}
                          onChange={(v) => up((c) => void (G(c, gc.id).rounds = Number(v) || 1))}
                        />
                        <Field
                          label="인용 기준"
                          hint="적중 횟수"
                          type="number"
                          value={gc.clearThreshold ?? 1}
                          onChange={(v) =>
                            up((c) => void (G(c, gc.id).clearThreshold = Number(v) || 1))
                          }
                        />
                      </div>

                      <div className="ops-sub">증거물 · 이모지 / 진짜 / 벌칙</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(gc.evidences || []).map((e, i) => (
                          <RowItem
                            key={i}
                            onDelete={() => up((c) => void G(c, gc.id).evidences!.splice(i, 1))}
                          >
                            <input
                              className="ops-input"
                              style={{ flex: 'none', width: 56, textAlign: 'center' }}
                              value={e.emoji || ''}
                              onChange={(ev) =>
                                up((c) => void (G(c, gc.id).evidences![i].emoji = ev.target.value))
                              }
                            />
                            <input
                              className="ops-input"
                              value={e.real}
                              placeholder="진짜"
                              onChange={(ev) =>
                                up((c) => void (G(c, gc.id).evidences![i].real = ev.target.value))
                              }
                            />
                            <input
                              className="ops-input secret"
                              value={e.fake}
                              placeholder="벌칙"
                              onChange={(ev) =>
                                up((c) => void (G(c, gc.id).evidences![i].fake = ev.target.value))
                              }
                            />
                          </RowItem>
                        ))}
                      </div>
                      <Btn
                        kind="ghost"
                        block
                        onClick={() =>
                          up((c) =>
                            G(c, gc.id).evidences!.push({ real: '', fake: '', emoji: '🍽️' })
                          )
                        }
                      >
                        증거물 추가
                      </Btn>
                    </>
                  )}

                  {gc.type === 'voice' && (
                    <>
                      <div className="ops-divider" />
                      <div className="ops-grid c2">
                        <Field
                          label="인용 기준"
                          hint="맞혀야 하는 문제 수"
                          type="number"
                          value={gc.clearThreshold ?? 3}
                          onChange={(v) =>
                            up((c) => void (G(c, gc.id).clearThreshold = Number(v) || 3))
                          }
                        />
                        <Field
                          label="문제당 청취 횟수"
                          type="number"
                          value={gc.maxListens ?? 3}
                          onChange={(v) => up((c) => void (G(c, gc.id).maxListens = Number(v) || 3))}
                        />
                      </div>

                      <div className="ops-sub" style={{ color: 'var(--secret)' }}>
                        정답 단어 — TV에는 글자 수만 표시됩니다
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(gc.questions || []).map((w, i) => (
                          <RowItem
                            key={i}
                            onDelete={() =>
                              up((c) => {
                                G(c, gc.id).questions!.splice(i, 1)
                                G(c, gc.id).rounds = G(c, gc.id).questions!.length
                              })
                            }
                          >
                            <span
                              className="ops-num"
                              style={{
                                flex: 'none',
                                alignSelf: 'center',
                                width: 18,
                                fontSize: 12,
                                color: 'var(--faint)',
                              }}
                            >
                              {i + 1}
                            </span>
                            <input
                              className="ops-input secret"
                              value={w}
                              onChange={(e) =>
                                up((c) => void (G(c, gc.id).questions![i] = e.target.value))
                              }
                            />
                            <span
                              className="ops-num"
                              style={{
                                flex: 'none',
                                alignSelf: 'center',
                                width: 32,
                                fontSize: 12,
                                color: 'var(--muted)',
                              }}
                            >
                              {w.length}자
                            </span>
                          </RowItem>
                        ))}
                      </div>
                      <Btn
                        kind="ghost"
                        block
                        onClick={() =>
                          up((c) => {
                            G(c, gc.id).questions!.push('')
                            G(c, gc.id).rounds = G(c, gc.id).questions!.length
                          })
                        }
                      >
                        단어 추가
                      </Btn>
                    </>
                  )}

                  {gc.type === 'tally' && (
                    <>
                      <div className="ops-divider" />
                      <div className="ops-grid c3">
                        <Field
                          label="회차 수"
                          type="number"
                          value={gc.rounds ?? 3}
                          onChange={(v) => up((c) => void (G(c, gc.id).rounds = Number(v) || 1))}
                        />
                        <Field
                          label="합계 목표"
                          type="number"
                          value={gc.target ?? 0}
                          onChange={(v) => up((c) => void (G(c, gc.id).target = Number(v) || 0))}
                        />
                        <Field
                          label="단위"
                          hint="명, 개 …"
                          value={gc.tallyUnit || ''}
                          onChange={(v) => up((c) => void (G(c, gc.id).tallyUnit = v))}
                        />
                      </div>
                      <Field
                        label="기록 항목 이름"
                        hint="예: 찍힌 인원"
                        value={gc.tallyLabel || ''}
                        onChange={(v) => up((c) => void (G(c, gc.id).tallyLabel = v))}
                      />
                      <div className="ops-note">
                        회차마다 숫자를 기록하고, 합계가 목표에 닿으면 자동으로 인용 선고됩니다.
                      </div>
                    </>
                  )}

                  {gc.type === 'versus' && (
                    <>
                      <div className="ops-divider" />
                      <div className="ops-sub">승부 방식</div>
                      <div className="ops-grid c2">
                        <Btn
                          kind={gc.scoring !== 'points' ? 'primary' : 'ghost'}
                          onClick={() => up((c) => void (G(c, gc.id).scoring = 'rounds'))}
                        >
                          승수제
                        </Btn>
                        <Btn
                          kind={gc.scoring === 'points' ? 'primary' : 'ghost'}
                          onClick={() => up((c) => void (G(c, gc.id).scoring = 'points'))}
                        >
                          점수 합산제
                        </Btn>
                      </div>
                      <div className="ops-grid c3">
                        <Field
                          label="회차 수"
                          type="number"
                          value={gc.rounds ?? 1}
                          onChange={(v) => up((c) => void (G(c, gc.id).rounds = Number(v) || 1))}
                        />
                        {gc.scoring !== 'points' && (
                          <Field
                            label="인용 기준 승수"
                            type="number"
                            value={gc.clearThreshold ?? 1}
                            onChange={(v) =>
                              up((c) => void (G(c, gc.id).clearThreshold = Number(v) || 1))
                            }
                          />
                        )}
                        <Field
                          label="점수 단위"
                          hint="점 …"
                          value={gc.tallyUnit || ''}
                          onChange={(v) => up((c) => void (G(c, gc.id).tallyUnit = v))}
                        />
                      </div>
                      <div className="ops-note">
                        {gc.scoring === 'points'
                          ? '회차마다 양측 점수를 입력하고, 전 회차를 마치면 합계가 높은 쪽이 승리합니다.'
                          : '회차마다 승패를 눌러 판정하고, 기준 승수에 도달하면 인용 선고됩니다.'}
                      </div>
                    </>
                  )}

                  {gc.type === 'draw' && (
                    <>
                      <div className="ops-divider" />
                      <div className="ops-sub">노역 항목 (제비뽑기)</div>
                      <div className="ops-hint">
                        추첨은 중복 없이 진행됩니다. 완수 시 아래 금액이 적립금에 가산됩니다.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(gc.missions || []).map((ms, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              padding: 10,
                              borderRadius: 10,
                              border: '1px solid var(--border)',
                              background: 'var(--surface-2)',
                            }}
                          >
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                className="ops-input"
                                value={ms.title}
                                placeholder="미션 이름"
                                onChange={(e) =>
                                  up((c) => void (G(c, gc.id).missions![i].title = e.target.value))
                                }
                              />
                              <input
                                className="ops-input ops-num"
                                type="number"
                                style={{ width: 96, flex: 'none', textAlign: 'center' }}
                                value={ms.reward ?? 15}
                                onChange={(e) =>
                                  up(
                                    (c) =>
                                      void (G(c, gc.id).missions![i].reward =
                                        Number(e.target.value) || 0)
                                  )
                                }
                              />
                            </div>
                            <textarea
                              className="ops-textarea"
                              value={ms.desc || ''}
                              placeholder="미션 상세 설명 (TV에 표시)"
                              onChange={(e) =>
                                up((c) => void (G(c, gc.id).missions![i].desc = e.target.value))
                              }
                            />
                            <Btn
                              size="sm"
                              kind="ghost"
                              block
                              onClick={() => up((c) => void G(c, gc.id).missions!.splice(i, 1))}
                            >
                              삭제
                            </Btn>
                          </div>
                        ))}
                      </div>
                      <Btn
                        kind="ghost"
                        block
                        onClick={() =>
                          up((c) => {
                            const gg = G(c, gc.id)
                            if (!gg.missions) gg.missions = []
                            gg.missions.push({ title: '', desc: '', reward: 15 })
                          })
                        }
                      >
                        노역 항목 추가
                      </Btn>
                    </>
                  )}

                  {gc.type === 'bonus' && (
                    <>
                      <div className="ops-divider" />
                      <div className="ops-sub">신문 사항과 증인 진술</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(gc.interviews || []).map((it, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              padding: 10,
                              borderRadius: 10,
                              border: '1px solid var(--border)',
                              background: 'var(--surface-2)',
                            }}
                          >
                            <input
                              className="ops-input"
                              value={it.cat || ''}
                              placeholder="분류 (예: 취향 & 식성)"
                              style={{ fontSize: 13 }}
                              onChange={(e) =>
                                up((c) => void (G(c, gc.id).interviews![i].cat = e.target.value))
                              }
                            />
                            <input
                              className="ops-input"
                              value={it.q}
                              placeholder="신문 사항 (TV에 표시)"
                              onChange={(e) =>
                                up((c) => void (G(c, gc.id).interviews![i].q = e.target.value))
                              }
                            />
                            <input
                              className="ops-input secret"
                              value={it.a || ''}
                              placeholder="증인 진술 (공개 전까지 숨김)"
                              onChange={(e) =>
                                up((c) => void (G(c, gc.id).interviews![i].a = e.target.value))
                              }
                            />
                            <Btn
                              size="sm"
                              kind="ghost"
                              block
                              onClick={() => up((c) => void G(c, gc.id).interviews!.splice(i, 1))}
                            >
                              삭제
                            </Btn>
                          </div>
                        ))}
                      </div>
                      <Btn
                        kind="ghost"
                        block
                        onClick={() => up((c) => G(c, gc.id).interviews!.push({ q: '', a: '' }))}
                      >
                        질문 추가
                      </Btn>
                    </>
                  )}

                  {gc.type === 'simple' && (
                    <div className="ops-note">
                      판사가 컨트롤러에서 <b>인용 / 기각</b>만 눌러 선고하는 공소사실입니다. 검사가
                      게임을 정하면 위의 죄명·공소사실·심리 방법·인용 조건만 채워 넣으면 됩니다.
                    </div>
                  )}
                </Card>
              )
            })}

            {/* 법정 */}
            <Card title="재판 정보" defaultOpen={false}>
              <div className="ops-grid c2">
                <Field
                  label="법원 이름"
                  hint="판결문 머리"
                  value={cfg.court.name || ''}
                  onChange={(v) => up((c) => void (c.court.name = v))}
                />
                <Field
                  label="재판장"
                  value={cfg.court.judge}
                  onChange={(v) => up((c) => void (c.court.judge = v))}
                />
              </div>
              <div className="ops-grid c2">
                <Field
                  label="사건번호"
                  value={cfg.court.caseNo}
                  onChange={(v) => up((c) => void (c.court.caseNo = v))}
                />
                <Field
                  label="사건명"
                  hint="예: 독단 행복추구 사건"
                  value={cfg.court.caseName || ''}
                  onChange={(v) => up((c) => void (c.court.caseName = v))}
                />
              </div>
              <div className="ops-grid c2">
                <Field
                  label="법정"
                  hint="예: 제1호 법정"
                  value={cfg.court.room}
                  onChange={(v) => up((c) => void (c.court.room = v))}
                />
                <Field
                  label="선고일 (결혼식)"
                  hint="YYYY-MM-DD"
                  value={cfg.court.weddingDate}
                  onChange={(v) => up((c) => void (c.court.weddingDate = v))}
                />
              </div>

              <div className="ops-sub">판결문 전용 죄목</div>
              <div className="ops-hint">게임과 무관하게 판결문 표에만 실리는 항목입니다.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(cfg.court.extraCharges || []).map((ch, i) => (
                  <RowItem
                    key={i}
                    onDelete={() => up((c) => void c.court.extraCharges!.splice(i, 1))}
                  >
                    <input
                      className="ops-input"
                      value={ch}
                      onChange={(e) => up((c) => void (c.court.extraCharges![i] = e.target.value))}
                    />
                  </RowItem>
                ))}
              </div>
              <Btn
                kind="ghost"
                block
                onClick={() =>
                  up((c) => {
                    if (!c.court.extraCharges) c.court.extraCharges = []
                    c.court.extraCharges.push('')
                  })
                }
              >
                죄목 추가
              </Btn>
            </Card>

            <Card title="피고인 · 증인" defaultOpen={false}>
              <div className="ops-grid c2">
                <Field
                  label="피고인 이름"
                  value={cfg.defendant.name}
                  onChange={(v) => up((c) => void (c.defendant.name = v))}
                />
                <Field
                  label="증인 이름"
                  hint="예비 배우자"
                  value={cfg.witness.name}
                  onChange={(v) => up((c) => void (c.witness.name = v))}
                />
              </div>
              <Field
                label="피고인 사진 URL"
                hint="/img/defendant.png 형태"
                value={cfg.defendant.photo || ''}
                onChange={(v) => up((c) => void (c.defendant.photo = v))}
              />
              <Field
                label="오열 사진 URL"
                hint="기각 선고 연출에 사용"
                value={cfg.defendant.cryPhoto || ''}
                onChange={(v) => up((c) => void (c.defendant.cryPhoto = v))}
              />
              <Field
                label="증인 사진 URL"
                value={cfg.witness.photo || ''}
                onChange={(v) => up((c) => void (c.witness.photo = v))}
              />
              <div className="ops-grid c2">
                <Field
                  label="직업"
                  value={cfg.defendant.job || ''}
                  onChange={(v) => up((c) => void (c.defendant.job = v))}
                />
                <Field
                  label="주거"
                  value={cfg.defendant.address || ''}
                  onChange={(v) => up((c) => void (c.defendant.address = v))}
                />
              </div>
              <Field
                label="특이사항"
                value={cfg.defendant.note}
                onChange={(v) => up((c) => void (c.defendant.note = v))}
              />

              <div className="ops-sub">전과 및 여죄 (검사 진술)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cfg.defendant.record.map((cr, i) => (
                  <RowItem key={i} onDelete={() => up((c) => void c.defendant.record.splice(i, 1))}>
                    <input
                      className="ops-input"
                      value={cr}
                      onChange={(e) => up((c) => void (c.defendant.record[i] = e.target.value))}
                    />
                  </RowItem>
                ))}
              </div>
              <Btn kind="ghost" block onClick={() => up((c) => void c.defendant.record.push(''))}>
                여죄 추가
              </Btn>
            </Card>

            <Card
              title="검사단"
              desc="인원수는 자유입니다. 대질신문 라인업이 자동으로 맞춰집니다."
              defaultOpen={false}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cfg.prosecutors.map((s, i) => (
                  <RowItem key={s.id} onDelete={() => up((c) => void c.prosecutors.splice(i, 1))}>
                    <input
                      className="ops-input"
                      value={s.name}
                      placeholder="이름"
                      onChange={(e) => up((c) => void (c.prosecutors[i].name = e.target.value))}
                    />
                    <input
                      className="ops-input"
                      value={s.photo || ''}
                      placeholder="사진 URL"
                      onChange={(e) => up((c) => void (c.prosecutors[i].photo = e.target.value))}
                    />
                  </RowItem>
                ))}
              </div>
              <Btn
                kind="ghost"
                block
                onClick={() =>
                  up((c) => {
                    const id = Math.max(0, ...c.prosecutors.map((s) => s.id)) + 1
                    c.prosecutors.push({ id, name: `검사 ${id}`, photo: '' })
                  })
                }
              >
                검사 추가
              </Btn>
            </Card>

            {/* 효과음 */}
            <Card
              title="효과음"
              desc={`파일 ${sfxFiles.length}개 · ▶ 를 눌러 이 기기에서 들어보고 바꾸세요`}
              defaultOpen={false}
            >
              <div className="ops-note">
                실제 음원 파일을 씁니다. 기본 배치는 임의로 정한 것이라 들어보고 마음에 드는
                파일로 바꾸는 걸 권합니다. 저장하면 TV·방청 화면에 바로 반영됩니다.
              </div>

              {sfxFiles.length === 0 && (
                <div className="ops-note" style={{ borderColor: 'var(--warn)', color: '#fcd34d' }}>
                  효과음 목록을 불러오지 못했습니다. 배포 후 다시 열어주세요.
                </div>
              )}

              {SLOTS.map((slot) => {
                const cursnd = cfg.sounds?.[slot.id] || DEFAULT_SOUNDS[slot.id] || ''
                // 힌트에 맞는 파일을 앞으로, 나머지는 뒤로
                const sorted = [...sfxFiles].sort((a, b) => {
                  const ha = slot.hint && a.startsWith(slot.hint) ? 0 : 1
                  const hb = slot.hint && b.startsWith(slot.hint) ? 0 : 1
                  return ha - hb || a.localeCompare(b)
                })
                return (
                  <div
                    key={slot.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span
                      style={{
                        flex: 'none',
                        width: 104,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text)',
                      }}
                    >
                      {slot.label}
                    </span>
                    <select
                      className="ops-input"
                      style={{ flex: 1, minWidth: 0, fontSize: 13 }}
                      value={cursnd}
                      onChange={(e) =>
                        up((c) => {
                          if (!c.sounds) c.sounds = { ...DEFAULT_SOUNDS }
                          c.sounds[slot.id] = e.target.value
                        })
                      }
                    >
                      {!sorted.includes(cursnd) && <option value={cursnd}>{cursnd}</option>}
                      {sorted.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <button
                      className="ops-btn"
                      style={{ flex: 'none', minWidth: 52 }}
                      onClick={() => {
                        initAudio()
                        setVolume(1.2)
                        void playFile(cursnd, { dur: 4 })
                      }}
                    >
                      ▶
                    </button>
                  </div>
                )
              })}

              <Btn
                kind="ghost"
                block
                onClick={() => up((c) => void (c.sounds = { ...DEFAULT_SOUNDS }))}
              >
                기본 배치로 되돌리기
              </Btn>
            </Card>

            <Card title="보안" defaultOpen={false}>
              <Field
                label="컨트롤러 PIN"
                hint="변경 후 컨트롤러 재로그인 필요"
                value={cfg.controlPin || ''}
                onChange={(v) => up((c) => void (c.controlPin = v))}
              />
            </Card>
          </>
        )}
      </div>

      {/* 하단 저장 */}
      <div className="ops-footbar">
        <div className="ops-footbar-inner">
          <Btn
            kind={dirty || raw ? 'primary' : 'ghost'}
            size="lg"
            block
            disabled={saving}
            onClick={save}
          >
            {saving ? '저장 중…' : dirty || raw ? '설정 저장' : '변경사항 없음'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
