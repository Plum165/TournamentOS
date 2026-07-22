export interface Archer {
  id: string;
  name: string;
  category: string; // e.g. Recurve, Compound, Barebow
  team: string; // e.g. Club Name or Independent
  points: number; // For rankings
}

export interface Shot {
  id: string;
  x: number; // coordinate x on target face (scaled -200 to +200)
  y: number; // coordinate y on target face (scaled -200 to +200)
  score: string; // "X", "10", "9", ..., "1", "M"
  value: number; // numeric value for calculations (X=10, M=0)
  timestamp: number;
}

export interface End {
  id: string;
  endNumber: number;
  shots: Shot[];
  distance: number; // in meters
}

export interface ArcherySession {
  id: string;
  archerId: string;
  archerName: string;
  format: 'indoor' | 'outdoor-720' | 'outdoor-1440' | 'outdoor-disa' | 'outdoor-practice';
  totalEnds: number; // 0 for unlimited (practice)
  arrowsPerEnd: number; // 3 or 6
  currentEndNumber: number;
  ends: End[];
  distances: number[]; // distances to shoot in this session
  date: string;
}

export type TargetType = '122cm' | '80cm' | 'indoor-40cm' | 'practice';

export interface TargetFaceDefinition {
  id: TargetType;
  name: string;
  rings: {
    value: string;
    radius: number; // boundary radius (0 to 200 scale)
    color: string;
    textColor: string;
  }[];
}

export interface RankingEntity {
  id: string;
  name: string;
  points: number;
  category?: string;
  team?: string;
  players?: Archer[]; // For team tournament pairings
  hasByePlayer?: boolean;
}

export interface TournamentMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  entity1: RankingEntity | null;
  entity2: RankingEntity | null;
  score1?: number;
  score2?: number;
  winnerId?: string;
}

export interface RoundRobinMatch {
  id: string;
  round: number;
  entity1: RankingEntity;
  entity2: RankingEntity; // can be "BYE"
  score1?: number;
  score2?: number;
  winnerId?: string;
  isBye: boolean;
}
