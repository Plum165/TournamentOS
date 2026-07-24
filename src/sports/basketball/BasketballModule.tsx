import React, { useState, useEffect } from 'react';
import { useDialog } from '../../components/DialogProvider';
import { 
  Users, Activity, Trophy, Settings, Trash2, Plus, Play, 
  Download, AlertOctagon, ArrowLeft, GitMerge, ListOrdered, 
  LayoutGrid, ClipboardList, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  number: string;
  team: 'A' | 'B';
  pts: number;
  fg2: number;
  fg3: number;
  ft: number;
  fouls: number;
}

interface BasketballModuleProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  onBackToOS: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function BasketballModule({ 
  currentTheme, 
  onThemeChange, 
  onBackToOS,
  currentView,
  onViewChange
}: BasketballModuleProps) {
  const { alert, confirm } = useDialog();
  // Derive subView from currentView prop
  const subView = (
    currentView === 'setup' || 
    currentView === 'scoring' || 
    currentView === 'tournament' || 
    currentView === 'settings'
  ) ? (currentView as 'setup' | 'scoring' | 'tournament' | 'settings') : 'setup';

  const setSubView = (view: 'setup' | 'scoring' | 'tournament' | 'settings') => {
    onViewChange(view);
  };

  // --- STATE ---
  const [roster, setRoster] = useState<Player[]>([]);
  const [teamAName, setTeamAName] = useState<string>('Home Team');
  const [teamBName, setTeamBName] = useState<string>('Away Team');
  
  // Scoring state
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [currentScoringTeam, setCurrentScoringTeam] = useState<'A' | 'B'>('A');

  // Tournament States
  const [tournamentView, setTournamentView] = useState<'menu' | 'roundRobin' | 'bracket'>('menu');
  const [roundRobinTeamCount, setRoundRobinTeamCount] = useState<number>(8);
  const [bracketTeamCount, setBracketTeamCount] = useState<number>(8);

  // Round Robin matches state
  interface RRMatch {
    id: string;
    round: number;
    home: string;
    away: string;
    isBye: boolean;
    homeScore?: string;
    awayScore?: string;
  }
  const [rrMatches, setRrMatches] = useState<RRMatch[]>([]);

  // Bracket matches state
  interface BracketRound {
    label: string;
    matches: {
      id: string;
      team1: string;
      team2: string;
      score1?: string;
      score2?: string;
    }[];
  }
  const [bracketRounds, setBracketRounds] = useState<BracketRound[]>([]);

  // Add player form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState<'A' | 'B'>('A');

  // --- LOAD & SAVE DATA ---
  useEffect(() => {
    const savedRoster = localStorage.getItem('basketballRoster');
    if (savedRoster) {
      try { setRoster(JSON.parse(savedRoster)); } catch(e) {}
    }
    const savedTeamA = localStorage.getItem('teamAName');
    if (savedTeamA) setTeamAName(savedTeamA);
    const savedTeamB = localStorage.getItem('teamBName');
    if (savedTeamB) setTeamBName(savedTeamB);
  }, []);

  const saveRoster = (newRoster: Player[]) => {
    setRoster(newRoster);
    localStorage.setItem('basketballRoster', JSON.stringify(newRoster));
  };

  const handleUpdateTeamAName = (name: string) => {
    setTeamAName(name);
    localStorage.setItem('teamAName', name);
  };

  const handleUpdateTeamBName = (name: string) => {
    setTeamBName(name);
    localStorage.setItem('teamBName', name);
  };

  // --- ACTIONS ---
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newPlayerNumber.trim()) {
      await alert('Please enter both a Player Name and Jersey Number.');
      return;
    }

    const newPlayer: Player = {
      id: `bb-player-${Date.now()}`,
      name: newPlayerName.trim(),
      number: newPlayerNumber.trim(),
      team: newPlayerTeam,
      pts: 0,
      fg2: 0,
      fg3: 0,
      ft: 0,
      fouls: 0
    };

    const updated = [...roster, newPlayer];
    saveRoster(updated);
    setNewPlayerName('');
    setNewPlayerNumber('');
  };

  const handleRemovePlayer = async (id: string) => {
    const isConfirmed = await confirm('Are you sure you want to remove this player?');
    if (isConfirmed) {
      const updated = roster.filter(p => p.id !== id);
      if (activePlayerId === id) setActivePlayerId(null);
      saveRoster(updated);
    }
  };

  const handleAddStat = async (type: '2PT' | '3PT' | 'FT' | 'FOUL') => {
    if (!activePlayerId) return;

    // Use a flag or alert inside a map safely
    let showFouledOutWarning = false;
    let fouledOutPlayerName = '';
    let fouledOutPlayerNumber = '';

    const updated = roster.map(p => {
      if (p.id !== activePlayerId) return p;

      const updatedPlayer = { ...p };
      if (type === '2PT') {
        updatedPlayer.fg2 += 1;
        updatedPlayer.pts += 2;
      } else if (type === '3PT') {
        updatedPlayer.fg3 += 1;
        updatedPlayer.pts += 3;
      } else if (type === 'FT') {
        updatedPlayer.ft += 1;
        updatedPlayer.pts += 1;
      } else if (type === 'FOUL') {
        updatedPlayer.fouls += 1;
        if (updatedPlayer.fouls >= 5) {
          showFouledOutWarning = true;
          fouledOutPlayerName = p.name;
          fouledOutPlayerNumber = p.number;
        }
      }
      return updatedPlayer;
    });

    saveRoster(updated);

    if (showFouledOutWarning) {
      await alert(`WARNING: ${fouledOutPlayerName} (#${fouledOutPlayerNumber}) has reached 5 fouls and fouled out!`);
    }
  };

  const handleResetBasketballData = async () => {
    const isConfirmed = await confirm('Are you sure you want to completely erase the roster and all basketball game stats?');
    if (isConfirmed) {
      saveRoster([]);
      setTeamAName('Home Team');
      setTeamBName('Away Team');
      localStorage.removeItem('basketballRoster');
      localStorage.removeItem('teamAName');
      localStorage.removeItem('teamBName');
      setActivePlayerId(null);
      setRrMatches([]);
      setBracketRounds([]);
      setTournamentView('menu');
      await alert('Basketball data has been purged.');
    }
  };

  // CSV Export for Basketball Box Score
  const handleExportCSV = async () => {
    if (roster.length === 0) {
      await alert('No roster data to export!');
      return;
    }
    let csv = 'Team,Player Name,Jersey #,Total Points (PTS),2-Pointers (FG),3-Pointers (3PT),Free Throws (FT),Fouls\n';
    roster.forEach(p => {
      const tName = p.team === 'A' ? teamAName : teamBName;
      csv += `"${tName}","${p.name}",${p.number},${p.pts},${p.fg2},${p.fg3},${p.ft},${p.fouls}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Basketball_BoxScore.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CALCULATE DYNAMIC TEAM SCORES ---
  const teamAScore = roster.filter(p => p.team === 'A').reduce((sum, p) => sum + p.pts, 0);
  const teamBScore = roster.filter(p => p.team === 'B').reduce((sum, p) => sum + p.pts, 0);

  // --- ROUND ROBIN GENERATOR (Berger System Circle Rotation) ---
  const handleGenerateRoundRobin = async () => {
    if (roundRobinTeamCount < 3) {
      await alert('Please enter at least 3 teams.');
      return;
    }

    const teams: string[] = [];
    for (let i = 1; i <= roundRobinTeamCount; i++) {
      teams.push(`Team ${i}`);
    }

    // Add BYE if odd
    if (teams.length % 2 !== 0) {
      teams.push('BYE');
    }

    const totalRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;
    const generated: RRMatch[] = [];

    const rotation = [...teams];

    for (let round = 1; round <= totalRounds; round++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const home = rotation[m];
        const away = rotation[rotation.length - 1 - m];
        const isBye = home === 'BYE' || away === 'BYE';

        generated.push({
          id: `rr-${round}-${m}`,
          round,
          home: home === 'BYE' ? away : home,
          away: home === 'BYE' ? 'BYE' : away,
          isBye,
        });
      }
      // Circle rotation
      rotation.splice(1, 0, rotation.pop()!);
    }

    setRrMatches(generated);
  };

  // --- ELIMINATION BRACKET GENERATOR ---
  const handleGenerateBracket = async () => {
    if (bracketTeamCount < 2) {
      await alert('Please enter at least 2 teams.');
      return;
    }

    // Next power of 2
    let power = 1;
    while (power < bracketTeamCount) power *= 2;

    const roundsCount = Math.log2(power);
    const generatedRounds: BracketRound[] = [];

    const roundNames = ['Finals', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64'];

    for (let r = 0; r < roundsCount; r++) {
      const matchesInRound = power / Math.pow(2, r + 1);
      const label = (roundsCount - 1 - r) < roundNames.length ? roundNames[roundsCount - 1 - r] : `Round ${r + 1}`;
      
      const matches = [];
      for (let m = 0; m < matchesInRound; m++) {
        matches.push({
          id: `bm-${r}-${m}`,
          team1: r === 0 ? `Team ${m * 2 + 1}` : '',
          team2: r === 0 && (m * 2 + 2 <= bracketTeamCount) ? `Team ${m * 2 + 2}` : (r === 0 ? 'BYE' : ''),
          score1: '',
          score2: ''
        });
      }

      generatedRounds.push({
        label,
        matches
      });
    }

    setBracketRounds(generatedRounds);
  };

  const handleUpdateRRScore = (matchId: string, isHome: boolean, val: string) => {
    setRrMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      return isHome ? { ...m, homeScore: val } : { ...m, awayScore: val };
    }));
  };

  const handleUpdateRRTeamName = (matchId: string, isHome: boolean, val: string) => {
    setRrMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      return isHome ? { ...m, home: val } : { ...m, away: val };
    }));
  };

  const handleUpdateBracketTeam = (roundIdx: number, matchIdx: number, isTeam1: boolean, val: string) => {
    setBracketRounds(prev => prev.map((round, rI) => {
      if (rI !== roundIdx) return round;
      const updatedMatches = round.matches.map((match, mI) => {
        if (mI !== matchIdx) return match;
        return isTeam1 ? { ...match, team1: val } : { ...match, team2: val };
      });
      return { ...round, matches: updatedMatches };
    }));
  };

  const handleUpdateBracketScore = (roundIdx: number, matchIdx: number, isTeam1: boolean, val: string) => {
    setBracketRounds(prev => {
      const nextRounds = [...prev];
      const match = nextRounds[roundIdx].matches[matchIdx];
      if (isTeam1) match.score1 = val;
      else match.score2 = val;

      // Auto-advance winner to next round if scores are filled and valid
      const s1 = parseInt(match.score1 || '');
      const s2 = parseInt(match.score2 || '');
      if (!isNaN(s1) && !isNaN(s2) && s1 !== s2) {
        const winner = s1 > s2 ? match.team1 : match.team2;
        const nextRoundIdx = roundIdx + 1;
        if (nextRoundIdx < nextRounds.length) {
          const nextMatchIdx = Math.floor(matchIdx / 2);
          const isSlot1 = matchIdx % 2 === 0;
          const nextMatch = nextRounds[nextRoundIdx].matches[nextMatchIdx];
          if (isSlot1) {
            nextMatch.team1 = winner;
          } else {
            nextMatch.team2 = winner;
          }
        }
      }
      return nextRounds;
    });
  };

  // Filter roster for teams
  const teamAPlayers = roster.filter(p => p.team === 'A');
  const teamBPlayers = roster.filter(p => p.team === 'B');
  const activeScoringPlayers = currentScoringTeam === 'A' ? teamAPlayers : teamBPlayers;
  const activeSelectedPlayer = roster.find(p => p.id === activePlayerId);

  return (
    <div className="w-full text-slate-100 p-6 md:p-8">

        {/* 1. ROSTER SETUP */}
        {subView === 'setup' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl font-black text-white">Build Matchup</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Configure competing teams and draft player rosters.</p>
            </div>

            {/* Team names inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-5 rounded-xl border-t-4 border-t-blue-500 shadow-lg">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1.5 block">Team A (Home) Name</label>
                <input 
                  type="text" 
                  value={teamAName} 
                  onChange={(e) => handleUpdateTeamAName(e.target.value)}
                  className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 font-bold text-base text-white"
                />
              </div>

              <div className="glass p-5 rounded-xl border-t-4 border-t-red-500 shadow-lg">
                <label className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1.5 block">Team B (Away) Name</label>
                <input 
                  type="text" 
                  value={teamBName} 
                  onChange={(e) => handleUpdateTeamBName(e.target.value)}
                  className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-4 py-2.5 outline-none focus:border-red-500 font-bold text-base text-white"
                />
              </div>
            </div>

            {/* Add player form */}
            <div className="glass p-5 rounded-xl shadow-lg border border-[var(--slate-700)]">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Add Player to Roster</h4>
              <form onSubmit={handleAddPlayer} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Player Full Name</label>
                  <input
                    type="text"
                    placeholder="Michael Jordan"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Jersey #</label>
                  <input
                    type="text"
                    placeholder="23"
                    value={newPlayerNumber}
                    onChange={(e) => setNewPlayerNumber(e.target.value)}
                    className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2.5 text-xs text-white text-center outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Assign Team</label>
                  <select
                    value={newPlayerTeam}
                    onChange={(e) => setNewPlayerTeam(e.target.value as 'A' | 'B')}
                    className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="A">{teamAName}</option>
                    <option value="B">{teamBName}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Player
                </button>
              </form>
            </div>

            {/* Current Roster Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A Roster */}
              <div className="glass p-5 rounded-xl border border-[var(--slate-700)]">
                <h4 className="font-black text-xs text-blue-400 border-b border-[var(--slate-700)] pb-2 uppercase tracking-wider mb-3">
                  {teamAName} Roster ({teamAPlayers.length} Players)
                </h4>
                {teamAPlayers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 font-semibold text-center">No players registered on this roster.</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {teamAPlayers.map(p => (
                      <div key={p.id} className="bg-[var(--slate-900)]/60 p-2.5 rounded-lg border border-[var(--slate-700)] flex items-center justify-between group text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-blue-400 w-8">#{p.number}</span>
                          <span className="font-bold text-slate-200">{p.name}</span>
                        </div>
                        <button 
                          onClick={() => handleRemovePlayer(p.id)}
                          className="text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 p-1 rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Team B Roster */}
              <div className="glass p-5 rounded-xl border border-[var(--slate-700)]">
                <h4 className="font-black text-xs text-red-400 border-b border-[var(--slate-700)] pb-2 uppercase tracking-wider mb-3">
                  {teamBName} Roster ({teamBPlayers.length} Players)
                </h4>
                {teamBPlayers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 font-semibold text-center">No players registered on this roster.</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {teamBPlayers.map(p => (
                      <div key={p.id} className="bg-[var(--slate-900)]/60 p-2.5 rounded-lg border border-[var(--slate-700)] flex items-center justify-between group text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-red-400 w-8">#{p.number}</span>
                          <span className="font-bold text-slate-200">{p.name}</span>
                        </div>
                        <button 
                          onClick={() => handleRemovePlayer(p.id)}
                          className="text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 p-1 rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 text-center">
              <button
                onClick={() => setSubView('scoring')}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black rounded-lg transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 mx-auto text-xs uppercase tracking-widest cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Enter Match Scoring
              </button>
            </div>
          </div>
        )}

        {/* 2. MATCH SCORING */}
        {subView === 'scoring' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Player selection & Keys */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Scoreboard block */}
                <div className="glass p-5 rounded-xl text-center shadow-xl flex justify-between items-center border border-[var(--slate-700)]">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 truncate">{teamAName}</h3>
                    <div className="text-4xl font-black text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.2)]">{teamAScore}</div>
                  </div>
                  <div className="px-3 text-xl font-black text-slate-600">-</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 truncate">{teamBName}</h3>
                    <div className="text-4xl font-black text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.2)]">{teamBScore}</div>
                  </div>
                </div>

                {/* Scored Team toggler */}
                <div className="flex p-1.5 bg-[var(--slate-900)] rounded-xl border border-[var(--slate-700)]">
                  <button
                    onClick={() => { setCurrentScoringTeam('A'); setActivePlayerId(null); }}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      currentScoringTeam === 'A' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Scoring {teamAName}
                  </button>
                  <button
                    onClick={() => { setCurrentScoringTeam('B'); setActivePlayerId(null); }}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      currentScoringTeam === 'B' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Scoring {teamBName}
                  </button>
                </div>

                {/* Player Selection Grid */}
                <div className="glass p-5 rounded-xl shadow-lg border border-[var(--slate-700)]">
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-black flex items-center justify-between">
                    <span>1. Select Player</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                      currentScoringTeam === 'A' ? 'bg-blue-500/15 text-blue-300' : 'bg-red-500/15 text-red-300'
                    }`}>
                      {currentScoringTeam === 'A' ? teamAName : teamBName}
                    </span>
                  </h4>

                  {activeScoringPlayers.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-500 font-semibold mb-2">No players found on this team.</p>
                      <button 
                        onClick={() => setSubView('setup')}
                        className="px-3 py-1 bg-[var(--slate-700)] hover:bg-white/10 rounded text-[10px] font-black uppercase text-slate-300 cursor-pointer"
                      >
                        Register Roster
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[190px] overflow-y-auto pr-1">
                      {activeScoringPlayers.map(p => {
                        const isActive = p.id === activePlayerId;
                        const hasFouledOut = p.fouls >= 5;
                        const borderActive = isActive 
                          ? (currentScoringTeam === 'A' ? 'border-blue-500 bg-blue-500/10' : 'border-red-500 bg-red-500/10')
                          : 'border-[var(--slate-700)] bg-[var(--slate-900)]/40 hover:bg-[var(--slate-700)]/30';

                        return (
                          <div
                            key={p.id}
                            onClick={() => !hasFouledOut && setActivePlayerId(p.id)}
                            className={`cursor-pointer transition-all border-2 p-2.5 rounded-lg flex flex-col items-center justify-center text-center gap-0.5 ${borderActive} ${
                              hasFouledOut ? 'opacity-40 border-red-500/20 bg-red-500/5 cursor-not-allowed' : ''
                            }`}
                          >
                            <span className={`text-base font-black ${isActive ? 'text-white' : 'text-slate-400'}`}>#{p.number}</span>
                            <span className="text-[10px] font-bold truncate w-full text-slate-300">{p.name}</span>
                            {hasFouledOut && (
                              <span className="text-[8px] text-red-500 font-black uppercase mt-0.5 tracking-tight">Fouled Out</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Score Input Keys */}
                <div className="glass p-5 rounded-xl shadow-lg border border-[var(--slate-700)] relative overflow-hidden">
                  {!activePlayerId && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center border border-[var(--slate-700)] rounded-xl">
                      <HelpCircle className="w-6 h-6 text-orange-400 mb-1.5 animate-bounce" />
                      <p className="font-black text-[10px] text-slate-300 uppercase tracking-wider">Select a player above first</p>
                    </div>
                  )}

                  <h4 className="text-[10px] uppercase tracking-widest text-slate-400 mb-4 font-black flex justify-between">
                    <span>2. Record Stat Action</span>
                    <span className="text-orange-400 font-black">
                      {activeSelectedPlayer ? `#${activeSelectedPlayer.number} ${activeSelectedPlayer.name}` : ''}
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={() => handleAddStat('2PT')}
                      className="py-3 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      +2 Score (FG)
                    </button>
                    <button
                      onClick={() => handleAddStat('3PT')}
                      className="py-3 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      +3 Score (3PM)
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddStat('FT')}
                      className="py-3 rounded-lg bg-slate-100/10 text-white border border-white/20 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      +1 Free Throw
                    </button>
                    <button
                      onClick={() => handleAddStat('FOUL')}
                      className="py-3 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition-colors text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <AlertOctagon className="w-4 h-4" /> Foul Record
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Match Box Score */}
              <div className="lg:col-span-7 flex flex-col h-full">
                <div className="glass rounded-xl overflow-hidden flex-1 flex flex-col shadow-xl border border-[var(--slate-700)]">
                  <div className="p-4 border-b border-[var(--slate-700)] bg-white/5 flex justify-between items-center">
                    <h4 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-white">
                      <ClipboardList className="w-4 h-4 text-[var(--accent)]" /> Live Match Box Score
                    </h4>
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 rounded bg-[var(--slate-700)] hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto overflow-y-auto max-h-[440px] flex-1">
                    <table className="w-full text-center text-xs">
                      <thead className="bg-[var(--slate-900)] text-slate-400 uppercase text-[9px] tracking-widest font-bold sticky top-0 z-10 border-b border-[var(--slate-700)]">
                        <tr>
                          <th className="py-3 px-4 text-left">Player</th>
                          <th>PTS</th>
                          <th>2PM</th>
                          <th>3PM</th>
                          <th>FTM</th>
                          <th className="text-red-400">Fouls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--slate-700)]">
                        {/* Team A stats */}
                        {teamAPlayers.length > 0 && (
                          <>
                            <tr className="bg-blue-500/5 text-blue-400 text-left">
                              <td colSpan={6} className="py-1.5 px-4 font-black text-[9px] uppercase tracking-widest">
                                {teamAName} (Home)
                              </td>
                            </tr>
                            {teamAPlayers.map(p => (
                              <tr key={p.id} className={`hover:bg-white/5 transition-colors ${p.id === activePlayerId ? 'bg-blue-500/10' : ''}`}>
                                <td className="py-2.5 px-4 text-left font-bold text-slate-200">
                                  <span className="opacity-40 mr-2">#{p.number}</span>{p.name}
                                </td>
                                <td className="text-blue-400 font-bold text-sm">{p.pts}</td>
                                <td className="text-slate-400">{p.fg2}</td>
                                <td className="text-slate-400">{p.fg3}</td>
                                <td className="text-slate-400">{p.ft}</td>
                                <td className={`font-bold ${p.fouls >= 5 ? 'text-red-500' : 'text-slate-400'}`}>{p.fouls}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* Team B stats */}
                        {teamBPlayers.length > 0 && (
                          <>
                            <tr className="bg-red-500/5 text-red-400 text-left">
                              <td colSpan={6} className="py-1.5 px-4 font-black text-[9px] uppercase tracking-widest">
                                {teamBName} (Away)
                              </td>
                            </tr>
                            {teamBPlayers.map(p => (
                              <tr key={p.id} className={`hover:bg-white/5 transition-colors ${p.id === activePlayerId ? 'bg-red-500/10' : ''}`}>
                                <td className="py-2.5 px-4 text-left font-bold text-slate-200">
                                  <span className="opacity-40 mr-2">#{p.number}</span>{p.name}
                                </td>
                                <td className="text-red-400 font-bold text-sm">{p.pts}</td>
                                <td className="text-slate-400">{p.fg2}</td>
                                <td className="text-slate-400">{p.fg3}</td>
                                <td className="text-slate-400">{p.ft}</td>
                                <td className={`font-bold ${p.fouls >= 5 ? 'text-red-500' : 'text-slate-400'}`}>{p.fouls}</td>
                              </tr>
                            ))}
                          </>
                        )}

                        {roster.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500">
                              No players loaded. Add players in Roster Setup to view box score sheets.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. TOURNAMENT BUILDERS */}
        {subView === 'tournament' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
            
            {/* TOURNAMENT MAIN SELECTION MENU */}
            {tournamentView === 'menu' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-white">Tournament Formats</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Structure championship brackets and round-robin leagues.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Round Robin Card */}
                  <div 
                    onClick={() => { setTournamentView('roundRobin'); handleGenerateRoundRobin(); }}
                    className="glass p-6 rounded-xl border border-[var(--slate-700)] shadow-lg flex flex-col hover:border-orange-500/50 transition-all cursor-pointer group"
                  >
                    <ListOrdered className="w-10 h-10 text-orange-400 mb-4 group-hover:scale-105 transition-transform" />
                    <h4 className="text-base font-black mb-1 text-white">Round Robin League</h4>
                    <p className="text-xs text-slate-400 flex-1 mb-6 font-medium">Berger Circle rotation system. Generates complete schedules. Odd teams automatically get BYEs.</p>
                    <button className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer">
                      Build Schedule
                    </button>
                  </div>

                  {/* Pool Play Card */}
                  <div className="glass p-6 rounded-xl border border-[var(--slate-700)] opacity-60 flex flex-col">
                    <LayoutGrid className="w-10 h-10 text-blue-400 mb-4" />
                    <h4 className="text-base font-black mb-1 text-white">Pool Play / Group Stage</h4>
                    <p className="text-xs text-slate-500 flex-1 mb-6 font-medium">Split competitors into groups for group stage qualifier rounds before entering knockout brackets.</p>
                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider block">Coming Soon</span>
                  </div>

                  {/* Elimination Bracket Card */}
                  <div 
                    onClick={() => { setTournamentView('bracket'); handleGenerateBracket(); }}
                    className="glass p-6 rounded-xl border border-[var(--slate-700)] shadow-lg flex flex-col hover:border-emerald-500/50 transition-all cursor-pointer group"
                  >
                    <GitMerge className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-105 transition-transform" />
                    <h4 className="text-base font-black mb-1 text-white">Elimination Bracket</h4>
                    <p className="text-xs text-slate-400 flex-1 mb-6 font-medium">Single elimination championship. Custom sizing matches power-of-two brackets cleanly.</p>
                    <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer">
                      Build Bracket
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ROUND ROBIN BUILDER WORKSPACE */}
            {tournamentView === 'roundRobin' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-3.5 rounded-xl shadow-md border border-[var(--slate-700)]">
                  <button
                    onClick={() => setTournamentView('menu')}
                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Formats
                  </button>
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Number of Teams:</label>
                    <input
                      type="number"
                      min={3}
                      max={32}
                      value={roundRobinTeamCount}
                      onChange={(e) => setRoundRobinTeamCount(Math.max(3, parseInt(e.target.value) || 3))}
                      className="bg-[var(--slate-900)] border border-[var(--slate-700)] rounded px-2 py-1 w-16 text-center text-xs font-bold outline-none focus:border-[var(--accent)] text-white"
                    />
                    <button
                      onClick={handleGenerateRoundRobin}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-slate-900 text-xs font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="glass p-5 rounded-xl border border-[var(--slate-700)] overflow-x-auto scrollbar-thin">
                  {rrMatches.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12">Enter team size and click Generate Rounds.</p>
                  ) : (
                    <div className="flex gap-6 min-w-max pb-3">
                      {Array.from(new Set(rrMatches.map(m => m.round))).sort((a: any, b: any) => Number(a) - Number(b)).map(round => {
                        const roundMatches = rrMatches.filter(m => m.round === round);
                        return (
                          <div key={round} className="w-[280px] shrink-0 bg-[var(--slate-900)]/60 border border-[var(--slate-700)] p-4 rounded-xl flex flex-col gap-3">
                            <h4 className="text-center font-black text-orange-400 uppercase tracking-widest text-xs border-b border-[var(--slate-700)] pb-1.5">Round {round}</h4>
                            <div className="space-y-2.5">
                              {roundMatches.map(match => (
                                <div key={match.id} className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${
                                  match.isBye ? 'bg-slate-950/20 border-dashed border-[var(--slate-700)] opacity-60' : 'bg-slate-950/40 border-[var(--slate-700)]'
                                }`}>
                                  {match.isBye ? (
                                    <p className="text-[10px] text-slate-500 text-center font-bold uppercase">
                                      <span className="text-slate-300 font-black">{match.home}</span> BYE (IDLE)
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-12 items-center gap-1">
                                      <div className="col-span-4 text-right">
                                        <input
                                          value={match.home}
                                          onChange={(e) => handleUpdateRRTeamName(match.id, true, e.target.value)}
                                          className="w-full bg-transparent text-right font-black text-[11px] outline-none text-slate-200 focus:text-orange-400"
                                        />
                                      </div>
                                      
                                      <div className="col-span-4 flex items-center justify-center gap-1">
                                        <input
                                          type="text"
                                          placeholder="-"
                                          value={match.homeScore ?? ''}
                                          onChange={(e) => handleUpdateRRScore(match.id, true, e.target.value)}
                                          className="w-8 bg-[var(--slate-900)] border border-[var(--slate-700)] rounded text-center font-black text-[11px] py-0.5 outline-none text-white focus:border-orange-500"
                                        />
                                        <span className="text-[9px] font-black text-slate-600">:</span>
                                        <input
                                          type="text"
                                          placeholder="-"
                                          value={match.awayScore ?? ''}
                                          onChange={(e) => handleUpdateRRScore(match.id, false, e.target.value)}
                                          className="w-8 bg-[var(--slate-900)] border border-[var(--slate-700)] rounded text-center font-black text-[11px] py-0.5 outline-none text-white focus:border-orange-500"
                                        />
                                      </div>

                                      <div className="col-span-4 text-left">
                                        <input
                                          value={match.away}
                                          onChange={(e) => handleUpdateRRTeamName(match.id, false, e.target.value)}
                                          className="w-full bg-transparent text-left font-black text-[11px] outline-none text-slate-200 focus:text-orange-400"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Group stage complete card */}
                      <div className="w-[200px] shrink-0 border-2 border-dashed border-[var(--slate-700)] bg-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                        <h5 className="font-black text-xs text-slate-200">Stage Complete</h5>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 mb-4">Draft the top qualifiers into playoff single brackets.</p>
                        <button
                          onClick={() => { setTournamentView('bracket'); handleGenerateBracket(); }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded cursor-pointer"
                        >
                          Build Playoff
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KNOCKOUT BRACKET WORKSPACE */}
            {tournamentView === 'bracket' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-3.5 rounded-xl shadow-md border border-[var(--slate-700)]">
                  <button
                    onClick={() => setTournamentView('menu')}
                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Formats
                  </button>
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bracket Size:</label>
                    <input
                      type="number"
                      min={2}
                      max={64}
                      value={bracketTeamCount}
                      onChange={(e) => setBracketTeamCount(Math.max(2, parseInt(e.target.value) || 2))}
                      className="bg-[var(--slate-900)] border border-[var(--slate-700)] rounded px-2 py-1 w-16 text-center text-xs font-bold outline-none focus:border-[var(--accent)] text-white"
                    />
                    <button
                      onClick={handleGenerateBracket}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-xs font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Bracket Tree scroll container */}
                <div className="glass p-5 rounded-xl border border-[var(--slate-700)] overflow-x-auto scrollbar-thin">
                  {bracketRounds.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12">Enter bracket count and click Generate.</p>
                  ) : (
                    <div className="flex gap-16 min-w-max pb-4 items-center">
                      {bracketRounds.map((round, rIdx) => (
                        <div key={rIdx} className="flex flex-col justify-around gap-8 min-h-[420px] w-48 shrink-0 relative">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border-b border-[var(--slate-700)] pb-1.5 text-center">
                            {round.label}
                          </h5>

                          {round.matches.map((match, mIdx) => {
                            const isResolved = match.score1 !== '' && match.score2 !== '' && match.score1 !== match.score2;
                            return (
                              <div
                                key={match.id}
                                className={`p-2 bg-[var(--slate-900)]/60 rounded-lg border flex flex-col gap-1 shadow-md relative ${
                                  isResolved ? 'border-emerald-500/40 shadow-emerald-500/5' : 'border-[var(--slate-700)]'
                                }`}
                              >
                                {/* Team 1 */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <input
                                    value={match.team1}
                                    placeholder="TBD"
                                    onChange={(e) => handleUpdateBracketTeam(rIdx, mIdx, true, e.target.value)}
                                    className="bg-transparent text-slate-200 outline-none font-bold text-[10px] truncate w-24 focus:text-[var(--accent)]"
                                  />
                                  <input
                                    type="text"
                                    value={match.score1 ?? ''}
                                    placeholder="Sc"
                                    onChange={(e) => handleUpdateBracketScore(rIdx, mIdx, true, e.target.value)}
                                    className="w-8 bg-[var(--slate-800)] border border-[var(--slate-700)] rounded py-0.5 text-center text-[10px] font-black text-white outline-none focus:border-[var(--accent)]"
                                  />
                                </div>

                                <div className="h-[1px] bg-[var(--slate-700)] my-0.5"></div>

                                {/* Team 2 */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <input
                                    value={match.team2}
                                    placeholder="TBD"
                                    onChange={(e) => handleUpdateBracketTeam(rIdx, mIdx, false, e.target.value)}
                                    className="bg-transparent text-slate-200 outline-none font-bold text-[10px] truncate w-24 focus:text-[var(--accent)]"
                                  />
                                  <input
                                    type="text"
                                    value={match.score2 ?? ''}
                                    placeholder="Sc"
                                    onChange={(e) => handleUpdateBracketScore(rIdx, mIdx, false, e.target.value)}
                                    className="w-8 bg-[var(--slate-800)] border border-[var(--slate-700)] rounded py-0.5 text-center text-[10px] font-black text-white outline-none focus:border-[var(--accent)]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Final Champion Column */}
                      <div className="flex flex-col justify-center gap-2 min-w-[160px] text-center self-center h-full">
                        <Trophy className="w-8 h-8 text-[var(--accent)] mx-auto animate-bounce mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">CHAMPION</span>
                        
                        {(() => {
                          const lastRound = bracketRounds[bracketRounds.length - 1];
                          const finalMatch = lastRound?.matches[0];
                          let champion = 'Undecided';
                          if (finalMatch) {
                            const s1 = parseInt(finalMatch.score1 || '');
                            const s2 = parseInt(finalMatch.score2 || '');
                            if (!isNaN(s1) && !isNaN(s2) && s1 !== s2) {
                              champion = s1 > s2 ? finalMatch.team1 : finalMatch.team2;
                            }
                          }

                          return (
                            <div className="bg-[var(--slate-900)] p-3 rounded-lg border-2 border-[var(--accent)]/40 shadow-xl max-w-[150px] mx-auto">
                              <span className="text-xs font-black text-[var(--accent)] truncate block" title={champion}>
                                {champion}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 4. SETTINGS */}
        {subView === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl font-black text-white">Settings & Customization</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Configure database registers and color aesthetics.</p>
            </div>

            {/* Interface theme block */}
            <div className="glass p-6 rounded-xl border border-[var(--slate-700)] shadow-lg space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[var(--accent)]" /> Change System Theme
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                This shifts the accent branding color and deep-tints the full background across all sport modules dynamically.
              </p>

              {/* Grid of themes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { id: 'dark-emerald', name: 'Dark Emerald', color: '#10b981' },
                  { id: 'cat-noir', name: 'Cat Noir', color: '#81e733' },
                  { id: 'blood-red', name: 'Blood Red', color: '#dc2626' },
                  { id: 'sapphire-steel', name: 'Sapphire Steel', color: '#5FA8D3' },
                  { id: 'emerald-charcoal', name: 'Emerald Charcoal', color: '#00af88' },
                  { id: 'digital-twilight', name: 'Digital Twilight', color: '#E94560' },
                  { id: 'coral-aqua', name: 'Coral Aqua', color: '#FF6B6B' },
                  { id: 'electric-citrus', name: 'Electric Citrus', color: '#F7B801' },
                  { id: 'artisan-clay', name: 'Artisan Clay', color: '#E07A5F' },
                  { id: 'forest-canopy', name: 'Forest Canopy', color: '#52b788' },
                  { id: 'ocean-depth', name: 'Ocean Depth', color: '#66A5AD' },
                  { id: 'desert-sunset', name: 'Desert Sunset', color: '#E88873' },
                  { id: 'monochrome-focus', name: 'Monochrome', color: '#777777' },
                  { id: 'soft-nordic', name: 'Soft Nordic', color: '#D90429' },
                  { id: 'neutral-peach', name: 'Neutral Peach', color: '#6B5B95' },
                  { id: 'retro-pop', name: 'Retro Pop', color: '#D95F43' },
                  { id: 'cyberpunk-glow', name: 'Cyberpunk Glow', color: '#66FCF1' },
                  { id: 'plum-gold', name: 'Plum Gold', color: '#FDB833' },
                  { id: 'red-blue', name: 'Red & Blue', color: '#ef233c' },
                  { id: 'purple-black', name: 'Purple Black', color: '#9b59b6' },
                  { id: 'spiderman', name: 'Spiderman', color: '#ff0000' },
                  { id: 'emerald-red', name: 'Emerald Red', color: '#ef4444' },
                  { id: 'dark-blue-cyan', name: 'Blue & Cyan', color: '#06b6d4' },
                  { id: 'dark-blue-electric', name: 'Electric Blue', color: '#3b82f6' },
                  { id: 'dark-blue-teal', name: 'Blue & Teal', color: '#14b8a6' },
                  { id: 'dark-blue-indigo', name: 'Indigo Blue', color: '#6366f1' },
                  { id: 'dark-emerald-blue', name: 'Emerald Blue', color: '#0ea5e9' }
                ].map(theme => (
                  <div
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`cursor-pointer p-3.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                      currentTheme === theme.id 
                        ? 'border-white bg-white/10 scale-105 shadow-md' 
                        : 'border-[var(--slate-700)] bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full shadow-lg mb-1.5" style={{ backgroundColor: theme.color }}></div>
                    <span className="text-[10px] font-black text-center text-slate-200 truncate w-full">{theme.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear database zone */}
            <div className="glass p-6 rounded-xl border border-red-500/20 bg-red-500/5 shadow-lg space-y-4">
              <h4 className="font-bold text-sm text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Reset Basketball Registry
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Purge your roster database, team configurations, tournament schedules, and box score aggregates completely.
              </p>
              <button
                onClick={handleResetBasketballData}
                className="px-5 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Clear Basketball Database
              </button>
            </div>

          </div>
        )}



      {/* FLOAT BACK BUTTON FOR CONVENIENCE */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onBackToOS}
          className="flex items-center gap-2 px-4 py-2.5 glass rounded-full shadow-2xl border border-[var(--slate-700)] bg-[var(--slate-900)]/80 hover:bg-[var(--accent)] hover:text-slate-900 hover:border-transparent transition-all cursor-pointer backdrop-blur-md"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Back to OS</span>
          <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

    </div>
  );
}
