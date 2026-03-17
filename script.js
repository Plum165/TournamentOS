let numRounds = parseInt(document.getElementById('numRounds').value);
let currentRound = 1;
let arrows = [];
// Reverted to localStorage for allScores
let allScores = JSON.parse(localStorage.getItem('archeryScores')) || [];
let cumulativeTotal = allScores.length ? allScores[allScores.length - 1].RT : 0;

// Theme Selector Logic (No changes needed here)
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

document.getElementById('numRounds').addEventListener('change', e => {
  numRounds = parseInt(e.target.value);
  if (allScores.length > 0) {
    if (!confirm("Changing the number of rounds will reset the current session. Continue?")) {
      e.target.value = allScores.length > numRounds ? allScores.length.toString() : numRounds.toString();
      return;
    }
    resetSession();
  }
});

function addScore(score) {
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

function nextRound() {
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
  localStorage.setItem('archeryScores', JSON.stringify(allScores)); // Save to localStorage
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

function finishSession() {
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
  
  if (confirm("Would you like to start a new session and clear current data?")) {
    resetSession();
  }
}

function resetSession() {
    localStorage.removeItem('archeryScores'); // Clear only the session scores
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

// NEW FUNCTION: Clear ALL locally stored data (including themes)
function clearAllData() {
    if (confirm("Are you sure you want to clear ALL stored archery data (scores and theme)? This action cannot be undone.")) {
        localStorage.clear(); // Clears ALL localStorage items
        resetSession(); // Resets the score tracker UI
        // Re-apply default theme after clearing localStorage
        setTheme('dark-emerald');
        themeDropdown.value = 'dark-emerald';
        alert("All local data has been cleared!");
    }
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
  link.setAttribute("download", "archery_scores.csv"); // Filename is generic now
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initial load: Populate table if already have saved scores and update stats
allScores.forEach(r => appendRow(r));
currentRound = allScores.length + 1;
document.getElementById('currentRound').textContent = currentRound;
updateStats();
updateArrowDisplay();