import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RosterSetup from './components/RosterSetup';
import TargetFace from './components/TargetFace';
import Numpad from './components/Numpad';
import AnalyticsPanel from './components/AnalyticsPanel';
import TournamentPanel from './components/TournamentPanel';
import ThemeSelector, { THEMES } from './components/ThemeSelector';
import BasketballModule from './sports/basketball/BasketballModule';
import HistoryPanel from './components/HistoryPanel';
import { ArcherySession, Shot, End, Archer, TargetType } from './types';
import { 
  Target, HelpCircle, PenTool, Award, Play, ChevronRight, 
  BarChart3, RotateCcw, LayoutGrid, Users, Dribbble, Compass,
  Plus, Shield, Sparkles, Trophy, Settings, Flame, Star, CheckCircle2,
  Trash2, Activity, X
} from 'lucide-react';

// Dynamic HSL Background generator to match active theme hue
function getHSLColorsForTheme(hex: string) {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Convert to HSL
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  const bgH = Math.round(h * 360);
  const bgS = Math.min(Math.round(s * 100), 16); // Limit saturation for a smooth dark visual aesthetic

  return {
    slate900: `hsl(${bgH}, ${bgS}%, 5%)`,   // Deep themed background
    slate800: `hsl(${bgH}, ${bgS}%, 10%)`,  // Container backgrounds
    slate700: `hsl(${bgH}, ${bgS}%, 16%)`   // Border styling
  };
}

export default function App() {
  // Global Routing: 'none' (OS main) | 'archery' | 'basketball'
  const [currentSport, setCurrentSport] = useState<'none' | 'archery' | 'basketball'>('none');
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<string>('dark-emerald');

  // --- CORE ARCHERY STATE ---
  const [activeSession, setActiveSession] = useState<ArcherySession | null>(null);
  const [activeShots, setActiveShots] = useState<Shot[]>([]);
  const [participants, setParticipants] = useState<Archer[]>([]);
  const [targetType, setTargetType] = useState<TargetType>('122cm');
  const [scoringMethod, setScoringMethod] = useState<'target' | 'numpad'>('target');

  // --- CUSTOM SPORT STATES ---
  interface CustomSport {
    id: string;
    name: string;
    color: string;
    icon: 'activity' | 'award' | 'star';
  }
  const [customSports, setCustomSports] = useState<CustomSport[]>([]);
  const [customSportName, setCustomSportName] = useState('');
  const [customSportColor, setCustomSportColor] = useState('#a855f7');
  const [customSportIcon, setCustomSportIcon] = useState<'activity' | 'award' | 'star'>('activity');

  // --- DARTS SETUP OVERLAY STATE ---
  const [dartsModalOpen, setDartsModalOpen] = useState(false);
  const [dartsStartingScore, setDartsStartingScore] = useState<number>(501);
  const [dartsDoubleOut, setDartsDoubleOut] = useState<boolean>(true);
  const [dartsPlayersCount, setDartsPlayersCount] = useState<number>(2);
  const [dartsMatchReady, setDartsMatchReady] = useState(false);

  // Load state on mount
  useEffect(() => {
    // Theme loading
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark-emerald';
    setCurrentTheme(savedTheme);
    applyThemeVariables(savedTheme);

    // Context Sport routing load
    const savedSport = localStorage.getItem('activeSportContext') as 'none' | 'archery' | 'basketball';
    if (savedSport && ['none', 'archery', 'basketball'].includes(savedSport)) {
      setCurrentSport(savedSport);
      const savedView = localStorage.getItem(`activeViewContext_${savedSport}`) || (savedSport === 'none' ? 'dashboard' : 'setup');
      setCurrentView(savedView);
    } else {
      setCurrentSport('none');
      setCurrentView('dashboard');
    }

    // Archery Session loading
    const savedSession = localStorage.getItem('activeArcherySession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setActiveSession(parsed);
        setTargetType(parsed.ends[0]?.shots.length > 0 ? parsed.ends[0].shots[0].targetType || parsed.targetType || '122cm' : '122cm');
      } catch (e) {
        console.error('Failed to parse active session', e);
      }
    }

    // Active Shots in progress
    const savedActiveShots = localStorage.getItem('activeEndShots');
    if (savedActiveShots) {
      try {
        setActiveShots(JSON.parse(savedActiveShots));
      } catch (e) {
        console.error('Failed to parse active shots', e);
      }
    }

    // Participants list
    const savedParticipants = localStorage.getItem('archeryParticipants');
    if (savedParticipants) {
      try {
        setParticipants(JSON.parse(savedParticipants));
      } catch (e) {
        console.error('Failed to parse participants', e);
      }
    }

    // Custom sports load
    const savedCustom = localStorage.getItem('customSportsRegistry');
    if (savedCustom) {
      try {
        setCustomSports(JSON.parse(savedCustom));
      } catch (e) {}
    }
  }, []);

  // Sync state helpers
  const handleSportContextChange = (sport: 'none' | 'archery' | 'basketball') => {
    setCurrentSport(sport);
    localStorage.setItem('activeSportContext', sport);
    const initialView = sport === 'none' ? 'dashboard' : 'setup';
    setCurrentView(initialView);
    localStorage.setItem(`activeViewContext_${sport}`, initialView);
  };

  const handleViewContextChange = (view: string) => {
    setCurrentView(view);
    localStorage.setItem(`activeViewContext_${currentSport}`, view);
  };

  const saveSession = (session: ArcherySession | null) => {
    setActiveSession(session);
    if (session) {
      localStorage.setItem('activeArcherySession', JSON.stringify(session));
    } else {
      localStorage.removeItem('activeArcherySession');
    }
  };

  const saveActiveShots = (shots: Shot[]) => {
    setActiveShots(shots);
    localStorage.setItem('activeEndShots', JSON.stringify(shots));
  };

  const saveParticipants = (list: Archer[]) => {
    setParticipants(list);
    localStorage.setItem('archeryParticipants', JSON.stringify(list));
  };

  const saveSessionToHistory = (sessionToSave: ArcherySession) => {
    try {
      const saved = localStorage.getItem('archerySessionHistory');
      let historyList: ArcherySession[] = [];
      if (saved) {
        historyList = JSON.parse(saved);
      }
      if (!historyList.some((s) => s.id === sessionToSave.id)) {
        const updated = [sessionToSave, ...historyList];
        localStorage.setItem('archerySessionHistory', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save session to history list', e);
    }
  };

  const applyThemeVariables = (themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.style.setProperty('--accent', theme.color);

    // Apply HSL colors matching the main theme accent
    const hsls = getHSLColorsForTheme(theme.color);
    document.documentElement.style.setProperty('--slate-900', hsls.slate900);
    document.documentElement.style.setProperty('--slate-800', hsls.slate800);
    document.documentElement.style.setProperty('--slate-700', hsls.slate700);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    applyThemeVariables(themeId);
    localStorage.setItem('selectedTheme', themeId);
  };

  // --- ARCHERY LOGIC SCORING HANDLERS ---
  const handleStartSession = (config: {
    archerName: string;
    category: string;
    format: ArcherySession['format'];
    targetType: TargetType;
    totalEnds: number;
    arrowsPerEnd: number;
    distances: number[];
  }) => {
    const newSession: ArcherySession = {
      id: `session-${Date.now()}`,
      archerId: `archer-${Date.now()}`,
      archerName: config.archerName,
      format: config.format,
      totalEnds: config.totalEnds,
      arrowsPerEnd: config.arrowsPerEnd,
      currentEndNumber: 1,
      ends: [],
      distances: config.distances,
      date: new Date().toLocaleDateString(),
      targetType: config.targetType,
    };

    saveSession(newSession);
    saveActiveShots([]);
    setTargetType(config.targetType);
    handleViewContextChange('scoring');
  };

  const handleAddShot = (shot: Shot) => {
    const limit = activeSession?.arrowsPerEnd || 3;
    if (activeShots.length >= limit) return;
    const nextShots = [...activeShots, shot];
    saveActiveShots(nextShots);
  };

  const handleRemoveShot = (id: string) => {
    const nextShots = activeShots.filter((s) => s.id !== id);
    saveActiveShots(nextShots);
  };

  const handleUpdateShot = (id: string, updated: Partial<Shot>) => {
    const nextShots = activeShots.map((s) => (s.id === id ? { ...s, ...updated } : s));
    saveActiveShots(nextShots);
  };

  const handleUndoShot = () => {
    if (activeShots.length === 0) return;
    const nextShots = activeShots.slice(0, -1);
    saveActiveShots(nextShots);
  };

  const handleSaveEnd = () => {
    if (!activeSession) return;
    const limit = activeSession.arrowsPerEnd;

    if (activeShots.length < limit) {
      alert(`Please record all ${limit} arrows for this end before saving.`);
      return;
    }

    let distance = activeSession.distances[0] || 60;
    if (activeSession.format === 'outdoor-720') {
      distance = activeSession.currentEndNumber > 6 ? activeSession.distances[1] || 50 : activeSession.distances[0] || 60;
    } else if (activeSession.format === 'outdoor-1440') {
      const idx = Math.min(Math.floor((activeSession.currentEndNumber - 1) / 6), 3);
      distance = activeSession.distances[idx] || 30;
    } else if (activeSession.format === 'outdoor-disa') {
      const idx = Math.min(Math.floor((activeSession.currentEndNumber - 1) / 4), 3);
      distance = activeSession.distances[idx] || 30;
    }

    const newEnd: End = {
      id: `end-${Date.now()}`,
      endNumber: activeSession.currentEndNumber,
      shots: [...activeShots],
      distance,
    };

    const updatedEnds = [...activeSession.ends, newEnd];
    const nextEndNum = activeSession.currentEndNumber + 1;

    const updatedSession: ArcherySession = {
      ...activeSession,
      ends: updatedEnds,
      currentEndNumber: nextEndNum,
    };

    saveSession(updatedSession);
    saveActiveShots([]);

    if (activeSession.totalEnds > 0 && activeSession.currentEndNumber >= activeSession.totalEnds) {
      const totalScore = updatedEnds.reduce(
        (sum, end) => sum + end.shots.reduce((sSum, s) => sSum + s.value, 0),
        0
      );

      const existsIdx = participants.findIndex((p) => p.name.toLowerCase() === activeSession.archerName.toLowerCase());
      if (existsIdx !== -1) {
        const nextParts = [...participants];
        nextParts[existsIdx].points = Math.max(nextParts[existsIdx].points, totalScore);
        saveParticipants(nextParts);
      } else {
        const newArcher: Archer = {
          id: `archer-auto-${Date.now()}`,
          name: activeSession.archerName,
          category: activeSession.format.includes('indoor') ? 'Recurve' : 'Compound',
          team: 'Club Shooter',
          points: totalScore,
        };
        saveParticipants([...participants, newArcher]);
      }

      // Save complete session data to history
      saveSessionToHistory(updatedSession);

      alert(`Session Completed! Final Aggregate Score: ${totalScore} points. Saved to rankings and history.`);
      saveSession(null);
      saveActiveShots([]);
      handleViewContextChange('history');
    }
  };

  const handleEndSessionEarly = () => {
    if (!activeSession) return;
    if (confirm('Are you sure you want to finalize and save this session to history? Your recorded arrows and ends will be fully archived.')) {
      const totalScore = activeSession.ends.reduce(
        (sum, end) => sum + end.shots.reduce((sSum, s) => sSum + s.value, 0),
        0
      );

      const existsIdx = participants.findIndex((p) => p.name.toLowerCase() === activeSession.archerName.toLowerCase());
      if (totalScore > 0) {
        if (existsIdx !== -1) {
          const nextParts = [...participants];
          nextParts[existsIdx].points = Math.max(nextParts[existsIdx].points, totalScore);
          saveParticipants(nextParts);
        } else {
          const newArcher: Archer = {
            id: `archer-auto-${Date.now()}`,
            name: activeSession.archerName,
            category: activeSession.format.includes('indoor') ? 'Recurve' : 'Compound',
            team: 'Club Practice',
            points: totalScore,
          };
          saveParticipants([...participants, newArcher]);
        }
      }

      // Save whatever session data we have to history
      saveSessionToHistory(activeSession);

      saveSession(null);
      saveActiveShots([]);
      handleViewContextChange('history');
    }
  };

  // --- DATA RESET OS ---
  const handleResetAllData = () => {
    localStorage.clear();
    setActiveSession(null);
    setActiveShots([]);
    setParticipants([]);
    setTargetType('122cm');
    setCustomSports([]);
    setDartsMatchReady(false);
    setCurrentTheme('dark-emerald');
    applyThemeVariables('dark-emerald');
    setCurrentSport('none');
    setCurrentView('dashboard');
    alert('All multi-sport registers and local database profiles have been completely erased.');
  };

  // --- CUSTOM SPORT ACTIONS ---
  const handleCreateCustomSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSportName.trim()) {
      alert('Please enter a name for your custom sport.');
      return;
    }

    const newSport: CustomSport = {
      id: `custom-sport-${Date.now()}`,
      name: customSportName.trim(),
      color: customSportColor,
      icon: customSportIcon
    };

    const updated = [...customSports, newSport];
    setCustomSports(updated);
    localStorage.setItem('customSportsRegistry', JSON.stringify(updated));
    setCustomSportName('');
    alert(`Custom sport template "${newSport.name}" has been successfully initialized!`);
  };

  const handleDeleteCustomSport = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" custom template?`)) {
      const updated = customSports.filter(s => s.id !== id);
      setCustomSports(updated);
      localStorage.setItem('customSportsRegistry', JSON.stringify(updated));
    }
  };

  // Retrieve dynamic statistics
  const aggregateScore = activeSession?.ends.reduce(
    (sum, end) => sum + end.shots.reduce((sSum, s) => sSum + s.value, 0),
    0
  ) || 0;

  const totalArrowsShot = activeSession?.ends.reduce((sum, end) => sum + end.shots.length, 0) || 0;

  // --- RENDER VIEW CONTENT ---
  const renderViewContent = () => {
    // A. ARCHERY MODULE IF ACTIVE
    if (currentSport === 'archery') {
      switch (currentView) {
        case 'setup':
          return <RosterSetup onStartSession={handleStartSession} activeSession={activeSession} />;
        
        case 'scoring':
          if (!activeSession) {
            return (
              <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center max-w-lg mx-auto">
                <PenTool className="w-16 h-16 text-white/20 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Session</h3>
                <p className="text-white/60 text-sm mb-6">
                  Configure an archer profile and choose a division to log active arrow targets.
                </p>
                <button
                  onClick={() => handleViewContextChange('setup')}
                  className="px-6 py-2.5 bg-[var(--accent)] text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 cursor-pointer"
                >
                  Configure Session
                </button>
              </div>
            );
          }

          const isSixArrowEnd = activeSession.arrowsPerEnd === 6;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 w-full max-w-xs mx-auto">
                  <button
                    onClick={() => setScoringMethod('target')}
                    className={`flex-1 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                      scoringMethod === 'target' ? 'bg-white/10 text-[var(--accent)]' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Interactive Target
                  </button>
                  <button
                    onClick={() => setScoringMethod('numpad')}
                    className={`flex-1 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                      scoringMethod === 'numpad' ? 'bg-white/10 text-[var(--accent)]' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Manual Keypad
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Always render target face so user can see arrow coordinates visually */}
                  <TargetFace
                    targetType={targetType}
                    onTargetTypeChange={setTargetType}
                    activeShots={activeShots}
                    onAddShot={handleAddShot}
                    onRemoveShot={handleRemoveShot}
                    onUpdateShot={handleUpdateShot}
                    onUndoShot={handleUndoShot}
                    maxShots={activeSession.arrowsPerEnd}
                    historicalShots={activeSession.ends.flatMap((e) => e.shots)}
                  />

                  {/* Render Numpad keypad below when Manual Keypad is selected */}
                  {scoringMethod === 'numpad' && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                      <Numpad
                        targetType={targetType}
                        activeShots={activeShots}
                        onAddShot={handleAddShot}
                        onUndoShot={handleUndoShot}
                        maxShots={activeSession.arrowsPerEnd}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="glass p-5 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col gap-1 text-center">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">
                    Active Archer: <span className="text-[var(--accent)] font-bold">{activeSession.archerName}</span>
                  </p>
                  <h4 className="text-xl font-black text-white">
                    End {activeSession.currentEndNumber}{' '}
                    {activeSession.totalEnds > 0 ? `/ ${activeSession.totalEnds}` : ' (Practice)'}
                  </h4>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div>
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-wider block">Aggregate</span>
                      <span className="text-3xl font-black text-[var(--accent)]">{aggregateScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-wider block">Arrows Shot</span>
                      <span className="text-3xl font-black text-blue-400">{totalArrowsShot}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex gap-3">
                    <button
                      onClick={handleEndSessionEarly}
                      className="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Finish early
                    </button>
                    <button
                      onClick={handleSaveEnd}
                      disabled={activeShots.length < activeSession.arrowsPerEnd}
                      className="flex-2 py-3 bg-[var(--accent)] disabled:bg-neutral-800 disabled:text-white/20 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 hover:brightness-110 cursor-pointer"
                    >
                      Save End <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="glass rounded-3xl overflow-hidden border border-white/10 flex-1 flex flex-col shadow-xl min-h-[300px]">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-[var(--accent)]" /> Arrow End Log
                    </h4>
                    <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest text-slate-300">
                      {activeSession.format.toUpperCase()}
                    </span>
                  </div>
                  <div className="overflow-y-auto flex-1 p-0">
                    <table className="w-full text-center text-xs">
                      <thead className="bg-black/90 text-white/50 uppercase text-[9px] tracking-wider font-bold sticky top-0 z-10">
                        <tr>
                          <th className="py-3 px-3">End</th>
                          <th>A1</th>
                          <th>A2</th>
                          <th>A3</th>
                          {isSixArrowEnd && (
                            <>
                              <th>A4</th>
                              <th>A5</th>
                              <th>A6</th>
                            </>
                          )}
                          <th className="text-[var(--accent)]">ET</th>
                          <th className="text-blue-400">RT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-semibold text-white/80">
                        {activeSession.ends.length === 0 ? (
                          <tr>
                            <td colSpan={isSixArrowEnd ? 9 : 6} className="py-12 text-center text-slate-500 font-bold">
                              Shoot arrows on target to log scoring sheet.
                            </td>
                          </tr>
                        ) : (
                          activeSession.ends.map((end, idx) => {
                            const endSum = end.shots.reduce((s, arrow) => s + arrow.value, 0);
                            const rtSum = activeSession.ends
                              .slice(0, idx + 1)
                              .reduce((sum, e) => sum + e.shots.reduce((ss, ar) => ss + ar.value, 0), 0);

                            return (
                              <tr key={end.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-3 font-black text-white/40">{end.endNumber}</td>
                                <td>{end.shots[0]?.score || '-'}</td>
                                <td>{end.shots[1]?.score || '-'}</td>
                                <td>{end.shots[2]?.score || '-'}</td>
                                {isSixArrowEnd && (
                                  <>
                                    <td>{end.shots[3]?.score || '-'}</td>
                                    <td>{end.shots[4]?.score || '-'}</td>
                                    <td>{end.shots[5]?.score || '-'}</td>
                                  </>
                                )}
                                <td className="font-black text-[var(--accent)]">{endSum}</td>
                                <td className="font-black text-blue-400">{rtSum}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'analytics':
          if (!activeSession) {
            return (
              <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center max-w-lg mx-auto">
                <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Data</h3>
                <p className="text-white/60 text-sm mb-6">
                  Need arrow shot logs to show dynamic coaching recommendations.
                </p>
                <button
                  onClick={() => handleViewContextChange('setup')}
                  className="px-6 py-2.5 bg-[var(--accent)] text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 cursor-pointer"
                >
                  Configure Session
                </button>
              </div>
            );
          }
          return <AnalyticsPanel session={activeSession} targetType={targetType} />;

        case 'history':
          return <HistoryPanel />;

        case 'tournament':
          return (
            <TournamentPanel
              participants={participants}
              onAddParticipant={(newP) => saveParticipants([...participants, newP])}
              onRemoveParticipant={(id) => saveParticipants(participants.filter((p) => p.id !== id))}
              onImportCSV={(csvList) => saveParticipants([...participants, ...csvList])}
              onClearAll={() => saveParticipants([])}
            />
          );

        case 'settings':
          return (
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              onResetAllData={handleResetAllData}
            />
          );

        default:
          return null;
      }
    }

    // B. BASKETBALL MODULE IF ACTIVE
    if (currentSport === 'basketball') {
      return (
        <BasketballModule
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          onBackToOS={() => handleSportContextChange('none')}
        />
      );
    }

    // C. SYSTEM OS MAIN PORT
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header branding info */}
            <div className="relative glass p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent)]/15 border border-[var(--accent)]/30 rounded-full text-[10px] uppercase tracking-widest text-[var(--accent)] font-black">
                  <Sparkles className="w-3.5 h-3.5" /> Core Operating Engine
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  Welcome to <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">TournamentOS</span>
                </h1>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Manage dual-scoreboard sports, interactive archer ring sheets, brackets, matches and dynamic statistical sheets in one synchronized container.
                </p>
              </div>
            </div>

            {/* Sport modules grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Available Modules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Archery */}
                <div className="glass p-6 rounded-2xl border border-[var(--slate-700)] shadow-lg flex flex-col hover:border-emerald-500/50 transition-all group relative">
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500"></div>
                  <Target className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-105 transition-transform" />
                  <h4 className="text-base font-black text-white mb-1">Archery Scoring Pro</h4>
                  <p className="text-xs text-slate-400 flex-1 mb-6 font-medium leading-relaxed">
                    Interactive SVG target coordinates, manual FITA logs, heatmaps scatter scoring, and draft singles bracket sheets.
                  </p>
                  <button 
                    onClick={() => handleSportContextChange('archery')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                  >
                    Open Module
                  </button>
                </div>

                {/* 2. Basketball */}
                <div className="glass p-6 rounded-2xl border border-[var(--slate-700)] shadow-lg flex flex-col hover:border-orange-500/50 transition-all group relative">
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500"></div>
                  <Dribbble className="w-10 h-10 text-orange-400 mb-4 group-hover:scale-105 transition-transform" />
                  <h4 className="text-base font-black text-white mb-1">Basketball Match scorer</h4>
                  <p className="text-xs text-slate-400 flex-1 mb-6 font-medium leading-relaxed">
                    Custom dual scoring board, active jersey keypad recorder, real-time box score sheets, Berger circle round robins, and single elimination.
                  </p>
                  <button 
                    onClick={() => handleSportContextChange('basketball')}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                  >
                    Open Module
                  </button>
                </div>

                {/* 3. Darts Scorer */}
                <div className="glass p-6 rounded-2xl border border-[var(--slate-700)] shadow-lg flex flex-col hover:border-red-500/50 transition-all group relative">
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500"></div>
                  <Flame className="w-10 h-10 text-red-400 mb-4 group-hover:scale-105 transition-transform" />
                  <h4 className="text-base font-black text-white mb-1">Darts Match Scorer</h4>
                  <p className="text-xs text-slate-400 flex-1 mb-6 font-medium leading-relaxed">
                    Configure leg counts, starting points (301, 501, 701), double-out options, and draft quick play tournament leaderboards.
                  </p>
                  <button 
                    onClick={() => setDartsModalOpen(true)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                  >
                    Configure Darts
                  </button>
                </div>

                {/* Render any Custom Sports */}
                {customSports.map((cs) => (
                  <div 
                    key={cs.id}
                    className="glass p-6 rounded-2xl border shadow-lg flex flex-col group relative"
                    style={{ borderColor: `${cs.color}40` }}
                  >
                    <button
                      onClick={() => handleDeleteCustomSport(cs.id, cs.name)}
                      className="absolute top-4 right-4 text-red-400 hover:bg-red-500/15 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {cs.icon === 'award' ? (
                      <Award className="w-10 h-10 mb-4 group-hover:scale-105 transition-transform" style={{ color: cs.color }} />
                    ) : cs.icon === 'star' ? (
                      <Star className="w-10 h-10 mb-4 group-hover:scale-105 transition-transform" style={{ color: cs.color }} />
                    ) : (
                      <Activity className="w-10 h-10 mb-4 group-hover:scale-105 transition-transform" style={{ color: cs.color }} />
                    )}
                    <h4 className="text-base font-black text-white mb-1 capitalize">{cs.name}</h4>
                    <p className="text-xs text-slate-400 flex-1 mb-6 font-medium leading-relaxed">
                      Custom tournament OS module template branded in gorgeous style accents. Scorer dashboard and rosters available.
                    </p>
                    <button 
                      onClick={() => alert(`Custom template "${cs.name}" is successfully established! Configure roster and matches on the dashboard.`)}
                      className="w-full py-2.5 font-black text-xs uppercase tracking-widest rounded-lg transition-all text-white cursor-pointer"
                      style={{ backgroundColor: cs.color }}
                    >
                      Initialize Arena
                    </button>
                  </div>
                ))}

              </div>
            </div>

            {/* Custom sport creator form on dashboard */}
            <div className="glass p-6 rounded-2xl border border-[var(--slate-700)] shadow-lg space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[var(--accent)]" /> Add Custom Sport Template
              </h4>
              <form onSubmit={handleCreateCustomSport} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">Sport Title</label>
                  <input
                    type="text"
                    placeholder="Volleyball, Soccer, Tennis..."
                    value={customSportName}
                    onChange={(e) => setCustomSportName(e.target.value)}
                    className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="w-full md:w-36">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">Branding Color</label>
                  <input
                    type="color"
                    value={customSportColor}
                    onChange={(e) => setCustomSportColor(e.target.value)}
                    className="w-full h-9 bg-transparent border-0 cursor-pointer rounded outline-none"
                  />
                </div>
                <div className="w-full md:w-44">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">Visual Icon</label>
                  <select
                    value={customSportIcon}
                    onChange={(e) => setCustomSportIcon(e.target.value as 'activity' | 'award' | 'star')}
                    className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="activity">Activity (Pulse)</option>
                    <option value="award">Award (Badge)</option>
                    <option value="star">Star (Favorite)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto px-5 py-2.5 bg-[var(--accent)] text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg hover:brightness-110 cursor-pointer"
                >
                  Deploy Template
                </button>
              </form>
            </div>

            {/* DARTS MODAL DIALOG */}
            {dartsModalOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="glass max-w-md w-full p-6 rounded-2xl border border-[var(--slate-700)] bg-[var(--slate-800)] space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button
                    onClick={() => { setDartsModalOpen(false); setDartsMatchReady(false); }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center">
                    <Flame className="w-10 h-10 text-red-500 mx-auto mb-2 animate-bounce" />
                    <h4 className="text-lg font-black text-white">Darts Scorer Custom Setup</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Configure target points and double leg checkout rules.</p>
                  </div>

                  {!dartsMatchReady ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">Starting Point Ledger</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[301, 501, 701].map((pts) => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => setDartsStartingScore(pts)}
                              className={`py-2 text-xs font-black rounded-lg border transition-colors cursor-pointer ${
                                dartsStartingScore === pts 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                                  : 'bg-[var(--slate-900)] border-[var(--slate-700)] text-slate-400 hover:text-white'
                              }`}
                            >
                              {pts} Points
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[var(--slate-900)] rounded-lg border border-[var(--slate-700)]">
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block">Double Checkout (Double Out)</span>
                          <span className="text-[10px] text-slate-400 font-medium">Must end the game on a double ring.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={dartsDoubleOut}
                          onChange={(e) => setDartsDoubleOut(e.target.checked)}
                          className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">Total Match Players</label>
                        <select
                          value={dartsPlayersCount}
                          onChange={(e) => setDartsPlayersCount(parseInt(e.target.value))}
                          className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value={2}>2 Players (Heads Up)</option>
                          <option value={3}>3 Players (Three Way)</option>
                          <option value={4}>4 Players (Quartet Squad)</option>
                        </select>
                      </div>

                      <button
                        onClick={() => setDartsMatchReady(true)}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                      >
                        Lock Match Configuration
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                        <h5 className="font-black text-xs text-emerald-400">Match Ready to Deploy</h5>
                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                          Darts Arena ({dartsStartingScore} pts, {dartsDoubleOut ? 'Double-Out' : 'Straight-Out'}, {dartsPlayersCount} players) is staged in the local memory frame!
                        </p>
                      </div>

                      <div className="space-y-2">
                        {Array.from({ length: dartsPlayersCount }).map((_, i) => (
                          <div key={i} className="flex justify-between items-center p-2.5 bg-[var(--slate-900)]/80 rounded-lg border border-[var(--slate-700)]">
                            <span className="text-xs font-black text-slate-300">Player {i + 1} Ledger</span>
                            <span className="text-xs font-mono font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/25">
                              {dartsStartingScore}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setDartsMatchReady(false)}
                          className="flex-1 py-2 border border-[var(--slate-700)] hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Adjust Setup
                        </button>
                        <button
                          onClick={() => {
                            alert('Simulating Darts Arena! Matches scored and saved locally.');
                            setDartsModalOpen(false);
                            setDartsMatchReady(false);
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Start Match
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        );

      case 'rankings':
        // Pull actual competitor registers dynamically!
        return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-white">Global Leaderboard</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Unified ELO standings across registered active sport profiles.</p>
            </div>

            <div className="glass p-5 rounded-2xl border border-[var(--slate-700)] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="bg-[var(--slate-900)] text-slate-400 uppercase text-[9px] tracking-widest font-bold border-b border-[var(--slate-700)]">
                    <tr>
                      <th className="py-3 px-4 text-left">Sport Module</th>
                      <th className="py-3 px-4 text-left">Competitor</th>
                      <th className="py-3 px-4">Peak Score / Record</th>
                      <th className="py-3 px-4">Format / Category</th>
                      <th className="py-3 px-4">Team Club</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--slate-700)] font-semibold text-slate-200">
                    {/* Archery entries */}
                    {participants.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 text-left">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                            Archery
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left font-black">{p.name}</td>
                        <td className="py-3.5 px-4 font-black text-emerald-400">{p.points} Pts</td>
                        <td className="py-3.5 px-4 text-slate-400">{p.category}</td>
                        <td className="py-3.5 px-4 text-slate-500">{p.team}</td>
                      </tr>
                    ))}

                    {/* Pre-populated archery if empty to showcase elegance */}
                    {participants.length === 0 && (
                      <>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 text-left">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                              Archery
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-left font-black">Marcus D'Almeida</td>
                          <td className="py-3.5 px-4 font-black text-emerald-400">712 Pts</td>
                          <td className="py-3.5 px-4 text-slate-400">Recurve Open</td>
                          <td className="py-3.5 px-4 text-slate-500">Brazil FITA Elite</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 text-left">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                              Archery
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-left font-black">Lim Sihyeon</td>
                          <td className="py-3.5 px-4 font-black text-emerald-400">708 Pts</td>
                          <td className="py-3.5 px-4 text-slate-400">Recurve Female</td>
                          <td className="py-3.5 px-4 text-slate-500">South Korea National</td>
                        </tr>
                      </>
                    )}

                    {/* Pre-populated basketball if empty */}
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 text-left">
                        <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-black uppercase">
                          Basketball
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left font-black">Lakers Elite</td>
                      <td className="py-3.5 px-4 font-black text-orange-400">12 - 2 Record</td>
                      <td className="py-3.5 px-4 text-slate-400">Western Conference</td>
                      <td className="py-3.5 px-4 text-slate-500">Championship Playoff</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 text-left">
                        <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-black uppercase">
                          Basketball
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left font-black">Celtics Club</td>
                      <td className="py-3.5 px-4 font-black text-orange-400">11 - 3 Record</td>
                      <td className="py-3.5 px-4 text-slate-400">Eastern Conference</td>
                      <td className="py-3.5 px-4 text-slate-500">Championship Playoff</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'players':
        return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-white">Competitors Registry</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Directory roster profile of active registered competitors.</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-[var(--slate-700)] shadow-xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Competitor Directory</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {participants.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center col-span-2 font-bold">No active competitors registered in Archery yet. Configure archers in Archery setup views.</p>
                ) : (
                  participants.map((p) => (
                    <div key={p.id} className="bg-[var(--slate-900)] p-3 rounded-xl border border-[var(--slate-700)] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mb-1.5 inline-block">Archery</span>
                        <h5 className="font-black text-slate-200">{p.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.team} • {p.category}</p>
                      </div>
                      <span className="font-bold text-slate-300">Score: {p.points} Pts</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            onResetAllData={handleResetAllData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full relative bg-[var(--slate-900)] text-[#f1f5f9] overflow-hidden font-sans">
      
      {/* Unified Adaptive Sidebar navigation */}
      <Sidebar
        currentSport={currentSport}
        onSportChange={handleSportContextChange}
        currentView={currentView}
        onViewChange={handleViewContextChange}
        appName="TournamentOS"
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main content body viewport */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Sticky Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--slate-800)] bg-[var(--slate-900)] sticky top-0 z-10 hidden md:flex shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black tracking-widest uppercase text-[var(--accent)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse inline-block"></span>
              {currentSport === 'none' ? 'Multi-Sport Shell' : currentSport === 'archery' ? 'Archery OS Pro' : 'Basketball Arena'}
            </h2>
            <span className="text-slate-600 font-bold">/</span>
            <span className="text-xs font-black uppercase text-slate-300 tracking-wider capitalize">{currentView} workspace</span>
          </div>

          <div className="flex items-center gap-6">
            {currentSport === 'archery' && activeSession && (
              <div className="bg-[var(--slate-800)] border border-[var(--slate-700)] px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping"></span>
                <span className="text-white/60">Archer:</span>
                <span className="text-white font-bold">{activeSession.archerName}</span>
                <span className="text-white/30">|</span>
                <span className="text-white/60">Score:</span>
                <span className="text-[var(--accent)] font-bold">{aggregateScore} Pts</span>
              </div>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-[var(--slate-800)]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-none">Tournament Admin</p>
                <p className="text-[9px] text-[var(--accent)] uppercase tracking-widest mt-1 font-bold">PRO ACCOUNT</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--slate-800)] to-[var(--slate-900)] border border-[var(--slate-700)] flex items-center justify-center font-black text-white text-xs">
                TA
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic viewport renderer */}
        <div className="flex-1 p-6 md:p-8 relative">
          {renderViewContent()}
        </div>

      </main>

    </div>
  );
}
