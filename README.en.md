# 🎅 Random Santa

> Automatic "Secret Santa" draw with Google Forms/Sheets integration and auto-deploy to GitHub Pages

[![Build and Deploy](https://github.com/vic-kk/random-santa/actions/workflows/build-and-deploy.yml/badge.svg?branch=main)](https://github.com/vic-kk/random-santa/actions/workflows/build-and-deploy.yml)
![GitHub package.json version](https://img.shields.io/github/package-json/v/vic-kk/random-santa)

The project solves the main problem of a "Secret Santa" organizer: data collection, preventing self-selection, fair distribution, and publishing results — all in one place with minimal manual work.

**🚀 Live example:** [vic-kk.github.io/random-santa](https://vic-kk.github.io/random-santa/)

## 📑 Table of Contents

- [⚡ Quick Start](#-quick-start)
- [📜 Scripts](#-scripts)
- [✨ Features](#-features)
- [🛠️ Technologies](#️-technologies)
- [🔄 Workflow (Manual)](#-workflow-manual)
- [⚙️ Configuration](#️-configuration)
- [🌐 Deploy to GitHub Pages (Manual)](#-deploy-to-github-pages-manual)
- [🌐 GitHub Actions Automation](#-github-actions-automation)
- [📁 Project Structure](#-project-structure)

## ⚡ Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/vic-kk/random-santa.git
cd random-santa

# Install dependencies
npm install

# Development mode
npm run dev
```

## 📜 Scripts
> [!TIP]
> The project supports npm and yarn.  
> All examples use npm, for yarn replace `npm run` -> `yarn`.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build project |
| `npm run mock_csv` | Generate mock test CSV (default: 15 entries) |
| `npm run mock_csv -- N` | Generate mock with N entries |
| `npm run lint` | ESLint code check |
| `npm run santa` | Run draw (from CSV) |
| `npm run santa_auto` | Draw + switch to final stage (3) |
| `npm run stage -- 1 \| 2 \| 3` | Change project stage |
| `npm run stage` | Interactive project stage change + build |
| `npm run preview` | Preview build |

## ✨ Features

- 🔑 **Unique ID** — generated automatically and saved in localStorage
- 📋 **Data collection via Google Form** — participants fill out a form with addresses and wishes
- 🎲 **Automatic draw** — algorithm ensures no one gives a gift to themselves
- 🎁 **Three project stages**:
  - **Stage 1** — Data collection (Google Form is displayed)
  - **Stage 2** — Maintenance (maintenance message is displayed)
  - **Stage 3** — Results (recipient data is displayed)
- 📋 **Copy to clipboard** — addresses can be copied with one click

## 🛠️ Technologies

- **React 19** — UI library
- **TypeScript** — type checking
- **Vite** — bundler
- **react-toastify** — notifications
- **ESLint** — linting
- **Husky + lint-staged** — pre-commit hooks

## 🔄 Workflow (Manual)

### 1. Data Collection
- Participants fill out Google Form [form example](https://forms.gle/2z2TJb279D5bpKw9A)
- Form collects: ID, gender, wishes, delivery addresses
- Data is exported to CSV

### 2. CSV Preparation
- Place `SANTA.csv` file in `_local/` folder
- CSV format (example):
```csv
"Отметка времени","Укажи уникальный номер, расположенный на сайте","Укажи свой гендер","Укажи свои пожелания, если хочешь. Что хотелось/не хотелось бы получить.","ОЗОН Адрес","ВБ Адрес"
"12/15/2025 10:18:29 GMT+7","610665","МУЖИК","Люблю сладкое! 🍫","Москва, улица Молодежная 60 корпус 5","Москва, улица Молодежная 60 корпус 6"
```

### 3. Draw
```bash
npm run santa
```
The script:
- Parses CSV
- Performs draw (derangement algorithm)
- Generates `src/data/addresses.ts` with results
- Creates backup of previous version

### 4. Stage Switching
```bash
# Stage 1: Data collection
npm run stage -- 1

# Stage 2: Maintenance
npm run stage -- 2

# Stage 3: Results
npm run stage -- 3
```

### 5. Deploy
```bash
npm run build
```
Build is created in `docs/` folder for GitHub Pages.

## ⚙️ Configuration

### External Links (`src/data/externalLinks.ts`)

```typescript
EXTERNAL_LINKS = {
  'community': {
    url: 'COMMUNITY_LINK',           // Link to community for contacting admins
    text: 'LINK_TEXT'                // displayed link text
  },
  'santa_form': {
    url: 'GOOGLE_FORM_LINK',         // Link to form
  },
};
```

### Feature Flags (`src/features/features.ts`)

```bash
# interactive stage change, recommended
npm run stage 

# Generated content
# FEATURES = { 
#   IN_SERVICE: false,  // true — show maintenance message
#   SANTA_READY: true,  // true — show results, false — show form
# }
```

## 🌐 Deploy to GitHub Pages (Manual)

1. Build the project:
```bash
npm run build
```

2. Commit `docs/` folder and push to repository

3. In GitHub repository settings:
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main, folder: /docs


## 🌐 GitHub Actions Automation

The repository has several workflows configured:

1. **Auto-export from Google Sheets with full shuffle and stage change cycle** — manual Action run in GitHub, needs secret configuration (details in `.github/workflows/`)
2. **Current stage change** — manual Action run in GitHub
3. **Deploy to GitHub Pages** — on push to `main`

For auto-export to work, you'll need GitHub Secrets:
- `CSV_SHEET_ID` — contains Google spreadsheet ID with responses

## 📁 Project Structure

```
random-santa/
├── src/
│   ├── containers/          # React components
│   │   ├── CopyToClipboard/ # Copy to clipboard
│   │   ├── GoogleForm/      # Google Form embedding
│   │   ├── Header/          # Header with unique ID
│   │   ├── InService/       # Maintenance message
│   │   ├── Recipient/       # Recipient block
│   │   └── RecipientLine/   # Recipient data line
│   ├── data/                # Data
│   │   ├── addresses.ts     # Draw results
│   │   └── externalLinks.ts # External links
│   ├── features/            # Feature flags
│   ├── hooks/               # React hooks
│   │   └── useSantaId.ts    # Unique ID generation
│   └── utils/               # Utilities
│       └── copyToClipboard.ts
├── node_scripts/            # Node.js scripts
│   ├── core/                # Core
│   │   ├── csv-parser.ts    # CSV parsing
│   │   ├── draw-algorithm.ts# Draw algorithm
│   │   ├── logger.ts        # Logging
│   │   └── types.ts         # Types
│   ├── santa_resort.ts      # Main draw script
│   ├── set_stage.ts         # Stage switching
│   └── generate_mock_csv.ts # Test data generation
├── _local/                  # Local files (not in git)
│   └── tip.txt              # CSV hint
└── public/                  # Static files