import { useEffect, useState } from 'react'
import { useSync } from './net'
import type { Config, GameConfig } from './types'

const PIN_KEY = 'marry.pin'

function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  area,
  danger,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  hint?: string
  area?: boolean
  danger?: boolean
}) {
  const cls = `w-full rounded-lg border-[3px] px-3 py-2 text-[15px] text-white outline-none focus:border-tape ${
    danger ? 'border-siren-red/60 bg-siren-red/10' : 'border-black bg-black/60'
  }`
  return (
    <label className="block">
      <div className="txt-head mb-1 text-[13px] text-tape">
        {label}
        {hint && <span className="ml-2 text-[11px] font-normal text-white/35">{hint}</span>}
      </div>
      {area ? (
        <textarea
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  )
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-[3px] border-black bg-con-800/90 p-3 shadow-[0_5px_0_rgba(0,0,0,.5)]">
      <div className="border-b-2 border-white/10 pb-2">
        <div className="txt-head text-[16px] tracking-widest text-tape">{title}</div>
        {desc && <div className="mt-0.5 text-[12px] font-normal text-white/45">{desc}</div>}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}

export default function Admin() {
  const pin = localStorage.getItem(PIN_KEY) || undefined
  const { config: live, status } = useSync('admin', pin)
  const [cfg, setCfg] = useState<Config | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [raw, setRaw] = useState(false)
  const [rawText, setRawText] = useState('')

  useEffect(() => {
    if (live && !cfg) {
      setCfg(structuredClone(live))
      setRawText(JSON.stringify(live, null, 2))
    }
  }, [live, cfg])

  useEffect(() => {
    document.body.dataset.scroll = 'on'
    return () => {
      delete document.body.dataset.scroll
    }
  }, [])

  if (status === 'denied' || !pin) {
    return (
      <div className="tex-concrete flex min-h-full flex-col items-center justify-center p-6 text-center">
        <div className="text-[60px]">🔒</div>
        <div className="txt-head mt-3 text-[22px] text-siren-red-lt">인증 필요</div>
        <div className="mt-2 text-[14px] text-white/50">컨트롤러에서 PIN을 먼저 입력해주세요</div>
        <a href="/control" className="btn btn-gold mt-5 text-[16px]">
          🎛 컨트롤러로 이동
        </a>
      </div>
    )
  }

  if (!cfg) {
    return (
      <div className="tex-concrete flex min-h-full items-center justify-center">
        <div className="txt-head anim-blink text-[20px] text-tape">설정 불러오는 중...</div>
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
    setMsg('')
    try {
      const body = raw ? JSON.parse(rawText) : cfg
      const r = await fetch('/api/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin, config: body }),
      })
      const j = await r.json()
      setMsg(j.ok ? '✅ 저장 완료 — 모든 화면에 반영됨' : `❌ 실패: ${j.error}`)
      if (j.ok && !raw) setRawText(JSON.stringify(body, null, 2))
    } catch (e) {
      setMsg(`❌ 오류: ${e}`)
    }
    setSaving(false)
  }

  const mains = cfg.games.filter((g) => !g.bonus)
  const unit = cfg.prize.unit

  /** 게임 공통 편집 (이름/규칙/성공조건) */
  const GameCommon = ({ gc, idx }: { gc: GameConfig; idx: number }) => (
    <>
      <div className="grid grid-cols-2 gap-2">
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
        label="부제 (선택)"
        value={gc.subtitle || ''}
        hint="예: 이구동성"
        onChange={(v) => up((c) => void (G(c, gc.id).subtitle = v))}
      />
      <Field
        label="진행 방법"
        area
        hint="TV와 컨트롤러에 표시됨"
        value={gc.rule || ''}
        onChange={(v) => up((c) => void (G(c, gc.id).rule = v))}
      />
      <Field
        label="성공 조건"
        value={gc.win || ''}
        hint="예: 3라운드 중 1회 이상 적중"
        onChange={(v) => up((c) => void (G(c, gc.id).win = v))}
      />
      {!gc.bonus && (
        <div className="rounded-lg bg-gold/10 px-3 py-2 text-[13px] text-gold">
          이 게임을 포함해 {idx + 1}개 클리어 시 → 누적 {cfg.prize.ladder[idx] ?? '?'}
          {unit}
        </div>
      )}
    </>
  )

  return (
    <div className="tex-concrete min-h-full pb-28">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b-[3px] border-black bg-black/95 px-3 py-3 backdrop-blur">
        <div className="txt-head text-[18px] text-tape">⚙️ 설정</div>
        <div className="flex gap-2">
          <button onClick={() => setRaw((v) => !v)} className="btn btn-steel text-[13px] !py-2">
            {raw ? '📋 폼' : '{ } JSON'}
          </button>
          <a href="/control" className="btn btn-blue text-[13px] !py-2 no-underline">
            🎛 컨트롤러
          </a>
          <button onClick={save} disabled={saving} className="btn btn-gold text-[13px] !py-2">
            {saving ? '저장 중...' : '💾 저장'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mx-3 mt-3 rounded-lg border-[3px] border-black bg-black/70 px-3 py-2 text-[14px] text-white">
          {msg}
        </div>
      )}

      {raw ? (
        <div className="p-3">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            spellCheck={false}
            className="h-[70vh] w-full rounded-lg border-[3px] border-black bg-black/70 p-3 font-mono text-[13px] text-cash outline-none focus:border-tape"
          />
          <div className="mt-2 text-[12px] text-white/40">
            ⚠️ JSON 문법이 틀리면 저장되지 않습니다.
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-3">
          {/* 상금 사다리 */}
          <Card
            title="💰 상금 사다리"
            desc="게임을 N개 깰 때마다 도달하는 누적 금액. 라운드당 적립은 없습니다."
          >
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="단위"
                value={cfg.prize.unit}
                hint="예: 만원"
                onChange={(v) => up((c) => void (c.prize.unit = v))}
              />
              <Field
                label="최대 금액 (보너스 포함)"
                type="number"
                value={cfg.prize.maxTotal}
                onChange={(v) => up((c) => void (c.prize.maxTotal = Number(v) || 0))}
              />
            </div>

            <div>
              <div className="txt-head mb-1 text-[13px] text-tape">단계별 누적 금액</div>
              {cfg.prize.ladder.map((amt, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <span className="txt-head w-16 shrink-0 text-[13px] text-white/50">
                    {i + 1}개 깨면
                  </span>
                  <input
                    type="number"
                    value={amt}
                    onChange={(e) =>
                      up((c) => void (c.prize.ladder[i] = Number(e.target.value) || 0))
                    }
                    className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[18px] text-tape outline-none focus:border-tape"
                  />
                  <span className="txt-head w-10 shrink-0 text-[13px] text-white/50">{unit}</span>
                  <button
                    onClick={() => up((c) => void c.prize.ladder.splice(i, 1))}
                    className="btn btn-red shrink-0 text-[13px] !py-2"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                onClick={() => up((c) => void c.prize.ladder.push(0))}
                className="btn btn-steel w-full text-[14px]"
              >
                ➕ 단계 추가
              </button>
              {cfg.prize.ladder.length !== mains.length && (
                <div className="mt-2 rounded bg-siren-red/15 px-2 py-1 text-[12px] text-siren-red-lt">
                  ⚠️ 단계 {cfg.prize.ladder.length}개 / 본게임 {mains.length}개 — 개수를 맞춰주세요
                </div>
              )}
            </div>

            <Field
              label="보너스 지급 단위"
              type="number"
              hint="천생연분 정답 시 주는 금액 버튼"
              value={cfg.prize.bonusStep ?? 10}
              onChange={(v) => up((c) => void (c.prize.bonusStep = Number(v) || 0))}
            />
          </Card>

          {/* 게임들 */}
          {cfg.games.map((gc, gi) => {
            const idx = mains.findIndex((x) => x.id === gc.id)
            return (
              <Card
                key={gc.id}
                title={`${gc.bonus ? '💗' : `${idx + 1}️⃣`} ${gc.no} · ${gc.title}`}
                desc={gc.bonus ? '부활 전용 보너스 게임 (사다리에 미포함)' : undefined}
              >
                <GameCommon gc={gc} idx={idx} />

                {gc.type === 'culprit' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Field
                        label="라운드 수"
                        type="number"
                        value={gc.rounds ?? 3}
                        onChange={(v) => up((c) => void (G(c, gc.id).rounds = Number(v) || 1))}
                      />
                      <Field
                        label="성공 기준 (적중 횟수)"
                        type="number"
                        value={gc.clearThreshold ?? 1}
                        onChange={(v) =>
                          up((c) => void (G(c, gc.id).clearThreshold = Number(v) || 1))
                        }
                      />
                    </div>
                    <div>
                      <div className="txt-head mb-1 text-[13px] text-tape">
                        증거물 <span className="text-[11px] font-normal text-white/35">이모지 / 진짜 / 벌칙</span>
                      </div>
                      {(gc.evidences || []).map((e, i) => (
                        <div key={i} className="mb-2 flex gap-2">
                          <input
                            value={e.emoji || ''}
                            onChange={(ev) =>
                              up((c) => void (G(c, gc.id).evidences![i].emoji = ev.target.value))
                            }
                            className="w-14 shrink-0 rounded-lg border-[3px] border-black bg-black/60 px-2 py-2 text-center text-[18px] outline-none"
                          />
                          <input
                            value={e.real}
                            onChange={(ev) =>
                              up((c) => void (G(c, gc.id).evidences![i].real = ev.target.value))
                            }
                            className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
                          />
                          <input
                            value={e.fake}
                            onChange={(ev) =>
                              up((c) => void (G(c, gc.id).evidences![i].fake = ev.target.value))
                            }
                            className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-siren-red-lt outline-none focus:border-tape"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          up((c) =>
                            G(c, gc.id).evidences!.push({ real: '', fake: '', emoji: '🍽️' })
                          )
                        }
                        className="btn btn-steel w-full text-[14px]"
                      >
                        ➕ 증거물 추가
                      </button>
                    </div>
                  </>
                )}

                {gc.type === 'voice' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Field
                        label="성공 기준 (정답 문제수)"
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
                    <div>
                      <div className="txt-head mb-1 text-[13px] text-siren-red-lt">
                        🔒 정답 단어 <span className="text-[11px] font-normal text-white/35">TV엔 글자 수만 표시됨</span>
                      </div>
                      {(gc.questions || []).map((w, i) => (
                        <div key={i} className="mb-2 flex gap-2">
                          <span className="txt-num w-7 shrink-0 pt-2 text-center text-[15px] text-white/40">
                            {i + 1}
                          </span>
                          <input
                            value={w}
                            onChange={(e) =>
                              up((c) => void (G(c, gc.id).questions![i] = e.target.value))
                            }
                            className="w-full rounded-lg border-[3px] border-siren-red/50 bg-siren-red/10 px-3 py-2 text-[16px] text-white outline-none focus:border-tape"
                          />
                          <span className="txt-num w-9 shrink-0 pt-2 text-center text-[13px] text-tape">
                            {w.length}자
                          </span>
                          <button
                            onClick={() =>
                              up((c) => {
                                G(c, gc.id).questions!.splice(i, 1)
                                G(c, gc.id).rounds = G(c, gc.id).questions!.length
                              })
                            }
                            className="btn btn-red shrink-0 text-[13px] !py-2"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          up((c) => {
                            G(c, gc.id).questions!.push('')
                            G(c, gc.id).rounds = G(c, gc.id).questions!.length
                          })
                        }
                        className="btn btn-steel w-full text-[14px]"
                      >
                        ➕ 단어 추가
                      </button>
                    </div>
                  </>
                )}

                {gc.type === 'bonus' && (
                  <div>
                    <div className="txt-head mb-1 text-[13px] text-love-lt">
                      인터뷰 질문 / 🔒 신부님 답변
                    </div>
                    {(gc.interviews || []).map((it, i) => (
                      <div key={i} className="mb-2 rounded-lg border-2 border-love/40 bg-black/40 p-2">
                        <input
                          value={it.q}
                          placeholder="질문 (TV에 표시)"
                          onChange={(e) =>
                            up((c) => void (G(c, gc.id).interviews![i].q = e.target.value))
                          }
                          className="mb-2 w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-love"
                        />
                        <input
                          value={it.a || ''}
                          placeholder="🔒 신부님 답변 (공개 전까지 숨김)"
                          onChange={(e) =>
                            up((c) => void (G(c, gc.id).interviews![i].a = e.target.value))
                          }
                          className="w-full rounded-lg border-[3px] border-siren-red/60 bg-siren-red/10 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
                        />
                        <button
                          onClick={() => up((c) => void G(c, gc.id).interviews!.splice(i, 1))}
                          className="btn btn-red mt-2 w-full text-[13px] !py-1"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => up((c) => G(c, gc.id).interviews!.push({ q: '', a: '' }))}
                      className="btn btn-love w-full text-[14px]"
                    >
                      ➕ 질문 추가
                    </button>
                  </div>
                )}

                {gc.type === 'simple' && (
                  <div className="rounded-lg bg-black/40 px-3 py-2 text-[12px] text-white/45">
                    이 게임은 진행자가 컨트롤러에서 [집행 성공] / [집행 실패] 만 눌러 판정합니다.
                    규칙이 정해지면 위의 진행 방법·성공 조건만 채워 넣으면 됩니다.
                  </div>
                )}
              </Card>
            )
          })}

          {/* 신랑/신부 */}
          <Card title="🤵 신랑 / 👰 신부">
            <div className="grid grid-cols-2 gap-2">
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
              value={cfg.groom.photo || ''}
              hint="/img/groom.jpg 형태"
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
            <div>
              <div className="txt-head mb-1 text-[13px] text-tape">여죄 (친구 진술)</div>
              {cfg.groom.crimes.map((cr, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={cr}
                    onChange={(e) => up((c) => void (c.groom.crimes[i] = e.target.value))}
                    className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
                  />
                  <button
                    onClick={() => up((c) => void c.groom.crimes.splice(i, 1))}
                    className="btn btn-red shrink-0 text-[13px] !py-2"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                onClick={() => up((c) => void c.groom.crimes.push(''))}
                className="btn btn-steel w-full text-[14px]"
              >
                ➕ 여죄 추가
              </button>
            </div>
          </Card>

          {/* 용의자 */}
          <Card title="👥 용의자 (친구들)" desc="인원수는 자유. 라인업이 자동으로 맞춰집니다.">
            {cfg.suspects.map((s, i) => (
              <div key={s.id} className="flex gap-2">
                <input
                  value={s.name}
                  placeholder="이름"
                  onChange={(e) => up((c) => void (c.suspects[i].name = e.target.value))}
                  className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
                />
                <input
                  value={s.photo || ''}
                  placeholder="사진 URL"
                  onChange={(e) => up((c) => void (c.suspects[i].photo = e.target.value))}
                  className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[13px] text-white/70 outline-none focus:border-tape"
                />
                <button
                  onClick={() => up((c) => void c.suspects.splice(i, 1))}
                  className="btn btn-red shrink-0 text-[13px] !py-2"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                up((c) => {
                  const id = Math.max(0, ...c.suspects.map((s) => s.id)) + 1
                  c.suspects.push({ id, name: `용의자 ${id}`, photo: '' })
                })
              }
              className="btn btn-steel w-full text-[14px]"
            >
              ➕ 용의자 추가
            </button>
          </Card>

          <Card title="🔐 보안">
            <Field
              label="컨트롤러 PIN"
              value={cfg.controlPin || ''}
              hint="변경 후 컨트롤러 재로그인 필요"
              onChange={(v) => up((c) => void (c.controlPin = v))}
            />
          </Card>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t-[3px] border-black bg-black/95 p-3">
        <button onClick={save} disabled={saving} className="btn btn-gold w-full text-[18px]">
          {saving ? '저장 중...' : '💾 설정 저장 (모든 화면 즉시 반영)'}
        </button>
      </div>
    </div>
  )
}
