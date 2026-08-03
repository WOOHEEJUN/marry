// ══════════════════════════════════════════════════════════════
// 게임 상태 + 액션 리듀서 (서버가 유일한 진실)
//
// 상금 모델: 라운드당 적립 없음.
//   게임을 N개 클리어하면 누적 금액이 ladder[N-1] 로 '도달'한다.
//   예) ladder = [30, 50, 70, 100, 130]
//       1개 클리어 → 30만원 / 3개 클리어 → 70만원 / 5개 전부 → 130만원
//   보너스 게임으로 추가 획득해 maxTotal(150만원)까지 채울 수 있다.
// ══════════════════════════════════════════════════════════════

let seq = 1
const nextId = () => seq++

export const isMain = (g) => !g.bonus
export const mainGames = (config) => config.games.filter(isMain)
const findGame = (config, id) => config.games.find((g) => g.id === id)

// ── 초기 상태 ──────────────────────────────────────────────────
export function initState(config) {
  const games = {}
  for (const g of config.games) games[g.id] = initGame(g)
  return {
    phase: 'intro',
    activeGameId: null,
    prize: { bonus: 0, earned: 0 },
    log: [],
    games,
    banner: null,
  }
}

function initGame(g) {
  const base = { type: g.type, cleared: false, failed: false, round: 0, revives: 0 }
  if (g.type === 'culprit') {
    return {
      ...base,
      results: Array.from({ length: g.rounds ?? 3 }, () => 'pending'),
      picked: null,
      guilty: null,
      revealed: false,
    }
  }
  if (g.type === 'voice') {
    return {
      ...base,
      results: Array.from({ length: g.rounds ?? 5 }, () => 'pending'),
      listensLeft: g.maxListens ?? 3,
      revealed: false,
    }
  }
  if (g.type === 'bonus') {
    return {
      ...base,
      results: Array.from({ length: (g.interviews || []).length }, () => 'pending'),
      revealed: false,
    }
  }
  // simple — 성공/실패 판정만
  return { ...base, results: [] }
}

/** 설정이 바뀌었을 때 기존 상태와 병합 (라운드 수 변경 등 반영) */
export function mergeState(state, config) {
  const next = { ...state, games: { ...state.games } }
  for (const g of config.games) {
    const cur = next.games[g.id]
    if (!cur) {
      next.games[g.id] = initGame(g)
      continue
    }
    // 문제/라운드 수가 늘어났으면 칸 추가
    const want =
      g.type === 'culprit'
        ? (g.rounds ?? 3)
        : g.type === 'voice'
          ? (g.questions?.length ?? g.rounds ?? 5)
          : g.type === 'bonus'
            ? (g.interviews?.length ?? 0)
            : 0
    if (Array.isArray(cur.results) && want > cur.results.length) {
      cur.results = [...cur.results, ...Array.from({ length: want - cur.results.length }, () => 'pending')]
    }
  }
  // 설정에서 사라진 게임 제거
  for (const id of Object.keys(next.games)) {
    if (!config.games.some((g) => g.id === id)) delete next.games[id]
  }
  return next
}

// ── 상금 계산 ──────────────────────────────────────────────────
export function clearedCount(state, config) {
  return mainGames(config).filter((g) => state.games[g.id]?.cleared).length
}

export function ladderAmount(n, config) {
  const L = config.prize.ladder || []
  if (n <= 0 || L.length === 0) return 0
  return L[Math.min(n, L.length) - 1]
}

export function computeEarned(state, config) {
  const base = ladderAmount(clearedCount(state, config), config)
  const max = config.prize.maxTotal ?? Infinity
  return Math.max(0, Math.min(max, base + (state.prize.bonus || 0)))
}

function syncPrize(state, config, label) {
  const before = state.prize.earned || 0
  const after = computeEarned(state, config)
  state.prize.earned = after
  if (after !== before && label) {
    state.log.unshift({
      id: nextId(),
      at: Date.now(),
      label,
      delta: after - before,
      total: after,
    })
    if (state.log.length > 60) state.log.length = 60
  }
  return after - before
}

function note(state, label) {
  state.log.unshift({ id: nextId(), at: Date.now(), label, delta: 0, total: state.prize.earned })
  if (state.log.length > 60) state.log.length = 60
}

// ── 게임 종료 판정 ─────────────────────────────────────────────
function settle(state, config, id, fx) {
  const g = state.games[id]
  const gc = findGame(config, id)
  if (!g || !gc || g.cleared || g.failed) return

  const wins = g.results.filter((r) => r === 'win').length
  const done = g.results.length > 0 && g.results.every((r) => r !== 'pending')
  const need = gc.clearThreshold ?? 1

  if (wins >= need) {
    g.cleared = true
    const n = clearedCount(state, config)
    const delta = syncPrize(state, config, `${gc.no} 성공 — 누적 ${ladderAmount(n, config)}${config.prize.unit}`)
    fx.push({
      kind: 'clear',
      title: `${gc.no} · ${gc.title}`,
      amount: delta,
      total: state.prize.earned,
      unit: config.prize.unit,
      step: n,
    })
  } else if (done) {
    g.failed = true
    note(state, `${gc.no} 실패 — 부활 기회 필요`)
    fx.push({ kind: 'fail' })
    fx.push({ kind: 'stamp', text: '집행 실패', tone: 'red' })
    fx.push({ kind: 'revive-offer' })
  }
}

// ══════════════════════════════════════════════════════════════
export function reduce(state, config, action) {
  const fx = []
  const id = action.gameId || state.activeGameId
  const g = id ? state.games[id] : null
  const gc = id ? findGame(config, id) : null

  switch (action.type) {
    // ── 화면 ──
    case 'goto':
      state.phase = action.phase
      state.activeGameId = action.phase === 'game' ? (action.gameId ?? state.activeGameId) : null
      fx.push({ kind: 'whoosh' })
      break

    case 'banner':
      state.banner = action.text || null
      break

    // ── 게임 판정 (simple: 한 방에 성공/실패) ──
    case 'game.clear': {
      if (g && gc && !g.cleared) {
        g.failed = false
        if (g.results.length === 0) g.results = ['win']
        else g.results = g.results.map((r, i) => (i === 0 && r === 'pending' ? 'win' : r))
        g.cleared = true
        const n = clearedCount(state, config)
        const delta = syncPrize(
          state,
          config,
          `${gc.no} 성공 — 누적 ${ladderAmount(n, config)}${config.prize.unit}`
        )
        fx.push({
          kind: 'clear',
          title: `${gc.no} · ${gc.title}`,
          amount: delta,
          total: state.prize.earned,
          unit: config.prize.unit,
          step: n,
        })
      }
      break
    }
    case 'game.fail': {
      if (g && gc && !g.cleared) {
        g.failed = true
        if (g.results.length === 0) g.results = ['lose']
        note(state, `${gc.no} 실패 — 부활 기회 필요`)
        fx.push({ kind: 'fail' })
        fx.push({ kind: 'stamp', text: '집행 실패', tone: 'red' })
        fx.push({ kind: 'revive-offer' })
      }
      break
    }
    case 'game.reset': {
      if (g && gc) {
        state.games[id] = initGame(gc)
        syncPrize(state, config, `${gc.no} 초기화`)
      }
      break
    }

    // ── 부활: 실패한 게임을 다시 도전 가능하게 ──
    case 'revive.grant': {
      const tg = state.games[action.gameId]
      const tc = findGame(config, action.gameId)
      if (tg && tc) {
        tg.failed = false
        tg.revives = (tg.revives || 0) + 1
        tg.revealed = false
        tg.picked = null
        tg.guilty = null
        if (tc.type === 'voice') tg.listensLeft = tc.maxListens ?? 3
        if (tg.results.length > 0) {
          tg.results.push('pending')
          tg.round = tg.results.length - 1
        } else {
          tg.results = []
          tg.round = 0
        }
        note(state, `${tc.no} 부활 — 재도전 기회 획득`)
        fx.push({ kind: 'revive' })
      }
      break
    }

    // ── 보너스 상금 (천생연분 등으로 150까지 채우기) ──
    case 'prize.bonus': {
      state.prize.bonus = Math.max(0, (state.prize.bonus || 0) + action.amount)
      const delta = syncPrize(state, config, action.label || '보너스 획득')
      if (delta > 0) fx.push({ kind: 'cash', amount: delta, unit: config.prize.unit })
      break
    }
    case 'prize.reset':
      state.prize.bonus = 0
      state.prize.earned = 0
      state.log = []
      for (const gid of Object.keys(state.games)) {
        const c = findGame(config, gid)
        if (c) state.games[gid] = initGame(c)
      }
      break

    // ── 게임1: 범인찾기 ──
    case 'culprit.setGuilty':
      if (g?.type === 'culprit') g.guilty = action.suspectId
      break
    case 'culprit.pick':
      if (g?.type === 'culprit' && !g.revealed) {
        g.picked = action.suspectId
        fx.push({ kind: 'lock-on' })
      }
      break
    case 'culprit.judge':
      if (g?.type === 'culprit' && !g.revealed) {
        g.revealed = true
        g.results[g.round] = action.win ? 'win' : 'lose'
        fx.push(
          action.win
            ? { kind: 'stamp', text: '유 죄', tone: 'gold' }
            : { kind: 'stamp', text: '무죄 석방', tone: 'blue' }
        )
        settle(state, config, id, fx)
      }
      break
    case 'culprit.next':
      if (g?.type === 'culprit') {
        if (g.round < g.results.length - 1) g.round += 1
        g.picked = null
        g.guilty = null
        g.revealed = false
      }
      break
    case 'culprit.setRound':
      if (g?.type === 'culprit') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
        g.picked = null
        g.guilty = null
        g.revealed = false
      }
      break

    // ── 게임2: 이구이성 ──
    case 'voice.countdown':
      if (g?.type === 'voice') fx.push({ kind: 'countdown' })
      break
    case 'voice.useListen':
      if (g?.type === 'voice' && g.listensLeft > 0) {
        g.listensLeft -= 1
        fx.push({ kind: 'listen', left: g.listensLeft })
      }
      break
    case 'voice.setListens':
      if (g?.type === 'voice') g.listensLeft = Math.max(0, action.value)
      break
    case 'voice.judge':
      if (g?.type === 'voice' && !g.revealed) {
        g.revealed = true
        g.results[g.round] = action.win ? 'win' : 'lose'
        if (action.win) fx.push({ kind: 'reveal-word' })
        else fx.push({ kind: 'stamp', text: '감청 실패', tone: 'red' })
        settle(state, config, id, fx)
      }
      break
    case 'voice.reveal':
      if (g?.type === 'voice') {
        g.revealed = true
        fx.push({ kind: 'reveal-word' })
      }
      break
    case 'voice.next':
      if (g?.type === 'voice') {
        if (g.round < g.results.length - 1) g.round += 1
        g.revealed = false
        g.listensLeft = gc.maxListens ?? 3
      }
      break
    case 'voice.setRound':
      if (g?.type === 'voice') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
        g.revealed = false
        g.listensLeft = gc.maxListens ?? 3
      }
      break

    // ── 보너스: 천생연분 ──
    case 'bonus.next':
      if (g?.type === 'bonus') {
        if (g.round < g.results.length - 1) g.round += 1
        g.revealed = false
      }
      break
    case 'bonus.setRound':
      if (g?.type === 'bonus') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
        g.revealed = false
      }
      break
    case 'bonus.reveal':
      if (g?.type === 'bonus') {
        g.revealed = true
        fx.push({ kind: 'love-reveal' })
      }
      break
    case 'bonus.judge':
      if (g?.type === 'bonus') {
        g.revealed = true
        g.results[g.round] = action.win ? 'win' : 'lose'
        if (action.win) {
          fx.push({ kind: 'love-win' })
          fx.push({ kind: 'stamp', text: '천생연분', tone: 'gold' })
        } else {
          fx.push({ kind: 'love-lose' })
        }
      }
      break

    case 'fx':
      fx.push({ kind: action.kind, ...action.payload })
      break

    default:
      break
  }

  state.prize.earned = computeEarned(state, config)
  return { state, fx }
}

// ══════════════════════════════════════════════════════════════
// 투영 — TV/관전자에게는 정답을 절대 보내지 않는다
// ══════════════════════════════════════════════════════════════
function withMeta(state, config) {
  const n = clearedCount(state, config)
  return {
    ...state,
    meta: {
      cleared: n,
      totalGames: mainGames(config).length,
      current: ladderAmount(n, config),
      next: ladderAmount(n + 1, config),
      maxTotal: config.prize.maxTotal,
      unit: config.prize.unit,
    },
  }
}

export function publicView(state, config) {
  const games = {}
  for (const [id, g] of Object.entries(state.games)) {
    const gc = findGame(config, id)
    if (!gc) continue
    if (g.type === 'culprit') {
      games[id] = { ...g, guilty: g.revealed ? g.guilty : null }
    } else if (g.type === 'voice') {
      const word = (gc.questions || [])[g.round] || ''
      games[id] = { ...g, wordLength: word.length, word: g.revealed ? word : null }
    } else if (g.type === 'bonus') {
      const itv = (gc.interviews || [])[g.round] || {}
      games[id] = { ...g, question: itv.q || '', answer: g.revealed ? itv.a || '' : null }
    } else {
      games[id] = { ...g }
    }
  }
  return withMeta({ ...state, games }, config)
}

export function controlView(state, config) {
  const games = {}
  for (const [id, g] of Object.entries(state.games)) {
    const gc = findGame(config, id)
    if (!gc) continue
    if (g.type === 'voice') {
      const word = (gc.questions || [])[g.round] || ''
      games[id] = { ...g, word, wordLength: word.length, allWords: gc.questions || [] }
    } else if (g.type === 'bonus') {
      const itv = (gc.interviews || [])[g.round] || {}
      games[id] = { ...g, question: itv.q || '', answer: itv.a || '' }
    } else {
      games[id] = { ...g }
    }
  }
  return withMeta({ ...state, games }, config)
}

export function publicConfig(config) {
  return {
    ...config,
    controlPin: undefined,
    games: config.games.map((g) => {
      const c = { ...g }
      delete c.questions
      if (c.interviews) c.interviews = c.interviews.map((i) => ({ q: i.q }))
      return c
    }),
  }
}
