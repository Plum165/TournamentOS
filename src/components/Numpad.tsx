import React, { useEffect, useState } from 'react';
import { Shot, TargetType } from '../types';
import { TARGET_DEFINITIONS, calculateScoreFromCoords } from '../targetDefinitions';
import { HelpCircle } from 'lucide-react';

interface NumpadProps {
  targetType: TargetType;
  activeShots: Shot[];
  onAddShot: (shot: Shot) => void;
  onUndoShot: () => void;
  onRemoveShot: (id: string) => void;
  maxShots: number;
}

export default function Numpad({
  targetType,
  activeShots,
  onAddShot,
  onUndoShot,
  onRemoveShot,
  maxShots,
}: NumpadProps) {
  const def = TARGET_DEFINITIONS[targetType];
  const [showShortcuts, setShowShortcuts] = useState(true);

  // Helper to generate coordinates within the proper ring zone
  const generateCoordsForScore = (score: string): { x: number; y: number } => {
    // Determine the radial band for this score value
    const rings = def.rings;
    let minRadius = 0;
    let maxRadius = 200;

    const ringIndex = rings.findIndex((r) => r.value === score);
    if (ringIndex !== -1) {
      maxRadius = rings[ringIndex].radius;
      minRadius = ringIndex > 0 ? rings[ringIndex - 1].radius : 0;
    } else if (score === 'M') {
      minRadius = 201;
      maxRadius = 220;
    }

    // Generate random angle and radius within band
    const angle = Math.random() * 2 * Math.PI;
    const radius = minRadius + Math.random() * (maxRadius - minRadius) * 0.75 + (maxRadius - minRadius) * 0.15;

    return {
      x: parseFloat((radius * Math.cos(angle)).toFixed(1)),
      y: parseFloat((radius * Math.sin(angle)).toFixed(1)),
    };
  };

  const handleScoreClick = (score: string) => {
    if (activeShots.length >= maxShots) return;

    const { x, y } = generateCoordsForScore(score);
    
    let value = parseInt(score, 10);
    if (score === 'X') value = 10;
    if (isNaN(value)) value = 0;

    const newShot: Shot = {
      id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      x,
      y,
      score,
      value,
      timestamp: Date.now(),
    };

    onAddShot(newShot);
  };

  // Bind Keyboard keys for super-fast entry!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside form inputs
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'x') {
        handleScoreClick('X');
      } else if (key === '0') {
        // Map 0 to 10
        handleScoreClick('10');
      } else if (key >= '1' && key <= '9') {
        // Only allow digits within the active target limits
        const targetScores = def.rings.map((r) => r.value);
        if (targetScores.includes(key)) {
          handleScoreClick(key);
        }
      } else if (key === 'm') {
        handleScoreClick('M');
      } else if (key === 'backspace' || key === 'u') {
        onUndoShot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeShots, targetType]);

  // Order buttons: X, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, M
  const buttonsToRender = [
    { value: 'X', colorClass: 'bg-[var(--gold)] text-[var(--slate-900)] hover:brightness-110 font-bold' },
    { value: '10', colorClass: 'bg-[var(--gold)] text-[var(--slate-900)] hover:brightness-110 font-bold' },
    { value: '9', colorClass: 'bg-[var(--gold)]/80 text-[var(--slate-900)] hover:brightness-110 font-bold' },
    { value: '8', colorClass: 'bg-[var(--red)] text-white hover:brightness-110 font-bold' },
    { value: '7', colorClass: 'bg-[var(--red)]/85 text-white hover:brightness-110 font-bold' },
    { value: '6', colorClass: 'bg-[var(--blue)] text-white hover:brightness-110 font-bold' },
    { value: '5', colorClass: 'bg-[var(--blue)]/85 text-white hover:brightness-110 font-bold' },
    { value: '4', colorClass: 'bg-[var(--slate-700)] text-white hover:brightness-110' },
    { value: '3', colorClass: 'bg-[var(--slate-700)]/80 text-white hover:brightness-110' },
    { value: '2', colorClass: 'bg-[var(--slate-700)]/60 text-slate-200 hover:brightness-110' },
    { value: '1', colorClass: 'bg-[var(--slate-700)]/40 text-slate-300 hover:brightness-110' },
    { value: 'M', colorClass: 'bg-[#475569] text-white hover:brightness-110 font-bold' },
  ];

  // Filter out buttons not valid on the selected target (e.g. Indoor 40cm doesn't have 1-4)
  const availableValues = def.rings.map((r) => r.value).concat(['M']);
  const activeButtons = buttonsToRender.filter((btn) => availableValues.includes(btn.value));

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Rapid Numpad Layout */}
      <div className="glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
          <span>Manual Input Panel</span>
          <span className="text-[var(--accent)] font-bold text-[10px]">Keyboard Hotkeys Enabled</span>
        </h4>

        <div className="grid grid-cols-3 gap-2">
          {activeButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => handleScoreClick(btn.value)}
              className={`py-3.5 rounded-lg font-bold text-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer border-none ${btn.colorClass}`}
              id={`btn-score-${btn.value}`}
            >
              {btn.value}
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts help badge with close box - hidden on mobile, hover-friendly on desktop */}
      {showShortcuts ? (
        <div className="bg-[var(--slate-800)]/50 rounded-xl p-4 border border-[var(--slate-700)] text-xs text-slate-400 space-y-1.5 font-medium leading-relaxed relative group hidden md:block transition-all animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={() => setShowShortcuts(false)}
            className="absolute top-2.5 right-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer text-sm font-black w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/5"
            title="Hide Shortcuts"
          >
            ×
          </button>
          <p className="font-bold text-white flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--accent)]" /> Keyboard Shortcuts:
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
            <div><span className="text-[var(--accent)] font-bold">X</span> : X Ring</div>
            <div><span className="text-[var(--accent)] font-bold">0</span> : 10 Ring</div>
            <div><span className="text-[var(--accent)] font-bold">1 - 9</span> : 1 to 9 Rings</div>
            <div><span className="text-[var(--accent)] font-bold">M</span> : Miss</div>
            <div className="col-span-2 border-t border-white/5 pt-1 mt-1"><span className="text-[var(--accent)] font-bold">Backspace / U</span> : Undo Last</div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center justify-end">
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-[10px] uppercase font-black tracking-wider text-slate-500 hover:text-[var(--accent)] transition-colors flex items-center gap-1 cursor-pointer bg-white/5 px-2 py-1 rounded-md border border-white/5"
          >
            <HelpCircle className="w-3 h-3" /> Show Shortcuts
          </button>
        </div>
      )}

      {/* Active End Arrows List inside Numpad */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
        <h5 className="text-xs font-black uppercase tracking-wider text-white/40 border-b border-white/10 pb-2 flex items-center justify-between">
          <span>Active End Arrows ({activeShots.length}/{maxShots})</span>
          <span className="text-[var(--accent)] font-bold">Tap keypad/keyboard to record</span>
        </h5>
        
        {activeShots.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4 font-semibold">
            Press the keypad buttons or keyboard numbers to enter arrow scores.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {activeShots.map((shot, idx) => (
              <div
                key={shot.id}
                className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex flex-col items-center justify-center relative group animate-in zoom-in-95 duration-150"
              >
                <span
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 bg-[var(--accent)] shadow-md"
                >
                  {idx + 1}
                </span>
                <span className="text-lg font-black text-white mt-1">{shot.score}</span>
                <span className="text-[9px] text-white/40 font-mono mt-0.5">
                  (Keypad)
                </span>
                <button
                  onClick={() => onRemoveShot(shot.id)}
                  className="absolute top-1 right-1 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-0.5 rounded-md hover:bg-red-500/10 cursor-pointer"
                  title="Delete Arrow"
                >
                  <span className="text-sm font-bold font-sans px-1 select-none">×</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
