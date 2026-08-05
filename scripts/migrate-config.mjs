// 배포 시 서버 설정을 새 템플릿으로 교체한다.
// schema 가 같으면 아무것도 하지 않고, 다르면 교체하되
// PIN·정답 단어·증인 진술·사진 경로처럼 사람이 채운 값은 그대로 옮겨 담는다.
import fs from 'node:fs'

const DIR = process.env.MARRY_DIR || '/opt/marry'
const P = `${DIR}/config.json`
const D = `${DIR}/config.default.json`

const cur = JSON.parse(fs.readFileSync(P, 'utf8'))
const next = JSON.parse(fs.readFileSync(D, 'utf8'))

if ((cur.schema || 0) === (next.schema || 0)) {
  console.log('  기존 config.json 유지')
  process.exit(0)
}

// ── PIN ──
if (cur.controlPin) next.controlPin = cur.controlPin

// ── 이구동성 정답 단어 (템플릿 예시값이면 무시) ──
const isSample = (w) => !w || /예시|여기수정|관리자에서|입력하세요|공개금지/.test(w)
const cv = (cur.games || []).find((g) => g.type === 'voice')
const nv = (next.games || []).find((g) => g.type === 'voice')
if (cv && nv && Array.isArray(cv.questions) && cv.questions.some((w) => !isSample(w))) {
  nv.questions = cv.questions
  nv.rounds = cv.questions.length
  console.log(`  정답 단어 ${cv.questions.length}개 이전`)
}

// ── 증인 진술 (질문 문구로 매칭) ──
const cb = (cur.games || []).find((g) => g.type === 'bonus')
const nb = (next.games || []).find((g) => g.type === 'bonus')
if (cb && nb && Array.isArray(cb.interviews) && Array.isArray(nb.interviews)) {
  const byQ = new Map(cb.interviews.filter((i) => i.a).map((i) => [i.q, i.a]))
  let moved = 0
  for (const i of nb.interviews) {
    if (byQ.has(i.q)) {
      i.a = byQ.get(i.q)
      moved++
    }
  }
  if (moved) console.log(`  증인 진술 ${moved}건 이전`)
}

// ── 사진 경로 ──
for (const k of ['photo', 'cryPhoto']) {
  if (cur.defendant && cur.defendant[k]) next.defendant[k] = cur.defendant[k]
}
if (cur.witness && cur.witness.photo) next.witness.photo = cur.witness.photo

fs.copyFileSync(P, `${DIR}/config.backup.${Date.now()}.json`)
fs.writeFileSync(P, JSON.stringify(next, null, 2))

// 공소사실 구성이 바뀌었으므로 진행 상태는 초기화
try {
  fs.unlinkSync(`${DIR}/state.json`)
} catch {}

console.log(`  config 마이그레이션 완료 (schema ${cur.schema || 0} → ${next.schema || 0})`)
