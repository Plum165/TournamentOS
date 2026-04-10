// ==========================================
// TOURNAMENT OS - GLOBAL LOGIC (script.js)
// ==========================================

const themes =[
    { id: 'cat-noir', name: 'Cat Noir', color: '#81e733' },
    { id: 'blood-red', name: 'Blood Red', color: '#dc2626' },
    { id: 'sapphire-steel', name: 'Sapphire', color: '#5FA8D3' },
    { id: 'emerald-charcoal', name: 'Emerald Charcoal', color: '#00af88' },
    { id: 'digital-twilight', name: 'Digital Twilight', color: '#E94560' },
    { id: 'coral-aqua', name: 'Coral Aqua', color: '#FF6B6B' },
    { id: 'electric-citrus', name: 'Electric Citrus', color: '#F7B801' },
    { id: 'artisan-clay', name: 'Artisan Clay', color: '#E07A5F' },
    { id: 'forest-canopy', name: 'Forest', color: '#52b788' },
    { id: 'monochrome-focus', name: 'Monochrome', color: '#777777' },
    { id: 'cyberpunk-glow', name: 'Cyberpunk', color: '#66FCF1' },
    { id: 'dark-emerald', name: 'Dark Emerald', color: '#10b981' },
    { id: 'dark-blue-electric', name: 'Electric Blue', color: '#3b82f6' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize standard OS features
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark-emerald';
    setTheme(savedTheme);
});

function setTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('selectedTheme', themeId);
    if (typeof renderThemeGrid === 'function') {
        renderThemeGrid(); 
    }
}

function renderThemeGrid() {
    const grid = document.getElementById('theme-grid');
    if (!grid) return; 
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark-emerald';
    
    grid.innerHTML = themes.map(theme => `
        <div onclick="setTheme('${theme.id}')" class="cursor-pointer group p-4 rounded-xl border-2 transition-all flex flex-col items-center ${currentTheme === theme.id ? 'border-white bg-white/20 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/20'}">
            <div class="w-10 h-10 rounded-full mb-2 shadow-lg" style="background-color: ${theme.color}"></div>
            <span class="text-xs font-bold text-center">${theme.name}</span>
        </div>
    `).join('');
}

function loadSport(sport) {
    window.location.href = sport + ".html";
}