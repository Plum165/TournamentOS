# Application Architecture

This document describes the design, folder layout, state flow, and system components of the sports OS application.

## 1. Project Overview
A multi-sport tournament and training management OS, currently supporting high-fidelity modules for:
- **Archery Module (Default Target OS)**: Multi-category scoring with dynamic physical targets (indoors, 3-spot, 40cm, etc.), local rosters, history trackers, and single elimination / team tournament bracket engines.
- **Basketball Module**: Separate roster drafting, team stats, live scrimmage scoreboards with period clocks, and dynamic playoff tournament single elimination bracket engines.

---

## 2. Technical Stack
- **Frontend Framework**: React 18+ (TSX)
- **Bundler & Dev Server**: Vite with fast HMR disabled incrementally for stable generation previews.
- **Styling**: Tailwind CSS with rich custom design patterns and warm/cool sophisticated dark/light palettes.
- **Icons**: Lucide React
- **Animations**: Motion (framer-motion)

---

## 3. Directory Layout
```text
/
├── index.html            # Main entry template
├── src/
│   ├── main.tsx          # App entry and initialization
│   ├── App.tsx           # Global routing, core layout state, and navigation
│   ├── types.ts          # Unified TypeScript interfaces and state models
│   ├── index.css         # Global Tailwind imports and theme overrides
│   ├── targetDefinitions.ts # Physical dimensions and rings for Archery targets
│   ├── components/       # Core shared sub-components
│   │   ├── Sidebar.tsx       # Primary navigation
│   │   ├── TargetFace.tsx    # SVG component to plot arrows and ring sectors
│   │   ├── RosterSetup.tsx   # Archer registration, category definitions
│   │   ├── TournamentPanel.tsx # Single elimination bracket with Gold & Bronze medal branches
│   │   ├── HistoryPanel.tsx  # Scrollable logs of completed ends and sessions
│   │   └── ThemeSelector.tsx # System-wide customization of backgrounds & accents
│   └── sports/
│       └── basketball/   # Self-contained Basketball OS dashboard
│           └── BasketballModule.tsx # Full suite: scrimmage clocks, round robins, playoffs
```

---

## 4. Key Workflows
### A. Tournament Bracket Seeding & Advancement
1. **Roster Definition**: Competitors are parsed by Category (e.g., "Compound Men", "Recurve Women").
2. **Bracket Tree Allocation**: Generates a standard power-of-two slot count with auto-filling BYEs.
3. **Double-Branch Medal Structure**:
   - Semifinal winners advance to the **🥇 Gold Medal Match** (Match 0).
   - Semifinal losers automatically route into the **🥉 Bronze Medal Match** (Match 1).
4. **Interactive Advancing**: Updating scores immediately recalculates winners, promotes them, or clears downstream branches if scores are reset.
5. **Multi-Division Persistent Storage**:
   - State persists brackets independently for each division inside an `allBrackets` state model, bound to `localStorage` synchronization.
   - Users can switch divisions seamlessly in the bracket subview via a modern, interactive dropdown selector without losing progress.
   - An "Active Brackets in Progress" resumption widget in the main Roster view lets users jump back into any division's live bracket.
6. **Instructions Modal**: A sleek help dialog detailing competitor progression can be toggled on-demand via an overlay pop-up, maximizing visual screen space during scoring.
7. **Standings Podium**: Displays the Gold, Silver, and Bronze medalists on the bracket stage once finalized.

### B. Physical Target Plotting (Archery)
- **Ring Resolution**: Coordinates clicked on the SVG target face are translated to score values (e.g., Inner 10, Outer 9, 8, etc.) using geometric radial bounds defined in `targetDefinitions.ts`.
