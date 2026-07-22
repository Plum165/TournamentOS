import React from 'react';
import { Target, Trophy, PenTool, BarChart3, Settings, Menu, X } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  appName: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  appName,
  mobileMenuOpen,
  setMobileMenuOpen,
}: SidebarProps) {
  const menuItems = [
    { id: 'setup', name: 'Configure Session', icon: Target },
    { id: 'scoring', name: 'Active Scoring', icon: PenTool },
    { id: 'analytics', name: 'Analytics & Coaching', icon: BarChart3 },
    { id: 'tournament', name: 'Tournaments & Rankings', icon: Trophy },
    { id: 'settings', name: 'Settings & Theme', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden h-16 w-full flex items-center justify-between px-6 border-b border-[var(--slate-700)] bg-[var(--slate-800)] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-[var(--accent)]" />
          <span className="font-bold text-lg text-white">{appName || 'TournamentOS'}</span>
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
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-[var(--accent)]" />
            <span className="text-[var(--accent)] font-extrabold uppercase tracking-wider">
              {appName || 'TournamentOS'}
            </span>
          </h1>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mt-1 opacity-80">
            Archery Scoring Pro
          </p>
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
                    ? 'bg-[var(--accent)] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[var(--slate-700)]/30'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--slate-700)] bg-black/10 text-center">
          <p className="text-[10px] text-slate-500 font-bold">TournamentOS • v2.1</p>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[var(--slate-900)] z-40 md:hidden flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center h-16 px-6 border-b border-[var(--slate-700)]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-[var(--accent)]" />
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
                      ? 'bg-[var(--accent)] text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-[var(--slate-800)]'
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                  <span className="text-base">{item.name}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-6 border-t border-[var(--slate-700)] text-center bg-black/20">
            <p className="text-xs text-white/40 font-medium">TournamentOS Mobile Mode</p>
          </div>
        </div>
      )}
    </>
  );
}
