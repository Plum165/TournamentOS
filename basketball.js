// --- BASKETBALL MODULE STATE ---
let roster = JSON.parse(localStorage.getItem('basketballRoster')) ||[];
let teamAName = localStorage.getItem('teamAName') || "Home Team";
let teamBName = localStorage.getItem('teamBName') || "Away Team";

let activePlayerId = null;
let currentScoringTeam = 'A'; // Tracks which team is currently visible in the active game view

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark-emerald';
    setTheme(savedTheme);

    // Load initial names into setup UI
    document.getElementById('teamAName').value = teamAName;
    document.getElementById('teamBName').value = teamBName;
    updateSetupTeamLabels();

    renderSetupRoster();
    if (roster.length > 0) {
        calculateAllPoints();
    }
});

// --- UI / VIEW CONTROLLER ---
function switchView(viewId) {
    const titleMap = {
        'setup': 'Roster Setup',
        'scoring': 'Active Match Scoring',
        'tournament': 'Tournament Tools',
        'settings': 'Settings & Theme'
    };
    
    document.getElementById('view-title').innerText = titleMap[viewId] || viewId;
    
    // Hide all sections, show the requested one
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('block');
    });
    
    const targetSection = document.getElementById('view-' + viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('block');
    }

    // Update Sidebar highlighting
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active-nav');
        item.classList.add('opacity-70');
    });

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active-nav');
        event.currentTarget.classList.remove('opacity-70');
    }

    if (viewId === 'settings') renderThemeGrid();
    if (viewId === 'scoring') switchScoringTeam('A'); // Default to Team A when opening scoring
    if (viewId === 'tournament') {
        // Ensure menus reset to default tournament selection view
        document.getElementById('tournament-menu').classList.remove('hidden');
        document.getElementById('bracket-builder').classList.add('hidden');
        document.getElementById('round-robin-builder').classList.add('hidden');
    }
}

// --- SETUP: ROSTER & TEAMS ---
function updateTeamNames() {
    teamAName = document.getElementById('teamAName').value || "Team A";
    teamBName = document.getElementById('teamBName').value || "Team B";
    localStorage.setItem('teamAName', teamAName);
    localStorage.setItem('teamBName', teamBName);
    updateSetupTeamLabels();
}

function updateSetupTeamLabels() {
    document.getElementById('optTeamA').innerText = teamAName;
    document.getElementById('optTeamB').innerText = teamBName;
    document.getElementById('displayTeamA').innerText = teamAName + " Roster";
    document.getElementById('displayTeamB').innerText = teamBName + " Roster";
}

function addPlayer() {
    const nameInput = document.getElementById('playerName');
    const numInput = document.getElementById('playerNum');
    const teamSelect = document.getElementById('playerTeam');
    
    if (!nameInput.value.trim() || !numInput.value.trim()) {
        alert("Please enter both a Player Name and a Jersey Number.");
        return;
    }

    const newPlayer = {
        id: Date.now().toString(),
        name: nameInput.value.trim(),
        number: numInput.value.trim(),
        team: teamSelect.value, // 'A' or 'B'
        pts: 0, fg2: 0, fg3: 0, ft: 0, fouls: 0
    };

    roster.push(newPlayer);
    saveData();
    
    nameInput.value = '';
    numInput.value = '';
    nameInput.focus();

    renderSetupRoster();
}

function removePlayer(id) {
    if (confirm("Remove player from roster? Their stats will be lost.")) {
        roster = roster.filter(p => p.id !== id);
        if (activePlayerId === id) activePlayerId = null;
        saveData();
        renderSetupRoster();
    }
}

function renderSetupRoster() {
    const listA = document.getElementById('rosterListA');
    const listB = document.getElementById('rosterListB');
    
    const teamA = roster.filter(p => p.team === 'A');
    const teamB = roster.filter(p => p.team === 'B');

    const buildHTML = (players) => {
        if (players.length === 0) return `<p class="text-sm opacity-50 py-2">No players added yet.</p>`;
        return players.map(p => `
            <div class="glass p-2 rounded-lg border border-white/10 flex items-center justify-between group text-sm">
                <div class="flex items-center gap-2">
                    <span class="font-black text-orange-400 w-6">#${p.number}</span>
                    <span class="font-bold truncate max-w-[150px]">${p.name}</span>
                </div>
                <button onclick="removePlayer('${p.id}')" class="text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded px-1">✕</button>
            </div>
        `).join('');
    };

    listA.innerHTML = buildHTML(teamA);
    listB.innerHTML = buildHTML(teamB);
}

function startGame() {
    if (roster.length === 0) {
        alert("Please add at least one player to either roster first!");
        return;
    }
    switchView('scoring');
}

// --- SCORING: ACTIVE GAME LOGIC ---
function switchScoringTeam(team) {
    currentScoringTeam = team;
    activePlayerId = null; 
    
    const btnA = document.getElementById('btnToggleA');
    const btnB = document.getElementById('btnToggleB');
    const label = document.getElementById('activeTeamLabel');

    if (team === 'A') {
        btnA.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-all bg-blue-500 text-white shadow-lg";
        btnB.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-all opacity-50 hover:opacity-100";
        label.innerText = teamAName + " Active";
        label.className = "text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded";
    } else {
        btnB.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-all bg-red-500 text-white shadow-lg";
        btnA.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-all opacity-50 hover:opacity-100";
        label.innerText = teamBName + " Active";
        label.className = "text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded";
    }

    updateGameUI();
}

function selectPlayer(id) {
    activePlayerId = id;
    updateGameUI();
}

function addStat(type) {
    if (!activePlayerId) return;

    const playerIndex = roster.findIndex(p => p.id === activePlayerId);
    if (playerIndex === -1) return;

    if (type === '2PT') roster[playerIndex].fg2++;
    else if (type === '3PT') roster[playerIndex].fg3++;
    else if (type === 'FT') roster[playerIndex].ft++;
    else if (type === 'FOUL') { 
        roster[playerIndex].fouls++; 
        if (roster[playerIndex].fouls >= 5) alert(`WARNING: ${roster[playerIndex].name} has fouled out (5 fouls)!`);
    }

    calculateAllPoints();
    saveData();
    updateGameUI();
}

function calculateAllPoints() {
    roster.forEach(p => p.pts = (p.fg2 * 2) + (p.fg3 * 3) + (p.ft * 1));
}

function updateGameUI() {
    renderActivePlayerGrid();
    renderBoxScore();
    
    document.getElementById('scoreNameA').innerText = teamAName;
    document.getElementById('scoreNameB').innerText = teamBName;

    const overlay = document.getElementById('keypadOverlay');
    const nameDisplay = document.getElementById('activePlayerNameDisplay');
    
    if (activePlayerId) {
        const p = roster.find(x => x.id === activePlayerId);
        overlay.classList.add('hidden');
        nameDisplay.innerText = `#${p.number} ${p.name}`;
    } else {
        overlay.classList.remove('hidden');
        nameDisplay.innerText = "";
    }
}

function renderActivePlayerGrid() {
    const grid = document.getElementById('activePlayerGrid');
    const activeTeamRoster = roster.filter(p => p.team === currentScoringTeam);
    
    if(activeTeamRoster.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-sm opacity-50">No players on this team.</p>`;
        return;
    }

    grid.innerHTML = activeTeamRoster.map(p => {
        const isActive = p.id === activePlayerId;
        const foulWarning = p.fouls >= 5 ? 'border-red-500 bg-red-500/20' : '';
        const themeColor = currentScoringTeam === 'A' ? 'blue-500' : 'red-500';
        
        const activeStyle = isActive 
            ? `border-${themeColor} bg-${themeColor}/20 shadow-[0_0_15px_rgba(var(--tw-colors-${themeColor}),0.3)]` 
            : 'border-white/10 bg-black/40 hover:bg-white/10';

        return `
        <div onclick="selectPlayer('${p.id}')" 
             class="cursor-pointer transition-all border-2 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 ${activeStyle} ${foulWarning}">
            <div class="text-xl font-black ${isActive ? `text-${themeColor}` : ''}">#${p.number}</div>
            <div class="text-xs font-bold truncate w-full ${isActive ? 'text-white' : 'opacity-70'}">${p.name}</div>
            ${p.fouls >= 5 ? '<div class="text-[10px] text-red-400 font-bold uppercase">Foul Out</div>' : ''}
        </div>`;
    }).join('');
}

function renderBoxScore() {
    const tbody = document.getElementById('boxScoreBody');
    let html = '';
    let totalScoreA = 0;
    let totalScoreB = 0;

    const buildTeamRows = (teamFilter, teamName, colorClass) => {
        const teamPlayers = roster.filter(p => p.team === teamFilter);
        if (teamPlayers.length === 0) return '';
        
        let tPts=0, t2=0, t3=0, tFt=0, tFouls=0;
        
        let rowHtml = `<tr class="bg-white/5 border-t-2 border-${colorClass}/50"><td colspan="6" class="py-2 px-4 text-left text-xs font-black text-${colorClass} uppercase tracking-widest">${teamName}</td></tr>`;
        
        teamPlayers.forEach(p => {
            tPts+=p.pts; t2+=p.fg2; t3+=p.fg3; tFt+=p.ft; tFouls+=p.fouls;
            if(teamFilter === 'A') totalScoreA += p.pts; else totalScoreB += p.pts;
            
            const trClass = p.id === activePlayerId ? `bg-${colorClass}/20` : 'hover:bg-white/5';
            rowHtml += `
                <tr class="${trClass}">
                    <td class="py-2 px-4 text-left font-bold text-sm"><span class="opacity-50 mr-2">#${p.number}</span> ${p.name}</td>
                    <td class="text-${colorClass} font-bold text-base">${p.pts}</td>
                    <td class="opacity-80">${p.fg2}</td>
                    <td class="opacity-80">${p.fg3}</td>
                    <td class="opacity-80">${p.ft}</td>
                    <td class="${p.fouls >= 5 ? 'text-red-500 font-bold' : 'opacity-60'}">${p.fouls}</td>
                </tr>`;
        });
        
        rowHtml += `<tr class="bg-black/30 font-bold border-b border-white/10">
            <td class="py-2 px-4 text-right text-xs opacity-50 uppercase">Totals</td>
            <td class="text-${colorClass}">${tPts}</td>
            <td class="text-xs opacity-70">${t2}</td>
            <td class="text-xs opacity-70">${t3}</td>
            <td class="text-xs opacity-70">${tFt}</td>
            <td class="text-xs opacity-70">${tFouls}</td>
        </tr>`;
        
        return rowHtml;
    };

    html += buildTeamRows('A', teamAName, 'blue-400');
    html += buildTeamRows('B', teamBName, 'red-400');
    
    tbody.innerHTML = html;

    document.getElementById('teamAScore').innerText = totalScoreA;
    document.getElementById('teamBScore').innerText = totalScoreB;
}

function exportBoxScore() {
    if (roster.length === 0) return alert("No roster data to export!");
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Team,Player Name,Jersey #,Total Points (PTS),2-Pointers (FG),3-Pointers (3PT),Free Throws (FT),Fouls\n`;
    
    roster.forEach(p => {
        const teamStr = p.team === 'A' ? teamAName : teamBName;
        csvContent += `"${teamStr}","${p.name}",${p.number},${p.pts},${p.fg2},${p.fg3},${p.ft},${p.fouls}\n`;
    });
    
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Basketball_BoxScore.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// --- TOURNAMENT: ROUND ROBIN BUILDER ---
function openRoundRobinBuilder() {
    document.getElementById('tournament-menu').classList.add('hidden');
    document.getElementById('bracket-builder').classList.add('hidden');
    document.getElementById('round-robin-builder').classList.remove('hidden');
}

function closeRoundRobinBuilder() {
    document.getElementById('round-robin-builder').classList.add('hidden');
    document.getElementById('tournament-menu').classList.remove('hidden');
}

function generateRoundRobin() {
    const numTeamsInput = parseInt(document.getElementById('roundRobinTeamCount').value);
    if (!numTeamsInput || numTeamsInput < 3) return alert("Please enter at least 3 teams.");

    let teams =[];
    for (let i = 1; i <= numTeamsInput; i++) {
        teams.push(`Team ${i}`);
    }

    // Automatically assign a BYE to make the array length an even number
    if (teams.length % 2 !== 0) {
        teams.push("BYE");
    }

    const totalRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;
    const container = document.getElementById('round-robin-container');
    let html = '';

    for (let round = 0; round < totalRounds; round++) {
        html += `<div class="glass p-4 rounded-xl min-w-[260px] shrink-0 border-t-4 border-t-orange-500 shadow-lg bg-black/20">`;
        html += `<h4 class="text-center font-bold mb-4 text-orange-400 uppercase tracking-widest text-sm">Round ${round + 1}</h4>`;
        html += `<div class="space-y-3">`;

        for (let match = 0; match < matchesPerRound; match++) {
            let home = teams[match];
            let away = teams[teams.length - 1 - match];

            if (home === "BYE") {
                html += `<div class="text-center text-xs opacity-60 font-bold p-2 bg-white/5 rounded border border-white/5"><span class="text-white">${away}</span> gets a BYE</div>`;
            } else if (away === "BYE") {
                html += `<div class="text-center text-xs opacity-60 font-bold p-2 bg-white/5 rounded border border-white/5"><span class="text-white">${home}</span> gets a BYE</div>`;
            } else {
                html += `
                <div class="flex items-center justify-between gap-2 bg-black/60 p-2 rounded-lg border border-white/10 hover:border-orange-500/50 transition-colors">
                    <input class="w-full bg-transparent text-center text-sm font-bold outline-none focus:text-orange-400 transition-colors truncate" value="${home}">
                    <span class="text-[10px] opacity-40 font-black tracking-widest">VS</span>
                    <input class="w-full bg-transparent text-center text-sm font-bold outline-none focus:text-orange-400 transition-colors truncate" value="${away}">
                </div>`;
            }
        }

        html += `</div></div>`;

        // Circle Method rotation
        teams.splice(1, 0, teams.pop());
    }

    // "Go to Knouckouts Bracket" Button Card
    html += `
        <div class="flex flex-col items-center justify-center min-w-[200px] p-6 border-2 border-dashed border-white/10 rounded-xl bg-white/5 shrink-0 text-center">
            <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-500 mb-3"></i>
            <h4 class="font-bold mb-2">Group Stage Complete</h4>
            <p class="text-xs opacity-50 mb-4">Advance the top teams into knockouts.</p>
            <button onclick="document.getElementById('round-robin-builder').classList.add('hidden'); openBracketBuilder();" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-bold text-sm transition-colors shadow-lg">
                Build Bracket
            </button>
        </div>
    `;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}


// --- TOURNAMENT: ELIMINATION BRACKET BUILDER ---
function openBracketBuilder() {
    document.getElementById('tournament-menu').classList.add('hidden');
    document.getElementById('round-robin-builder').classList.add('hidden');
    document.getElementById('bracket-builder').classList.remove('hidden');
}

function closeBracketBuilder() {
    document.getElementById('bracket-builder').classList.add('hidden');
    document.getElementById('tournament-menu').classList.remove('hidden');
}

function generateBracket() {
    const numTeams = parseInt(document.getElementById('bracketTeamCount').value);
    if (!numTeams || numTeams < 2) return alert("Please enter at least 2 teams.");

    let p = 1;
    while(p < numTeams) p *= 2;
    
    const totalRounds = Math.log2(p);
    const container = document.getElementById('bracket-container');
    let html = '';

    const roundNames =['','Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64'];

    for (let r = 0; r <= totalRounds; r++) {
        let matchesInRound = p / Math.pow(2, r + 1);
        let roundLabel = (totalRounds - r) < roundNames.length ? roundNames[totalRounds - r] : `Round ${r+1}`;
        if(r === totalRounds) roundLabel = "Champion";

        html += `<div class="flex flex-col justify-around gap-6 bracket-col w-48 shrink-0">`;
        html += `<h5 class="text-xs font-bold text-emerald-400 uppercase tracking-widest text-center mb-2">${roundLabel}</h5>`;
        
        if (r === totalRounds) {
            html += `<div class="p-3 glass rounded-lg border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <input class="w-full bg-transparent outline-none font-bold text-center placeholder:opacity-40" placeholder="Winner">
                     </div>`;
        } else {
            for (let m = 0; m < matchesInRound; m++) {
                html += `
                <div class="glass p-2 rounded-lg border border-white/20 flex flex-col gap-1 bracket-match shadow-lg relative">
                    <input class="bg-black/40 hover:bg-black/60 border border-transparent focus:border-emerald-500 px-2 py-1.5 text-sm rounded outline-none font-semibold transition-colors placeholder:opacity-30" placeholder="Team Name">
                    <div class="h-[1px] w-full bg-white/10 my-0.5"></div>
                    <input class="bg-black/40 hover:bg-black/60 border border-transparent focus:border-emerald-500 px-2 py-1.5 text-sm rounded outline-none font-semibold transition-colors placeholder:opacity-30" placeholder="Team Name">
                </div>`;
            }
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}

// --- DATA & THEME MANAGEMENT ---
function saveData() { localStorage.setItem('basketballRoster', JSON.stringify(roster)); }

function clearAllData() {
    if (confirm("Are you sure you want to completely erase the roster and all game stats?")) {
        roster =[];
        activePlayerId = null;
        localStorage.removeItem('basketballRoster');
        localStorage.removeItem('teamAName');
        localStorage.removeItem('teamBName');
        document.getElementById('teamAName').value = "Team A";
        document.getElementById('teamBName').value = "Team B";
        updateTeamNames();
        renderSetupRoster();
        updateGameUI();
        alert("Data cleared.");
    }
}

// THEMES ARRAY
const themes =[
    { id: 'cat-noir', name: 'Cat Noir', color: '#81e733' },
    { id: 'blood-red', name: 'Blood Red', color: '#dc2626' },
    { id: 'sapphire-steel', name: 'Sapphire Steel', color: '#5FA8D3' },
    { id: 'emerald-charcoal', name: 'Emerald Charcoal', color: '#00af88' },
    { id: 'digital-twilight', name: 'Digital Twilight', color: '#E94560' },
    { id: 'coral-aqua', name: 'Coral Aqua', color: '#FF6B6B' },
    { id: 'electric-citrus', name: 'Electric Citrus', color: '#F7B801' },
    { id: 'artisan-clay', name: 'Artisan Clay', color: '#E07A5F' },
    { id: 'forest-canopy', name: 'Forest Canopy', color: '#52b788' },
    { id: 'ocean-depth', name: 'Ocean Depth', color: '#66A5AD' },
    { id: 'desert-sunset', name: 'Desert Sunset', color: '#E88873' },
    { id: 'monochrome-focus', name: 'Monochrome', color: '#777777' },
    { id: 'soft-nordic', name: 'Soft Nordic', color: '#D90429' },
    { id: 'neutral-peach', name: 'Neutral Peach', color: '#6B5B95' },
    { id: 'retro-pop', name: 'Retro Pop', color: '#D95F43' },
    { id: 'cyberpunk-glow', name: 'Cyberpunk Glow', color: '#66FCF1' },
    { id: 'plum-gold', name: 'Plum Gold', color: '#FDB833' },
    { id: 'red-blue', name: 'Red & Blue', color: '#ef233c' },
    { id: 'purple-black', name: 'Purple Black', color: '#9b59b6' },
    { id: 'spiderman', name: 'Spiderman', color: '#ff0000' },
    { id: 'dark-emerald', name: 'Dark Emerald', color: '#10b981' },
    { id: 'emerald-red', name: 'Emerald Red', color: '#ef4444' },
    { id: 'dark-blue-cyan', name: 'Blue & Cyan', color: '#06b6d4' },
    { id: 'dark-blue-electric', name: 'Electric Blue', color: '#3b82f6' },
    { id: 'dark-blue-teal', name: 'Blue & Teal', color: '#14b8a6' },
    { id: 'dark-blue-indigo', name: 'Indigo Blue', color: '#6366f1' },
    { id: 'dark-emerald-blue', name: 'Emerald Blue', color: '#0ea5e9' }
];

function setTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('selectedTheme', themeId);
    renderThemeGrid(); 
}

function renderThemeGrid() {
    const grid = document.getElementById('theme-grid');
    if (!grid) return; 
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark-emerald';
    
    grid.innerHTML = themes.map(theme => `
        <div onclick="setTheme('${theme.id}')" 
             class="cursor-pointer group p-4 rounded-xl border-2 transition-all flex flex-col items-center 
             ${currentTheme === theme.id ? 'border-white bg-white/20 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/20'}">
            <div class="w-10 h-10 rounded-full mb-2 shadow-lg" style="background-color: ${theme.color}"></div>
            <span class="text-xs font-bold text-center">${theme.name}</span>
        </div>
    `).join('');
}