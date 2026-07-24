import React from 'react';
import { 
  Target, Trophy, PenTool, BarChart3, Settings, Menu, X,
  LayoutGrid, Users, Activity, ArrowLeft, Dribbble, Clock
} from 'lucide-react';

interface SidebarProps {
  currentSport: 'none' | 'archery' | 'basketball';
  onSportChange: (sport: 'none' | 'archery' | 'basketball') => void;
  currentView: string;
  onViewChange: (view: string) => void;
  appName: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({
  currentSport,
  onSportChange,
  currentView,
  onViewChange,
  appName,
  mobileMenuOpen,
  setMobileMenuOpen,
}: SidebarProps) {
  // Get menu items based on current sport context
  const getMenuItems = () => {
    if (currentSport === 'none') {
      return [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid },
        { id: 'rankings', name: 'Global Rankings', icon: BarChart3 },
        { id: 'players', name: 'Competitors', icon: Users },
        { id: 'settings', name: 'OS Settings', icon: Settings },
      ];
    } else if (currentSport === 'archery') {
      return [
        { id: 'setup', name: 'Configure Session', icon: Target },
        { id: 'scoring', name: 'Active Scoring', icon: PenTool },
        { id: 'analytics', name: 'Analytics & Coaching', icon: BarChart3 },
        { id: 'history', name: 'Saved History', icon: Clock },
        { id: 'tournament', name: 'Tournaments & Rankings', icon: Trophy },
        { id: 'settings', name: 'Settings & Theme', icon: Settings },
      ];
    } else {
      // basketball
      return [
        { id: 'setup', name: 'Roster Setup', icon: Users },
        { id: 'scoring', name: 'Active Game', icon: Activity },
        { id: 'tournament', name: 'Tournament', icon: Trophy },
        { id: 'settings', name: 'Settings & Theme', icon: Settings },
      ];
    }
  };

  const menuItems = getMenuItems();

  const getHeaderBranding = () => {
    if (currentSport === 'none') {
      return (
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
            <span>TournamentOS</span>
          </h1>
          <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mt-1 opacity-80">
            Multi-Sport Core
          </p>
        </div>
      );
    } else if (currentSport === 'archery') {
      return (
        <div>
          <h1 className="text-xl font-black text-emerald-400 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span>TournamentOS</span>
          </h1>
          <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mt-1 opacity-80">
            Archery Scoring Pro
          </p>
        </div>
      );
    } else {
      return (
        <div>
          <h1 className="text-xl font-black text-orange-400 flex items-center gap-2">
            <Dribbble className="w-5 h-5 text-orange-400" />
            <span>TournamentOS</span>
          </h1>
          <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mt-1 opacity-80">
            Basketball Module
          </p>
        </div>
      );
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden h-16 w-full flex items-center justify-between px-6 border-b border-[var(--slate-700)] bg-[var(--slate-800)] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          {currentSport === 'basketball' ? (
            <Dribbble className="w-6 h-6 text-[var(--accent)]" />
          ) : (
            <Target className="w-6 h-6 text-[var(--accent)]" />
          )}
          <span className="font-bold text-lg text-white">
            {currentSport === 'none' ? 'TournamentOS' : currentSport === 'archery' ? 'Archery Pro' : 'Basketball'}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white/80 hover:text-white hover:bg-[var(--slate-700)]/50 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-[var(--slate-700)] bg-[var(--slate-800)] h-screen flex flex-col hidden md:flex z-20 sticky top-0">
        <div className="p-6">
          {getHeaderBranding()}
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all font-semibold text-xs text-left group cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-slate-900 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[var(--slate-700)]/30'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {currentSport !== 'none' && (
          <div className="p-4 border-t border-[var(--slate-700)] px-4">
            <button
              onClick={() => onSportChange('none')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit to OS Shell
            </button>
          </div>
        )}

        <div className="p-4 border-t border-[var(--slate-700)] bg-black/10 text-center">
          <p className="text-[10px] text-slate-500 font-bold">TournamentOS • v2.1</p>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[var(--slate-900)] z-40 md:hidden flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center h-16 px-6 border-b border-[var(--slate-700)]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {currentSport === 'basketball' ? (
                <Dribbble className="w-6 h-6 text-[var(--accent)]" />
              ) : (
                <Target className="w-6 h-6 text-[var(--accent)]" />
              )}
              <span>{appName || 'TournamentOS'}</span>
            </h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-[var(--slate-700)]/30 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 p-6 space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent)] text-slate-900 shadow-lg font-black'
                      : 'text-slate-300 hover:text-white hover:bg-[var(--slate-800)]'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span className="text-base">{item.name}</span>
                </button>
              );
            })}

            {currentSport !== 'none' && (
              <button
                onClick={() => {
                  onSportChange('none');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer mt-4 border border-red-500/20"
              >
                <ArrowLeft className="w-6 h-6" />
                <span className="text-base">Exit to OS Shell</span>
              </button>
            )}
          </nav>
          <div className="p-6 border-t border-[var(--slate-700)] text-center bg-black/20">
            <p className="text-xs text-white/40 font-medium">TournamentOS Mobile Mode</p>
          </div>
        </div>
      )}
    </>
  );
}
