const API_BASE_URL = 'http://localhost:3000/api'; // Your backend server address
let userId = localStorage.getItem('currentUserId'); // Store active user ID

let numRounds = parseInt(document.getElementById('numRounds').value);
let currentRound = 1;
let arrows = [];
let allScores = []; // Will be loaded from server, not localStorage directly
let cumulativeTotal = 0;

// --- Theme Selector Logic (Keep as is) ---
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
// --- End Theme Selector Logic ---

// --- User Management UI (Example - you'll add this to HTML) ---
// You would add input fields and buttons in your HTML for these.
// For simplicity, I'm just creating placeholder functions here.
async function registerUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        alert(`Registration successful for ${data.userId}! You can now log in.`);
    } catch (error) {
        console.error('Registration failed:', error);
        alert('Registration failed: ' + error.message);
    }
}

async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        userId = data.userId;
        localStorage.setItem('currentUserId', userId);
        alert(`Logged in as ${userId}!`);
        loadScoresFromServer(); // Load user's scores after login
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
        userId = null;
        localStorage.removeItem('currentUserId');
    }
}

function logoutUser() {
    userId = null;
    localStorage.removeItem('currentUserId');
    alert("Logged out.");
    resetSession(); // Clear UI and data
}

// Call these functions from UI buttons (e.g., <button onclick="loginUser('testuser', 'password')">Login</button>)
// For testing, you might hardcode a userId temporarily or add a prompt.
if (!userId) {
    // You'd typically show a login/register form here
    // For this example, let's assume 'player1' is logged in for scores, or prompt.
    // userId = prompt("Please enter your User ID (e.g., player1, player2):");
    // if (userId) {
    //    localStorage.setItem('currentUserId', userId);
    //    loadScoresFromServer();
    // } else {
    //    alert("You need to enter a User ID to save/load scores.");
    // }
} else {
    loadScoresFromServer(); // If a user ID is already stored, try loading scores
}
// --- End User Management UI ---


async function loadScoresFromServer() {
    if (!userId) {
        console.warn("No user ID found, cannot load scores from server.");
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            headers: { 'x-user-id': userId }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allScores = data;
        
        // Re-populate cumulativeTotal
        cumulativeTotal = allScores.length ? allScores[allScores.length - 1].RT : 0;

        // Clear existing table rows before populating
        document.getElementById('scoreTable').querySelector('tbody').innerHTML = '';

        allScores.forEach(r => appendRow(r));
        currentRound = allScores.length + 1;
        document.getElementById('currentRound').textContent = currentRound;
        updateStats();
        updateArrowDisplay(); // Ensure arrow display is clear on load
        alert(`Scores loaded for user: ${userId}`);
    } catch (error) {
        console.error('Error loading scores:', error);
        alert('Error loading scores: ' + error.message + ". Please ensure the server is running and you are logged in.");
        allScores = []; // Clear local data if server load fails
        resetSession(); // Reset UI as well
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
                'x-user-id': userId // Send user ID for authentication
            },
            body: JSON.stringify(scoreData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        console.log('Score saved to server.');
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Error saving score to server: ' + error.message);
    }
}

// --- Existing functions, modified for server interaction ---

document.getElementById('numRounds').addEventListener('change', e => {
  numRounds = parseInt(e.target.value);
  if (allScores.length > 0) {
    if (!confirm("Changing the number of rounds will reset the current session. Continue?")) {
      e.target.value = allScores.length > numRounds ? allScores.length.toString() : numRounds.toString();
      return;
    }
    resetSession(); // This will now also clear server data if confirmed
  }
});

function addScore(score) {
  if (!userId) { // Added check
    alert("Please log in to add scores.");
    return;
  }
  if (currentRound > numRounds && numRounds !== 0) {
    alert("Max rounds reached for this session. Please start a new session or adjust the number of rounds.");
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

async function nextRound() { // Made async
  if (!userId) { // Added check
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
  await saveScoreToServer(row); // Save to server

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

async function finishSession() { // Made async
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
    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'DELETE',
            headers: { 'x-user-id': userId }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        alert("Server data cleared for your session.");
        resetSession();
    } catch (error) {
        console.error("Error clearing server data:", error);
        alert("Failed to clear server data: " + error.message);
    }
  }
}

function resetSession() { // This now only clears frontend state
    // localStorage.removeItem('archeryScores'); // No longer used for main data
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
  link.setAttribute("download", "archery_scores.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initial load logic now relies on userId
if (userId) {
    loadScoresFromServer();
} else {
    resetSession(); // Ensure UI is clean if no user is logged in
}
