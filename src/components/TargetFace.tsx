import React, { useRef, useState, useEffect } from 'react';
import { TARGET_DEFINITIONS, calculateScoreFromCoords } from '../targetDefinitions';
import { Shot, TargetType } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, ArrowLeft, ArrowRight, Play, Delete, Undo, Check, Download } from 'lucide-react';

interface TargetFaceProps {
  targetType: TargetType;
  onTargetTypeChange: (type: TargetType) => void;
  activeShots: Shot[];
  onAddShot: (shot: Shot) => void;
  onRemoveShot: (id: string) => void;
  onUpdateShot: (id: string, updated: Partial<Shot>) => void;
  onUndoShot: () => void;
  maxShots: number;
  archerColor?: string;
  historicalShots?: Shot[]; // Past ends to draw faded markers
}

export default function TargetFace({
  targetType,
  onTargetTypeChange,
  activeShots,
  onAddShot,
  onRemoveShot,
  onUpdateShot,
  onUndoShot,
  maxShots,
  archerColor = '#10B981', // Default emerald
  historicalShots = [],
}: TargetFaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan states
  const [zoomLevel, setZoomLevel] = useState(1); // 1x to 4x
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging shot state
  const [draggedShotId, setDraggedShotId] = useState<string | null>(null);
  const [isDraggingShot, setIsDraggingShot] = useState(false);

  // Temporary hover coordinate display
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; score: string } | null>(null);

  // Playback/Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayShots, setReplayShots] = useState<Shot[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);

  const def = TARGET_DEFINITIONS[targetType];

  // Map client coordinate to target coordinate space (-200 to +200)
  const getTargetCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    try {
      const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    } catch (e) {
      // Fallback
      const rect = svg.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / rect.width) * 440 - 220;
      const rawY = ((clientY - rect.top) / rect.height) * 440 - 220;
      return { x: rawX, y: rawY };
    }
  };

  // Click on target face
  const handleTargetClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // If we're dragging a shot or panning, ignore clicks
    if (isDraggingShot || draggedShotId || isPanning) return;

    // Check if clicked element was a shot marker
    if ((e.target as SVGElement).closest('.shot-marker')) return;

    const coords = getTargetCoords(e.clientX, e.clientY);
    if (!coords) return;

    // Check if within bounds
    const dist = Math.sqrt(coords.x * coords.x + coords.y * coords.y);
    if (dist > 220) return; // Outside target ring boundary + margin

    if (activeShots.length >= maxShots) {
      alert(`Limit reached. Please save this end or undo an arrow.`);
      return;
    }

    const { score, value } = calculateScoreFromCoords(coords.x, coords.y, targetType);

    const newShot: Shot = {
      id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      x: parseFloat(coords.x.toFixed(1)),
      y: parseFloat(coords.y.toFixed(1)),
      score,
      value,
      timestamp: Date.now(),
    };

    onAddShot(newShot);
  };

  // Dragging shot handlers
  const handleShotMouseDown = (shotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedShotId(shotId);
    setIsDraggingShot(true);
  };

  // Mouse Move on target
  const handleTargetMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getTargetCoords(e.clientX, e.clientY);
    if (!coords) return;

    // 1. Drag Shot logic
    if (isDraggingShot && draggedShotId) {
      const { score, value } = calculateScoreFromCoords(coords.x, coords.y, targetType);
      onUpdateShot(draggedShotId, {
        x: parseFloat(coords.x.toFixed(1)),
        y: parseFloat(coords.y.toFixed(1)),
        score,
        value,
      });
      return;
    }

    // 2. Pan logic (only when zoomed)
    if (isPanning && zoomLevel > 1) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset((prev) => ({
        x: prev.x + dx / zoomLevel,
        y: prev.y + dy / zoomLevel,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // 3. Hover coordinate preview
    const dist = Math.sqrt(coords.x * coords.x + coords.y * coords.y);
    if (dist <= 220) {
      const { score } = calculateScoreFromCoords(coords.x, coords.y, targetType);
      setHoverCoord({
        x: parseFloat(coords.x.toFixed(1)),
        y: parseFloat(coords.y.toFixed(1)),
        score,
      });
    } else {
      setHoverCoord(null);
    }
  };

  const handleTargetMouseUp = () => {
    setDraggedShotId(null);
    setIsDraggingShot(false);
    setIsPanning(false);
  };

  // Pan Start (using background click with Shift or on zoomed pan container)
  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1 && (e.shiftKey || e.button === 1)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 }); // Reset pan
      return next;
    });
  };
  const handleZoomReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Shot Replay Animation
  const startReplay = () => {
    if (activeShots.length === 0) return;
    setIsReplaying(true);
    setReplayShots(activeShots);
    setReplayIndex(0);
  };

  useEffect(() => {
    if (!isReplaying) return;
    if (replayIndex >= replayShots.length) {
      const timer = setTimeout(() => setIsReplaying(false), 1500);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setReplayIndex((prev) => prev + 1);
    }, 600); // 600ms between arrows appearing

    return () => clearTimeout(timer);
  }, [isReplaying, replayIndex, replayShots]);

  // Adjust SVG viewBox based on zoom and pan
  // Normal viewBox is -220 -220 440 440
  const boxSize = 440 / zoomLevel;
  const vx = -boxSize / 2 - panOffset.x;
  const vy = -boxSize / 2 - panOffset.y;

  // Render Target Rings (sorted largest radius to smallest to overlay correctly)
  const sortedRings = [...def.rings].sort((a, b) => b.radius - a.radius);

  // Export Target Plot as high-resolution PNG image
  const handleExportPNG = () => {
    const svg = svgRef.current;
    if (!svg) return;

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
        ctx.fillText(`Target: ${def.name} | Active End Arrows: ${activeShots.length} | Exported: ${dateString}`, 50, 35);

        // Download PNG
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `ArcheryPlot-${targetType}-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (e) {
      console.error('Failed to export PNG:', e);
      alert('Could not compile PNG image. Saving vector SVG instead!');
      handleExportSVG();
    }
  };

  const handleExportSVG = () => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `ArcheryPlot-${targetType}-${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export SVG:', e);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full animate-in fade-in duration-300" ref={containerRef}>
      
      {/* Target Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--slate-800)] p-3 rounded-xl border border-[var(--slate-700)] shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400">Target Face:</label>
          <select
            value={targetType}
            onChange={(e) => onTargetTypeChange(e.target.value as TargetType)}
            className="bg-[var(--slate-900)] border border-[var(--slate-700)] rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {Object.values(TARGET_DEFINITIONS).map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5 bg-[var(--slate-900)] rounded-lg p-1 border border-[var(--slate-700)]">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-white px-2 tracking-tighter">
            {zoomLevel.toFixed(1)}x
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 4}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all border-l border-[var(--slate-700)] cursor-pointer"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Replay and Edit Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPNG}
            className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export Target Distribution as PNG"
          >
            <Download className="w-3.5 h-3.5" /> Export Plot
          </button>
          <button
            onClick={startReplay}
            disabled={activeShots.length === 0 || isReplaying}
            className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-blue-600/20 disabled:hover:text-blue-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> Replay End
          </button>
          <button
            onClick={onUndoShot}
            disabled={activeShots.length === 0}
            className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white disabled:opacity-30 disabled:hover:bg-red-600/20 disabled:hover:text-red-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Undo className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      </div>

      {/* Main Interactive Interactive Target Area */}
      <div 
        style={{ background: 'radial-gradient(circle, var(--slate-800) 0%, var(--slate-900) 100%)' }}
        className="relative flex-1 min-h-[380px] md:min-h-[440px] rounded-xl border border-[var(--slate-700)] shadow-2xl flex items-center justify-center p-4 overflow-hidden select-none"
      >
        
        {/* Dynamic target rendering */}
        <svg
          ref={svgRef}
          viewBox={`${vx} ${vy} ${boxSize} ${boxSize}`}
          className={`w-full max-w-[420px] aspect-square overflow-visible touch-none ${
            isPanning ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : 'cursor-crosshair'
          }`}
          onClick={handleTargetClick}
          onMouseMove={handleTargetMouseMove}
          onMouseUp={handleTargetMouseUp}
          onMouseDown={handleBgMouseDown}
        >
          {/* Target Face Rings */}
          {sortedRings.map((ring) => (
            <circle
              key={ring.value}
              cx="0"
              cy="0"
              r={ring.radius}
              fill={ring.color}
              stroke="#000000"
              strokeWidth={ring.value === 'X' ? 0.8 : 1.5}
              className="transition-all duration-300"
            />
          ))}

          {/* Target Face Ring Scoring Labels (1 to 10) */}
          {def.rings.map((ring, idx) => {
            if (ring.value === 'X') return null; // keep center clean
            const prevRadius = idx > 0 ? def.rings[idx - 1].radius : 0;
            const mid = (prevRadius + ring.radius) / 2;
            
            // Draw ring values along left, right, top, and bottom of each zone
            const positions = [
              { x: -mid, y: 0 },
              { x: mid, y: 0 },
              { x: 0, y: -mid },
              { x: 0, y: mid }
            ];
            
            return (
              <g key={`labels-${ring.value}`} className="opacity-80">
                {positions.map((pos, pIdx) => (
                  <text
                    key={pIdx}
                    x={pos.x}
                    y={pos.y}
                    fill={ring.textColor || '#1E293B'}
                    fontSize="7"
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

          {/* Hairlines for targeting reference */}
          <line x1="-210" y1="0" x2="210" y2="0" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
          <line x1="0" y1="-210" x2="0" y2="210" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />

          {/* Historical (Faded) Shots from past ends to build context */}
          {historicalShots.map((shot, idx) => (
            <g key={`hist-${shot.id}`} className="opacity-25 select-none pointer-events-none">
              <circle
                cx={shot.x}
                cy={shot.y}
                r="6.5"
                fill="#475569"
                stroke="#F8FAFC"
                strokeWidth="1"
              />
              <line x1={shot.x - 10} y1={shot.y} x2={shot.x + 10} y2={shot.y} stroke="#fff" strokeWidth="0.5" />
              <line x1={shot.x} y1={shot.y - 10} x2={shot.x} y2={shot.y + 10} stroke="#fff" strokeWidth="0.5" />
            </g>
          ))}

          {/* Active Shots Markers */}
          {(!isReplaying ? activeShots : replayShots.slice(0, replayIndex)).map((shot, index) => (
            <g
              key={shot.id}
              className="shot-marker cursor-grab active:cursor-grabbing transition-transform duration-200"
              onMouseDown={(e) => handleShotMouseDown(shot.id, e)}
            >
              {/* Outer pulsing ring for newly added arrows */}
              {index === activeShots.length - 1 && (
                <circle
                  cx={shot.x}
                  cy={shot.y}
                  r="14"
                  fill="none"
                  stroke={archerColor}
                  strokeWidth="2.5"
                  className="animate-ping"
                  opacity="0.6"
                />
              )}
              {/* Main Arrow Hole */}
              <circle
                cx={shot.x}
                cy={shot.y}
                r="8.5"
                fill={archerColor}
                stroke="#FFFFFF"
                strokeWidth="2"
                shadow-lg="true"
              />
              {/* Inner pointer target */}
              <circle cx={shot.x} cy={shot.y} r="1.5" fill="#FFFFFF" />
              {/* Visual crosshair centered on coordinate */}
              <line x1={shot.x - 12} y1={shot.y} x2={shot.x + 12} y2={shot.y} stroke={archerColor} strokeWidth="1" />
              <line x1={shot.x} y1={shot.y - 12} x2={shot.x} y2={shot.y + 12} stroke={archerColor} strokeWidth="1" />
              {/* Arrow label number */}
              <text
                x={shot.x}
                y={shot.y - 13}
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="black"
                textAnchor="middle"
                className="select-none pointer-events-none drop-shadow-lg filter bg-black"
                style={{ paintOrder: 'stroke', stroke: '#000000', strokeWidth: '2.5px' }}
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Coordinate Floating Badge */}
        {hoverCoord && !isReplaying && (
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs font-black tracking-tight text-white/80 pointer-events-none">
            <span className="text-[var(--accent)] font-black mr-2">ZONE {hoverCoord.score}</span>
            <span>X: {hoverCoord.x} • Y: {hoverCoord.y}</span>
          </div>
        )}

        {/* Zoom Instructions overlay (Shift drag) */}
        {zoomLevel > 1 && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 text-[10px] text-white/50 pointer-events-none uppercase font-bold tracking-widest">
            Hold Shift + Drag to Pan Target
          </div>
        )}

        {/* Replay Overlay */}
        {isReplaying && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-300">
            <span className="text-[var(--accent)] text-lg font-black tracking-widest animate-pulse flex items-center gap-2">
              <Play className="w-5 h-5 fill-current" /> REPLAYING END SHOTS
            </span>
            <p className="text-white/60 text-xs mt-1 font-semibold">
              Showing arrow {Math.min(replayIndex + 1, replayShots.length)} of {replayShots.length}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Legend and List */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
        <h5 className="text-xs font-black uppercase tracking-wider text-white/40 border-b border-white/10 pb-2 flex items-center justify-between">
          <span>Active End Arrows ({activeShots.length}/{maxShots})</span>
          <span className="text-[var(--accent)] font-bold">Drag markers to adjust</span>
        </h5>
        
        {activeShots.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4 font-semibold">
            Click on the target above to record where your arrows landed.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {activeShots.map((shot, idx) => (
              <div
                key={shot.id}
                className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex flex-col items-center justify-center relative group"
              >
                <span
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-black"
                  style={{ backgroundColor: archerColor }}
                >
                  {idx + 1}
                </span>
                <span className="text-lg font-black text-white mt-1">{shot.score}</span>
                <span className="text-[9px] text-white/40 font-mono mt-0.5">
                  ({shot.x}, {shot.y})
                </span>
                <button
                  onClick={() => onRemoveShot(shot.id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-0.5 rounded-md hover:bg-red-500/10"
                  title="Delete Arrow"
                >
                  <Delete className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
