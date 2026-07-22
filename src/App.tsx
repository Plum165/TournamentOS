import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RosterSetup from './components/RosterSetup';
import TargetFace from './components/TargetFace';
import Numpad from './components/Numpad';
import AnalyticsPanel from './components/AnalyticsPanel';
import TournamentPanel from './components/TournamentPanel';
import ThemeSelector, { THEMES } from './components/ThemeSelector';
import { ArcherySession, Shot, End, Archer, TargetType } from './types';
import { Target, HelpCircle, PenTool, Award, Play, ChevronRight, BarChart3, RotateCcw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('setup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<string>('dark-emerald');

  // Core Applet State
  const [activeSession, setActiveSession] = useState<ArcherySession | null>(null);
  const [activeShots, setActiveShots] = useState<Shot[]>([]);
  const [participants, setParticipants] = useState<Archer[]>([]);
  const [targetType, setTargetType] = useState<TargetType>('122cm');
  const [scoringMethod, setScoringMethod] = useState<'target' | 'numpad'>('target');

  // Load state on mount
  useEffect(() => {
    // Theme loading
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark-emerald';
    setCurrentTheme(savedTheme);
    applyThemeVariables(savedTheme);

    // Session loading
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
  }, []);

  // Sync state helpers
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

  const applyThemeVariables = (themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.style.setProperty('--accent', theme.color);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    applyThemeVariables(themeId);
    localStorage.setItem('selectedTheme', themeId);
  };

  // --- CORE SCORING TRIGGER HANDLERS ---
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
    };

    saveSession(newSession);
    saveActiveShots([]);
    setTargetType(config.targetType);
    setCurrentView('scoring');
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

    // Determine current distance based on format
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

    // Check if session is fully complete
    if (activeSession.totalEnds > 0 && activeSession.currentEndNumber >= activeSession.totalEnds) {
      // Add to rankings list automatically
      const totalScore = updatedEnds.reduce(
        (sum, end) => sum + end.shots.reduce((sSum, s) => sSum + s.value, 0),
        0
      );

      // Check if archer already exists in rankings
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

      alert(`Session Completed! Final Aggregate Score: ${totalScore} points. Saved to rankings.`);
      setCurrentView('analytics');
    }
  };

  const handleEndSessionEarly = () => {
    if (!activeSession) return;
    if (confirm('Are you sure you want to end this session? Incomplete progress will be formatted and saved to history.')) {
      const totalScore = activeSession.ends.reduce(
        (sum, end) => sum + end.shots.reduce((sSum, s) => sSum + s.value, 0),
        0
      );

      if (totalScore > 0) {
        const newArcher: Archer = {
          id: `archer-auto-${Date.now()}`,
          name: activeSession.archerName,
          category: activeSession.format.includes('indoor') ? 'Recurve' : 'Compound',
          team: 'Club Practice',
          points: totalScore,
        };
        saveParticipants([...participants, newArcher]);
      }

      saveSession(null);
      saveActiveShots([]);
      setCurrentView('setup');
    }
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setActiveSession(null);
    setActiveShots([]);
    setParticipants([]);
    setTargetType('122cm');
    setCurrentTheme('dark-emerald');
    applyThemeVariables('dark-emerald');
    setCurrentView('setup');
    alert('All local database arrays and configurations have been purged.');
  };

  // Get active session stats
  const aggregateScore = activeSession?.ends.reduce(
    (sum, end) => sum + end.shots.reduce((sSum, s) => sSum + s.value, 0),
    0
  ) || 0;

  const totalArrowsShot = activeSession?.ends.reduce((sum, end) => sum + end.shots.length, 0) || 0;

  // Render main screen view
  const renderViewContent = () => {
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
                You must configure an archer profile and choose a FITA division before scoring arrow values.
              </p>
              <button
                onClick={() => setCurrentView('setup')}
                className="px-6 py-2.5 bg-[var(--accent)] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Go to Setup Panel
              </button>
            </div>
          );
        }

        const isSixArrowEnd = activeSession.arrowsPerEnd === 6;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
            {/* Left Scoring Inputs */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Method toggler */}
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 w-full max-w-xs mx-auto">
                <button
                  onClick={() => setScoringMethod('target')}
                  className={`flex-1 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${
                    scoringMethod === 'target' ? 'bg-white/10 text-[var(--accent)]' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Interactive Target
                </button>
                <button
                  onClick={() => setScoringMethod('numpad')}
                  className={`flex-1 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${
                    scoringMethod === 'numpad' ? 'bg-white/10 text-[var(--accent)]' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Manual Keypad
                </button>
              </div>

              {/* Scoring Views */}
              {scoringMethod === 'target' ? (
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
              ) : (
                <Numpad
                  targetType={targetType}
                  activeShots={activeShots}
                  onAddShot={handleAddShot}
                  onUndoShot={handleUndoShot}
                  maxShots={activeSession.arrowsPerEnd}
                />
              )}
            </div>

            {/* Right End Scoresheets & Stats */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* End Stats Badge */}
              <div className="glass p-5 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col gap-1 text-center">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">
                  Active Archer: <span className="text-[var(--accent)]">{activeSession.archerName}</span>
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

                {/* Next End button */}
                <div className="mt-4 pt-2 flex gap-3">
                  <button
                    onClick={handleEndSessionEarly}
                    className="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Finish Session
                  </button>
                  <button
                    onClick={handleSaveEnd}
                    disabled={activeShots.length < activeSession.arrowsPerEnd}
                    className="flex-2 py-3 bg-[var(--accent)] disabled:bg-neutral-800 disabled:text-white/20 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 hover:brightness-110"
                  >
                    Save End <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* End List Scorecard Table */}
              <div className="glass rounded-3xl overflow-hidden border border-white/10 flex-1 flex flex-col shadow-xl min-h-[300px]">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-[var(--accent)]" /> Arrow End Log
                  </h4>
                  <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
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
                          <td colSpan={isSixArrowEnd ? 9 : 6} className="py-12 text-center text-white/40">
                            Shoot arrows on target to log active scoring.
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
            <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center max-w-lg mx-auto animate-in fade-in duration-300">
              <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-white mb-2">No Active Data</h3>
              <p className="text-white/60 text-sm mb-6">
                You need an active shooting session with arrow scores to populate your real-time coach feedback.
              </p>
              <button
                onClick={() => setCurrentView('setup')}
                className="px-6 py-2.5 bg-[var(--accent)] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Go to Setup Panel
              </button>
            </div>
          );
        }
        return <AnalyticsPanel session={activeSession} targetType={targetType} />;

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
  };

  return (
    <div className="flex h-screen w-full relative bg-[var(--slate-900)] text-[#f1f5f9] overflow-hidden font-sans">
      
      {/* Dynamic persistent sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        appName="TournamentOS"
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Primary Content Viewport */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Desktop sticky topbar header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--slate-800)] bg-[var(--slate-900)] sticky top-0 z-10 hidden md:flex">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black tracking-tight text-white capitalize">{currentView} Panel</h2>
          </div>
          
          <div className="flex items-center gap-6">
            {activeSession && (
              <div className="bg-[var(--slate-800)] border border-[var(--slate-700)] px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping"></span>
                <span className="text-white/60">Archer:</span>
                <span className="text-white font-bold">{activeSession.archerName}</span>
                <span className="text-white/30">|</span>
                <span className="text-white/60">Aggregate:</span>
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

        {/* Content Box */}
        <div className="flex-1 p-6 md:p-8 relative">
          {renderViewContent()}
        </div>
      </main>
    </div>
  );
}
