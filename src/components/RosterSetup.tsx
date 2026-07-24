import React, { useState } from 'react';
import { ArcherySession, TargetType } from '../types';
import { Home, Sun, BookOpen, ExternalLink, User, Target, ChevronRight, Trophy } from 'lucide-react';
import { useDialog } from './DialogProvider';

interface RosterSetupProps {
  onStartSession: (config: {
    archerName: string;
    category: string;
    format: ArcherySession['format'];
    targetType: TargetType;
    totalEnds: number;
    arrowsPerEnd: number;
    distances: number[];
  }) => void;
  activeSession: ArcherySession | null;
}

export default function RosterSetup({ onStartSession, activeSession }: RosterSetupProps) {
  const { alert } = useDialog();
  const [archerName, setArcherName] = useState('Default Archer');
  const [category, setCategory] = useState('Recurve');
  const [format, setFormat] = useState<ArcherySession['format']>('outdoor-720');
  const [targetType, setTargetType] = useState<TargetType>('122cm');
  const [totalEnds, setTotalEnds] = useState(12); // standard 720 is 12 ends
  const [arrowsPerEnd, setArrowsPerEnd] = useState(6); // 6 arrows

  // Handle format presets
  const applyPreset = (selectedFormat: ArcherySession['format']) => {
    setFormat(selectedFormat);
    if (selectedFormat === 'indoor') {
      setTargetType('indoor-40cm');
      setTotalEnds(10); // standard indoor 30 arrows (10 ends of 3)
      setArrowsPerEnd(3);
    } else if (selectedFormat === 'outdoor-720') {
      setTargetType('122cm');
      setTotalEnds(12); // 72 arrows (12 ends of 6)
      setArrowsPerEnd(6);
    } else if (selectedFormat === 'outdoor-1440') {
      setTargetType('122cm');
      setTotalEnds(24); // 144 arrows (24 ends of 6)
      setArrowsPerEnd(6);
    } else if (selectedFormat === 'outdoor-disa') {
      setTargetType('122cm');
      setTotalEnds(16); // 16 ends of 6 arrows (DISA format)
      setArrowsPerEnd(6);
    } else if (selectedFormat === 'outdoor-practice') {
      setTargetType('122cm');
      setTotalEnds(0); // unlimited
      setArrowsPerEnd(6);
    }
  };

  const handleLaunch = async () => {
    if (!archerName.trim()) {
      await alert('Archer name is required.');
      return;
    }

    let distances: number[] = [60];
    if (format === 'indoor') distances = [18];
    else if (format === 'outdoor-720') distances = [60, 50];
    else if (format === 'outdoor-1440') distances = [90, 70, 50, 30];
    else if (format === 'outdoor-disa') distances = [60, 50, 40, 30];
    else distances = [60]; // default practice

    onStartSession({
      archerName: archerName.trim(),
      category,
      format,
      targetType,
      totalEnds,
      arrowsPerEnd,
      distances,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="text-center">
        <h3 className="text-3xl font-black mb-2 text-white">Configure Archery Session</h3>
        <p className="opacity-60 text-sm">Select your competitor profile, division format, and target face presets to launch.</p>
      </div>

      {/* Profile Section */}
      <div className="glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl space-y-4">
        <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[var(--slate-700)] pb-2.5">
          <User className="w-4 h-4 text-[var(--accent)]" /> 1. Competitor Profile
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Archer Name</label>
            <input
              type="text"
              value={archerName}
              onChange={(e) => setArcherName(e.target.value)}
              className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
              placeholder="Enter shooter profile name..."
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Archer Division</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="Recurve">Recurve Division</option>
              <option value="Compound">Compound Division</option>
              <option value="Barebow">Barebow Division</option>
            </select>
          </div>
        </div>
      </div>

      {/* Format Presets Grid */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-white flex items-center gap-2 px-1">
          <Target className="w-4 h-4 text-[var(--accent)]" /> 2. Shooting Format Preset
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Preset Cards */}
          {[
            { id: 'indoor', name: 'Indoor 18m', icon: Home, desc: '30 arrows, 10 ends' },
            { id: 'outdoor-720', name: 'Outdoor 720', icon: Sun, desc: '72 arrows, 12 ends' },
            { id: 'outdoor-1440', name: '1440 FITA', icon: Trophy, desc: '144 arrows, 24 ends' },
            { id: 'outdoor-disa', name: 'DISA Format', icon: Target, desc: '96 arrows, 4 dist' },
            { id: 'outdoor-practice', name: 'Practice mode', icon: Target, desc: 'Unlimited ends' },
          ].map((preset) => {
            const Icon = preset.icon;
            const isSelected = format === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id as ArcherySession['format'])}
                className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--slate-800)] shadow-lg scale-102'
                    : 'border-[var(--slate-700)] bg-[var(--slate-800)]/30 hover:border-slate-500 hover:bg-[var(--slate-800)]/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg bg-[var(--slate-900)] h-fit ${isSelected ? 'text-[var(--accent)]' : 'text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white block mt-0.5">{preset.name}</span>
                <span className="text-[9px] text-slate-400 font-medium leading-tight block">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Configuration Presets */}
      <div className="glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl space-y-4">
        <h4 className="font-bold text-sm text-white border-b border-[var(--slate-700)] pb-2.5">
          3. Session Specifications
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Target Ring Definition</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as TargetType)}
              className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="122cm">122cm Target Face (Outdoor standard)</option>
              <option value="80cm">80cm Target Face (Short range standard)</option>
              <option value="indoor-40cm">Indoor 40cm Target Face (Rings 10-5)</option>
              <option value="practice">Emerald Practice Target Face</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Total Session Ends</label>
            <input
              type="number"
              value={totalEnds}
              onChange={(e) => setTotalEnds(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
              min="0"
              disabled={format === 'outdoor-practice'}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Arrows Per End</label>
            <select
              value={arrowsPerEnd}
              onChange={(e) => setArrowsPerEnd(parseInt(e.target.value, 10) || 3)}
              className="w-full bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer"
              disabled={format === 'outdoor-practice'}
            >
              <option value="3">3 Arrows (Indoor Preset)</option>
              <option value="6">6 Arrows (Outdoor Preset)</option>
            </select>
          </div>
        </div>

        {activeSession && (
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs font-semibold leading-relaxed">
            Note: Starting a new session will overwrite the active session scoring. You can view or export your active session results first.
          </div>
        )}

        <button
          onClick={handleLaunch}
          className="w-full py-3 bg-[var(--accent)] text-white font-extrabold text-xs uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-98 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          Launch Scoring Engine <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Educational Fact Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="https://www.sanaa.org.za/how-to-score/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 p-4 rounded-xl bg-[var(--slate-800)]/40 border border-[var(--slate-700)] hover:border-slate-500 hover:bg-[var(--slate-800)]/70 transition-all group"
        >
          <div className="p-2 rounded-lg bg-[var(--slate-900)] text-[var(--accent)] group-hover:scale-105 transition-transform">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-sm text-white">Official SANAA Scoring Guide</h5>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-normal">
              Learn the rules of dynamic distance shifts, end sequences, and shoot-off parameters.
            </p>
          </div>
        </a>
        <a
          href="https://www.worldarchery.sport/sport/history"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 p-4 rounded-xl bg-[var(--slate-800)]/40 border border-[var(--slate-700)] hover:border-slate-500 hover:bg-[var(--slate-800)]/70 transition-all group"
        >
          <div className="p-2 rounded-lg bg-[var(--slate-900)] text-blue-400 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-sm text-white">World Archery History & Rules</h5>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-normal">
              Read how archery transitioned from a survival necessity to an elite, highly precise Olympic discipline.
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
