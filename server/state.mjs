// ══════════════════════════════════════════════════════════════
// 재판 상태 + 액션 리듀서 (서버가 유일한 진실)
//
// 세계관: 검사들이 피고인에게 공소사실을 하나씩 제기하고 징역을 구형한다.
//   게임 성공 → 피고인의 항변이 '인용' → 적립금 상승
//   게임 실패 → 항변 '기각' → 구형한 징역이 그대로 확정
//
// 적립금 모델: 라운드당 적립 없음.
//   공소사실을 N건 인용받으면 누적 금액이 ladder[N-1] 로 '도달'한다.
//   증인 신문(직권)으로 추가 획득해 maxTotal 까지 채울 수 있다.
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
  const pend = (n) => Array.from({ length: n }, () => 'pending')

  if (g.type === 'culprit') {
    return { ...base, results: pend(g.rounds ?? 3), picked: null, guilty: null, revealed: false }
  }
  if (g.type === 'voice') {
    return {
      ...base,
      results: pend(g.questions?.length ?? g.rounds ?? 5),
      listensLeft: g.maxListens ?? 3,
      revealed: false,
    }
  }
  if (g.type === 'tally') {
    const n = g.rounds ?? 3
    return { ...base, results: pend(n), values: Array.from({ length: n }, () => 0) }
  }
  if (g.type === 'versus') {
    const n = g.rounds ?? 1
    return {
      ...base,
      results: pend(n),
      mine: Array.from({ length: n }, () => 0),
      theirs: Array.from({ length: n }, () => 0),
    }
  }
  if (g.type === 'draw') {
    return {
      ...base,
      results: pend((g.missions || []).length),
      drawn: [],
      current: null,
      revealed: false,
    }
  }
  if (g.type === 'bonus') {
    return { ...base, results: pend((g.interviews || []).length), revealed: false }
  }
  // simple — 인용/기각 선고만
  return { ...base, results: [] }
}

const sum = (a) => (a || []).reduce((x, y) => x + (Number(y) || 0), 0)

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
      g.type === 'culprit' || g.type === 'tally' || g.type === 'versus'
        ? (g.rounds ?? 3)
        : g.type === 'voice'
          ? (g.questions?.length ?? g.rounds ?? 5)
          : g.type === 'bonus'
            ? (g.interviews?.length ?? 0)
            : g.type === 'draw'
              ? (g.missions?.length ?? 0)
              : 0
    if (Array.isArray(cur.results) && want > cur.results.length) {
      cur.results = [...cur.results, ...Array.from({ length: want - cur.results.length }, () => 'pending')]
    }
    // 숫자 배열도 라운드 수에 맞춰 늘린다
    for (const key of ['values', 'mine', 'theirs']) {
      if (Array.isArray(cur[key]) && want > cur[key].length) {
        cur[key] = [...cur[key], ...Array.from({ length: want - cur[key].length }, () => 0)]
      }
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

// ── 공소사실 종료 판정 ──────────────────────────────────────────
function settle(state, config, id, fx) {
  const g = state.games[id]
  const gc = findGame(config, id)
  if (!g || !gc || g.cleared || g.failed) return

  const done = g.results.length > 0 && g.results.every((r) => r !== 'pending')

  // 합산형 — 전 라운드 합계가 목표 이상이면 인용
  if (g.type === 'tally') {
    const total = sum(g.values)
    const target = gc.target ?? 0
    if (total >= target) grant(state, config, id, fx)
    else if (done) reject(state, config, id, fx)
    return
  }

  // 대결형 — 점수제는 합계 비교, 라운드제는 승수 비교
  if (g.type === 'versus') {
    if (gc.scoring === 'points') {
      if (!done) return
      if (sum(g.mine) > sum(g.theirs)) grant(state, config, id, fx)
      else reject(state, config, id, fx)
      return
    }
    const wins = g.results.filter((r) => r === 'win').length
    if (wins >= (gc.clearThreshold ?? 1)) grant(state, config, id, fx)
    else if (done) reject(state, config, id, fx)
    return
  }

  const wins = g.results.filter((r) => r === 'win').length
  if (wins >= (gc.clearThreshold ?? 1)) grant(state, config, id, fx)
  else if (done) reject(state, config, id, fx)
}

/** 인용 — 피고인의 항변이 받아들여짐 */
function grant(state, config, id, fx) {
  const g = state.games[id]
  const gc = findGame(config, id)
  g.failed = false
  g.cleared = true
  const n = clearedCount(state, config)
  const delta = syncPrize(
    state,
    config,
    `${gc.no} 인용 — 누적 ${ladderAmount(n, config)}${config.prize.unit}`
  )
  fx.push({
    kind: 'clear',
    title: `${gc.no}`,
    subtitle: gc.charge || gc.title,
    amount: delta,
    total: state.prize.earned,
    unit: config.prize.unit,
    step: n,
  })
}

/** 기각 — 구형한 징역이 그대로 확정 */
function reject(state, config, id, fx) {
  const g = state.games[id]
  const gc = findGame(config, id)
  g.failed = true
  note(state, `${gc.no} 기각 — 징역 ${gc.demand ?? 0}년 확정`)
  fx.push({ kind: 'fail' })
  fx.push({ kind: 'stamp', text: '기 각', tone: 'red' })
  fx.push({ kind: 'revive-offer' })
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

    // ── 선고 (인용 / 기각) ──
    case 'game.clear': {
      if (g && gc && !g.cleared) {
        if (g.results.length === 0) g.results = ['win']
        else g.results = g.results.map((r, i) => (i === 0 && r === 'pending' ? 'win' : r))
        grant(state, config, id, fx)
      }
      break
    }
    case 'game.fail': {
      if (g && gc && !g.cleared) {
        if (g.results.length === 0) g.results = ['lose']
        reject(state, config, id, fx)
      }
      break
    }
    case 'game.reset': {
      if (g && gc) {
        state.games[id] = initGame(gc)
        syncPrize(state, config, `${gc.no} 심리 재개`)
      }
      break
    }

    // ── 재심: 기각된 공소사실을 다시 다툴 수 있게 (공소사실당 1회) ──
    case 'revive.grant': {
      const tg = state.games[action.gameId]
      const tc = findGame(config, action.gameId)
      if (tg && tc && (tg.revives || 0) >= 1 && !action.force) {
        note(state, `${tc.no} 재심 불가 — 이미 재심을 마쳤습니다`)
        break
      }
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
        note(state, `${tc.no} 재심 개시 — 재도전 기회 획득`)
        fx.push({ kind: 'revive' })
      }
      break
    }

    // ── 보너스 상금 (천생연분 등으로 150까지 채우기) ──
    case 'prize.bonus': {
      state.prize.bonus = Math.max(0, (state.prize.bonus || 0) + action.amount)
      const delta = syncPrize(state, config, action.label || '재판부 직권 가산')
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
            ? { kind: 'stamp', text: '적 중', tone: 'gold' }
            : { kind: 'stamp', text: '불 발', tone: 'blue' }
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
        else fx.push({ kind: 'stamp', text: '진술 불명', tone: 'blue' })
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
          fx.push({ kind: 'stamp', text: '진술 일치', tone: 'gold' })
        } else {
          fx.push({ kind: 'love-lose' })
        }
      }
      break

    // ── 합산형 (눈 가리고 셀카 등) ──
    case 'tally.record': {
      if (g?.type === 'tally') {
        g.values[g.round] = Math.max(0, Number(action.value) || 0)
        g.results[g.round] = 'win'
        fx.push({ kind: 'tally', value: g.values[g.round] })
        settle(state, config, id, fx)
        if (!g.cleared && !g.failed && g.round < g.results.length - 1) g.round += 1
      }
      break
    }
    case 'tally.setValue': {
      if (g?.type === 'tally') {
        const r = Math.max(0, Math.min(g.values.length - 1, action.round ?? g.round))
        g.values[r] = Math.max(0, Number(action.value) || 0)
      }
      break
    }
    case 'tally.setRound': {
      if (g?.type === 'tally') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
      }
      break
    }

    // ── 대결형 (탁구공 빙고 / 코끼리코) ──
    case 'versus.judge': {
      if (g?.type === 'versus' && g.results[g.round] === 'pending') {
        g.results[g.round] = action.win ? 'win' : 'lose'
        fx.push(
          action.win
            ? { kind: 'stamp', text: '피고인 승', tone: 'gold' }
            : { kind: 'stamp', text: '검사단 승', tone: 'blue' }
        )
        settle(state, config, id, fx)
        if (!g.cleared && !g.failed && g.round < g.results.length - 1) g.round += 1
      }
      break
    }
    case 'versus.record': {
      if (g?.type === 'versus') {
        const r = g.round
        g.mine[r] = Number(action.mine) || 0
        g.theirs[r] = Number(action.theirs) || 0
        g.results[r] = g.mine[r] >= g.theirs[r] ? 'win' : 'lose'
        fx.push({ kind: 'tally', value: g.mine[r] })
        settle(state, config, id, fx)
        if (!g.cleared && !g.failed && r < g.results.length - 1) g.round += 1
      }
      break
    }
    case 'versus.setRound': {
      if (g?.type === 'versus') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
      }
      break
    }

    // ── 제비뽑기 노역 (부족한 적립금 충당) ──
    case 'draw.pick': {
      if (g?.type === 'draw') {
        const total = (gc.missions || []).length
        const left = []
        for (let i = 0; i < total; i++) {
          if (!g.drawn.includes(i)) left.push(i)
        }
        if (left.length === 0) {
          note(state, '노역 항목이 모두 소진되었습니다')
          break
        }
        const pickIdx = left[Math.floor(Math.random() * left.length)]
        g.current = pickIdx
        g.drawn.push(pickIdx)
        g.revealed = false
        fx.push({ kind: 'draw', index: pickIdx })
      }
      break
    }
    case 'draw.reveal': {
      if (g?.type === 'draw') g.revealed = true
      break
    }
    case 'draw.judge': {
      if (g?.type === 'draw' && g.current !== null) {
        const idx = g.current
        const mission = (gc.missions || [])[idx] || {}
        g.results[idx] = action.win ? 'win' : 'lose'
        if (action.win) {
          const reward = mission.reward ?? config.prize.bonusStep ?? 15
          state.prize.bonus = Math.max(0, (state.prize.bonus || 0) + reward)
          const delta = syncPrize(state, config, `노역 완수 — ${mission.title || `제${idx + 1}호`}`)
          fx.push({ kind: 'cash', amount: delta, unit: config.prize.unit })
          fx.push({ kind: 'stamp', text: '완 수', tone: 'gold' })
        } else {
          note(state, `노역 미완수 — ${mission.title || `제${idx + 1}호`}`)
          fx.push({ kind: 'fail' })
        }
        g.current = null
        g.revealed = false
      }
      break
    }
    case 'draw.undoPick': {
      if (g?.type === 'draw' && g.current !== null) {
        g.drawn = g.drawn.filter((i) => i !== g.current)
        g.current = null
        g.revealed = false
      }
      break
    }

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
  const mains = mainGames(config)
  // 기각된 공소사실의 구형 년수가 그대로 확정 징역이 된다
  const demandStanding = mains.reduce(
    (a, g) => a + (state.games[g.id]?.failed ? (g.demand ?? 0) : 0),
    0
  )
  return {
    ...state,
    meta: {
      cleared: n,
      totalGames: mains.length,
      current: ladderAmount(n, config),
      next: ladderAmount(n + 1, config),
      maxTotal: config.prize.maxTotal,
      unit: config.prize.unit,
      demandTotal: mains.reduce((a, g) => a + (g.demand ?? 0), 0),
      demandStanding,
      // 최대치까지 남은 금액 (노역으로 충당해야 할 몫)
      shortfall: Math.max(0, (config.prize.maxTotal ?? 0) - (state.prize.earned || 0)),
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
      games[id] = {
        ...g,
        question: itv.q || '',
        category: itv.cat || '',
        answer: g.revealed ? itv.a || '' : null,
      }
    } else if (g.type === 'draw') {
      games[id] = { ...g, mission: g.current === null ? null : (gc.missions || [])[g.current] }
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
      games[id] = { ...g, question: itv.q || '', category: itv.cat || '', answer: itv.a || '' }
    } else if (g.type === 'draw') {
      games[id] = { ...g, mission: g.current === null ? null : (gc.missions || [])[g.current] }
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
