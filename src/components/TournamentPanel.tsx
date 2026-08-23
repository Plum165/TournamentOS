import React, { useState, useEffect } from 'react';
import { Archer, RankingEntity, TournamentMatch, RoundRobinMatch } from '../types';
import { useDialog } from './DialogProvider';
import { Search, Trophy, GitMerge, ListOrdered, UploadCloud, UserPlus, Trash2, ArrowLeft, Users, ChevronRight, HelpCircle } from 'lucide-react';

interface TournamentPanelProps {
  participants: Archer[];
  onAddParticipant: (archer: Archer) => void;
  onRemoveParticipant: (id: string) => void;
  onImportCSV: (archers: Archer[]) => void;
  onClearAll: () => void;
}

export default function TournamentPanel({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onImportCSV,
  onClearAll,
}: TournamentPanelProps) {
  const { alert, confirm } = useDialog();

  // Navigation subviews with localStorage persistence
  const [viewState, setViewState] = useState<'roster' | 'categorySelect' | 'bracket' | 'roundRobin'>(() => {
    return (localStorage.getItem('archery_tournament_viewState') as any) || 'roster';
  });
  const [tournamentMode, setTournamentMode] = useState<'single' | 'team'>(() => {
    return (localStorage.getItem('archery_tournament_mode') as any) || 'single';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return localStorage.getItem('archery_tournament_selectedCategory') || 'Everyone';
  });

  // Input states
  const [partName, setPartName] = useState('');
  const [partPoints, setPartPoints] = useState('');
  const [partCategory, setPartCategory] = useState('Recurve');
  const [partTeam, setPartTeam] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionSearchQuery, setDivisionSearchQuery] = useState('');

  // Round Robin state with localStorage persistence
  const [roundRobinMatches, setRoundRobinMatches] = useState<RoundRobinMatch[]>(() => {
    try {
      const saved = localStorage.getItem('archery_tournament_roundRobinMatches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentRoundRobinRound, setCurrentRoundRobinRound] = useState<number>(() => {
    const saved = localStorage.getItem('archery_tournament_currentRoundRobinRound');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Bracket state with localStorage persistence
  const [bracketMatches, setBracketMatches] = useState<TournamentMatch[]>(() => {
    try {
      const saved = localStorage.getItem('archery_tournament_bracketMatches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [bracketSize, setBracketSize] = useState<number>(() => {
    const saved = localStorage.getItem('archery_tournament_bracketSize');
    return saved ? parseInt(saved, 10) : 2;
  });
  const [bracketRoundsCount, setBracketRoundsCount] = useState<number>(() => {
    const saved = localStorage.getItem('archery_tournament_bracketRoundsCount');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('archery_tournament_viewState', viewState);
  }, [viewState]);

  useEffect(() => {
    localStorage.setItem('archery_tournament_mode', tournamentMode);
  }, [tournamentMode]);

  useEffect(() => {
    localStorage.setItem('archery_tournament_selectedCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem('archery_tournament_roundRobinMatches', JSON.stringify(roundRobinMatches));
  }, [roundRobinMatches]);

  useEffect(() => {
    localStorage.setItem('archery_tournament_currentRoundRobinRound', String(currentRoundRobinRound));
  }, [currentRoundRobinRound]);

  useEffect(() => {
    localStorage.setItem('archery_tournament_bracketMatches', JSON.stringify(bracketMatches));
  }, [bracketMatches]);

  useEffect(() => {
    localStorage.setItem('archery_tournament_bracketSize', String(bracketSize));
  }, [bracketSize]);

  useEffect(() => {
    localStorage.setItem('archery_tournament_bracketRoundsCount', String(bracketRoundsCount));
  }, [bracketRoundsCount]);

  // --- MANUAL PARTICIPANT ADD ---
  const handleAddPart = async () => {
    if (!partName.trim()) {
      await alert('Name is required');
      return;
    }
    const points = parseInt(partPoints, 10);
    if (isNaN(points)) {
      await alert('Points must be a valid number');
      return;
    }

    const newArcher: Archer = {
      id: `archer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: partName.trim(),
      points,
      category: partCategory,
      team: partTeam.trim() || 'Independent',
    };

    onAddParticipant(newArcher);
    setPartName('');
    setPartPoints('');
    setPartTeam('');
  };

  // --- CSV FILE IMPORT ---
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const importedArchers: Archer[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        if (cols.length >= 2) {
          const name = cols[0]?.trim();
          const points = parseInt(cols[1]?.trim(), 10);
          const category = cols[2]?.trim() || 'Recurve';
          const team = cols[3]?.trim() || 'Independent';

          if (name && !isNaN(points)) {
            importedArchers.push({
              id: `archer-csv-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
              name,
              points,
              category,
              team,
            });
          }
        }
      }

      onImportCSV(importedArchers);
      await alert(`Imported ${importedArchers.length} archers successfully!`);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Get active distinct categories
  const categories = ['Everyone', ...new Set(participants.map((p) => p.category))].sort();

  // Filter and search rankings
  const sortedRankings = [...participants]
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'Everyone' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => b.points - a.points);

  // --- BRACKET SEEDING ENGINE ---
  const handleInitiateBracketMode = async (mode: 'single' | 'team') => {
    if (participants.length === 0) {
      await alert('Roster is empty. Please add archers first.');
      return;
    }
    setTournamentMode(mode);
    setViewState('categorySelect');
  };

  const handleBuildBracketForCategory = async (cat: string) => {
    setSelectedCategory(cat);

    // 1. Get filtered participants
    const filtered = cat === 'Everyone' ? participants : participants.filter((p) => p.category === cat);
    // Sort descending for proper seeding
    const players = [...filtered].sort((a, b) => b.points - a.points);

    if (players.length < 2) {
      await alert(`Not enough archers in category "${cat}" to seed a bracket (minimum 2).`);
      return;
    }

    let entities: RankingEntity[] = [];

    // Seeding Logic: Singles vs Balanced Pairs Team Draft
    if (tournamentMode === 'single') {
      entities = players.map((p) => ({
        id: p.id,
        name: p.name,
        points: p.points,
        category: p.category,
        team: p.team,
      }));
    } else {
      // Balanced dynamic team pairing: pair 1st seed with last seed, 2nd with second last, etc.
      let left = 0;
      let right = players.length - 1;

      while (left < right) {
        const p1 = players[left];
        const p2 = players[right];
        entities.push({
          id: `team-${p1.id}-${p2.id}`,
          name: `${p1.name} & ${p2.name}`,
          points: p1.points + p2.points,
          players: [p1, p2],
        });
        left++;
        right--;
      }

      // Handle odd number bye
      if (left === right) {
        const p = players[left];
        entities.push({
          id: `team-${p.id}-bye`,
          name: `${p.name} (Single)`,
          points: p.points,
          players: [p],
          hasByePlayer: true,
        });
      }
    }

    // Determine nearest power of 2 for bracket size
    let bSize = 2;
    while (bSize < entities.length) {
      bSize *= 2;
    }

    const rounds = Math.log2(bSize);
    setBracketSize(bSize);
    setBracketRoundsCount(rounds);

    // Fill seed positions with BYE if necessary to reach power of 2
    const seededEntities = [...entities];
    while (seededEntities.length < bSize) {
      seededEntities.push({
        id: `bye-${seededEntities.length}`,
        name: 'BYE (Automatic Win)',
        points: 0,
      });
    }

    // Seed matches of the first round using standard seed pairings (1 vs N, 2 vs N-1, etc.)
    const firstRoundMatches: TournamentMatch[] = [];
    const numMatchesFirstRound = bSize / 2;

    for (let m = 0; m < numMatchesFirstRound; m++) {
      const ent1 = seededEntities[m];
      const ent2 = seededEntities[bSize - 1 - m];

      // Auto resolve if one is a BYE
      let winnerId: string | undefined = undefined;
      let score1 = undefined;
      let score2 = undefined;

      if (ent1.id.startsWith('bye')) {
        winnerId = ent2.id;
        score1 = 0;
        score2 = 1;
      } else if (ent2.id.startsWith('bye')) {
        winnerId = ent1.id;
        score1 = 1;
        score2 = 0;
      }

      firstRoundMatches.push({
        id: `match-0-${m}`,
        roundIndex: 0,
        matchIndex: m,
        entity1: ent1,
        entity2: ent2,
        score1,
        score2,
        winnerId,
      });
    }

    // Populate empty matches for future rounds
    const allMatches = [...firstRoundMatches];
    for (let r = 1; r < rounds; r++) {
      const numMatchesInRound = bSize / Math.pow(2, r + 1);
      for (let m = 0; m < numMatchesInRound; m++) {
        allMatches.push({
          id: `match-${r}-${m}`,
          roundIndex: r,
          matchIndex: m,
          entity1: null,
          entity2: null,
        });
      }
    }

    // Add Bronze Medal Match if there are at least 2 rounds (Semifinals and Finals)
    if (rounds >= 2) {
      allMatches.push({
        id: `match-${rounds - 1}-1`,
        roundIndex: rounds - 1,
        matchIndex: 1,
        entity1: null,
        entity2: null,
      });
    }

    // Auto-advance BYE winners from Round 0 to Round 1 immediately
    advanceWinners(allMatches, rounds);

    setBracketMatches(allMatches);
    setViewState('bracket');
  };

  // ADVANCE WINNER helper
  const advanceWinners = (matches: TournamentMatch[], rounds: number) => {
    // Reset any existing Bronze Match slots first to prevent duplicate stale state before recalculation
    if (rounds >= 2) {
      const bronzeMatch = matches.find((m) => m.roundIndex === rounds - 1 && m.matchIndex === 1);
      if (bronzeMatch) {
        bronzeMatch.entity1 = null;
        bronzeMatch.entity2 = null;
      }
    }

    for (let r = 0; r < rounds - 1; r++) {
      const currentRoundMatches = matches.filter((m) => m.roundIndex === r);
      currentRoundMatches.forEach((m) => {
        if (m.winnerId) {
          const winnerEntity = m.winnerId === m.entity1?.id ? m.entity1 : m.entity2;
          if (!winnerEntity) return;

          // Next round index is r+1, next match index is matchIndex / 2 (floored)
          const nextMatchIndex = Math.floor(m.matchIndex / 2);
          const nextMatch = matches.find((nm) => nm.roundIndex === r + 1 && nm.matchIndex === nextMatchIndex);

          if (nextMatch) {
            const isFirstSlot = m.matchIndex % 2 === 0;
            if (isFirstSlot) {
              nextMatch.entity1 = winnerEntity;
            } else {
              nextMatch.entity2 = winnerEntity;
            }

            // If next slot is also auto-bye, resolve it too
            if (nextMatch.entity1 && nextMatch.entity2) {
              if (nextMatch.entity1.id.startsWith('bye')) {
                nextMatch.winnerId = nextMatch.entity2.id;
                nextMatch.score1 = 0;
                nextMatch.score2 = 1;
              } else if (nextMatch.entity2.id.startsWith('bye')) {
                nextMatch.winnerId = nextMatch.entity1.id;
                nextMatch.score1 = 1;
                nextMatch.score2 = 0;
              }
            }
          }

          // If this is the Semifinal round (rounds - 2), also advance the loser to the Bronze Medal Match
          if (r === rounds - 2) {
            const loserEntity = m.winnerId === m.entity1?.id ? m.entity2 : m.entity1;
            if (loserEntity) {
              const bronzeMatch = matches.find((nm) => nm.roundIndex === r + 1 && nm.matchIndex === 1);
              if (bronzeMatch) {
                if (m.matchIndex === 0) {
                  bronzeMatch.entity1 = loserEntity;
                } else if (m.matchIndex === 1) {
                  bronzeMatch.entity2 = loserEntity;
                }
              }
            }
          }
        }
      });
    }
  };

  const updateMatchScore = (matchId: string, score1Str: string, score2Str: string) => {
    const nextMatches = bracketMatches.map((m) => {
      if (m.id === matchId) {
        return { ...m };
      }
      return m;
    });
    const match = nextMatches.find((m) => m.id === matchId);
    if (!match || !match.entity1 || !match.entity2) return;

    const s1 = score1Str === '' ? undefined : parseInt(score1Str, 10);
    const s2 = score2Str === '' ? undefined : parseInt(score2Str, 10);

    match.score1 = isNaN(s1 as number) ? undefined : s1;
    match.score2 = isNaN(s2 as number) ? undefined : s2;

    if (match.score1 !== undefined && match.score2 !== undefined) {
      if (match.score1 > match.score2) match.winnerId = match.entity1.id;
      else if (match.score2 > match.score1) match.winnerId = match.entity2.id;
      else match.winnerId = undefined; // Draw is unresolved
    } else {
      match.winnerId = undefined;
    }

    // Reset downstream dependencies if score cleared
    if (match.winnerId === undefined) {
      clearDownstreamSlots(nextMatches, match.roundIndex, match.matchIndex);
    }

    // Re-apply advances
    advanceWinners(nextMatches, bracketRoundsCount);
    setBracketMatches(nextMatches);
  };

  const clearDownstreamSlots = (matches: TournamentMatch[], round: number, matchIdx: number) => {
    let currentRound = round;
    let currentIdx = matchIdx;

    // Reset bronze match slots if clearing a Semifinal
    if (round === bracketRoundsCount - 2) {
      const bronzeMatch = matches.find((m) => m.roundIndex === bracketRoundsCount - 1 && m.matchIndex === 1);
      if (bronzeMatch) {
        if (matchIdx === 0) {
          bronzeMatch.entity1 = null;
        } else if (matchIdx === 1) {
          bronzeMatch.entity2 = null;
        }
        bronzeMatch.score1 = undefined;
        bronzeMatch.score2 = undefined;
        bronzeMatch.winnerId = undefined;
      }
    }

    while (currentRound < bracketRoundsCount - 1) {
      const nextRound = currentRound + 1;
      const nextIdx = Math.floor(currentIdx / 2);
      const nextMatch = matches.find((m) => m.roundIndex === nextRound && m.matchIndex === nextIdx);

      if (nextMatch) {
        const isFirstSlot = currentIdx % 2 === 0;
        if (isFirstSlot) {
          nextMatch.entity1 = null;
        } else {
          nextMatch.entity2 = null;
        }
        nextMatch.score1 = undefined;
        nextMatch.score2 = undefined;
        nextMatch.winnerId = undefined;
      }

      currentRound = nextRound;
      currentIdx = nextIdx;
    }
  };

  // --- ROUND ROBIN SEEDING ENGINE ---
  const handleInitiateRoundRobin = async () => {
    const players = [...sortedRankings];
    if (players.length < 3) {
      await alert('Need at least 3 archers to compile a Round Robin group schedule.');
      return;
    }

    const list: RankingEntity[] = players.map((p) => ({
      id: p.id,
      name: p.name,
      points: p.points,
      category: p.category,
      team: p.team,
    }));

    const n = list.length;
    const matches: RoundRobinMatch[] = [];

    // Standard Berger Round Robin Scheduler
    const pool = [...list];
    if (n % 2 !== 0) {
      pool.push({ id: 'bye-rr', name: 'BYE (Idle Slot)', points: 0 });
    }

    const numTeams = pool.length;
    const rounds = numTeams - 1;
    const half = numTeams / 2;

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < half; i++) {
        const t1 = pool[i];
        const t2 = pool[numTeams - 1 - i];

        if (t1.id !== 'bye-rr' && t2.id !== 'bye-rr') {
          matches.push({
            id: `rr-${r}-${i}`,
            round: r + 1,
            entity1: t1,
            entity2: t2,
            isBye: false,
          });
        } else {
          // Identify who is receiving the bye in this round
          const activeEntity = t1.id === 'bye-rr' ? t2 : t1;
          matches.push({
            id: `rr-${r}-${i}`,
            round: r + 1,
            entity1: activeEntity,
            entity2: { id: 'bye-rr', name: 'BYE', points: 0 },
            isBye: true,
          });
        }
      }

      // Rotate pool ( Berger shift ) keeping first index fixed
      const last = pool.pop();
      if (last) {
        pool.splice(1, 0, last);
      }
    }

    setRoundRobinMatches(matches);
    setCurrentRoundRobinRound(1);
    setViewState('roundRobin');
  };

  const updateRoundRobinScore = (matchId: string, s1: string, s2: string) => {
    const nextMatches = roundRobinMatches.map((m) => {
      if (m.id === matchId) {
        return { ...m };
      }
      return m;
    });
    const match = nextMatches.find((m) => m.id === matchId);
    if (!match || match.isBye) return;

    const val1 = s1 === '' ? undefined : parseInt(s1, 10);
    const val2 = s2 === '' ? undefined : parseInt(s2, 10);

    match.score1 = isNaN(val1 as number) ? undefined : val1;
    match.score2 = isNaN(val2 as number) ? undefined : val2;

    if (match.score1 !== undefined && match.score2 !== undefined) {
      if (match.score1 > match.score2) match.winnerId = match.entity1.id;
      else if (match.score2 > match.score1) match.winnerId = match.entity2.id;
      else match.winnerId = 'draw';
    } else {
      match.winnerId = undefined;
    }

    setRoundRobinMatches(nextMatches);
  };

  // Helpers to get bracket rounds
  const getRoundLabel = (rIdx: number) => {
    if (rIdx === bracketRoundsCount - 1) return 'Finals Match';
    if (rIdx === bracketRoundsCount - 2) return 'Semifinals';
    if (rIdx === bracketRoundsCount - 3) return 'Quarterfinals';
    return `Round ${rIdx + 1}`;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. ROSTER & SETUP VIEW */}
      {viewState === 'roster' && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
          
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black mb-2 text-white">Rankings & Eliminations</h3>
            <p className="opacity-60 text-sm">Build your tournament roster to seed custom single-elim, dynamic team formats, or round-robin schedules.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Form */}
            <div className="lg:col-span-5 glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl flex flex-col gap-4">
              <h4 className="font-bold text-sm text-white border-b border-[var(--slate-700)] pb-2.5 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[var(--accent)]" /> Add Archer Manually
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="e.g. Dave Cousins"
                    className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Rounds Score (Total Points)</label>
                  <input
                    type="number"
                    value={partPoints}
                    onChange={(e) => setPartPoints(e.target.value)}
                    placeholder="e.g. 710"
                    className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Division</label>
                    <input
                      type="text"
                      list="roster-divisions-presets"
                      value={partCategory}
                      onChange={(e) => setPartCategory(e.target.value)}
                      className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                      placeholder="e.g. Recurve, Compound..."
                    />
                    <datalist id="roster-divisions-presets">
                      {['Recurve', 'Compound', 'Barebow', ...new Set(participants.map(p => p.category))].map((div) => (
                        <option key={div} value={div} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Club / Team</label>
                    <input
                      type="text"
                      value={partTeam}
                      onChange={(e) => setPartTeam(e.target.value)}
                      placeholder="e.g. Royal Club"
                      className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddPart}
                className="w-full py-2.5 bg-[var(--accent)] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md mt-2 cursor-pointer"
              >
                Add Archer to Standings
              </button>
            </div>

            {/* CSV File Upload Option */}
            <div className="lg:col-span-7 glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden group min-h-[220px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent pointer-events-none"></div>
              <UploadCloud className="w-10 h-10 text-[var(--accent)] mb-3 group-hover:scale-105 transition-transform" />
              <h4 className="font-bold text-base text-white mb-1">Import Competitor Roster</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed font-semibold">
                Excel or CSV files containing lists of archers. Column layout matches exactly: 
                <span className="text-[var(--accent)] font-mono ml-1">Name, Points, Category, Team</span>
              </p>
              <input
                type="file"
                id="roster-csv-input"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <label
                htmlFor="roster-csv-input"
                className="px-5 py-2 bg-[var(--slate-800)] hover:bg-[var(--slate-700)] text-white border border-[var(--slate-700)] rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-sm"
              >
                Select CSV File
              </label>
            </div>
          </div>

          {/* Standings Table and Seeding Actions */}
          <div className="glass p-5 rounded-xl border border-[var(--slate-700)] shadow-2xl space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--slate-700)] pb-4">
              <div>
                <h4 className="font-bold text-base text-white">Competitor Roster & standings</h4>
                <p className="text-xs text-slate-400 mt-0.5">{participants.length} Active Competitors Registered</p>
              </div>

              {/* Action Seeding Launchers */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleInitiateBracketMode('single')}
                  className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <GitMerge className="w-3.5 h-3.5" /> Seed Singles Bracket
                </button>
                <button
                  onClick={() => handleInitiateBracketMode('team')}
                  className="flex-1 sm:flex-none px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> Draft Balanced Teams
                </button>
                <button
                  onClick={handleInitiateRoundRobin}
                  className="flex-1 sm:flex-none px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ListOrdered className="w-3.5 h-3.5" /> Round Robin League
                </button>
              </div>
            </div>

            {/* Live Search & Segment Filtering */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search competitor name or club..."
                  className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex flex-wrap bg-[var(--slate-800)] rounded-lg p-0.5 border border-[var(--slate-700)] h-fit gap-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat ? 'bg-[var(--accent)] text-white font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Standings List */}
            <div className="overflow-x-auto rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)] max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[var(--slate-800)] text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-[var(--slate-700)] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">Rank</th>
                    <th>Competitor Name</th>
                    <th>Division</th>
                    <th>Club / Team</th>
                    <th className="text-[var(--accent)]">Aggregate Points</th>
                    <th className="text-right px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--slate-700)] font-semibold text-slate-300">
                  {sortedRankings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No competitors found matching this search / division filter.
                      </td>
                    </tr>
                  ) : (
                    sortedRankings.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-[var(--slate-800)]/50 transition-colors">
                        <td className="py-2.5 px-4 text-sm font-black text-[var(--accent)]">#{idx + 1}</td>
                        <td className="text-white text-xs font-bold">{p.name}</td>
                        <td>
                          <span className="bg-slate-800 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wide text-slate-400">
                            {p.category}
                          </span>
                        </td>
                        <td className="text-xs text-slate-400">{p.team}</td>
                        <td className="text-xs font-bold text-[var(--accent)]">{p.points} Pts</td>
                        <td className="text-right px-4">
                          <button
                            onClick={() => onRemoveParticipant(p.id)}
                            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all cursor-pointer shadow"
                            title="Remove Archer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {participants.length > 0 && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={onClearAll}
                  className="px-4 py-2 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Reset Roster
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. DIVISION CATEGORY SELECTION SUBVIEW */}
      {viewState === 'categorySelect' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between glass p-4 rounded-2xl shadow-xl">
            <button
              onClick={() => setViewState('roster')}
              className="flex items-center gap-1.5 text-xs font-black text-white/60 hover:text-white uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Standings
            </button>
            <span className="text-xs font-black text-[var(--accent)] uppercase tracking-widest">
              STEP 2: DIVISION FILTER
            </span>
          </div>

          <div className="glass p-10 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6">
            <div>
              <Trophy className="w-12 h-12 text-[var(--accent)] mx-auto mb-2" />
              <h3 className="text-2xl font-black text-white">Select Division Bracket</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed mt-1 font-semibold">
                Generate brackets grouped by division, or seed everyone together in a unified championship.
              </p>
            </div>

            {/* Dynamic Division Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search divisions..."
                value={divisionSearchQuery}
                onChange={(e) => setDivisionSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
              {categories
                .filter((cat) => cat.toLowerCase().includes(divisionSearchQuery.toLowerCase()))
                .map((cat) => {
                  const count = cat === 'Everyone' ? participants.length : participants.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      disabled={count < 2}
                      onClick={() => handleBuildBracketForCategory(cat)}
                      className="p-5 bg-black/40 border border-white/10 hover:border-[var(--accent)]/50 rounded-2xl text-center transition-all group disabled:opacity-40 disabled:hover:border-white/10"
                    >
                      <span className="text-sm font-black text-white uppercase tracking-wider block group-hover:text-[var(--accent)] transition-colors">
                        {cat}
                      </span>
                      <span className="text-[10px] text-white/40 block mt-1 font-semibold">
                        {count} Archers Registered
                      </span>
                    </button>
                  );
                })}
              {categories.filter((cat) => cat.toLowerCase().includes(divisionSearchQuery.toLowerCase())).length === 0 && (
                <div className="col-span-2 text-center text-xs text-white/40 py-4 font-semibold">
                  No matching divisions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. VISUAL BRACKET VIEW */}
      {viewState === 'bracket' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-3 rounded-lg shadow-xl border border-[var(--slate-700)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewState('roster')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Standings
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={async () => {
                  const confirmed = await confirm('Are you sure you want to discard this tournament bracket and start over?');
                  if (confirmed) {
                    setBracketMatches([]);
                    setBracketSize(2);
                    setBracketRoundsCount(1);
                    setViewState('roster');
                    localStorage.removeItem('archery_tournament_bracketMatches');
                    localStorage.removeItem('archery_tournament_viewState');
                  }
                }}
                className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
              >
                Reset Bracket
              </button>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                {tournamentMode === 'single' ? 'Singles Elimination' : 'Balanced Team Pairs'} • {selectedCategory}
              </span>
            </div>
          </div>

          {/* Interactive Advancing Help Card */}
          <div className="glass p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300 flex items-start gap-3 max-w-4xl mx-auto">
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-blue-400 mt-0.5" />
            <div className="space-y-1 font-semibold">
              <p className="font-bold text-white">How to Advance Competitors:</p>
              <p className="leading-relaxed">
                Enter scores in the match cards below. The competitor with the higher score is automatically promoted to the next slot in real-time. Matches seeded with "BYE" are resolved immediately.
              </p>
            </div>
          </div>

          {/* Bracket Interactive Tree */}
          <div className="glass p-6 rounded-xl border border-[var(--slate-700)] shadow-2xl overflow-x-auto max-w-full">
            <div className="flex gap-16 min-w-max pb-4">
              
              {Array.from({ length: bracketRoundsCount }).map((_, rIdx) => {
                const roundMatches = bracketMatches.filter((m) => m.roundIndex === rIdx);
                return (
                  <div key={rIdx} className="flex flex-col justify-around gap-12 min-w-[240px] relative">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] border-b border-[var(--slate-700)] pb-2 text-center">
                      {rIdx === bracketRoundsCount - 1 ? 'Finals & Bronze Match' : getRoundLabel(rIdx)}
                    </h5>

                    <div className="flex-1 flex flex-col justify-around gap-8">
                      {roundMatches.map((match) => {
                        const isEnt1Winner = match.winnerId && match.entity1 && match.winnerId === match.entity1.id;
                        const isEnt2Winner = match.winnerId && match.entity2 && match.winnerId === match.entity2.id;

                        const isMatchResolved = !!match.winnerId;
                        const isBronzeMatch = match.roundIndex === bracketRoundsCount - 1 && match.matchIndex === 1;
                        const isGoldMatch = match.roundIndex === bracketRoundsCount - 1 && match.matchIndex === 0;

                        return (
                          <div
                            key={match.id}
                            className={`p-3 bg-[var(--slate-900)] rounded-lg border flex flex-col gap-3 relative shadow-md transition-all ${
                              isGoldMatch ? 'border-yellow-500/40 shadow-lg' : isBronzeMatch ? 'border-amber-600/40 shadow-lg' : 'border-[var(--slate-700)]'
                            } ${
                              isMatchResolved && !isGoldMatch && !isBronzeMatch ? 'border-[var(--accent)]/55 shadow-md shadow-[var(--accent)]/5' : ''
                            }`}
                          >
                            {/* Match Header Label */}
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest pb-1 border-b border-[var(--slate-850,rgba(255,255,255,0.05))]">
                              <span className={isGoldMatch ? 'text-yellow-500' : isBronzeMatch ? 'text-amber-500' : 'text-slate-400'}>
                                {isGoldMatch ? '🥇 Gold Medal Match' : isBronzeMatch ? '🥉 Bronze Medal Match' : `Match ${match.matchIndex + 1}`}
                              </span>
                            </div>

                            {/* Connector Lines for Brackets */}
                            {/* Left incoming line (from previous round) */}
                            {rIdx > 0 && (
                              <div className="absolute left-[-32px] top-1/2 w-[32px] h-[2px] bg-slate-600/60 pointer-events-none" />
                            )}

                            {/* Right outgoing line to meet parent branch */}
                            {rIdx < bracketRoundsCount - 1 ? (
                              <>
                                <div className="absolute right-[-32px] top-1/2 w-[32px] h-[2px] bg-slate-600/60 pointer-events-none" />
                                {match.matchIndex % 2 === 0 ? (
                                  /* Sibling 1: Draw trunk down */
                                  <div 
                                    className="absolute right-[-32px] top-1/2 w-[2px] bg-slate-600/60 pointer-events-none" 
                                    style={{ height: `${Math.pow(2, rIdx) * 32 + 20}px` }} 
                                  />
                                ) : (
                                  /* Sibling 2: Draw trunk up */
                                  <div 
                                    className="absolute right-[-32px] bottom-1/2 w-[2px] bg-slate-600/60 pointer-events-none" 
                                    style={{ height: `${Math.pow(2, rIdx) * 32 + 20}px` }} 
                                  />
                                )}
                              </>
                            ) : (
                              /* Finals outgoing line to champion - only for Gold match (matchIndex === 0) */
                              isGoldMatch && (
                                <div className="absolute right-[-32px] top-1/2 w-[32px] h-[2px] bg-yellow-500/40 pointer-events-none" />
                              )
                            )}

                            <div className="space-y-2">
                              {/* Entity 1 Row */}
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className={`text-xs font-bold truncate max-w-[140px] ${
                                    isEnt1Winner ? 'text-[var(--accent)] font-black' : 'text-slate-400'
                                  }`}
                                  title={match.entity1?.name || 'Waiting...'}
                                >
                                  {match.entity1?.name || 'TBD Competitor'}
                                </span>
                                {match.entity1 && !match.entity1.id.startsWith('bye') && (
                                  <input
                                    type="number"
                                    placeholder="Sc"
                                    value={match.score1 ?? ''}
                                    onChange={(e) => updateMatchScore(match.id, e.target.value, String(match.score2 ?? ''))}
                                    className="w-12 bg-[var(--slate-800)] border border-[var(--slate-700)] rounded py-1 px-1.5 text-center font-bold text-xs text-white outline-none focus:border-[var(--accent)]"
                                  />
                                )}
                              </div>

                              <div className="h-[1px] bg-[var(--slate-700)]"></div>

                              {/* Entity 2 Row */}
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className={`text-xs font-bold truncate max-w-[140px] ${
                                    isEnt2Winner ? 'text-[var(--accent)] font-black' : 'text-slate-400'
                                  }`}
                                  title={match.entity2?.name || 'Waiting...'}
                                >
                                  {match.entity2?.name || 'TBD Competitor'}
                                </span>
                                {match.entity2 && !match.entity2.id.startsWith('bye') && (
                                  <input
                                    type="number"
                                    placeholder="Sc"
                                    value={match.score2 ?? ''}
                                    onChange={(e) => updateMatchScore(match.id, String(match.score1 ?? ''), e.target.value)}
                                    className="w-12 bg-[var(--slate-800)] border border-[var(--slate-700)] rounded py-1 px-1.5 text-center font-bold text-xs text-white outline-none focus:border-[var(--accent)]"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Champion Column */}
              <div className="flex flex-col justify-center gap-4 min-w-[210px] text-center self-center h-full">
                <div className="space-y-1">
                  <Trophy className="w-8 h-8 text-yellow-500 mx-auto animate-bounce mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">PODIUM STANDINGS</span>
                </div>
                
                {/* Find the winner of final round */}
                {(() => {
                  const finalMatch = bracketMatches.find((m) => m.roundIndex === bracketRoundsCount - 1 && m.matchIndex === 0);
                  const bronzeMatch = bracketMatches.find((m) => m.roundIndex === bracketRoundsCount - 1 && m.matchIndex === 1);
                  
                  const goldWinner = finalMatch?.winnerId
                    ? finalMatch.winnerId === finalMatch.entity1?.id
                      ? finalMatch.entity1
                      : finalMatch.entity2
                    : null;

                  const silverWinner = finalMatch?.winnerId
                    ? finalMatch.winnerId === finalMatch.entity1?.id
                      ? finalMatch.entity2
                      : finalMatch.entity1
                    : null;

                  const bronzeWinner = bronzeMatch?.winnerId
                    ? bronzeMatch.winnerId === bronzeMatch.entity1?.id
                      ? bronzeMatch.entity1
                      : bronzeMatch.entity2
                    : null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="bg-[var(--slate-900)] p-4 rounded-lg border-2 border-yellow-500/50 shadow-xl max-w-[180px] mx-auto relative">
                        {/* Incoming connector from Finals */}
                        <div className="absolute left-[-32px] top-1/2 w-[32px] h-[2px] bg-yellow-500/40 pointer-events-none" />
                        <span className="text-[9px] font-black text-yellow-500 tracking-widest uppercase block mb-1">🥇 Gold Winner</span>
                        <span className="text-xs font-black text-white truncate block" title={goldWinner?.name || 'TBD'}>
                          {goldWinner?.name || 'Undecided'}
                        </span>
                      </div>

                      {silverWinner && (
                        <div className="bg-[var(--slate-900)]/90 p-3 rounded-lg border border-slate-400/35 shadow-md max-w-[170px] mx-auto">
                          <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block mb-1">🥈 Silver Medal</span>
                          <span className="text-xs font-black text-slate-200 truncate block" title={silverWinner.name}>
                            {silverWinner.name}
                          </span>
                        </div>
                      )}

                      {bronzeWinner && (
                        <div className="bg-[var(--slate-900)]/90 p-3 rounded-lg border border-amber-600/35 shadow-md max-w-[170px] mx-auto">
                          <span className="text-[9px] font-black text-amber-500 tracking-widest uppercase block mb-1">🥉 Bronze Medal</span>
                          <span className="text-xs font-black text-slate-200 truncate block" title={bronzeWinner.name}>
                            {bronzeWinner.name}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. ROUND ROBIN VIEW */}
      {viewState === 'roundRobin' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-3 rounded-lg shadow-xl border border-[var(--slate-700)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewState('roster')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Standings
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={async () => {
                  const confirmed = await confirm('Are you sure you want to discard this round-robin league and start over?');
                  if (confirmed) {
                    setRoundRobinMatches([]);
                    setCurrentRoundRobinRound(1);
                    setViewState('roster');
                    localStorage.removeItem('archery_tournament_roundRobinMatches');
                    localStorage.removeItem('archery_tournament_viewState');
                  }
                }}
                className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
              >
                Reset League
              </button>
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                BERGER SYSTEM ROUND ROBIN LEAGUE
              </span>
            </div>
          </div>

          {/* Round RR Menu Tabs */}
          {(() => {
            const rounds = Array.from(new Set(roundRobinMatches.map((m) => m.round))).sort((a: number, b: number) => a - b);
            return (
              <div className="flex flex-wrap gap-1 bg-[var(--slate-800)] p-1 rounded-xl border border-[var(--slate-700)] justify-center">
                {rounds.map((r) => (
                  <button
                    key={r}
                    onClick={() => setCurrentRoundRobinRound(r)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      currentRoundRobinRound === r
                        ? 'bg-[var(--accent)] text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Round {r}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Current Round Matchcards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roundRobinMatches
              .filter((m) => m.round === currentRoundRobinRound)
              .map((match) => (
                <div
                  key={match.id}
                  className={`glass p-4 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]/40 flex flex-col gap-3 shadow-sm transition-colors ${
                    match.isBye ? 'opacity-40 border-dashed' : ''
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <span>Round {match.round} Matchup</span>
                    {match.isBye && <span className="text-amber-500 font-bold">BYE (IDLE END)</span>}
                  </div>

                  <div className="grid grid-cols-12 items-center gap-3">
                    {/* Archer 1 */}
                    <div className="col-span-5 text-right font-bold text-xs text-slate-300 truncate" title={match.entity1.name}>
                      {match.entity1.name}
                    </div>

                    {/* Scores Inputs */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      {!match.isBye ? (
                        <>
                          <input
                            type="number"
                            value={match.score1 ?? ''}
                            onChange={(e) => updateRoundRobinScore(match.id, e.target.value, String(match.score2 ?? ''))}
                            placeholder="-"
                            className="w-10 bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-md py-1 text-center font-bold text-xs text-white outline-none focus:border-[var(--accent)]"
                          />
                          <span className="text-slate-600 font-black">:</span>
                          <input
                            type="number"
                            value={match.score2 ?? ''}
                            onChange={(e) => updateRoundRobinScore(match.id, String(match.score1 ?? ''), e.target.value)}
                            placeholder="-"
                            className="w-10 bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-md py-1 text-center font-bold text-xs text-white outline-none focus:border-[var(--accent)]"
                          />
                        </>
                      ) : (
                        <span className="text-slate-500 font-bold text-xs">BYE</span>
                      )}
                    </div>

                    {/* Archer 2 */}
                    <div className="col-span-5 text-left font-bold text-xs text-slate-300 truncate" title={match.entity2.name}>
                      {match.entity2.name}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  );
}
