import React, { useState } from 'react';
import { Shot, End, ArcherySession, TargetType } from '../types';
import { TARGET_DEFINITIONS } from '../targetDefinitions';
import { BarChart3, HelpCircle, Flame, ShieldAlert, Award, Compass, Sparkles } from 'lucide-react';

interface AnalyticsPanelProps {
  session: ArcherySession;
  targetType: TargetType;
  pastSessions?: ArcherySession[];
}

export default function AnalyticsPanel({
  session,
  targetType,
  pastSessions = [],
}: AnalyticsPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'coaching' | 'grouping' | 'stats'>('coaching');

  // Extract all shots in this session
  const allShots: Shot[] = session.ends.flatMap((end) => end.shots);

  if (allShots.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center max-w-lg mx-auto">
        <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">No Shot Data Available</h3>
        <p className="text-white/60 text-sm">
          Once you start shooting and recording arrow placements, your impact density heatmap, grouping plots, and performance charts will populate here!
        </p>
      </div>
    );
  }

  // --- STATS CALCULATIONS ---
  const totalPoints = allShots.reduce((sum, s) => sum + s.value, 0);
  const meanScore = totalPoints / allShots.length;

  // Coordinate math
  let sumX = 0;
  let sumY = 0;
  allShots.forEach((s) => {
    sumX += s.x;
    sumY += s.y;
  });
  const meanX = sumX / allShots.length;
  const meanY = sumY / allShots.length;

  // Average Distance from Center (0,0)
  const avgDistFromCenter =
    allShots.reduce((sum, s) => sum + Math.sqrt(s.x * s.x + s.y * s.y), 0) / allShots.length;

  // Group consistency (Average Radius from Mean Center)
  // This measures raw grouping consistency regardless of sight calibration!
  const groupRadius =
    allShots.reduce(
      (sum, s) => sum + Math.sqrt((s.x - meanX) * (s.x - meanX) + (s.y - meanY) * (s.y - meanY)),
      0
    ) / allShots.length;

  // Standard deviation of scores
  const scoreVariance =
    allShots.reduce((sum, s) => sum + Math.pow(s.value - meanScore, 2), 0) / allShots.length;
  const stdDevScore = Math.sqrt(scoreVariance);

  // Quadrant distribution for Heatmap
  let qTopLeft = 0;
  let qTopRight = 0;
  let qBottomLeft = 0;
  let qBottomRight = 0;

  allShots.forEach((s) => {
    if (s.x < 0 && s.y < 0) qTopLeft++;
    else if (s.x >= 0 && s.y < 0) qTopRight++;
    else if (s.x < 0 && s.y >= 0) qBottomLeft++;
    else qBottomRight++;
  });

  const totalShots = allShots.length;
  const pctTopLeft = Math.round((qTopLeft / totalShots) * 100);
  const pctTopRight = Math.round((qTopRight / totalShots) * 100);
  const pctBottomLeft = Math.round((qBottomLeft / totalShots) * 100);
  const pctBottomRight = Math.round((qBottomRight / totalShots) * 100);

  // Score frequencies
  const frequencies: Record<string, number> = { X: 0, '10': 0, '9': 0, '8': 0, '7': 0, '6': 0, '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, M: 0 };
  allShots.forEach((s) => {
    if (frequencies[s.score] !== undefined) {
      frequencies[s.score]++;
    }
  });

  // --- COACHING ADVICE ENGINE ---
  const getCoachingAdvice = () => {
    const adviceList: { type: 'success' | 'warning' | 'info'; title: string; text: string; icon: any }[] = [];

    // 1. Group Centering Advice
    const threshold = 18; // mm offset threshold
    if (Math.abs(meanX) > threshold || Math.abs(meanY) > threshold) {
      let horizontalDir = meanX > threshold ? 'right' : 'left';
      let verticalDir = meanY > threshold ? 'low' : 'high';

      let adviceText = '';
      if (Math.abs(meanX) > threshold && Math.abs(meanY) > threshold) {
        adviceText = `Your center of mass is shifting ${verticalDir} and to the ${horizontalDir}. Adjust your sight pin slightly ${
          verticalDir === 'high' ? 'UP' : 'DOWN'
        } and to the ${horizontalDir === 'right' ? 'RIGHT' : 'LEFT'}.`;
      } else if (Math.abs(meanX) > threshold) {
        adviceText = `Your grouping is consistent but drifting to the ${horizontalDir}. Move your sight aperture slightly to the ${horizontalDir.toUpperCase()} to correct.`;
      } else {
        adviceText = `Your grouping is vertical drifting (${verticalDir}). Move your sight pin slightly ${verticalDir === 'high' ? 'UP' : 'DOWN'} or review your anchor point consistency.`;
      }

      adviceList.push({
        type: 'warning',
        title: 'Sight Adjustment Recommended',
        text: adviceText,
        icon: Compass,
      });
    } else if (allShots.length >= 6) {
      adviceList.push({
        type: 'success',
        title: 'Excellent Sight Calibration',
        text: 'Your average center of impact is perfectly aligned with the target center. Focus on maintaining your biomechanical form and release sequence.',
        icon: Award,
      });
    }

    // 2. Form Consistency Advice based on Group Radius
    if (groupRadius > 55) {
      adviceList.push({
        type: 'info',
        title: 'Form Consistency Focus',
        text: 'Your group dispersion is wide (Average group radius: ' + Math.round(groupRadius) + 'mm). This is typically caused by variations in draw length, anchor point, or muscular fatigue. Focus on a solid bone-to-bone contact anchor point and clean dynamic release.',
        icon: ShieldAlert,
      });
    } else if (groupRadius < 30) {
      adviceList.push({
        type: 'success',
        title: 'Elite Grouping Consistency',
        text: `Superb archery form! Your group dispersion is extremely tight (Avg group radius: ${Math.round(groupRadius)}mm). You are demonstrating excellent release speed, stable follow-through, and repeatable anchoring.`,
        icon: Flame,
      });
    }

    // 3. Wind Drift or Plucking Advice (Horizontal spread vs vertical spread)
    let varX = 0;
    let varY = 0;
    allShots.forEach((s) => {
      varX += Math.pow(s.x - meanX, 2);
      varY += Math.pow(s.y - meanY, 2);
    });
    const stdDevX = Math.sqrt(varX / allShots.length);
    const stdDevY = Math.sqrt(varY / allShots.length);

    if (stdDevX > stdDevY * 1.6) {
      adviceList.push({
        type: 'info',
        title: 'Horizontal Wind Drift / Plucking Alert',
        text: 'Horizontal variance is significantly larger than vertical. If shooting outdoors, this indicates variable wind drift (make sure to cant or adjust sight). If indoors, this suggests "plucking" the string on release instead of a clean rearward follow-through.',
        icon: Sparkles,
      });
    } else if (stdDevY > stdDevX * 1.6) {
      adviceList.push({
        type: 'info',
        title: 'Vertical Anchor Drift Alert',
        text: 'Vertical variance is high. This is typically a result of variable bow hand grip pressure, breathing during execution, or slight variations in your anchor point height on the jawbone. Focus on holding your breath fully during the expansion phase.',
        icon: Sparkles,
      });
    }

    // Fallback if empty
    if (adviceList.length === 0) {
      adviceList.push({
        type: 'info',
        title: 'Establishing Baseline',
        text: 'Keep shooting to collect more coordinates. The analytics system will analyze horizontal/vertical variance ratios to isolate wind conditions, anchoring consistency, and sight alignment tips.',
        icon: Compass,
      });
    }

    return adviceList;
  };

  const adviceItems = getCoachingAdvice();

  // Mini Target rendering for scatter plot
  const defMini = TARGET_DEFINITIONS[targetType];
  const sortedRingsMini = [...defMini.rings].sort((a, b) => b.radius - a.radius);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-xl border border-[var(--slate-700)] text-center shadow-md">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Mean Score</p>
          <p className="text-2xl font-black text-[var(--accent)]">{meanScore.toFixed(2)}</p>
          <span className="text-[9px] text-slate-500 font-medium">Out of 10.0</span>
        </div>
        <div className="glass p-4 rounded-xl border border-[var(--slate-700)] text-center shadow-md">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Group Consistency</p>
          <p className="text-2xl font-black text-blue-400">
            {groupRadius < 35 ? 'Tight' : groupRadius < 60 ? 'Moderate' : 'Wide'}
          </p>
          <span className="text-[9px] text-slate-500 font-medium">Dispersion: {Math.round(groupRadius)}mm</span>
        </div>
        <div className="glass p-4 rounded-xl border border-[var(--slate-700)] text-center shadow-md">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Impact Offset</p>
          <p className="text-2xl font-black text-orange-400">
            {Math.round(avgDistFromCenter)}mm
          </p>
          <span className="text-[9px] text-slate-500 font-medium">Avg distance from center</span>
        </div>
        <div className="glass p-4 rounded-xl border border-[var(--slate-700)] text-center shadow-md">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Standard Dev</p>
          <p className="text-2xl font-black text-purple-400">
            {stdDevScore.toFixed(2)}
          </p>
          <span className="text-[9px] text-slate-500 font-medium">Score spread variance</span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex bg-[var(--slate-800)] p-1 rounded-xl border border-[var(--slate-700)] w-full max-w-md mx-auto">
        <button
          onClick={() => setSelectedTab('coaching')}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
            selectedTab === 'coaching'
              ? 'bg-[var(--accent)] text-slate-900 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Impact Density Heatmap
        </button>
        <button
          onClick={() => setSelectedTab('grouping')}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
            selectedTab === 'grouping'
              ? 'bg-[var(--accent)] text-white shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Shot Group Scatter
        </button>
        <button
          onClick={() => setSelectedTab('stats')}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
            selectedTab === 'stats'
              ? 'bg-[var(--accent)] text-white shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Score Distribution
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        
        {/* COACHING tab */}
        {selectedTab === 'coaching' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Heatmap density quadrant plot */}
            <div className="md:col-span-5 glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl flex flex-col justify-between items-center text-center">
              <div>
                <h4 className="font-bold text-sm text-white">Impact Density Heatmap</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Quadrant percentage of registered shots</p>
              </div>

              {/* Quadrant Visualizer Grid */}
              <div className="w-full max-w-[220px] aspect-square grid grid-cols-2 gap-2 mt-6 relative bg-[var(--slate-900)] p-2 rounded-lg border border-[var(--slate-700)]">
                
                {/* Horizontal & vertical division lines */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-700/60"></div>
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-700/60"></div>
                
                {/* TL */}
                <div className="flex flex-col items-center justify-center rounded-lg p-2 bg-red-500/10 border border-red-500/20">
                  <span className="text-[10px] text-slate-400 font-bold">TL</span>
                  <span className="text-xl font-black text-white">{pctTopLeft}%</span>
                </div>
                {/* TR */}
                <div className="flex flex-col items-center justify-center rounded-lg p-2 bg-orange-500/10 border border-orange-500/20">
                  <span className="text-[10px] text-slate-400 font-bold">TR</span>
                  <span className="text-xl font-black text-white">{pctTopRight}%</span>
                </div>
                {/* BL */}
                <div className="flex flex-col items-center justify-center rounded-lg p-2 bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[10px] text-slate-400 font-bold">BL</span>
                  <span className="text-xl font-black text-white">{pctBottomLeft}%</span>
                </div>
                {/* BR */}
                <div className="flex flex-col items-center justify-center rounded-lg p-2 bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-slate-400 font-bold">BR</span>
                  <span className="text-xl font-black text-white">{pctBottomRight}%</span>
                </div>
              </div>

              {/* Quadrant feedback */}
              <p className="text-xs text-slate-300 mt-6 max-w-xs leading-relaxed font-medium">
                {pctTopLeft > 40 && 'Significant top-left clustering detected. Focus on bow hand release speed.'}
                {pctTopRight > 40 && 'Significant top-right clustering. Sight adjustments or string release focus recommended.'}
                {pctBottomLeft > 40 && 'Significant bottom-left clustering. Check bow stabilization balance.'}
                {pctBottomRight > 40 && 'Significant bottom-right clustering. Look out for bow arm dropping too early.'}
                {Math.max(pctTopLeft, pctTopRight, pctBottomLeft, pctBottomRight) <= 40 && 'Well-distributed cluster center, indicating clean form balance!'}
              </p>
            </div>

            {/* Smart Diagnostic Advice Stream */}
            <div className="md:col-span-7 space-y-4">
              <h4 className="font-bold text-sm text-white px-1">Impact Diagnostics</h4>
              
              {adviceItems.map((advice, idx) => {
                const Icon = advice.icon;
                const borderClass =
                  advice.type === 'success'
                    ? 'border-l-4 border-l-emerald-500 bg-emerald-500/5'
                    : advice.type === 'warning'
                    ? 'border-l-4 border-l-amber-500 bg-amber-500/5'
                    : 'border-l-4 border-l-blue-500 bg-blue-500/5';
                
                const titleColor =
                  advice.type === 'success'
                    ? 'text-emerald-400'
                    : advice.type === 'warning'
                    ? 'text-amber-400'
                    : 'text-blue-400';

                return (
                  <div
                    key={idx}
                    className={`glass p-4 rounded-xl border border-[var(--slate-700)] shadow-md ${borderClass} flex gap-4`}
                  >
                    <div className={`p-2 rounded-lg bg-[var(--slate-900)] h-fit ${titleColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h5 className={`font-bold text-xs uppercase tracking-wider ${titleColor}`}>
                        {advice.title}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                        {advice.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GROUPING tab (Scatter plot) */}
        {selectedTab === 'grouping' && (
          <div className="glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-full max-w-[320px] aspect-square bg-[var(--slate-900)] p-4 rounded-xl border border-[var(--slate-700)] flex items-center justify-center">
              
              {/* Mini Target Face */}
              <svg viewBox="-220 -220 440 440" className="w-full h-full overflow-visible select-none">
                {sortedRingsMini.map((ring) => (
                  <circle
                    key={ring.value}
                    cx="0"
                    cy="0"
                    r={ring.radius}
                    fill={ring.color}
                    stroke="#000000"
                    strokeWidth="1.2"
                  />
                ))}

                {/* Plot scatter markers with numbers */}
                {allShots.map((shot, idx) => (
                  <g key={`scatter-${shot.id}`}>
                    <circle cx={shot.x} cy={shot.y} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                    <text
                      x={shot.x}
                      y={shot.y - 8}
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="black"
                      textAnchor="middle"
                      style={{ paintOrder: 'stroke', stroke: '#000000', strokeWidth: '2px' }}
                    >
                      {idx + 1}
                    </text>
                  </g>
                ))}

                {/* Plot the Mean Center of impact */}
                <g>
                  {/* Outer coordinate tracking circle */}
                  <circle
                    cx={meanX}
                    cy={meanY}
                    r={groupRadius}
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* Core mean centroid indicator */}
                  <line x1={meanX - 15} y1={meanY} x2={meanX + 15} y2={meanY} stroke="#F43F5E" strokeWidth="2.5" />
                  <line x1={meanX} y1={meanY - 15} x2={meanX} y2={meanY + 15} stroke="#F43F5E" strokeWidth="2.5" />
                  <circle cx={meanX} cy={meanY} r="4.5" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.5" />
                </g>
              </svg>
            </div>

            {/* Scatter information panel */}
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-white">Scatter and Centroid Dispersion</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  The pink dashed circle represents your average group consistency radius, and the cross represents the absolute center of impact.
                </p>
              </div>

              <div className="space-y-2 bg-[var(--slate-900)]/60 p-4 rounded-lg border border-[var(--slate-700)] text-xs font-semibold">
                <div className="flex justify-between py-1.5 border-b border-[var(--slate-700)]">
                  <span className="text-slate-400">Center of Impact offset:</span>
                  <span className="text-white font-mono">
                    X: {meanX.toFixed(1)}mm • Y: {meanY.toFixed(1)}mm
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--slate-700)]">
                  <span className="text-slate-400">Group Consistency Spread (Radius):</span>
                  <span className="text-blue-400 font-mono">{groupRadius.toFixed(1)}mm</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Centered Accuracy distance:</span>
                  <span className="text-orange-400 font-mono">{avgDistFromCenter.toFixed(1)}mm</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                An accurate sight calibration means the pink cross matches perfectly with the yellow center ring. A tight grouping radius represents muscular/anchor point consistency. Look to shrink the dashed circle diameter first, then move your sight to shift the cross to the center!
              </p>
            </div>
          </div>
        )}

        {/* STATS tab (Score frequencies) */}
        {selectedTab === 'stats' && (
          <div className="glass p-5 rounded-xl border border-[var(--slate-700)] shadow-xl space-y-6">
            <div>
              <h4 className="font-bold text-sm text-white">Score Frequency Distribution</h4>
              <p className="text-xs text-slate-400 mt-0.5">The count of arrows hitting each scoring zone</p>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="w-full h-48 bg-[var(--slate-900)]/60 rounded-lg p-4 border border-[var(--slate-700)] flex flex-col justify-end relative">
              <div className="flex items-end justify-between h-full gap-2 px-2">
                {Object.entries(frequencies).map(([zone, count]) => {
                  const maxCount = Math.max(...Object.values(frequencies), 1);
                  const heightPercent = `${(count / maxCount) * 80}%`;

                  // Determine zone ring colors
                  let barColor = 'bg-slate-500';
                  if (zone === 'X' || zone === '10' || zone === '9') barColor = 'bg-[var(--gold)] text-black';
                  else if (zone === '8' || zone === '7') barColor = 'bg-[var(--red)]';
                  else if (zone === '6' || zone === '5') barColor = 'bg-[var(--blue)]';
                  else if (zone === '4' || zone === '3') barColor = 'bg-[var(--slate-700)] border border-[var(--slate-700)]';
                  else if (zone === '2' || zone === '1') barColor = 'bg-slate-100 text-black';
                  else if (zone === 'M') barColor = 'bg-neutral-950 border border-[var(--red)]/30 text-[var(--red)]';

                  return (
                    <div key={zone} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Floating value hover label */}
                      <span className="text-[10px] font-black text-white/90 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 bg-black px-1.5 py-0.5 rounded border border-white/10">
                        {count}
                      </span>
                      {/* Count number on top of active bars */}
                      {count > 0 && (
                        <span className="text-[9px] font-black text-white/70 mb-1">
                          {count}
                        </span>
                      )}
                      {/* Bar fill */}
                      <div
                        style={{ height: heightPercent }}
                        className={`w-full rounded-t-sm shadow-md transition-all duration-500 hover:brightness-110 ${barColor}`}
                      ></div>
                      {/* Label */}
                      <span className="text-[10px] font-black text-slate-400 mt-2">{zone}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom SVG Line Frequency Graph */}
            <div className="space-y-3 pt-4">
              <div>
                <h4 className="font-bold text-sm text-white">Arrow Point Frequency Trend Line</h4>
                <p className="text-xs text-slate-400 mt-0.5">Line tracking arrow counts progressively from Miss (M) up to Inner Ten (X)</p>
              </div>
              
              <div className="w-full bg-[var(--slate-900)]/60 rounded-xl p-5 border border-[var(--slate-700)] shadow-inner">
                {(() => {
                  const orderedZones = ['M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'X'];
                  const maxCount = Math.max(...orderedZones.map(z => frequencies[z] || 0), 1);
                  
                  // Dimensions
                  const width = 600;
                  const height = 180;
                  const paddingLeft = 40;
                  const paddingRight = 40;
                  const paddingTop = 25;
                  const paddingBottom = 25;
                  
                  const chartWidth = width - paddingLeft - paddingRight;
                  const chartHeight = height - paddingTop - paddingBottom;
                  
                  // Map points to coordinates
                  const points = orderedZones.map((zone, i) => {
                    const count = frequencies[zone] || 0;
                    const x = paddingLeft + (i * (chartWidth / (orderedZones.length - 1)));
                    const y = height - paddingBottom - (count / maxCount) * chartHeight;
                    return { x, y, zone, count };
                  });
                  
                  // Construct SVG path string
                  let pathD = '';
                  let areaD = `M ${points[0].x} ${height - paddingBottom} `;
                  
                  points.forEach((pt, i) => {
                    if (i === 0) {
                      pathD += `M ${pt.x} ${pt.y} `;
                      areaD += `L ${pt.x} ${pt.y} `;
                    } else {
                      pathD += `L ${pt.x} ${pt.y} `;
                      areaD += `L ${pt.x} ${pt.y} `;
                    }
                  });
                  
                  areaD += `L ${points[points.length - 1].x} ${height - paddingBottom} Z`;
                  
                  return (
                    <div className="relative overflow-visible">
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                        <defs>
                          <linearGradient id="freqAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                          </linearGradient>
                        </defs>
                        
                        {/* Horizontal background grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                          const y = paddingTop + ratio * chartHeight;
                          const gridVal = Math.round((1 - ratio) * maxCount);
                          return (
                            <g key={ratio} className="opacity-30">
                              <line
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="0.8"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={paddingLeft - 12}
                                y={y + 3}
                                fill="#94A3B8"
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="end"
                              >
                                {gridVal}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* Shaded Area fill under trend line */}
                        <path d={areaD} fill="url(#freqAreaGrad)" />
                        
                        {/* Main Trend Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Interactive Data point circles */}
                        {points.map((pt, i) => (
                          <g key={pt.zone} className="group cursor-pointer">
                            {/* Larger transparent hover capture circle */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="12"
                              fill="transparent"
                            />
                            {/* Aesthetic background indicator circle */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="5"
                              fill="#0F172A"
                              stroke="#10B981"
                              strokeWidth="2.5"
                              className="transition-all duration-200 group-hover:r-7"
                            />
                            {/* Point Score hover labels */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <rect
                                x={pt.x - 18}
                                y={pt.y - 28}
                                width="36"
                                height="18"
                                rx="4"
                                fill="#000000"
                                stroke="#10B981"
                                strokeWidth="1"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 16}
                                fill="#FFFFFF"
                                fontSize="9"
                                fontWeight="black"
                                textAnchor="middle"
                              >
                                {pt.count}
                              </text>
                            </g>
                          </g>
                        ))}
                        
                        {/* X-axis labels */}
                        {points.map((pt) => (
                          <text
                            key={pt.zone}
                            x={pt.x}
                            y={height - 5}
                            fill="#94A3B8"
                            fontSize="9"
                            fontWeight="black"
                            textAnchor="middle"
                          >
                            {pt.zone}
                          </text>
                        ))}
                      </svg>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
