export type Phase = 'intro' | 'dashboard' | 'defendant' | 'game' | 'verdict'
export type RoundResult = 'pending' | 'win' | 'lose'
export type Role = 'tv' | 'control' | 'admin' | 'spectator'
export type GameType = 'culprit' | 'voice' | 'bonus' | 'simple' | 'tally' | 'versus' | 'draw'

export interface Mission {
  title: string
  desc?: string
  reward?: number
}

export interface Person {
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
  /** true 면 사다리에 포함되지 않는 직권 신문(부활용) */
  bonus?: boolean
  /** 공소사실 제N항 */
  no: string
  /** 구형한 검사 */
  prosecutor?: string
  /** 죄명 */
  charge?: string
  /** 게임 이름 */
  title: string
  subtitle?: string
  /** 공소사실 (억까 사유) */
  indictment?: string
  /** 구형 징역 년수 */
  demand?: number
  /** 진행 방법 */
  rule?: string
  /** 인용 조건 */
  win?: string
  rounds?: number
  clearThreshold?: number
  maxListens?: number
  evidences?: Evidence[]
  questions?: string[]
  interviews?: { q: string; a?: string; cat?: string }[]
  /** tally — 합계 목표치 */
  target?: number
  /** tally / versus — 숫자 단위 (명, 점 …) */
  tallyUnit?: string
  tallyLabel?: string
  /** versus — 'rounds'(승수) | 'points'(합계 점수) */
  scoring?: 'rounds' | 'points'
  /** draw — 제비뽑기 노역 항목 */
  missions?: Mission[]
}

export interface Config {
  court: {
    title: string
    /** 법원 이름 (예: 모시래 지방법원) */
    name?: string
    caseNo: string
    /** 사건명 (예: 독단 행복추구 사건) */
    caseName?: string
    room: string
    date: string
    weddingDate: string
    judge: string
    /** 판결문에만 실리는 추가 죄목 (게임과 무관) */
    extraCharges?: string[]
  }
  defendant: {
    name: string
    photo?: string
    /** 기각 연출용 오열 사진 */
    cryPhoto?: string
    birth?: string
    job?: string
    address?: string
    note: string
    record: string[]
  }
  witness: { name: string; photo?: string; role?: string }
  prize: {
    unit: string
    /** 공소사실을 N건 인용받았을 때 '누적 도달' 적립금 */
    ladder: number[]
    maxTotal: number
    bonusStep?: number
  }
  prosecutors: Person[]
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
  /** null = 전원 참여 */
  participants: number[] | null
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
  category?: string
  answer: string | null
  /** 이미 출제된 신문 사항 index */
  asked: number[]
  /** 남은 신문 사항 수 */
  remaining: number
}

export interface SimpleState extends GameBase {
  type: 'simple'
}

export interface TallyState extends GameBase {
  type: 'tally'
  values: number[]
}

export interface VersusState extends GameBase {
  type: 'versus'
  mine: number[]
  theirs: number[]
}

export interface DrawState extends GameBase {
  type: 'draw'
  drawn: number[]
  current: number | null
  revealed: boolean
  mission: Mission | null
}

export type GameState =
  | CulpritState
  | VoiceState
  | BonusState
  | SimpleState
  | TallyState
  | VersusState
  | DrawState

export interface PrizeLog {
  id: number
  at: number
  label: string
  delta: number
  total: number
}

export interface Meta {
  /** 인용된 공소사실 건수 */
  cleared: number
  totalGames: number
  current: number
  next: number
  maxTotal: number
  unit: string
  /** 총 구형 징역 (년) */
  demandTotal: number
  /** 기각되어 확정된 징역 (년) */
  demandStanding: number
  /** 최대치까지 남은 금액 (노역으로 충당할 몫) */
  shortfall: number
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
