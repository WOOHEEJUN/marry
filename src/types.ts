export type Phase = 'intro' | 'dashboard' | 'mugshot' | 'game' | 'certificate'
export type RoundResult = 'pending' | 'win' | 'lose'
export type Role = 'tv' | 'control' | 'admin' | 'spectator'

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
  type: 'culprit' | 'voice' | 'bonus'
  no: string
  title: string
  subtitle?: string
  rounds?: number
  prizePerRound?: number
  clearBonus?: number
  clearThreshold?: number
  maxListens?: number
  perfectBonus?: number
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
  prize: { totalPool: number; currency: string; autoDistribute?: boolean }
  suspects: Suspect[]
  games: GameConfig[]
  controlPin?: string
}

export interface CulpritState {
  type: 'culprit'
  round: number
  results: RoundResult[]
  picked: number | null
  guilty: number | null
  revealed: boolean
  cleared: boolean
}

export interface VoiceState {
  type: 'voice'
  round: number
  results: RoundResult[]
  listensLeft: number
  revealed: boolean
  countdown: number | null
  cleared: boolean
  wordLength: number
  word: string | null
  allWords?: string[]
}

export interface BonusState {
  type: 'bonus'
  round: number
  results: RoundResult[]
  revealed: boolean
  answered: string
  cleared: boolean
  question: string
  answer: string | null
}

export type GameState = CulpritState | VoiceState | BonusState

export interface PrizeLog {
  id: number
  at: number
  label: string
  amount: number
}

export interface AppState {
  phase: Phase
  activeGameId: string | null
  prize: { earned: number }
  log: PrizeLog[]
  games: Record<string, GameState>
  banner: string | null
  revivePending: { gameId: string | null } | null
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
  text?: string
  tone?: 'red' | 'blue' | 'gold'
  title?: string
  left?: number
}
