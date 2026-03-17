const API_BASE_URL = 'http://localhost:3000/api';
let userId = localStorage.getItem('currentUserId');
let username = localStorage.getItem('currentUsername'); // Store username too for display

let numRounds = parseInt(document.getElementById('numRounds').value);
let currentRound = 1;
let arrows = [];
let allScores = [];
let cumulativeTotal = 0;

// Get references to UI sections
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loggedInUsernameDisplay = document.getElementById('loggedInUsername');

// Theme Selector Logic (No changes needed here from previous version)
const themeDropdown = document.getElementById('theme-dropdown');
const htmlElement = document.documentElement;

function setTheme(themeName) {
    htmlElement.setAttribute('data-theme', themeName);
    localStorage.setItem('selectedTheme', themeName);
}

themeDropdown.addEventListener('change', (e) => {
    setTheme(e.target.value);
});

const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme) {
    setTheme(savedTheme);
    themeDropdown.value = savedTheme;
} else {
    setTheme('dark-emerald');
    themeDropdown.value = 'dark-emerald';
}
// End Theme Selector Logic

// --- Auth UI Management ---
function showAuthSection() {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    showLoginForm(); // Default to login form
    loggedInUsernameDisplay.textContent = 'Guest';
}

function showAppSection() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    loggedInUsernameDisplay.textContent = username || 'Error';
}

function showLoginForm() {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
}

function showRegisterForm() {
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
}

// --- Auth API Calls ---
async function handleRegister() {
    const regUsername = document.getElementById('registerUsername').value.trim();
    const regPassword = document.getElementById('registerPassword').value.trim();

    if (!regUsername || !regPassword) {
        alert("Please enter both username and password for registration.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: regUsername, password: regPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Registration failed with status: ${response.status}`);
        }
        
        alert(`Registration successful for ${data.userId}! You can now log in.`);
        document.getElementById('loginUsername').value = regUsername; // Pre-fill login
        document.getElementById('loginPassword').value = '';
        showLoginForm();
    } catch (error) {
        console.error('Registration failed:', error);
        alert('Registration failed: ' + error.message);
    }
}

async function handleLogin() {
    const logUsername = document.getElementById('loginUsername').value.trim();
    const logPassword = document.getElementById('loginPassword').value.trim();

    if (!logUsername || !logPassword) {
        alert("Please enter both username and password to log in.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: logUsername, password: logPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Login failed with status: ${response.status}`);
        }
        
        userId = data.userId;
        username = logUsername; // Save the username as well
        localStorage.setItem('currentUserId', userId);
        localStorage.setItem('currentUsername', username);

        alert(`Logged in as ${username}!`);
        showAppSection();
        loadScoresFromServer(); // Load user's scores after login
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
        userId = null;
        username = null;
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUsername');
    }
}

function logoutUser() {
    userId = null;
    username = null;
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUsername');
    alert("Logged out.");
    resetSession(); // Clear UI and data
    showAuthSection(); // Go back to login/register
}


// --- Core App Logic (Modified for server interaction) ---

async function loadScoresFromServer() {
    if (!userId) {
        console.warn("No user ID found, cannot load scores from server.");
        showAuthSection(); // Ensure auth section is shown if no user
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            headers: { 'x-user-id': userId }
        });
        if (!response.ok) {
            // If the user ID is invalid on the server (e.g., deleted), log out
            if (response.status === 404 || response.status === 401) {
                alert("User session invalid or not found on server. Please log in again.");
                logoutUser();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allScores = data;
        
        cumulativeTotal = allScores.length ? allScores[allScores.length - 1].RT : 0;

        document.getElementById('scoreTable').querySelector('tbody').innerHTML = '';

        allScores.forEach(r => appendRow(r));
        currentRound = allScores.length + 1;
        document.getElementById('currentRound').textContent = currentRound;
        updateStats();
        updateArrowDisplay();
        console.log(`Scores loaded for user: ${username}`);
    } catch (error) {
        console.error('Error loading scores:', error);
        alert('Error loading scores: ' + error.message + ". Please ensure the server is running and you are logged in.");
        allScores = [];
        resetSession();
    }
}

async function saveScoreToServer(scoreData) {
    if (!userId) {
        alert("Please log in to save scores.");
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify(scoreData)
        });
        if (!response.ok) {
            // Handle specific errors for saving, e.g., if user somehow becomes unauthorized mid-session
            if (response.status === 401 || response.status === 404) {
                 alert("Your session has expired or user not found. Please log in again.");
                 logoutUser();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Score saved to server.');
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Error saving score to server: ' + error.message);
    }
}

document.getElementById('numRounds').addEventListener('change', async e => {
    if (!userId) {
        alert("Please log in to change round settings.");
        e.target.value = '20'; // Revert to default
        return;
    }
    numRounds = parseInt(e.target.value);
    if (allScores.length > 0) {
        if (!confirm("Changing the number of rounds will reset the current session and clear server data. Continue?")) {
            e.target.value = (allScores.length > numRounds ? allScores.length : numRounds).toString();
            return;
        }
        await clearServerScores(); // Clear server data if confirmed
        resetSession();
    }
});

function addScore(score) {
    if (!userId) {
        alert("Please log in to add scores.");
        return;
    }
    if (currentRound > numRounds && numRounds !== 0) {
        alert("Max rounds reached for this session. Please click 'Done Session' or adjust the number of rounds.");
        return;
    }
    if (arrows.length >= 3) {
        alert("All 3 arrows scored for this round! Click 'Next Round' or 'Clear Last'.");
        return;
    }
    arrows.push(score);
    updateArrowDisplay();
}

function clearArrow() {
    arrows.pop();
    updateArrowDisplay();
}

function updateArrowDisplay() {
    document.getElementById('arrow1').textContent = arrows[0] || '-';
    document.getElementById('arrow2').textContent = arrows[1] || '-';
    document.getElementById('arrow3').textContent = arrows[2] || '-';
}

async function nextRound() {
    if (!userId) {
        alert("Please log in to save scores to the server.");
        return;
    }
    if (arrows.length < 3) {
        alert("Complete all 3 arrows before moving to the next round!");
        return;
    }
    if (currentRound > numRounds) {
        alert("You have completed all specified rounds for this session. Click 'Done Session' to finish.");
        return;
    }
    
    let ET = arrows.reduce((sum, a) => sum + (a === 'X' ? 10 : (a === 'M' ? 0 : a)), 0);
    cumulativeTotal += ET;
    
    let row = {
        round: currentRound,
        arrows: [...arrows],
        ET,
        RT: cumulativeTotal,
        nineCount: arrows.filter(a => a == 9).length,
        tenCount: arrows.filter(a => a == 10 || a === 'X').length,
        missCount: arrows.filter(a => 'M' === a).length
    };
    
    allScores.push(row);
    await saveScoreToServer(row);

    appendRow(row);
    updateStats();
    
    arrows = [];
    updateArrowDisplay();
    currentRound++;
    document.getElementById('currentRound').textContent = currentRound;

    if (currentRound > numRounds) {
        alert("All rounds complete! Click 'Done Session' to review your results or 'Export to Excel'.");
    }
}

function appendRow(row) {
    let tbody = document.getElementById('scoreTable').querySelector('tbody');
    let tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${row.round}</td>
        <td>${row.arrows[0]}</td>
        <td>${row.arrows[1]}</td>
        <td>${row.arrows[2]}</td>
        <td>${row.ET}</td>
        <td>${row.RT}</td>
        <td>${row.nineCount}</td>
        <td>${row.tenCount}</td>
        <td>${row.missCount}</td>
    `;
    tbody.appendChild(tr);
}

function updateStats() {
    let totalArrows = allScores.length * 3;
    let totalPoints = allScores.reduce((sum, r) => sum + r.ET, 0);
    let totalMisses = allScores.reduce((sum, r) => sum + r.missCount, 0);
    document.getElementById('totalArrows').textContent = totalArrows;
    document.getElementById('totalPoints').textContent = totalPoints;
    document.getElementById('avgArrow').textContent = totalArrows > 0 ? (totalPoints / totalArrows).toFixed(2) : '0';
    document.getElementById('missPercent').textContent = totalArrows > 0 ? ((totalMisses / totalArrows) * 100).toFixed(2) + '%' : '0%';
}

async function finishSession() {
    if (!userId) {
        alert("Please log in to finish session and manage server data.");
        return;
    }
    if (allScores.length === 0) {
        alert("No scores recorded yet for this session.");
        return;
    }
    let totalArrowsFired = allScores.length * 3;
    let totalPointsScored = cumulativeTotal;
    let totalMisses = allScores.reduce((sum,r)=>sum+r.missCount,0);
    let missPercentage = totalArrowsFired > 0 ? ((totalMisses / totalArrowsFired) * 100).toFixed(2) : '0';

    alert(`Session complete!
Total rounds: ${allScores.length}
Total arrows fired: ${totalArrowsFired}
Total points: ${totalPointsScored}
Miss %: ${missPercentage}%`);
    
    if (confirm("Would you like to start a new session and clear current data on the server?")) {
        await clearServerScores();
        resetSession();
    }
}

async function clearServerScores() {
    if (!userId) {
        alert("Cannot clear server scores without being logged in.");
        return false;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'DELETE',
            headers: { 'x-user-id': userId }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 404) {
                alert("Your session has expired or user not found. Please log in again.");
                logoutUser();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        alert("Server data cleared for your session.");
        return true;
    } catch (error) {
        console.error("Error clearing server data:", error);
        alert("Failed to clear server data: " + error.message);
        return false;
    }
}


function resetSession() {
    allScores = [];
    arrows = [];
    cumulativeTotal = 0;
    currentRound = 1;
    document.getElementById('currentRound').textContent = currentRound;
    updateArrowDisplay();
    document.getElementById('scoreTable').querySelector('tbody').innerHTML = '';
    updateStats();
    document.getElementById('numRounds').value = '20';
    numRounds = 20;
}

function exportExcel() {
    if (allScores.length === 0) {
        alert("No scores to export!");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Round,Arrow 1,Arrow 2,Arrow 3,End Total (ET),Round Total (RT),9',10',Miss\n";
    allScores.forEach(r=>{
        csvContent += `${r.round},${r.arrows[0]},${r.arrows[1]},${r.arrows[2]},${r.ET},${r.RT},${r.nineCount},${r.tenCount},${r.missCount}\n`;
    });
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${username || 'archery'}_scores.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initial check on load
if (userId && username) {
    showAppSection();
    loadScoresFromServer();
} else {
    showAuthSection();
}