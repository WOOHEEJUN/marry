import { useEffect, useState } from 'react'
import { useSync } from './net'
import type { Config } from './types'

const PIN_KEY = 'marry.pin'

function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  hint?: string
}) {
  return (
    <label className="block">
      <div className="txt-head mb-1 text-[13px] text-tape">
        {label}
        {hint && <span className="ml-2 text-[11px] font-normal text-white/35">{hint}</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
      />
    </label>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-[3px] border-black bg-con-800/90 p-3 shadow-[0_5px_0_rgba(0,0,0,.5)]">
      <div className="txt-head mb-3 border-b-2 border-white/10 pb-2 text-[16px] tracking-widest text-tape">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
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
        <div className="mt-2 text-[14px] text-white/50">
          컨트롤러에서 PIN을 먼저 입력해주세요
        </div>
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

  const culprit = cfg.games.find((g) => g.type === 'culprit')
  const voice = cfg.games.find((g) => g.type === 'voice')
  const bonus = cfg.games.find((g) => g.type === 'bonus')

  return (
    <div className="tex-concrete min-h-full pb-28">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b-[3px] border-black bg-black/95 px-3 py-3 backdrop-blur">
        <div className="txt-head text-[18px] text-tape">⚙️ 설정</div>
        <div className="flex gap-2">
          <button
            onClick={() => setRaw((v) => !v)}
            className="btn btn-steel text-[13px] !py-2"
          >
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
          <Card title="💰 보석금">
            <Field
              label="총 보석금 (목표)"
              type="number"
              value={cfg.prize.totalPool}
              onChange={(v) => up((c) => void (c.prize.totalPool = Number(v) || 0))}
            />
          </Card>

          <Card title="🤵 신랑 / 👰 신부">
            <Field
              label="신랑 이름"
              value={cfg.groom.name}
              onChange={(v) => up((c) => void (c.groom.name = v))}
            />
            <Field
              label="신랑 사진 URL"
              value={cfg.groom.photo || ''}
              hint="/img/groom.jpg 형태"
              onChange={(v) => up((c) => void (c.groom.photo = v))}
            />
            <Field
              label="신부 이름"
              value={cfg.bride.name}
              onChange={(v) => up((c) => void (c.bride.name = v))}
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
                    onChange={(e) =>
                      up((c) => void (c.groom.crimes[i] = e.target.value))
                    }
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

          <Card title="👥 용의자 (친구들)">
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

          {culprit && (
            <Card title="🔴 1차 집행 · 범인찾기">
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="라운드당 상금"
                  type="number"
                  value={culprit.prizePerRound || 0}
                  onChange={(v) =>
                    up(
                      (c) =>
                        void (c.games.find((x) => x.id === culprit.id)!.prizePerRound =
                          Number(v) || 0)
                    )
                  }
                />
                <Field
                  label="클리어 보너스"
                  type="number"
                  value={culprit.clearBonus || 0}
                  onChange={(v) =>
                    up(
                      (c) =>
                        void (c.games.find((x) => x.id === culprit.id)!.clearBonus =
                          Number(v) || 0)
                    )
                  }
                />
              </div>
              <div>
                <div className="txt-head mb-1 text-[13px] text-tape">증거물 (진짜 / 벌칙)</div>
                {(culprit.evidences || []).map((e, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input
                      value={e.emoji || ''}
                      onChange={(ev) =>
                        up(
                          (c) =>
                            void (c.games.find((x) => x.id === culprit.id)!.evidences![i].emoji =
                              ev.target.value)
                        )
                      }
                      className="w-14 shrink-0 rounded-lg border-[3px] border-black bg-black/60 px-2 py-2 text-center text-[18px] outline-none"
                    />
                    <input
                      value={e.real}
                      onChange={(ev) =>
                        up(
                          (c) =>
                            void (c.games.find((x) => x.id === culprit.id)!.evidences![i].real =
                              ev.target.value)
                        )
                      }
                      className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
                    />
                    <input
                      value={e.fake}
                      onChange={(ev) =>
                        up(
                          (c) =>
                            void (c.games.find((x) => x.id === culprit.id)!.evidences![i].fake =
                              ev.target.value)
                        )
                      }
                      className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-siren-red-lt outline-none focus:border-tape"
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    up((c) =>
                      c.games
                        .find((x) => x.id === culprit.id)!
                        .evidences!.push({ real: '', fake: '', emoji: '🍽️' })
                    )
                  }
                  className="btn btn-steel w-full text-[14px]"
                >
                  ➕ 증거물 추가
                </button>
              </div>
            </Card>
          )}

          {voice && (
            <Card title="🎧 2차 집행 · 이구이성">
              <div className="grid grid-cols-3 gap-2">
                <Field
                  label="문제당 상금"
                  type="number"
                  value={voice.prizePerRound || 0}
                  onChange={(v) =>
                    up(
                      (c) =>
                        void (c.games.find((x) => x.id === voice.id)!.prizePerRound =
                          Number(v) || 0)
                    )
                  }
                />
                <Field
                  label="클리어 보너스"
                  type="number"
                  value={voice.clearBonus || 0}
                  onChange={(v) =>
                    up(
                      (c) =>
                        void (c.games.find((x) => x.id === voice.id)!.clearBonus = Number(v) || 0)
                    )
                  }
                />
                <Field
                  label="성공 기준(문제수)"
                  type="number"
                  value={voice.clearThreshold || 3}
                  onChange={(v) =>
                    up(
                      (c) =>
                        void (c.games.find((x) => x.id === voice.id)!.clearThreshold =
                          Number(v) || 3)
                    )
                  }
                />
              </div>
              <div>
                <div className="txt-head mb-1 text-[13px] text-tape">
                  단어 목록 <span className="text-[11px] text-white/35">3~5글자 권장</span>
                </div>
                {(voice.questions || []).map((w, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <span className="txt-num w-8 shrink-0 pt-2 text-center text-[16px] text-white/40">
                      {i + 1}
                    </span>
                    <input
                      value={w}
                      onChange={(e) =>
                        up(
                          (c) =>
                            void (c.games.find((x) => x.id === voice.id)!.questions![i] =
                              e.target.value)
                        )
                      }
                      className="w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[16px] text-white outline-none focus:border-tape"
                    />
                    <span className="txt-num w-10 shrink-0 pt-2 text-center text-[14px] text-tape">
                      {w.length}자
                    </span>
                    <button
                      onClick={() =>
                        up((c) => void c.games.find((x) => x.id === voice.id)!.questions!.splice(i, 1))
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
                      const gg = c.games.find((x) => x.id === voice.id)!
                      gg.questions!.push('')
                      gg.rounds = gg.questions!.length
                    })
                  }
                  className="btn btn-steel w-full text-[14px]"
                >
                  ➕ 단어 추가
                </button>
              </div>
            </Card>
          )}

          {bonus && (
            <Card title="💗 천생연분 · 인터뷰">
              {(bonus.interviews || []).map((it, i) => (
                <div key={i} className="rounded-lg border-2 border-love/40 bg-black/40 p-2">
                  <input
                    value={it.q}
                    placeholder="질문"
                    onChange={(e) =>
                      up(
                        (c) =>
                          void (c.games.find((x) => x.id === bonus.id)!.interviews![i].q =
                            e.target.value)
                      )
                    }
                    className="mb-2 w-full rounded-lg border-[3px] border-black bg-black/60 px-3 py-2 text-[15px] text-white outline-none focus:border-love"
                  />
                  <input
                    value={it.a || ''}
                    placeholder="🔒 신부님 답변 (TV엔 공개 전까지 안 뜸)"
                    onChange={(e) =>
                      up(
                        (c) =>
                          void (c.games.find((x) => x.id === bonus.id)!.interviews![i].a =
                            e.target.value)
                      )
                    }
                    className="w-full rounded-lg border-[3px] border-siren-red/60 bg-siren-red/10 px-3 py-2 text-[15px] text-white outline-none focus:border-tape"
                  />
                  <button
                    onClick={() =>
                      up((c) => void c.games.find((x) => x.id === bonus.id)!.interviews!.splice(i, 1))
                    }
                    className="btn btn-red mt-2 w-full text-[13px] !py-1"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  up((c) => c.games.find((x) => x.id === bonus.id)!.interviews!.push({ q: '', a: '' }))
                }
                className="btn btn-love w-full text-[14px]"
              >
                ➕ 질문 추가
              </button>
            </Card>
          )}

          <Card title="🔐 보안">
            <Field
              label="컨트롤러 PIN"
              value={cfg.controlPin || ''}
              hint="변경 시 다시 로그인 필요"
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
