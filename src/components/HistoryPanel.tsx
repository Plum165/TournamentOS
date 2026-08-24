import React, { useState, useEffect } from 'react';
import { ArcherySession, Shot, End, TargetType } from '../types';
import { TARGET_DEFINITIONS } from '../targetDefinitions';
import { useDialog } from './DialogProvider';
import AnalyticsPanel from './AnalyticsPanel';
import { 
  Clock, Calendar, Download, Trash2, ChevronDown, ChevronUp, 
  Target, Award, FileSpreadsheet, Eye, HelpCircle, ArrowLeftRight
} from 'lucide-react';

interface HistoryPanelProps {
  onSelectSession?: (session: ArcherySession) => void;
}

export default function HistoryPanel({ onSelectSession }: HistoryPanelProps) {
  const { confirm } = useDialog();
  const [history, setHistory] = useState<ArcherySession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('archerySessionHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load archery session history', e);
      }
    }
  };

  const deleteSession = async (id: string, name: string) => {
    const isConfirmed = await confirm(`Are you sure you want to permanently delete the session for "${name}"?`);
    if (isConfirmed) {
      const updated = history.filter((s) => s.id !== id);
      setHistory(updated);
      localStorage.setItem('archerySessionHistory', JSON.stringify(updated));
    }
  };

  const clearAllHistory = async () => {
    const isConfirmed = await confirm('Are you sure you want to permanently clear ALL saved sessions? This cannot be undone.');
    if (isConfirmed) {
      setHistory([]);
      localStorage.removeItem('archerySessionHistory');
    }
  };

  // Helper to convert data to CSV and trigger download (Excel compatible)
  const exportSessionToCSV = (session: ArcherySession) => {
    const arrowsPerEnd = session.arrowsPerEnd || 3;
    const arrowHeaders = Array.from({ length: arrowsPerEnd }, (_, i) => `Arrow ${i + 1}`);

    const headers = [
      'Date', 
      'Archer Name', 
      'Session Format', 
      'Target Type', 
      'End Number', 
      ...arrowHeaders, 
      'End Total', 
      'Distance (m)'
    ];
    const rows: string[][] = [];

    session.ends.forEach((end) => {
      const rowShots = Array.from({ length: arrowsPerEnd }, (_, i) => {
        const shot = end.shots[i];
        return shot ? shot.score : '';
      });
      const endTotal = end.shots.reduce((sum, s) => sum + s.value, 0);

      rows.push([
        session.date,
        session.archerName,
        session.format,
        session.targetType || '122cm',
        end.endNumber.toString(),
        ...rowShots,
        endTotal.toString(),
        end.distance ? `${end.distance}m` : 'N/A'
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    triggerDownload(csvContent, `Archery_Session_${session.archerName.replace(/\s+/g, '_')}_${session.date.replace(/\//g, '-')}.csv`);
  };

  const exportAllHistoryToCSV = () => {
    if (history.length === 0) return;

    // Summary sheet
    const headers = ['Session ID', 'Date', 'Archer Name', 'Format', 'Total Ends', 'Arrows Per End', 'Total Arrows', 'Total Score', 'Average Arrow Value'];
    const rows: string[][] = [];

    history.forEach((session) => {
      const totalScore = session.ends.reduce((sum, e) => sum + e.shots.reduce((s, sh) => s + sh.value, 0), 0);
      const totalArrows = session.ends.reduce((sum, e) => sum + e.shots.length, 0);
      const avgValue = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : '0';

      rows.push([
        session.id,
        session.date,
        session.archerName,
        session.format,
        session.ends.length.toString(),
        session.arrowsPerEnd.toString(),
        totalArrows.toString(),
        totalScore.toString(),
        avgValue
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    triggerDownload(csvContent, `Archery_Global_Standings_Export.csv`);
  };

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSessionPlotPNG = async (session: ArcherySession, defName: string) => {
    const svg = document.getElementById(`svg-history-${session.id}`) as unknown as SVGSVGElement | null;
    if (!svg) {
      alert('Could not find the target SVG element.');
      return;
    }

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      
      const canvas = document.createElement('canvas');
      const size = 1000; // High resolution square
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill a premium dark background matching Slate 900
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, size, size);

      // Convert SVG code into image blob url
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        // Draw target plot in the center of canvas
        ctx.drawImage(img, 50, 50, size - 100, size - 100);
        
        // Brand details at the bottom of the canvas
        ctx.fillStyle = '#10B981'; // Emerald 500
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillText('TOURNAMENTOS | ARCHERY PORT', 50, size - 35);

        ctx.fillStyle = '#64748B'; // Slate 500
        ctx.font = 'bold 16px system-ui, sans-serif';
        const dateString = new Date().toLocaleString();
        const totalArrows = session.ends.flatMap(e => e.shots).length;
        ctx.fillText(`Archer: ${session.archerName} | Target: ${defName} | Total Arrows: ${totalArrows} | Exported: ${dateString}`, 50, 35);

        // Download PNG
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `ArcheryPlot-${session.archerName.replace(/\s+/g, '_')}-${session.id}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (e) {
      console.error('Failed to export history PNG:', e);
      // Fallback: Export SVG
      exportSessionPlotSVG(session);
    }
  };

  const exportSessionPlotSVG = (session: ArcherySession) => {
    const svg = document.getElementById(`svg-history-${session.id}`) as unknown as SVGSVGElement | null;
    if (!svg) return;
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `ArcheryPlot-${session.archerName.replace(/\s+/g, '_')}-${session.id}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export history SVG:', e);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'scorecard' | 'analytics'>('scorecard');

  const toggleExpand = (id: string) => {
    if (expandedSessionId === id) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(id);
      setActiveSubTab('scorecard');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header with quick aggregate actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--slate-800)] p-6 rounded-2xl border border-[var(--slate-700)] shadow-md">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--accent)]" /> 
            <span>Archery Scoring History</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Browse and manage all permanently archived arrow-by-arrow logs.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <button
              onClick={exportAllHistoryToCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export All (Excel)</span>
            </button>
            <button
              onClick={clearAllHistory}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600/15 border border-red-500/20 hover:bg-red-600/25 text-red-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-16 rounded-3xl text-center max-w-lg mx-auto">
          <Clock className="w-16 h-16 text-white/20 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-white mb-2">No Saved Sessions</h3>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Shoot arrows and use the <strong>Complete & Save</strong> button inside the active scoring dashboard to archive results permanently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            
            // Calculate aggregate values
            const totalScore = session.ends.reduce((sum, e) => sum + e.shots.reduce((s, sh) => s + sh.value, 0), 0);
            const totalArrows = session.ends.reduce((sum, e) => sum + e.shots.length, 0);
            const avgArrow = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : '0';
            const targetFaceType = session.targetType || '122cm';
            const def = TARGET_DEFINITIONS[targetFaceType] || TARGET_DEFINITIONS['122cm'];

            // Sort rings to render largest to smallest
            const sortedRings = [...def.rings].sort((a, b) => b.radius - a.radius);
            const allShots = session.ends.flatMap(e => e.shots);

            // Count high rings
            const goldRings = allShots.filter(s => ['X', '10', '9'].includes(s.score)).length;
            const redRings = allShots.filter(s => ['8', '7'].includes(s.score)).length;
            const blueRings = allShots.filter(s => ['6', '5'].includes(s.score)).length;
            const blackRings = allShots.filter(s => ['4', '3'].includes(s.score)).length;
            const missRings = allShots.filter(s => s.score === 'M').length;

            return (
              <div 
                key={session.id} 
                className="glass rounded-2xl border border-[var(--slate-700)] overflow-hidden shadow-lg transition-all"
              >
                {/* Session Summary Bar */}
                <div 
                  onClick={() => toggleExpand(session.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-1 md:mt-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base">{session.archerName}</span>
                        <span className="text-[10px] bg-white/10 text-slate-300 font-bold px-2 py-0.5 rounded-full uppercase">
                          {session.format}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {session.date}
                        </span>
                        <span>•</span>
                        <span>{session.ends.length} Ends ({totalArrows} Arrows)</span>
                        <span>•</span>
                        <span className="text-slate-400 font-bold">{def.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">Aggregate</span>
                      <span className="text-2xl font-black text-emerald-400">{totalScore} <span className="text-xs text-slate-400 font-medium">pts</span></span>
                    </div>
                    <div className="text-left md:text-right hidden sm:block">
                      <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">Avg Arrow</span>
                      <span className="text-2xl font-black text-blue-400">{avgArrow}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Details Container */}
                {isExpanded && (
                  <div className="border-t border-[var(--slate-700)] bg-black/20 p-5 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    
                    {/* Inner Sub-Tabs Selection */}
                    <div className="flex border-b border-[var(--slate-700)] pb-px gap-6">
                      <button
                        onClick={() => setActiveSubTab('scorecard')}
                        className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                          activeSubTab === 'scorecard'
                            ? 'text-[var(--accent)] border-b-2 border-b-[var(--accent)] font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Scorecard & Target Plot
                      </button>
                      <button
                        onClick={() => setActiveSubTab('analytics')}
                        className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                          activeSubTab === 'analytics'
                            ? 'text-[var(--accent)] border-b-2 border-b-[var(--accent)] font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Shot Analytics & Coaching Advice
                      </button>
                    </div>

                    {activeSubTab === 'scorecard' ? (
                      <>
                        {/* Action buttons inside detail */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--slate-800)]/80 p-3.5 rounded-xl border border-white/5">
                          <span className="text-xs font-bold text-slate-300">Detailed scorecard and arrow heatmap breakdown:</span>
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => exportSessionToCSV(session)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>Export Excel (CSV)</span>
                            </button>
                            <button
                              onClick={() => exportSessionPlotPNG(session, def.name)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              <Target className="w-4 h-4" />
                              <span>Export Target Plot (PNG)</span>
                            </button>
                            <button
                              onClick={() => deleteSession(session.id, session.archerName)}
                              className="inline-flex items-center justify-center p-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                              title="Delete Session Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Left & Right layout: Visual coordinate plot + Ring counts */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* SVG coordinate scatter plot on left */}
                          <div className="lg:col-span-5 bg-[var(--slate-900)] border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block self-start">
                              Shot Coordinate Scatter Heatmap
                            </h5>
                            
                            <div className="relative w-full max-w-[260px] aspect-square">
                              <svg
                                id={`svg-history-${session.id}`}
                                viewBox="-220 -220 440 440"
                                className="w-full h-full overflow-visible"
                              >
                                {/* Render Rings */}
                                {sortedRings.map((ring) => (
                                  <circle
                                    key={ring.value}
                                    cx="0"
                                    cy="0"
                                    r={ring.radius}
                                    fill={ring.color}
                                    stroke="#000"
                                    strokeWidth={ring.value === 'X' ? 0.6 : 1.2}
                                  />
                                ))}

                                {/* Ring Scoring Labels (1 to 10) */}
                                {def.rings.map((ring, idx) => {
                                  if (ring.value === 'X') return null; // keep center clean
                                  const prevRadius = idx > 0 ? def.rings[idx - 1].radius : 0;
                                  const mid = (prevRadius + ring.radius) / 2;
                                  
                                  const positions = [
                                    { x: -mid, y: 0 },
                                    { x: mid, y: 0 },
                                    { x: 0, y: -mid },
                                    { x: 0, y: mid }
                                  ];
                                  
                                  return (
                                    <g key={`hist-labels-${ring.value}`} className="opacity-70">
                                      {positions.map((pos, pIdx) => (
                                        <text
                                          key={pIdx}
                                          x={pos.x}
                                          y={pos.y}
                                          fill={ring.textColor || '#1E293B'}
                                          fontSize="6"
                                          fontWeight="900"
                                          textAnchor="middle"
                                          dominantBaseline="central"
                                          className="select-none pointer-events-none font-sans"
                                        >
                                          {ring.value}
                                        </text>
                                      ))}
                                    </g>
                                  );
                                })}

                                {/* Center crosshair */}
                                <line x1="-210" y1="0" x2="210" y2="0" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                                <line x1="0" y1="-210" x2="0" y2="210" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />

                                {/* Render all arrow scatter points */}
                                {allShots.map((shot, shotIdx) => (
                                  <g key={`scatter-${session.id}-${shot.id}`} className="transition-all duration-300">
                                    <circle
                                      cx={shot.x}
                                      cy={shot.y}
                                      r="7"
                                      fill="#10B981"
                                      stroke="#FFFFFF"
                                      strokeWidth="1.5"
                                      className="shadow-sm"
                                    />
                                    <circle cx={shot.x} cy={shot.y} r="1" fill="#fff" />
                                  </g>
                                ))}
                              </svg>
                            </div>
                            <div className="flex flex-col items-center mt-2.5">
                              <span className="text-[9px] font-mono text-slate-500">
                                Plotted {allShots.length} shots recorded during session.
                              </span>
                              <button
                                onClick={() => exportSessionPlotPNG(session, def.name)}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all cursor-pointer"
                              >
                                <Download className="w-3 h-3 text-[var(--accent)]" />
                                <span>Download Image</span>
                              </button>
                            </div>
                          </div>

                          {/* Stats and stats counts on right */}
                          <div className="lg:col-span-7 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Average Arrow</span>
                                <span className="text-xl font-black text-blue-400 mt-0.5 block">{avgArrow}</span>
                              </div>
                              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Gold Hits (9+)</span>
                                <span className="text-xl font-black text-yellow-400 mt-0.5 block">
                                  {goldRings} <span className="text-xs font-normal text-slate-500">({allShots.length > 0 ? Math.round((goldRings/allShots.length)*100) : 0}%)</span>
                                </span>
                              </div>
                              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Red Hits (7-8)</span>
                                <span className="text-xl font-black text-red-400 mt-0.5 block">
                                  {redRings} <span className="text-xs font-normal text-slate-500">({allShots.length > 0 ? Math.round((redRings/allShots.length)*100) : 0}%)</span>
                                </span>
                              </div>
                              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Miss Rate</span>
                                <span className="text-xl font-black text-slate-400 mt-0.5 block">
                                  {missRings} <span className="text-xs font-normal text-slate-500">({allShots.length > 0 ? Math.round((missRings/allShots.length)*100) : 0}%)</span>
                                </span>
                              </div>
                            </div>

                            {/* Detailed Ends Table */}
                            <div className="bg-[var(--slate-900)] border border-white/5 rounded-xl overflow-hidden shadow">
                              <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Arrow-by-Arrow Log Sheet</span>
                                <span className="text-[10px] font-bold text-slate-500">{session.format.toUpperCase()}</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs">
                                  <thead className="bg-black/40 text-white/40 uppercase text-[9px] tracking-wider font-bold">
                                    <tr>
                                      <th className="py-2.5 px-3">End</th>
                                      {Array.from({ length: session.arrowsPerEnd }).map((_, i) => (
                                        <th key={i}>A{i + 1}</th>
                                      ))}
                                      <th className="text-[var(--accent)]">End Score</th>
                                      <th className="text-blue-400">Running</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 font-bold text-slate-300">
                                    {session.ends.map((end, idx) => {
                                      const endSum = end.shots.reduce((s, shot) => s + shot.value, 0);
                                      const runningSum = session.ends
                                        .slice(0, idx + 1)
                                        .reduce((sum, e) => sum + e.shots.reduce((ss, ar) => ss + ar.value, 0), 0);

                                      return (
                                        <tr key={end.id} className="hover:bg-white/5 transition-colors">
                                          <td className="py-2 px-3 font-black text-white/40">{end.endNumber}</td>
                                          {Array.from({ length: session.arrowsPerEnd }).map((_, i) => {
                                            const shot = end.shots[i];
                                            return <td key={i}>{shot ? shot.score : '-'}</td>;
                                          })}
                                          <td className="font-black text-[var(--accent)]">{endSum}</td>
                                          <td className="font-black text-blue-400">{runningSum}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                          </div>

                        </div>
                      </>
                    ) : (
                      <div className="p-2.5 rounded-2xl bg-[var(--slate-900)] border border-[var(--slate-700)]">
                        <AnalyticsPanel session={session} targetType={targetFaceType} />
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
