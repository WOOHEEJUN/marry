export type Phase = 'intro' | 'dashboard' | 'mugshot' | 'game' | 'certificate'
export type RoundResult = 'pending' | 'win' | 'lose'
export type Role = 'tv' | 'control' | 'admin' | 'spectator'
export type GameType = 'culprit' | 'voice' | 'bonus' | 'simple'

export interface Suspect {
  id: number
  name: string
  photo?: string
}

export interface Evidence {
  real: string
  fake: string
  emoji?: string
}

export interface GameConfig {
  id: string
  type: GameType
  /** true 면 사다리에 포함되지 않는 보너스/부활 게임 */
  bonus?: boolean
  no: string
  title: string
  subtitle?: string
  /** 진행 방법 설명 (TV·컨트롤러에 표시) */
  rule?: string
  /** 성공 조건 설명 */
  win?: string
  rounds?: number
  clearThreshold?: number
  maxListens?: number
  evidences?: Evidence[]
  questions?: string[]
  interviews?: { q: string; a?: string }[]
}

export interface Config {
  party: { title: string; date: string; weddingDate: string }
  groom: {
    name: string
    photo?: string
    prisonNo: string
    crimeName: string
    sentence: string
    parole: string
    note: string
    crimes: string[]
  }
  bride: { name: string; photo?: string }
  prize: {
    unit: string
    /** 게임을 N개 클리어했을 때 '누적 도달' 금액 */
    ladder: number[]
    maxTotal: number
    bonusStep?: number
  }
  suspects: Suspect[]
  games: GameConfig[]
  controlPin?: string
}

interface GameBase {
  cleared: boolean
  failed: boolean
  round: number
  revives: number
  results: RoundResult[]
}

export interface CulpritState extends GameBase {
  type: 'culprit'
  picked: number | null
  guilty: number | null
  revealed: boolean
}

export interface VoiceState extends GameBase {
  type: 'voice'
  listensLeft: number
  revealed: boolean
  wordLength: number
  word: string | null
  allWords?: string[]
}

export interface BonusState extends GameBase {
  type: 'bonus'
  revealed: boolean
  question: string
  answer: string | null
}

export interface SimpleState extends GameBase {
  type: 'simple'
}

export type GameState = CulpritState | VoiceState | BonusState | SimpleState

export interface PrizeLog {
  id: number
  at: number
  label: string
  delta: number
  total: number
}

export interface Meta {
  /** 클리어한 본게임 수 */
  cleared: number
  totalGames: number
  /** 현재 도달 금액 (사다리) */
  current: number
  /** 다음 단계 금액 */
  next: number
  maxTotal: number
  unit: string
}

export interface AppState {
  phase: Phase
  activeGameId: string | null
  prize: { bonus: number; earned: number }
  log: PrizeLog[]
  games: Record<string, GameState>
  banner: string | null
  meta: Meta
}

export interface Conn {
  tv: number
  control: number
  spectator: number
  admin: number
}

export interface Fx {
  kind: string
  _id: string
  amount?: number
  total?: number
  unit?: string
  step?: number
  text?: string
  tone?: 'red' | 'blue' | 'gold'
  title?: string
  left?: number
}
