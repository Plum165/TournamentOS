// ==========================================
// ARCHERY MODULE LOGIC (archery.js)
// ==========================================

// --- MODULE STATE ---
let numRounds = 20;
let currentRound = 1;
let arrows =[];
let sessionFormat = 'outdoor'; 
let arrowsPerEnd = 3; // Dynamically changes to 6 for DISA
let allScores = JSON.parse(localStorage.getItem('archeryScores')) ||[];
let cumulativeTotal = allScores.length ? allScores[allScores.length - 1].RT : 0;

let participants = JSON.parse(localStorage.getItem('archeryParticipants')) ||[];
let currentTournamentMode = 'single'; 

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    sessionFormat = localStorage.getItem('archeryFormat') || 'outdoor';
    
    if(allScores.length > 0) {
        // Must restore variables FIRST before rendering
        if(sessionFormat === 'outdoor-disa') {
            numRounds = 16;
            arrowsPerEnd = 6;
        }
        document.getElementById('totalRoundsDisplay').textContent = numRounds;
        setRounds(numRounds, true);
        applyFormatUI(sessionFormat);
        
        allScores.forEach(r => appendRow(r));
        currentRound = allScores.length + 1;
        document.getElementById('currentRound').textContent = currentRound;
        updateStats();
        updateArrowDisplay();
        updateDISABadge();
    }
});

// --- UI CONTROLLER ---
function switchView(viewId) {
    const titleMap = {
        'setup': 'Setup Session', 'scoring': 'Active Scoring',
        'tournament': 'Tournaments & Rankings', 'settings': 'Settings & Theme'
    };
    document.getElementById('view-title').innerText = titleMap[viewId] || viewId;
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden'); section.classList.remove('block');
    });
    const targetSection = document.getElementById('view-' + viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden'); targetSection.classList.add('block');
    }
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active-nav'); item.classList.add('opacity-70');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active-nav'); event.currentTarget.classList.remove('opacity-70');
    }
}

// --- FORMAT SELECTION ---
function setRounds(val, skipConfirm = false) {
    if (!skipConfirm && allScores.length > 0 && numRounds !== val) {
        if (!confirm("Changing rounds resets the current session. Continue?")) return;
        resetSession();
    }
    numRounds = val;
    document.getElementById('totalRoundsDisplay').textContent = numRounds;
    
    const btn10 = document.getElementById('btn-round-10');
    const btn20 = document.getElementById('btn-round-20');
    if (btn10 && btn20) {
        btn10.className = val === 10 ? "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold bg-emerald-500 text-black shadow-lg transition-all" : "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold text-white/50 hover:text-white transition-all";
        btn20.className = val === 20 ? "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold bg-emerald-500 text-black shadow-lg transition-all" : "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold text-white/50 hover:text-white transition-all";
    }
}

function setDistance(val) {
    // Simple visual UI toggle for standard outdoor formats
    const btns = document.getElementById('distance-choice').querySelectorAll('button');
    btns.forEach(btn => {
        if (btn.innerText.includes(val)) {
            btn.className = "px-3 py-2 rounded-md text-xs font-bold bg-emerald-500 text-black shadow-lg transition-all";
        } else {
            btn.className = "px-3 py-2 rounded-md text-xs font-bold text-white/50 hover:text-white transition-all";
        }
    });
}

function startSession(format) {
    sessionFormat = format;
    localStorage.setItem('archeryFormat', format);
    
    if (format === 'outdoor-disa') {
        numRounds = 16; 
        arrowsPerEnd = 6;
    } else {
        arrowsPerEnd = 3;
        numRounds = parseInt(document.getElementById('btn-round-10').classList.contains('bg-emerald-500') ? 10 : 20);
    }
    
    document.getElementById('totalRoundsDisplay').textContent = numRounds;
    applyFormatUI(format);
    switchView('scoring');
    updateArrowDisplay();
    updateDISABadge();
}

function applyFormatUI(format) {
    const badge = document.getElementById('selected-format-badge');
    const toggles = document.getElementById('standard-scoring-toggles');
    const disaBadge = document.getElementById('disa-distance-badge');
    
    let displayName = format;
    if (format === 'outdoor-720') displayName = '720 Round';
    if (format === 'outdoor-1440') displayName = '1440 (FITA)';
    if (format === 'outdoor-disa') displayName = 'DISA';
    
    badge.innerText = displayName.toUpperCase() + " MODE";
    badge.classList.remove('hidden');

    const btnX = document.getElementById('btn-x');
    const thStat1 = document.getElementById('th-stat1');
    const thStat2 = document.getElementById('th-stat2');
    const thA4 = document.getElementById('th-arr4');
    const thA5 = document.getElementById('th-arr5');
    const thA6 = document.getElementById('th-arr6');

    // UI Adjustments for DISA vs Standard
    if (format === 'outdoor-disa') {
        if (toggles) toggles.classList.add('hidden');
        if (disaBadge) disaBadge.classList.remove('hidden');
        if (thA4) thA4.classList.remove('hidden');
        if (thA5) thA5.classList.remove('hidden');
        if (thA6) thA6.classList.remove('hidden');
    } else {
        if (toggles) toggles.classList.remove('hidden');
        if (disaBadge) disaBadge.classList.add('hidden');
        if (thA4) thA4.classList.add('hidden');
        if (thA5) thA5.classList.add('hidden');
        if (thA6) thA6.classList.add('hidden');
    }

    if (format === 'indoor') {
        if (btnX) {
            btnX.disabled = true;
            btnX.className = "keypad-btn bg-black/40 text-white/20 cursor-not-allowed border border-white/10 transition-all";
        }
        if (thStat1) thStat1.innerText = "9s";
        if (thStat2) thStat2.innerText = "10s";
    } else {
        if (btnX) {
            btnX.disabled = false;
            btnX.className = "keypad-btn bg-yellow-400 text-black transition-all";
        }
        if (thStat1) thStat1.innerText = "10s";
        if (thStat2) thStat2.innerText = "10s+X";
    }
}

function updateDISABadge() {
    const badge = document.getElementById('disa-distance-badge');
    if (sessionFormat !== 'outdoor-disa' || !badge) return;

    // First, strip away any existing color classes
    badge.classList.remove(
        'bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 
        'text-white', 'text-black'
    );

    let dist = "";
    
    // Check rounds in reverse order (highest to lowest)
    if (currentRound > 12) {
        dist = "30M (80cm Face)";
        badge.classList.add('bg-emerald-500', 'text-black'); // Green
    } 
    else if (currentRound > 8) {
        dist = "40M (80cm Face)";
        badge.classList.add('bg-blue-500', 'text-white'); // Blue
    } 
    else if (currentRound > 4) {
        dist = "50M (122cm Face)";
        badge.classList.add('bg-orange-500', 'text-black'); // Orange
    } 
    else {
        dist = "60M (122cm Face)";
        badge.classList.add('bg-red-500', 'text-white'); // Red
    }
    
    badge.innerText = `Current Distance: ${dist}`;
}

// --- SCORING LOGIC ---
function addScore(score) {
    if (currentRound > numRounds && numRounds !== 0) return alert("Max rounds reached.");
    if (arrows.length >= arrowsPerEnd) return alert(`All ${arrowsPerEnd} arrows scored! Click 'Next Round'.`);
    arrows.push(score);
    updateArrowDisplay();
}

function clearArrow() { arrows.pop(); updateArrowDisplay(); }

function updateArrowDisplay() {
    for (let i = 1; i <= 6; i++) {
        let el = document.getElementById('arrow' + i);
        if (el) {
            if (i <= arrowsPerEnd) {
                el.classList.remove('hidden');
                el.textContent = arrows[i - 1] !== undefined ? arrows[i - 1] : '-';
            } else {
                el.classList.add('hidden');
            }
        }
    }
}

function nextRound() {
    if (arrows.length < arrowsPerEnd) return alert(`Complete all ${arrowsPerEnd} arrows before moving to the next round!`);
    if (currentRound > numRounds) return;
    
    let ET = arrows.reduce((sum, a) => sum + (a === 'X' ? 10 : (a === 'M' ? 0 : a)), 0);
    cumulativeTotal += ET;
    
    let stat1Count = 0, stat2Count = 0;
    let count10 = arrows.filter(a => a == 10).length;
    let countX = arrows.filter(a => a === 'X').length;

    if (sessionFormat === 'indoor') {
        stat1Count = arrows.filter(a => a == 9).length;
        stat2Count = count10;
    } else {
        stat1Count = count10;           
        stat2Count = count10 + countX;  
    }
    
    let row = {
        round: currentRound,
        arrows: [...arrows],
        ET, RT: cumulativeTotal,
        stat1: stat1Count, stat2: stat2Count, xCount: countX,
        missCount: arrows.filter(a => 'M' === a).length
    };
    
    allScores.push(row);
    localStorage.setItem('archeryScores', JSON.stringify(allScores)); 
    appendRow(row);
    updateStats();
    
    arrows =[];
    updateArrowDisplay();
    currentRound++;
    updateDISABadge();
    
    if (currentRound > numRounds) {
        document.getElementById('currentRound').textContent = currentRound - 1;
        alert("All rounds complete! Click 'End Session' or 'Export CSV'.");
    } else {
        document.getElementById('currentRound').textContent = currentRound;
    }
}

function appendRow(row) {
    let tbody = document.getElementById('scoreTable').querySelector('tbody');
    let tr = document.createElement('tr');
    tr.className = "hover:bg-white/5 transition-colors";
    
    // Fallbacks for old saved data
    const s1 = row.stat1 !== undefined ? row.stat1 : (row.nineCount || 0);
    const s2 = row.stat2 !== undefined ? row.stat2 : (row.tenCount || 0);

    let html = `
        <td class="py-2 font-bold">${row.round}</td>
        <td>${row.arrows[0] !== undefined ? row.arrows[0] : ''}</td>
        <td>${row.arrows[1] !== undefined ? row.arrows[1] : ''}</td>
        <td>${row.arrows[2] !== undefined ? row.arrows[2] : ''}</td>`;
    
    if (arrowsPerEnd === 6) {
        html += `
        <td>${row.arrows[3] !== undefined ? row.arrows[3] : ''}</td>
        <td>${row.arrows[4] !== undefined ? row.arrows[4] : ''}</td>
        <td>${row.arrows[5] !== undefined ? row.arrows[5] : ''}</td>`;
    }

    html += `
        <td class="text-emerald-400 font-bold">${row.ET}</td>
        <td class="text-blue-400 font-bold">${row.RT}</td>
        <td class="opacity-80 font-bold">${s1}</td>
        <td class="opacity-80 font-bold">${s2}</td>
        <td class="text-red-400">${row.missCount}</td>`;
        
    tr.innerHTML = html;
    tbody.appendChild(tr);
    tbody.parentElement.parentElement.scrollTop = tbody.parentElement.parentElement.scrollHeight;
}

function updateStats() {
    let totalArrowsFired = allScores.length * arrowsPerEnd;
    let totalPointsScored = allScores.reduce((sum, r) => sum + r.ET, 0);
    let totalMisses = allScores.reduce((sum, r) => sum + r.missCount, 0);
    
    document.getElementById('totalArrows').textContent = totalArrowsFired;
    document.getElementById('totalPoints').textContent = totalPointsScored;
    document.getElementById('avgArrow').textContent = totalArrowsFired > 0 ? (totalPointsScored / totalArrowsFired).toFixed(2) : '0';
    document.getElementById('missPercent').textContent = totalArrowsFired > 0 ? ((totalMisses / totalArrowsFired) * 100).toFixed(1) + '%' : '0%';
}

// --- ARROW BREAKDOWN MODAL ---
function showArrowBreakdown() {
    if (allScores.length === 0) return alert("No arrows scored yet.");
    
    let counts = { 'X':0, 10:0, 9:0, 8:0, 7:0, 6:0, 5:0, 4:0, 3:0, 2:0, 1:0, 'M':0 };
    let total = 0;

    allScores.forEach(r => {
        r.arrows.forEach(a => {
            if (counts[a] !== undefined) counts[a]++;
            else if (a === '10' || a == 10) counts[10]++; // Type coercion fallback
            total++;
        });
    });

    const content = document.getElementById('breakdownContent');
    
    // Prepare data for the graph
    const labels =['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
    const dataPoints = labels.map(l => counts[l] || 0);
    const maxVal = Math.max(...dataPoints, 1);

    // --- GENERATE SVG LINE GRAPH ---
    const svgWidth = 300;
    const svgHeight = 120;
    const padX = 12;
    const padYTop = 20;  // Room for numbers above peaks
    const padYBot = 20;  // Room for X-axis labels
    const plotW = svgWidth - 2 * padX;
    const plotH = svgHeight - padYTop - padYBot;

    // Calculate coordinates for each point
    const points = dataPoints.map((val, i) => {
        const x = padX + (i * (plotW / (labels.length - 1)));
        const y = svgHeight - padYBot - ((val / maxVal) * plotH);
        return { x, y, val, label: labels[i] };
    });

    // Build SVG Path strings
    const pathD = "M " + points.map(p => `${p.x},${p.y}`).join(" L ");
    const areaD = `${pathD} L ${points[points.length-1].x},${svgHeight - padYBot} L ${points[0].x},${svgHeight - padYBot} Z`;

    let graphHtml = `
        <div class="w-full h-32 mb-6 mt-4 relative">
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-full overflow-visible drop-shadow-lg">
                <defs>
                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>
                
                <!-- Baseline -->
                <line x1="0" y1="${svgHeight - padYBot}" x2="${svgWidth}" y2="${svgHeight - padYBot}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                
                <!-- Filled Area Under Line -->
                <path d="${areaD}" fill="url(#areaGrad)" />
                
                <!-- The Main Line -->
                <path d="${pathD}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                
                <!-- Data Points & Labels -->
                ${points.map(p => `
                    <!-- Colored Circle -->
                    <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${p.label === 'X' || p.label === '10' || p.label === '9' ? '#facc15' : p.label === '8' || p.label === '7' ? '#ee1616' : p.label === '6' || p.label === '5' ? '#270dca' : p.label === '4' || p.label === '3' ? '#000000' : p.label === '2' || p.label === '1' ? '#f3f3f3' : (p.label === 'M' ? '#ac00fb' : '#10b981')}" stroke="#000" stroke-width="1.5" class="transition-all duration-300 cursor-pointer"/>
                    
                    <!-- Top Data Value (Only show if > 0 to keep it clean) -->
                    <text x="${p.x}" y="${p.y - 8}" fill="white" font-size="9" font-weight="bold" text-anchor="middle" class="${p.val > 0 ? 'opacity-100' : 'opacity-0'} drop-shadow-md">${p.val}</text>
                    
                    <!-- X-Axis Labels (X, 10, 9... M) -->
                    <text x="${p.x}" y="${svgHeight - 4}" fill="white" font-size="9" text-anchor="middle" class="opacity-60 font-semibold">${p.label}</text>
                `).join('')}
            </svg>
        </div>
    `;

    // Inject graph + textual list into modal
    content.innerHTML = graphHtml + `
        <div class="space-y-1 text-sm bg-black/20 p-4 rounded-xl border border-white/5">
            <div class="flex justify-between items-center py-2 border-b border-white/10"><span class="text-yellow-400">10s (Including X)</span> <span class="text-emerald-400 font-bold">${counts[10] + counts['X']}</span></div>
            <div class="flex justify-between items-center py-1 opacity-60 text-xs ml-4 border-b border-white/10"><span>↳ Pure Xs</span> <span>${counts['X']}</span></div>
            <div class="flex justify-between items-center py-2 border-b border-white/10"><span>9s</span> <span>${counts[9]}</span></div>
            <div class="flex justify-between items-center py-2 border-b border-white/10"><span>8s</span> <span>${counts[8]}</span></div>
            <div class="flex justify-between items-center py-2 border-b border-white/10 opacity-70"><span>7s to 1s</span> <span>${counts[7]+counts[6]+counts[5]+counts[4]+counts[3]+counts[2]+counts[1]}</span></div>
            <div class="flex justify-between items-center py-2 border-b border-white/10"><span class="text-red-400">Misses (M)</span> <span class="text-red-400 font-bold">${counts['M']}</span></div>
            <div class="flex justify-between items-center py-3 mt-2 font-black text-white border-t-2 border-white/20"><span>TOTAL ARROWS</span> <span>${total}</span></div>
        </div>
    `;

    document.getElementById('arrowBreakdownModal').classList.remove('hidden');
}



function closeArrowBreakdown() {
    document.getElementById('arrowBreakdownModal').classList.add('hidden');
}

// --- EXPORT LOGIC ---
function exportExcel() {
    if (allScores.length === 0) return alert("No scores to export!");
    
    // Use specialized exporter if DISA
    if (sessionFormat === 'outdoor-disa') {
        exportDISAExcel();
        return;
    }

    let s1H = sessionFormat === 'indoor' ? '9s' : '10s';
    let s2H = sessionFormat === 'indoor' ? '10s' : '10s+X';
    let csv = `Round,Arrow 1,Arrow 2,Arrow 3,End Total (ET),Round Total (RT),${s1H},${s2H},Miss\n`;
    allScores.forEach(r => {
        csv += `${r.round},${r.arrows[0]},${r.arrows[1]},${r.arrows[2]},${r.ET},${r.RT},${r.stat1||r.nineCount||0},${r.stat2||r.tenCount||0},${r.missCount}\n`;
    });
    
    let link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
    link.download = `Archery_${sessionFormat}_Scores.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// Custom Exporter matching the DISA Excel Screenshot exactly
function exportDISAExcel() {
    let csvRows =[];
    
    // Left Side Headers
    let leftHeaders =["Rounds", "Arrow 1", "Arrow 2", "Arrow 3", "Arrow 4", "Arrow 5", "Arrow 6", "End Total(ET)", "Round Total(RT)", "9'", "10'", "X"];
    
    // Right Side Distance Breakdown Blocks
    const distances =[
        { name: "60 Meter Range (122cm face)", startIdx: 0 },
        { name: "50 Meter Range (122cm face)", startIdx: 4 },
        { name: "40 Meter Range (80cm face)", startIdx: 8 },
        { name: "30 Meter Range (80cm face)", startIdx: 12 }
    ];

    let rightBlocks =[]; 
    distances.forEach(d => {
        rightBlocks.push(`${d.name},,,,,,,`); // Header
        rightBlocks.push(`Arrow 1,Arrow 2,Arrow 3,Arrow 4,Arrow 5,Arrow 6,End Total(ET),Round Total(RT)`);
        for(let i=0; i<4; i++) {
            let score = allScores[d.startIdx + i];
            if(score) {
                rightBlocks.push(`${score.arrows[0]||''},${score.arrows[1]||''},${score.arrows[2]||''},${score.arrows[3]||''},${score.arrows[4]||''},${score.arrows[5]||''},${score.ET},${score.RT}`);
            } else {
                rightBlocks.push(`,,,,,,,`);
            }
        }
        rightBlocks.push(`,,,,,,,`); // Spacer
    });

    let leftBlocks =[];
    leftBlocks.push(leftHeaders.join(","));
    for(let i=0; i<16; i++) {
        let score = allScores[i];
        if(score) {
            let pure10s = score.arrows.filter(a => a == 10).length;
            let pureXs = score.arrows.filter(a => a === 'X').length;
            leftBlocks.push(`${score.round},${score.arrows[0]||''},${score.arrows[1]||''},${score.arrows[2]||''},${score.arrows[3]||''},${score.arrows[4]||''},${score.arrows[5]||''},${score.ET},${score.RT},${score.stat1},${pure10s},${pureXs}`);
        } else {
            leftBlocks.push(`${i+1},,,,,,,,,,,`);
        }
    }
    
    // Bottom Totals for Left Block
    let totalPointsScored = allScores.reduce((sum, r) => sum + r.ET, 0);
    let totalArrowsFired = allScores.length * 6;
    let avg = totalArrowsFired > 0 ? (totalPointsScored / totalArrowsFired).toFixed(2) : 0;
    let totalMisses = allScores.reduce((sum, r) => sum + r.missCount, 0);
    let missP = totalArrowsFired > 0 ? ((totalMisses / totalArrowsFired) * 100).toFixed(1) + '%' : '0%';
    let total9s = allScores.reduce((sum, r) => sum + r.stat1, 0);
    let total10s = allScores.reduce((sum, r) => sum + r.arrows.filter(a=>a==10).length, 0);
    let totalXs = allScores.reduce((sum, r) => sum + r.arrows.filter(a=>a==='X').length, 0);

    leftBlocks.push(`Total,${totalPointsScored},,,,,,,,,${total9s},${total10s},${totalXs}`);
    leftBlocks.push(`Avg Arrow,${avg},,,,,,,,,,`);
    leftBlocks.push(`Misses,${totalMisses},,,,,,,,,,`);
    leftBlocks.push(`Percentage,${missP},,,,,,,,,,`);

    // Merge Left and Right blocks horizontally into CSV format
    let maxRows = Math.max(leftBlocks.length, rightBlocks.length);
    for(let i=0; i<maxRows; i++) {
        let left = leftBlocks[i] || ",,,,,,,,,,,";
        let right = rightBlocks[i] || "";
        csvRows.push(`${left},,,${right}`); // Added spacing column between left and right tables
    }

    let csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    let link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Archery_DISA_Scores.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function resetSession() {
    localStorage.removeItem('archeryScores');
    allScores = []; arrows =[]; cumulativeTotal = 0; currentRound = 1;
    document.getElementById('currentRound').textContent = currentRound;
    updateArrowDisplay();
    document.getElementById('scoreTable').querySelector('tbody').innerHTML = '';
    updateStats();
    updateDISABadge();
}

function finishSession() {
if (allScores.length === 0) return alert("No scores recorded yet.");
let totalArrows = allScores.length * 3;
let missP = totalArrows > 0 ? ((allScores.reduce((sum,r)=>sum+r.missCount,0)/totalArrows)*100).toFixed(2) : '0';
alert(`SESSION COMPLETE\nTotal rounds: ${allScores.length}\nPoints: ${cumulativeTotal}\nMiss %: ${missP}%`);
if (confirm("Clear this session's data?")) {
resetSession();
switchView('setup');
document.getElementById('selected-format-badge').classList.add('hidden');
}
}

function clearAllData() {
    if (confirm("Erase EVERYTHING? Session scores and tournament participants will be deleted.")) {
        resetSession(); 
        participants =[];
        saveParticipants();
        renderParticipants();
        alert("All Data cleared!");
    }
}

// --- TOURNAMENT: RANKINGS & BRACKET LOGIC ---
function addParticipant() {
    const name = document.getElementById('partName').value.trim();
    const points = parseInt(document.getElementById('partPoints').value);
    const cat = document.getElementById('partCategory').value.trim() || 'Uncategorized';
    const team = document.getElementById('partTeam').value.trim() || 'Independent';

    if (!name || isNaN(points)) return alert("Please enter a valid Name and Points.");

    participants.push({ id: Date.now().toString(), name, points, category: cat, team });
    saveParticipants();
    renderParticipants();
    
    document.getElementById('partName').value = '';
    document.getElementById('partPoints').value = '';
    document.getElementById('partName').focus();
}

function removeParticipant(id) {
    participants = participants.filter(p => p.id !== id);
    saveParticipants();
    renderParticipants();
}

function saveParticipants() {
    localStorage.setItem('archeryParticipants', JSON.stringify(participants));
}

function renderParticipants() {
    participants.sort((a, b) => b.points - a.points);
    
    const tbody = document.getElementById('participantsTableBody');
    document.getElementById('participantCount').innerText = `${participants.length} Participants`;
    
    if (participants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center opacity-50">No participants added yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = participants.map((p, index) => `
        <tr class="hover:bg-white/5">
            <td class="py-3 px-4 font-black text-emerald-400">#${index + 1}</td>
            <td class="font-bold">${p.name}</td>
            <td class="opacity-70">${p.category}</td>
            <td class="opacity-70">${p.team || 'Independent'}</td>
            <td class="font-bold text-emerald-400 text-lg">${p.points}</td>
            <td class="text-right px-4">
                <button onclick="removeParticipant('${p.id}')" class="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/30 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n');
        
        let count = 0;
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length >= 2) {
                const name = cols[0]?.trim();
                const points = parseInt(cols[1]?.trim());
                const category = cols[2]?.trim() || 'Uncategorized';
                const team = cols[3]?.trim() || 'Independent';
                
                if (name && !isNaN(points)) {
                    participants.push({ id: Date.now().toString() + i, name, points, category, team });
                    count++;
                }
            }
        }
        saveParticipants();
        renderParticipants();
        alert(`Successfully imported ${count} participants from CSV!`);
    };
    reader.readAsText(file);
    event.target.value = ''; 
}

function backToRankings() {
    document.getElementById('tournament-bracket-view').classList.add('hidden');
    document.getElementById('tournament-category-view').classList.add('hidden');
    document.getElementById('tournament-setup-view').classList.remove('hidden');
}

function backToCategories() {
    document.getElementById('tournament-bracket-view').classList.add('hidden');
    document.getElementById('tournament-category-view').classList.remove('hidden');
}

function showCategorySelection(mode) {
    if (participants.length === 0) return alert("Please add participants to rankings first.");
    currentTournamentMode = mode; 
    
    const categories = [...new Set(participants.map(p => p.category))];
    
    document.getElementById('tournament-setup-view').classList.add('hidden');
    document.getElementById('tournament-category-view').classList.remove('hidden');
    
    document.getElementById('catSelectionTitle').innerText = mode === 'single' ? "Select Category for Single Elim" : "Select Category for Team Elim";

    const btnContainer = document.getElementById('categoryButtonsContainer');
    btnContainer.innerHTML = categories.map(cat => `
        <button onclick="generateBracketForCategory('${cat}')" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 text-lg">
            ${cat}
        </button>
    `).join('');
}

function generateBracketForCategory(category) {
    document.getElementById('tournament-category-view').classList.add('hidden');
    document.getElementById('tournament-bracket-view').classList.remove('hidden');
    
    let categorySubset = participants.filter(p => p.category === category);
    let entities =[];

    if (currentTournamentMode === 'single') {
        document.getElementById('bracketTitleDisplay').innerText = `${category} - Single Elimination`;
        document.getElementById('teamRankingsContainer').classList.add('hidden');
        entities =[...categorySubset].sort((a,b) => b.points - a.points);
    } else {
        document.getElementById('bracketTitleDisplay').innerText = `${category} - Team Elimination`;
        document.getElementById('teamRankingsContainer').classList.remove('hidden');
        
        const teamMap = {};
        categorySubset.forEach(p => {
            let teamName = p.team && p.team !== 'Independent' ? p.team : p.name + " (Ind)";
            if (!teamMap[teamName]) teamMap[teamName] = 0;
            teamMap[teamName] += p.points;
        });

        entities = Object.keys(teamMap).map(tName => ({ name: tName, points: teamMap[tName] }))
                         .sort((a,b) => b.points - a.points);

        document.getElementById('teamRankingsList').innerHTML = entities.map((t, idx) => `
            <div class="glass p-3 rounded-xl border border-white/10 text-center shadow-md">
                <p class="text-[10px] font-black uppercase text-purple-400 mb-1">Rank #${idx+1}</p>
                <h5 class="font-bold truncate">${t.name}</h5>
                <p class="text-xs opacity-70 mt-1">${t.points} Pts</p>
            </div>
        `).join('');
    }

    if(entities.length < 2) return alert(`Not enough data in the '${category}' category to generate a bracket!`);

    let p = 1;
    while(p < entities.length) p *= 2;
    while(entities.length < p) entities.push({ name: "BYE" });

    let firstRoundMatchups =[];
    for(let i=0; i < entities.length / 2; i++) {
        firstRoundMatchups.push([entities[i].name, entities[entities.length - 1 - i].name]);
    }

    const totalRounds = Math.log2(p);
    const container = document.getElementById('archeryBracketContainer');
    let html = '';

    const roundNames =['','Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];

    for (let r = 0; r <= totalRounds; r++) {
        let matchesInRound = p / Math.pow(2, r + 1);
        let roundLabel = (totalRounds - r) < roundNames.length ? roundNames[totalRounds - r] : `Round ${r+1}`;
        if(r === totalRounds) roundLabel = "Champion";

        html += `<div class="flex flex-col justify-around gap-6 bracket-col w-48 shrink-0">`;
        html += `<h5 class="text-xs font-bold text-emerald-400 uppercase tracking-widest text-center mb-2">${roundLabel}</h5>`;
        
        if (r === totalRounds) {
            html += `<div class="p-3 glass rounded-lg border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <input class="w-full bg-transparent outline-none font-bold text-center placeholder:opacity-40 text-emerald-300" placeholder="Winner">
                     </div>`;
        } else {
            for (let m = 0; m < matchesInRound; m++) {
                let t1 = r === 0 ? firstRoundMatchups[m][0] : "TBD";
                let t2 = r === 0 ? firstRoundMatchups[m][1] : "TBD";
                
                html += `
                <div class="glass p-2 rounded-lg border border-white/20 flex flex-col gap-1 bracket-match shadow-lg relative">
                    <input class="bg-black/40 hover:bg-black/60 border border-transparent focus:border-emerald-500 px-2 py-1.5 text-sm rounded outline-none font-semibold transition-colors truncate" value="${t1}">
                    <div class="h-[1px] w-full bg-white/10 my-0.5"></div>
                    <input class="bg-black/40 hover:bg-black/60 border border-transparent focus:border-emerald-500 px-2 py-1.5 text-sm rounded outline-none font-semibold transition-colors truncate" value="${t2}">
                </div>`;
            }
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}