# TournamentOS 🏆

Welcome to **TournamentOS**, an offline-first, highly sophisticated multi-sport operating core and scoring container built with React, Vite, Tailwind CSS, and Framer Motion. TournamentOS features rich, modular, and fully synchronized workflows for managing sports analytics, dual-scoreboard engines, competitor rosters, and tournament systems.

---

## 🚀 Key Modules & Capabilities

### 1. 🎯 Archery Pro Scoring & Coaching Engine
A high-precision, visual, and analytical module designed for archers, trainers, and tournament directors:
- **Interactive Plotting Target Face**: Click or tap to plot arrow shots on standard archery targets. Features automatic coordinate calculation, radial distance measuring, and angle estimation.
- **Support for Multi-Type Targets**:
  - **122cm Target Face**: Standard outdoor long-distance target.
  - **80cm Target Face**: Standard short-range target.
  - **Indoor 40cm Face (Rings 5-10)**: Three-spot indoor style with rings from 5 to 10.
  - **Indoor 40cm Single Spot (Rings 1-10)**: Full circular indoor face showing scoring rings from 1 (outer white) to 10 (inner gold).
  - **Practice Face**: Beautiful customized Emerald coaching layout.
- **Dynamic Coaching & Shot Analytics**:
  - Automatically calculates **Center of Group (CoG)**, standard deviation error ellipses, and horizontal/vertical scatter.
  - Generates real-time, algorithmic coaching advice (e.g., Windage adjustment, Elevation advice, Release and follow-through suggestions).
- **Manual Scoring Keypad (Numpad)**:
  - Responsive numpad for rapid, traditional manual scoresheet entry.
  - Features precise, color-coded buttons matching actual World Archery target face ring colors (including white 1-2 buttons, blue 5-6 buttons, red 7-8 buttons, yellow 9-10 buttons, and slate gray Miss buttons).
- **Session History & Image Export**:
  - Saves full history profiles inside secure client-side `localStorage`.
  - Exporter to download any active or historical target plot as a **high-resolution PNG image** or a vector SVG, completely customized with the archer's details, date, and branding.
- **Tournament Manager**:
  - Single & Team Elimination Bracket seeding system.
  - Berger System round-robin group stage schedule compiler.

---

### 2. 🏀 Basketball OS Scoreboard & Team Module
A dual-team roster manager and match statistics processor:
- **Unified Adaptive Navigation**:
  - Features a **fully synchronized dual-sidebar layout**. Any selection on the primary main sidebar instantly coordinates and renders the correct view on the basketball sub-sidebar, keeping state perfectly in harmony.
- **Match Setup & Competitor Drafting**:
  - Draft competing Home and Away team rosters, including player name registration and jersey numbering.
- **Active Live Stats Tracker**:
  - Interactive scoreboard controls to track **2-Pointers (2PT)**, **3-Pointers (3PT)**, **Free Throws (FT)**, and **Personal Fouls**.
  - Automated real-time tracking for fouls, complete with a critical warning when a player reaches 5 fouls and "Fouls Out".
- **Dynamic Playoff & Group Generators**:
  - Berger System Circle Rotation algorithm to compile perfect round-robin schedules for up to dozens of teams.
  - Playoff tree bracket manager to run elimination matches.
- **Spreadsheet Exports**:
  - Export full roster match sheets to CSV formats, capturing total points, field-goal splits, and fouls.

---

### 3. ⚙️ Operating System Core & Layout Architecture
- **Theme Customizer**: Dynamic UI customization to adjust accent coloring on the fly.
- **Beautiful Dialog Box Overrides**: Replaces generic browser `alert` and `confirm` windows with custom-designed, responsive floating modals via the `DialogProvider`.
- **Desktop-First Precision & Responsive Mobile Drawer**: Perfectly adapts from wide desktop monitors down to touch-target safe mobile layouts.
- **Offline Durability**: Full state saving for competitor lists, active session state, historical logs, and custom-created sports.

---

## 🛠️ Tech Stack & Styling Guide

- **Framework**: React 18+ & Vite
- **Styling**: Tailwind CSS & Modern Custom Themes (Slate neutrals background)
- **Icons**: Lucide React
- **Animations**: Framer Motion (for route transitions and modal layouts)
- **Database**: Offline-First Local Storage Engine
