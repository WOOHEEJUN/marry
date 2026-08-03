import { useEffect, useMemo, useState } from 'react'
import { useSync } from './net'
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
              title="상금 사다리"
              desc="게임을 몇 개 깼는지에 따라 누적 금액이 결정됩니다. 라운드당 적립은 없습니다."
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
                      {i + 1}개 깨면
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
                  단계 {cfg.prize.ladder.length}개 / 본게임 {mains.length}개 — 개수를 맞춰주세요
                </div>
              )}

              <Field
                label="보너스 지급 단위"
                hint="천생연분 정답 시 지급 버튼 금액"
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
                  title={`${gc.no} · ${gc.title}`}
                  desc={
                    gc.bonus
                      ? '부활 전용 보너스 게임 (사다리 미포함)'
                      : `${idx + 1}번째 게임 · 성공 시 누적 ${cfg.prize.ladder[idx] ?? '?'}${unit}`
                  }
                  defaultOpen={false}
                >
                  <div className="ops-grid c2">
                    <Field
                      label="차수 표기"
                      value={gc.no}
                      onChange={(v) => up((c) => void (G(c, gc.id).no = v))}
                    />
                    <Field
                      label="게임 이름"
                      value={gc.title}
                      onChange={(v) => up((c) => void (G(c, gc.id).title = v))}
                    />
                  </div>
                  <Field
                    label="부제"
                    hint="선택"
                    value={gc.subtitle || ''}
                    onChange={(v) => up((c) => void (G(c, gc.id).subtitle = v))}
                  />
                  <Field
                    label="진행 방법"
                    hint="TV와 컨트롤러에 표시"
                    area
                    value={gc.rule || ''}
                    onChange={(v) => up((c) => void (G(c, gc.id).rule = v))}
                  />
                  <Field
                    label="성공 조건"
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
                          label="성공 기준"
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
                          label="성공 기준"
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

                  {gc.type === 'bonus' && (
                    <>
                      <div className="ops-divider" />
                      <div className="ops-sub">인터뷰 질문과 신부님 답변</div>
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
                              value={it.q}
                              placeholder="질문 (TV에 표시)"
                              onChange={(e) =>
                                up((c) => void (G(c, gc.id).interviews![i].q = e.target.value))
                              }
                            />
                            <input
                              className="ops-input secret"
                              value={it.a || ''}
                              placeholder="신부님 답변 (공개 전까지 숨김)"
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
                      진행자가 컨트롤러에서 <b>성공 / 실패</b>만 눌러 판정하는 게임입니다. 규칙이
                      정해지면 위의 진행 방법과 성공 조건만 채워 넣으면 됩니다.
                    </div>
                  )}
                </Card>
              )
            })}

            {/* 인물 */}
            <Card title="신랑 · 신부" defaultOpen={false}>
              <div className="ops-grid c2">
                <Field
                  label="신랑 이름"
                  value={cfg.groom.name}
                  onChange={(v) => up((c) => void (c.groom.name = v))}
                />
                <Field
                  label="신부 이름"
                  value={cfg.bride.name}
                  onChange={(v) => up((c) => void (c.bride.name = v))}
                />
              </div>
              <Field
                label="신랑 사진 URL"
                hint="/img/groom.jpg 형태"
                value={cfg.groom.photo || ''}
                onChange={(v) => up((c) => void (c.groom.photo = v))}
              />
              <Field
                label="신부 사진 URL"
                value={cfg.bride.photo || ''}
                onChange={(v) => up((c) => void (c.bride.photo = v))}
              />
              <Field
                label="특이사항"
                value={cfg.groom.note}
                onChange={(v) => up((c) => void (c.groom.note = v))}
              />

              <div className="ops-sub">여죄 (친구 진술)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cfg.groom.crimes.map((cr, i) => (
                  <RowItem key={i} onDelete={() => up((c) => void c.groom.crimes.splice(i, 1))}>
                    <input
                      className="ops-input"
                      value={cr}
                      onChange={(e) => up((c) => void (c.groom.crimes[i] = e.target.value))}
                    />
                  </RowItem>
                ))}
              </div>
              <Btn kind="ghost" block onClick={() => up((c) => void c.groom.crimes.push(''))}>
                여죄 추가
              </Btn>
            </Card>

            <Card
              title="용의자 (친구들)"
              desc="인원수는 자유입니다. TV 라인업이 자동으로 맞춰집니다."
              defaultOpen={false}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cfg.suspects.map((s, i) => (
                  <RowItem key={s.id} onDelete={() => up((c) => void c.suspects.splice(i, 1))}>
                    <input
                      className="ops-input"
                      value={s.name}
                      placeholder="이름"
                      onChange={(e) => up((c) => void (c.suspects[i].name = e.target.value))}
                    />
                    <input
                      className="ops-input"
                      value={s.photo || ''}
                      placeholder="사진 URL"
                      onChange={(e) => up((c) => void (c.suspects[i].photo = e.target.value))}
                    />
                  </RowItem>
                ))}
              </div>
              <Btn
                kind="ghost"
                block
                onClick={() =>
                  up((c) => {
                    const id = Math.max(0, ...c.suspects.map((s) => s.id)) + 1
                    c.suspects.push({ id, name: `용의자 ${id}`, photo: '' })
                  })
                }
              >
                용의자 추가
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
