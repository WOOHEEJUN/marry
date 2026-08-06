// ══════════════════════════════════════════════════════════════
// 🚨 총각 검거 작전 — 서버
// 정적 파일 + WebSocket 실시간 동기화를 한 프로세스에서 처리
// ══════════════════════════════════════════════════════════════
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyWs from '@fastify/websocket'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  initState,
  mergeState,
  reduce,
  publicView,
  controlView,
  publicConfig,
} from './state.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const PORT = Number(process.env.PORT || 8000)
const HOST = process.env.HOST || '0.0.0.0'
const CONFIG_PATH = process.env.CONFIG_PATH || path.join(ROOT, 'config.json')
const STATE_PATH = process.env.STATE_PATH || path.join(ROOT, 'state.json')
const DIST = path.join(ROOT, 'dist')

// ── 설정 로드 ──────────────────────────────────────────────────
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
}
let config = loadConfig()

// ── 상태 로드/저장 ─────────────────────────────────────────────
let state
try {
  if (fs.existsSync(STATE_PATH)) {
    state = mergeState(JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')), config)
    // 구버전 상태 호환 (라운드 적립 모델 → 사다리 모델)
    if (!state.prize || typeof state.prize.bonus !== 'number') {
      state.prize = { bonus: 0, earned: 0 }
      state.log = []
    }
  } else {
    state = initState(config)
  }
} catch {
  state = initState(config)
}

// 되돌리기용 스냅샷 스택 (직전 판정 취소)
const history = []
const snapshot = () => {
  history.push(JSON.stringify(state))
  if (history.length > 40) history.shift()
}

let saveTimer = null
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    fs.writeFile(STATE_PATH, JSON.stringify(state), () => {})
  }, 250)
}

// ── 소켓 관리 ──────────────────────────────────────────────────
/** @type {Set<{sock:any, role:string}>} */
const clients = new Set()

const counts = () => {
  const c = { tv: 0, control: 0, spectator: 0, admin: 0 }
  for (const cl of clients) c[cl.role] = (c[cl.role] || 0) + 1
  return c
}

function send(cl, msg) {
  try {
    if (cl.sock.readyState === 1) cl.sock.send(JSON.stringify(msg))
  } catch {}
}

function pushState(target) {
  const conn = counts()
  const pub = { type: 'state', state: publicView(state, config), conn }
  const ctl = { type: 'state', state: controlView(state, config), conn }
  for (const cl of clients) {
    if (target && cl !== target) continue
    send(cl, cl.role === 'control' || cl.role === 'admin' ? ctl : pub)
  }
}

function pushFx(list) {
  if (!list?.length) return
  for (const f of list) {
    const msg = { type: 'fx', fx: { ...f, _id: Math.random().toString(36).slice(2) } }
    for (const cl of clients) send(cl, msg)
  }
}

function pushConfig(target) {
  const pub = { type: 'config', config: publicConfig(config) }
  const full = { type: 'config', config }
  for (const cl of clients) {
    if (target && cl !== target) continue
    send(cl, cl.role === 'control' || cl.role === 'admin' ? full : pub)
  }
}

// ── 서버 ───────────────────────────────────────────────────────
const app = Fastify({ logger: false, trustProxy: true })
await app.register(fastifyWs, { options: { maxPayload: 1 << 20 } })

app.get('/api/health', async () => ({ ok: true, up: process.uptime(), conn: counts() }))

// 효과음 파일 목록 (관리자에서 미리듣기·교체용)
app.get('/api/sfx', async () => {
  try {
    const dir = path.join(DIST, 'sfx')
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(ogg|oga|mp3|wav|opus)$/i.test(f))
      .sort()
    return { files }
  } catch {
    return { files: [] }
  }
})

// 어드민: 설정 조회/수정 (PIN 필요)
app.post('/api/config', async (req, reply) => {
  const { pin, config: next } = req.body || {}
  if (pin !== config.controlPin) return reply.code(403).send({ error: 'bad pin' })
  try {
    config = { ...next, controlPin: next.controlPin || config.controlPin }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
    // 게임 추가/삭제, 라운드 수 변경 등을 상태에 반영
    state = mergeState(state, config)
    pushConfig()
    pushState()
    persist()
    return { ok: true }
  } catch (e) {
    return reply.code(500).send({ error: String(e) })
  }
})

app.register(async function (f) {
  f.get('/ws', { websocket: true }, (sock) => {
    const cl = { sock, role: 'spectator' }
    clients.add(cl)

    sock.on('message', (raw) => {
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }

      // 역할 등록
      if (msg.type === 'hello') {
        const wants = msg.role
        if (wants === 'control' || wants === 'admin') {
          if (msg.pin !== config.controlPin) {
            send(cl, { type: 'denied' })
            return
          }
        }
        cl.role = ['tv', 'control', 'admin', 'spectator'].includes(wants) ? wants : 'spectator'
        send(cl, { type: 'hello.ok', role: cl.role })
        pushConfig(cl)
        pushState(cl)
        pushState() // 접속자 수 갱신 브로드캐스트
        return
      }

      // 액션은 컨트롤러/어드민만
      if (msg.type === 'action') {
        if (cl.role !== 'control' && cl.role !== 'admin') return

        // 되돌리기: 직전 스냅샷으로 복원
        if (msg.action?.type === 'undo') {
          const prev = history.pop()
          if (prev) {
            state = JSON.parse(prev)
            pushState()
            pushFx([{ kind: 'undo' }])
            persist()
          }
          return
        }

        // 화면 이동처럼 되돌릴 필요 없는 것은 스냅샷 생략
        const skipSnapshot = ['goto', 'banner', 'fx', 'culprit.pick', 'culprit.setGuilty']
        if (!skipSnapshot.includes(msg.action?.type)) snapshot()

        const r = reduce(state, config, msg.action)
        state = r.state
        pushState()
        pushFx(r.fx)
        persist()
        return
      }

      if (msg.type === 'ping') {
        send(cl, { type: 'pong', t: msg.t })
      }
    })

    const bye = () => {
      clients.delete(cl)
      pushState()
    }
    sock.on('close', bye)
    sock.on('error', bye)
  })
})

// 정적 파일 (빌드 결과물)
if (fs.existsSync(DIST)) {
  await app.register(fastifyStatic, { root: DIST, prefix: '/' })
  // SPA 폴백
  app.setNotFoundHandler((req, reply) => {
    const u = req.raw.url || ''
    // 없는 효과음/에셋까지 index.html 로 응답하면 디코딩이 이상하게 실패하므로 404 를 준다
    if (u.startsWith('/api') || u.startsWith('/ws') || u.startsWith('/sfx') || u.startsWith('/img')) {
      return reply.code(404).send({ error: 'not found' })
    }
    return reply.type('text/html').send(fs.readFileSync(path.join(DIST, 'index.html')))
  })
} else {
  app.get('/', async () => 'dist 없음 — `npm run build` 후 다시 실행하거나 개발 모드는 `npm run dev`')
}

await app.listen({ port: PORT, host: HOST })
console.log(`🚨 총각 검거 작전 서버 기동  http://${HOST}:${PORT}`)
console.log(`   설정: ${CONFIG_PATH}`)
console.log(`   상태: ${STATE_PATH}`)
