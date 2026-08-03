// ══════════════════════════════════════════════════════════════
// 게임 상태 + 액션 리듀서 (서버가 유일한 진실)
// ══════════════════════════════════════════════════════════════

let seq = 1
const nextId = () => seq++

export function initState(config) {
  const games = {}
  for (const g of config.games) {
    if (g.type === 'culprit') {
      games[g.id] = {
        type: 'culprit',
        round: 0,
        results: Array.from({ length: g.rounds }, () => 'pending'),
        picked: null,
        guilty: null,
        revealed: false,
        cleared: false,
      }
    } else if (g.type === 'voice') {
      games[g.id] = {
        type: 'voice',
        round: 0,
        results: Array.from({ length: g.rounds }, () => 'pending'),
        listensLeft: g.maxListens ?? 3,
        revealed: false,
        countdown: null,
        cleared: false,
      }
    } else if (g.type === 'bonus') {
      games[g.id] = {
        type: 'bonus',
        round: 0,
        results: Array.from({ length: (g.interviews || []).length }, () => 'pending'),
        revealed: false,
        answered: '',
        cleared: false,
      }
    }
  }
  return {
    phase: 'intro',
    activeGameId: null,
    prize: { earned: 0 },
    log: [],
    games,
    banner: null,
    revivePending: null,
  }
}

const findGame = (config, id) => config.games.find((g) => g.id === id)

function addPrize(state, amount, label) {
  state.prize.earned = Math.max(0, state.prize.earned + amount)
  state.log.unshift({
    id: nextId(),
    at: Date.now(),
    label,
    amount,
  })
  if (state.log.length > 60) state.log.length = 60
}

function undoLast(state) {
  const last = state.log.shift()
  if (!last) return
  state.prize.earned = Math.max(0, state.prize.earned - last.amount)
}

/**
 * @returns {{state:object, fx:Array}} fx = 클라이언트에서 1회성으로 재생할 연출
 */
export function reduce(state, config, action) {
  const fx = []
  const g = state.activeGameId ? state.games[state.activeGameId] : null
  const gc = state.activeGameId ? findGame(config, state.activeGameId) : null

  switch (action.type) {
    // ── 화면 이동 ──────────────────────────────────────────────
    case 'goto': {
      state.phase = action.phase
      if (action.phase === 'game') {
        state.activeGameId = action.gameId ?? state.activeGameId
      }
      if (action.phase !== 'game') state.activeGameId = null
      fx.push({ kind: 'whoosh' })
      break
    }

    case 'banner': {
      state.banner = action.text || null
      break
    }

    // ── 공통: 상금 수동 조작 ────────────────────────────────────
    case 'prize.add': {
      addPrize(state, action.amount, action.label || '수동 지급')
      if (action.amount > 0) fx.push({ kind: 'cash', amount: action.amount })
      else fx.push({ kind: 'lose' })
      break
    }
    case 'prize.undo': {
      undoLast(state)
      fx.push({ kind: 'undo' })
      break
    }
    case 'prize.reset': {
      state.prize.earned = 0
      state.log = []
      break
    }

    // ── 게임1: 범인찾기 ────────────────────────────────────────
    case 'culprit.setGuilty': {
      if (g?.type === 'culprit') g.guilty = action.suspectId
      break
    }
    case 'culprit.pick': {
      if (g?.type === 'culprit' && !g.revealed) {
        g.picked = action.suspectId
        fx.push({ kind: 'lock-on' })
      }
      break
    }
    case 'culprit.judge': {
      if (g?.type === 'culprit' && !g.revealed) {
        const win = action.win
        g.revealed = true
        g.results[g.round] = win ? 'win' : 'lose'
        if (win) {
          addPrize(state, gc.prizePerRound, `${gc.no} ROUND ${g.round + 1} 적중`)
          fx.push({ kind: 'cash', amount: gc.prizePerRound })
          fx.push({ kind: 'stamp', text: '유 죄', tone: 'red' })
        } else {
          fx.push({ kind: 'stamp', text: '무죄 석방', tone: 'blue' })
          fx.push({ kind: 'fail' })
        }
        // 클리어 판정
        const wins = g.results.filter((r) => r === 'win').length
        const done = g.results.every((r) => r !== 'pending')
        if (!g.cleared && wins >= (gc.clearThreshold ?? 1)) {
          g.cleared = true
          addPrize(state, gc.clearBonus, `${gc.no} 집행 성공 보너스`)
          fx.push({ kind: 'clear', amount: gc.clearBonus, title: gc.title })
        } else if (done && !g.cleared) {
          state.revivePending = { gameId: g === state.games[state.activeGameId] ? state.activeGameId : null }
          fx.push({ kind: 'revive-offer' })
        }
      }
      break
    }
    case 'culprit.next': {
      if (g?.type === 'culprit') {
        if (g.round < g.results.length - 1) g.round += 1
        g.picked = null
        g.guilty = null
        g.revealed = false
      }
      break
    }
    case 'culprit.setRound': {
      if (g?.type === 'culprit') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
        g.picked = null
        g.guilty = null
        g.revealed = false
      }
      break
    }
    case 'culprit.addRound': {
      if (g?.type === 'culprit') {
        g.results.push('pending')
        g.round = g.results.length - 1
        g.picked = null
        g.guilty = null
        g.revealed = false
      }
      break
    }

    // ── 게임2: 이구이성 ────────────────────────────────────────
    case 'voice.countdown': {
      if (g?.type === 'voice') {
        g.countdown = Date.now()
        fx.push({ kind: 'countdown' })
      }
      break
    }
    case 'voice.useListen': {
      if (g?.type === 'voice' && g.listensLeft > 0) {
        g.listensLeft -= 1
        fx.push({ kind: 'listen', left: g.listensLeft })
      }
      break
    }
    case 'voice.setListens': {
      if (g?.type === 'voice') g.listensLeft = Math.max(0, action.value)
      break
    }
    case 'voice.judge': {
      if (g?.type === 'voice' && !g.revealed) {
        const win = action.win
        g.revealed = true
        g.results[g.round] = win ? 'win' : 'lose'
        if (win) {
          const maxL = gc.maxListens ?? 3
          const perfect = g.listensLeft === maxL - 1
          addPrize(state, gc.prizePerRound, `${gc.no} Q${g.round + 1} 정답`)
          fx.push({ kind: 'cash', amount: gc.prizePerRound })
          fx.push({ kind: 'reveal-word' })
          if (perfect && gc.perfectBonus) {
            addPrize(state, gc.perfectBonus, `${gc.no} Q${g.round + 1} 1회 청취 보너스`)
            fx.push({ kind: 'perfect', amount: gc.perfectBonus })
          }
        } else {
          fx.push({ kind: 'stamp', text: '감청 실패', tone: 'red' })
          fx.push({ kind: 'fail' })
        }
        const wins = g.results.filter((r) => r === 'win').length
        const done = g.results.every((r) => r !== 'pending')
        if (!g.cleared && wins >= (gc.clearThreshold ?? 3)) {
          g.cleared = true
          addPrize(state, gc.clearBonus, `${gc.no} 집행 성공 보너스`)
          fx.push({ kind: 'clear', amount: gc.clearBonus, title: gc.title })
        } else if (done && !g.cleared) {
          fx.push({ kind: 'revive-offer' })
        }
      }
      break
    }
    case 'voice.next': {
      if (g?.type === 'voice') {
        if (g.round < g.results.length - 1) g.round += 1
        g.revealed = false
        g.listensLeft = gc.maxListens ?? 3
        g.countdown = null
      }
      break
    }
    case 'voice.setRound': {
      if (g?.type === 'voice') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
        g.revealed = false
        g.listensLeft = gc.maxListens ?? 3
        g.countdown = null
      }
      break
    }
    case 'voice.reveal': {
      if (g?.type === 'voice') {
        g.revealed = true
        fx.push({ kind: 'reveal-word' })
      }
      break
    }

    // ── 보너스: 천생연분 ───────────────────────────────────────
    case 'bonus.setRound': {
      if (g?.type === 'bonus') {
        g.round = Math.max(0, Math.min(g.results.length - 1, action.round))
        g.revealed = false
        g.answered = ''
      }
      break
    }
    case 'bonus.next': {
      if (g?.type === 'bonus') {
        if (g.round < g.results.length - 1) g.round += 1
        g.revealed = false
        g.answered = ''
      }
      break
    }
    case 'bonus.reveal': {
      if (g?.type === 'bonus') {
        g.revealed = true
        fx.push({ kind: 'love-reveal' })
      }
      break
    }
    case 'bonus.judge': {
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
    }

    // ── 부활 처리 ──────────────────────────────────────────────
    case 'revive.grant': {
      const target = state.games[action.gameId]
      const tc = findGame(config, action.gameId)
      if (target && tc) {
        target.results.push('pending')
        target.round = target.results.length - 1
        target.revealed = false
        target.picked = null
        target.guilty = null
        if (target.type === 'voice') target.listensLeft = tc.maxListens ?? 3
        fx.push({ kind: 'revive' })
      }
      break
    }

    // ── 순수 연출 트리거 ───────────────────────────────────────
    case 'fx': {
      fx.push({ kind: action.kind, ...action.payload })
      break
    }

    default:
      break
  }

  return { state, fx }
}

// ══════════════════════════════════════════════════════════════
// 공개 투영 — TV/관전자에게는 정답을 절대 보내지 않는다
// ══════════════════════════════════════════════════════════════
export function publicView(state, config) {
  const games = {}
  for (const [id, g] of Object.entries(state.games)) {
    const gc = findGame(config, id)
    if (g.type === 'culprit') {
      games[id] = {
        ...g,
        // 공개 전에는 진범을 숨긴다
        guilty: g.revealed ? g.guilty : null,
      }
    } else if (g.type === 'voice') {
      const word = (gc.questions || [])[g.round] || ''
      games[id] = {
        ...g,
        // 정답 단어는 보내지 않고 글자수만
        wordLength: word.length,
        word: g.revealed ? word : null,
      }
    } else if (g.type === 'bonus') {
      const itv = (gc.interviews || [])[g.round] || {}
      games[id] = {
        ...g,
        question: itv.q || '',
        answer: g.revealed ? itv.a || '' : null,
      }
    }
  }
  return { ...state, games }
}

// 컨트롤러 전용 — 정답 포함
export function controlView(state, config) {
  const games = {}
  for (const [id, g] of Object.entries(state.games)) {
    const gc = findGame(config, id)
    if (g.type === 'voice') {
      games[id] = {
        ...g,
        word: (gc.questions || [])[g.round] || '',
        wordLength: ((gc.questions || [])[g.round] || '').length,
        allWords: gc.questions || [],
      }
    } else if (g.type === 'bonus') {
      const itv = (gc.interviews || [])[g.round] || {}
      games[id] = { ...g, question: itv.q || '', answer: itv.a || '' }
    } else {
      games[id] = { ...g }
    }
  }
  return { ...state, games }
}

// 공개용 config — 정답 제거
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
