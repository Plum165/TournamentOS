// ==========================================
// ARCHERY MODULE LOGIC (archery.js)
// ==========================================

// --- MODULE STATE ---
let numRounds = 20;
let currentRound = 1;
let arrows =[];
let sessionFormat = 'outdoor'; 
let allScores = JSON.parse(localStorage.getItem('archeryScores')) || [];
let cumulativeTotal = allScores.length ? allScores[allScores.length - 1].RT : 0;

// Tournament State
let participants = JSON.parse(localStorage.getItem('archeryParticipants')) ||[];
let currentTournamentMode = 'single'; // 'single' or 'team'

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    sessionFormat = localStorage.getItem('archeryFormat') || 'outdoor';
    document.getElementById('totalRoundsDisplay').textContent = numRounds;
    
    // Update the 10/20 round buttons visually based on the default
    setRounds(numRounds, true);
    
    // Auto-restore scoring data
    if(allScores.length > 0) {
        allScores.forEach(r => appendRow(r));
        currentRound = allScores.length + 1;
        document.getElementById('currentRound').textContent = currentRound;
        updateStats();
        updateArrowDisplay();
        applyFormatUI(sessionFormat);
    }

    renderParticipants();
});

// --- UI / VIEW CONTROLLER ---
function switchView(viewId) {
    const titleMap = {
        'setup': 'Setup Session',
        'scoring': 'Active Scoring',
        'tournament': 'Tournaments & Rankings',
        'settings': 'Settings & Theme'
    };
    
    document.getElementById('view-title').innerText = titleMap[viewId] || viewId;
    
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('block');
    });
    
    const targetSection = document.getElementById('view-' + viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('block');
    }

    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active-nav');
        item.classList.add('opacity-70');
    });

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active-nav');
        event.currentTarget.classList.remove('opacity-70');
    }

    if (viewId === 'settings') renderThemeGrid();
    if (viewId === 'tournament') backToRankings(); 
}

// --- FORMAT & ROUND SELECTION ---
function setRounds(val, skipConfirm = false) {
    if (!skipConfirm && allScores.length > 0 && numRounds !== val) {
        if (!confirm("Changing rounds resets the current session. Continue?")) return;
        resetSession();
    }
    
    numRounds = val;
    document.getElementById('totalRoundsDisplay').textContent = numRounds;
    
    // Toggle Button UI
    const btn10 = document.getElementById('btn-round-10');
    const btn20 = document.getElementById('btn-round-20');
    
    if (btn10 && btn20) {
        btn10.className = val === 10 
            ? "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold bg-emerald-500 text-black shadow-lg transition-all" 
            : "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold text-white/50 hover:text-white transition-all";
            
        btn20.className = val === 20 
            ? "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold bg-emerald-500 text-black shadow-lg transition-all" 
            : "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold text-white/50 hover:text-white transition-all";
    }
}

function showOutdoorFormats() {
    document.getElementById('outdoor-formats-menu').classList.remove('hidden');
}

function startSession(format) {
    sessionFormat = format;
    localStorage.setItem('archeryFormat', format);
    document.getElementById('totalRoundsDisplay').textContent = numRounds;

    applyFormatUI(format);
    switchView('scoring');
}

function applyFormatUI(format) {
    const badge = document.getElementById('selected-format-badge');
    
    // Beautify format names for the badge
    let displayName = format;
    if (format === 'outdoor-720') displayName = '720 Round';
    if (format === 'outdoor-1440') displayName = '1440 (FITA)';
    if (format === 'outdoor-disa') displayName = 'DISA';
    
    badge.innerText = displayName.toUpperCase() + " MODE";
    badge.classList.remove('hidden');

    const btnX = document.getElementById('btn-x');
    const thStat1 = document.getElementById('th-stat1');
    const thStat2 = document.getElementById('th-stat2');

    if (format === 'indoor') {
        if (btnX) {
            btnX.disabled = true;
            btnX.className = "keypad-btn bg-black/40 text-white/20 cursor-not-allowed border border-white/10 transition-all";
        }
        if (thStat1) thStat1.innerText = "9s";
        if (thStat2) thStat2.innerText = "10s";
    } else {
        // Any outdoor format
        if (btnX) {
            btnX.disabled = false;
            btnX.className = "keypad-btn bg-yellow-400 text-black transition-all";
        }
        if (thStat1) thStat1.innerText = "10s";
        if (thStat2) thStat2.innerText = "10s+X";
    }
}

// --- ARCHERY LOGIC ---
function addScore(score) {
    if (currentRound > numRounds && numRounds !== 0) return alert("Max rounds reached for this session.");
    if (arrows.length >= 3) return alert("All 3 arrows scored! Click 'Next Round'.");
    arrows.push(score);
    updateArrowDisplay();
}

function clearArrow() { arrows.pop(); updateArrowDisplay(); }

function updateArrowDisplay() {
    document.getElementById('arrow1').textContent = arrows[0] !== undefined ? arrows[0] : '-';
    document.getElementById('arrow2').textContent = arrows[1] !== undefined ? arrows[1] : '-';
    document.getElementById('arrow3').textContent = arrows[2] !== undefined ? arrows[2] : '-';
}

function nextRound() {
    if (arrows.length < 3) return alert("Complete all 3 arrows before moving to the next round!");
    if (currentRound > numRounds) return;
    
    let ET = arrows.reduce((sum, a) => sum + (a === 'X' ? 10 : (a === 'M' ? 0 : a)), 0);
    cumulativeTotal += ET;
    
    let stat1Count = 0, stat2Count = 0;
    if (sessionFormat === 'indoor') {
        stat1Count = arrows.filter(a => a == 9).length;
        stat2Count = arrows.filter(a => a == 10).length;
    } else {
        let count10 = arrows.filter(a => a == 10).length;
        let countX = arrows.filter(a => a === 'X').length;
        stat1Count = count10;           
        stat2Count = count10 + countX;  
    }
    
    let row = {
        round: currentRound,
        arrows: [...arrows],
        ET, RT: cumulativeTotal,
        stat1: stat1Count, stat2: stat2Count,
        missCount: arrows.filter(a => 'M' === a).length
    };
    
    allScores.push(row);
    localStorage.setItem('archeryScores', JSON.stringify(allScores)); 
    appendRow(row);
    updateStats();
    
    arrows =[];
    updateArrowDisplay();
    currentRound++;
    
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
    const s1 = row.stat1 !== undefined ? row.stat1 : (row.nineCount || 0);
    const s2 = row.stat2 !== undefined ? row.stat2 : (row.tenCount || 0);

    tr.innerHTML = `
        <td class="py-2 font-bold">${row.round}</td>
        <td>${row.arrows[0]}</td><td>${row.arrows[1]}</td><td>${row.arrows[2]}</td>
        <td class="text-emerald-400 font-bold">${row.ET}</td>
        <td class="text-blue-400 font-bold">${row.RT}</td>
        <td class="opacity-80 font-bold">${s1}</td><td class="opacity-80 font-bold">${s2}</td>
        <td class="text-red-400">${row.missCount}</td>
    `;
    tbody.appendChild(tr);
    tbody.parentElement.parentElement.scrollTop = tbody.parentElement.parentElement.scrollHeight;
}

function updateStats() {
    let totalArrowsFired = allScores.length * 3;
    let totalPointsScored = allScores.reduce((sum, r) => sum + r.ET, 0);
    let totalMisses = allScores.reduce((sum, r) => sum + r.missCount, 0);
    
    document.getElementById('totalArrows').textContent = totalArrowsFired;
    document.getElementById('totalPoints').textContent = totalPointsScored;
    document.getElementById('avgArrow').textContent = totalArrowsFired > 0 ? (totalPointsScored / totalArrowsFired).toFixed(2) : '0';
    document.getElementById('missPercent').textContent = totalArrowsFired > 0 ? ((totalMisses / totalArrowsFired) * 100).toFixed(1) + '%' : '0%';
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

function exportExcel() {
    if (allScores.length === 0) return alert("No scores to export!");
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

function resetSession() {
    localStorage.removeItem('archeryScores');
    allScores = []; arrows =[]; cumulativeTotal = 0; currentRound = 1;
    document.getElementById('currentRound').textContent = currentRound;
    updateArrowDisplay();
    document.getElementById('scoreTable').querySelector('tbody').innerHTML = '';
    updateStats();
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
    
    const categories =[...new Set(participants.map(p => p.category))];
    
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
        entities = [...categorySubset].sort((a,b) => b.points - a.points);
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