import React from 'react';
import { Palette, AlertTriangle } from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  color: string;
}

export const THEMES: Theme[] = [
  { id: 'dark-emerald', name: 'Dark Emerald', color: '#10b981' },
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
  { id: 'emerald-red', name: 'Emerald Red', color: '#ef4444' },
  { id: 'dark-blue-cyan', name: 'Blue & Cyan', color: '#06b6d4' },
  { id: 'dark-blue-electric', name: 'Electric Blue', color: '#3b82f6' },
  { id: 'dark-blue-teal', name: 'Blue & Teal', color: '#14b8a6' },
  { id: 'dark-blue-indigo', name: 'Indigo Blue', color: '#6366f1' },
  { id: 'dark-emerald-blue', name: 'Emerald Blue', color: '#0ea5e9' }
];

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  onResetAllData: () => void;
}

export default function ThemeSelector({
  currentTheme,
  onThemeChange,
  onResetAllData,
}: ThemeSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Theme Picker Grid */}
      <div className="glass p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <h4 className="font-bold text-lg text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--accent)]" /> Interface Custom Themes
        </h4>
        <p className="text-xs text-white/50 font-semibold leading-relaxed">
          Select a sport branding aesthetic to skin your TournamentOS layout, action controls, and score indicators.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4">
          {THEMES.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col items-center gap-2.5 ${
                  isSelected
                    ? 'border-white bg-white/10 shadow-lg scale-105'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full shadow-inner border border-white/10"
                  style={{ backgroundColor: theme.color }}
                ></div>
                <span className="text-xs font-black text-center text-white/80">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass p-6 rounded-3xl border border-red-500/20 bg-red-500/5 shadow-xl space-y-4">
        <h4 className="font-bold text-base text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h4>
        <p className="text-xs text-white/60 font-semibold leading-relaxed max-w-2xl">
          Erase all archery session ends, arrows shot, rankings entries, and participant histories from your local browser database. This action is irreversible.
        </p>
        <button
          onClick={() => {
            onResetAllData();
          }}
          className="px-6 py-2.5 bg-red-600/25 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
        >
          Reset All TournamentOS Data
        </button>
      </div>

    </div>
  );
}
