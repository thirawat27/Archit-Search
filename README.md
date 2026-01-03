# Archit Search

<p align="center">
  <img src="./resources/archit-search.png" alt="Archit Search Logo" width="180">
</p>

<h3 align="center">🏛️ Intelligent Architecture Enforcement with AI-Powered Analysis</h3>

<p align="center">
  <a href="#key-features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#commands">Commands</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-1.107%2B-blue?logo=visualstudiocode" alt="VS Code">
  <img src="https://img.shields.io/badge/License-GPL--3.0-green" alt="License">
  <img src="https://img.shields.io/badge/Languages-10%2B-orange" alt="Languages">
</p>

---

**Archit Search** is a comprehensive Visual Studio Code extension designed to prevent "Spaghetti Code" and maintain clean, scalable software architecture. By combining strict rule-based validation with AI-powered anomaly detection, this extension provides real-time feedback on architectural violations, helping development teams enforce best practices consistently.

> 🎯 **Not just an import checker** — Archit Search is a complete architecture enforcement platform with AI analysis, software metrics, deep cycle detection, quick fixes, and report generation.

---

## 📋 Table of Contents

- [What Does Archit Search Do?](#what-does-archit-search-do)
- [Key Features](#key-features)
- [Feature Comparison](#feature-comparison)
- [Supported Languages](#supported-languages)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Commands](#commands)
- [Quick Fix Actions](#quick-fix-actions)
- [Software Metrics](#software-metrics)
- [Architecture Reports](#architecture-reports)
- [Example Configurations](#example-configurations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## What Does Archit Search Do?

Archit Search goes far beyond simple import validation. It's a **complete architecture enforcement platform** that includes:

| Category | Capabilities |
|----------|-------------|
| **🔍 Import Analysis** | Parse and validate imports across 10+ languages |
| **🔄 Dependency Management** | Detect direct cycles (A↔B) and deep cycles (A→B→C→A up to 20 levels) |
| **🛡️ Architecture Enforcement** | Layer validation, custom rules, encapsulation checking |
| **🧠 AI Analysis** | Machine learning-based anomaly detection, semantic analysis |
| **📊 Software Metrics** | Maintainability Index, Instability, Coupling analysis |
| **⚡ Quick Fixes** | Intelligent code actions for all violation types |
| **📁 Report Generation** | Export comprehensive reports in JSON, HTML, Markdown |
| **🌍 Localization** | Full English and Thai language support |

---

## Key Features

### 🕸️ Circular Dependency Detection

**Direct Cycles (A ↔ B)**
Instantly identifies when File A imports File B and File B imports File A. These circular dependencies cause runtime errors, memory leaks, and maintenance nightmares.

**Deep Multi-Level Cycles (A → B → C → D → A)**
Unlike basic linters, Archit Search uses depth-first search algorithms to detect complex cycles up to 20 levels deep. Find hidden architectural problems that other tools miss.

```
Example Detected Cycle:
UserController.js → AuthService.js → TokenManager.js → UserController.js
[Depth: 3, Files: 3]
```

### 🛡️ Architecture Layer Enforcement

Define clear boundaries between layers (Presentation, Domain, Infrastructure). The extension enforces unidirectional dependencies, preventing lower layers from importing upper layers.

```json
{
  "architSearch.layers": [
    { "name": "Domain", "pattern": "**/domain/**" },
    { "name": "Application", "pattern": "**/services/**" },
    { "name": "Infrastructure", "pattern": "**/database/**" },
    { "name": "Presentation", "pattern": "**/pages/**" }
  ]
}
```

**Result:** Domain layer cannot import from Presentation layer.

### 🧠 AI-Powered Analysis

#### Statistical Anomaly Detection
Uses Z-Score analysis to detect files with unusual complexity. The AI engine learns from your codebase structure and identifies statistical anomalies.

- **Vector Space Models** — Tokenizes and vectorizes source code
- **Z-Score Analysis** — Identifies complexity outliers
- **K-Nearest Neighbors** — Classifies files by similarity

#### Semantic Path Analysis
The Smart Advisor analyzes file paths to detect Clean Architecture violations based on naming conventions.

```
⚠️ Suspicious: 'Data' layer importing from 'Presentation' layer
   Confidence: 95%
   File: models/User.js → pages/Dashboard.js
```

### 📦 High Coupling Detection (God Object Prevention)

Monitors the number of imports in each file. When a file exceeds the configured threshold, it triggers a warning indicating potential "God Object" anti-pattern.

```json
{
  "architSearch.maxImports": 15
}
```

**Warning:** _"High Coupling: 23 imports detected (threshold: 15). Consider splitting this file."_

### 🔒 Module Encapsulation

Warns when internal module files are imported directly instead of through the module's public entry point (`index.js` or `index.ts`).

```
❌ import { utils } from '../utils/helpers/stringUtils'
✅ import { utils } from '../utils'
```

### 📁 Unused Import Detection

Identifies imports that are declared but never used in the file. Supports both ES6 import syntax and CommonJS require patterns.

- Reduces bundle size
- Improves code clarity  
- Prevents dead code accumulation

### ⚡ Quick Fix Actions (Code Actions)

When violations are detected, the extension provides intelligent quick fix suggestions through the VS Code lightbulb menu:

| Violation Type | Available Quick Fixes |
|----------------|----------------------|
| Circular Dependency | Extract to common module, Apply DI pattern, Comment out import |
| Layer Violation | Create adapter/facade, Depend on abstraction |
| High Coupling | Split file, Apply Facade pattern, Review imports |
| Encapsulation | Import from index file |
| All Violations | Suppress with comment |

### 📊 Software Metrics Calculator

Calculate industry-standard software metrics for your codebase:

| Metric | Description |
|--------|-------------|
| **Maintainability Index** | Grades A-F based on complexity, volume, LOC |
| **Instability Index** | 0 (stable) to 1 (unstable) based on dependencies |
| **Afferent Coupling (Ca)** | Incoming dependencies count |
| **Efferent Coupling (Ce)** | Outgoing dependencies count |
| **Health Score** | Overall project health percentage |

### 📈 Architecture Report Export

Generate comprehensive architecture analysis reports in multiple formats:

| Format | Best For |
|--------|----------|
| **JSON** | CI/CD integration, automated analysis |
| **HTML** | Beautiful dark-themed dashboard |
| **Markdown** | Documentation, wikis, README files |

Reports include project summary, dependency graph statistics, detected cycles, and actionable recommendations.

### 🌍 Multi-Language Localization

Full support for English and Thai languages. All UI elements update instantly when you change the language setting.

```json
{
  "architSearch.language": "th"
}
```

---

## Feature Comparison

| Feature | Archit Search | ESLint | Madge | Dependency Cruiser |
|---------|--------------|--------|-------|-------------------|
| Direct Cycle Detection | ✅ | ❌ | ✅ | ✅ |
| Deep Cycle Detection (20 levels) | ✅ | ❌ | ❌ | ⚠️ Limited |
| Layer Architecture Enforcement | ✅ | ❌ | ❌ | ✅ |
| AI Anomaly Detection | ✅ | ❌ | ❌ | ❌ |
| Software Metrics | ✅ | ❌ | ❌ | ❌ |
| Quick Fix Actions | ✅ | ✅ | ❌ | ❌ |
| Real-time VS Code Integration | ✅ | ✅ | ❌ | ❌ |
| Multi-language Support (10+) | ✅ | ⚠️ JS/TS | ⚠️ JS/TS | ⚠️ JS/TS |
| HTML Report Export | ✅ | ❌ | ⚠️ SVG | ✅ |

---

## Supported Languages

Archit Search analyzes import statements and dependencies across a wide range of programming languages:

| Language | File Extensions | Import Patterns |
|----------|-----------------|-----------------|
| JavaScript | .js, .jsx | `import`, `require`, `export from` |
| TypeScript | .ts, .tsx | `import`, `require`, `export from` |
| Go | .go | `import "pkg"`, `import ()` |
| Python | .py | `import`, `from x import` |
| Java | .java | `import pkg.Class;` |
| C# | .cs | `using Namespace;` |
| PHP | .php | `use`, `require`, `include` |
| Ruby | .rb | `require`, `require_relative` |
| Rust | .rs | `use`, `mod` |
| Dart | .dart | `import 'pkg'` |
| Swift | .swift | `import Module` |

---

## Installation

### From VS Code Marketplace

1. Open Visual Studio Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
3. Search for **"Archit Search"**
4. Click the **Install** button

### From VSIX File

1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Press `Ctrl+Shift+P` and type **"Install from VSIX"**
4. Select the downloaded file

---

## Quick Start

### Step 1 — Open Your Project
Open your project folder in VS Code. Archit Search activates automatically when VS Code finishes loading.

### Step 2 — Check Status Bar
Look at the bottom left corner. You'll see **"Archit Search: Healthy 🟢"** or the current health status.

### Step 3 — View Violations
- **Problems Panel** — Press `Ctrl+Shift+M` to see detailed violation messages
- **Archit Search Sidebar** — Click the Archit Search icon in the Activity Bar

### Step 4 — Configure Rules (Optional)
Create `.vscode/settings.json` to add custom rules:

```json
{
  "architSearch.maxImports": 10,
  "architSearch.checkDeepCycles": true,
  "architSearch.layers": [
    { "name": "Domain", "pattern": "**/domain/**" },
    { "name": "Infrastructure", "pattern": "**/database/**" }
  ]
}
```

### Step 5 — Use Quick Fixes
Click the 💡 lightbulb icon next to violations to see available fixes.

---

## Configuration

All configuration is done through `.vscode/settings.json` in your project root.

### Core Settings

```json
{
  "architSearch.language": "en",
  "architSearch.maxImports": 15,
  "architSearch.checkCycles": true,
  "architSearch.checkDeepCycles": true,
  "architSearch.deepCycleMaxDepth": 10,
  "architSearch.enforceEncapsulation": true,
  "architSearch.enableAI": true,
  "architSearch.detectUnusedImports": false
}
```

### UI Settings

```json
{
  "architSearch.showMetricsInSidebar": true,
  "architSearch.autoExportReport": false,
  "architSearch.reportFormat": "html"
}
```

### Architecture Layers

```json
{
  "architSearch.layers": [
    { "name": "Domain", "pattern": "**/domain/**" },
    { "name": "Application", "pattern": "**/services/**" },
    { "name": "Infrastructure", "pattern": "**/database/**" },
    { "name": "Presentation", "pattern": "**/pages/**" }
  ]
}
```

### Custom Rules

```json
{
  "architSearch.rules": [
    {
      "source": "**/pages/**",
      "disallow": ["**/database/**"],
      "message": "UI components cannot access database directly"
    },
    {
      "source": "**/domain/**",
      "disallow": ["**/infrastructure/**", "**/pages/**"],
      "message": "Domain layer must remain pure"
    }
  ]
}
```

### Complete Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `architSearch.language` | `"en"` \| `"th"` | `"en"` | Language for UI messages |
| `architSearch.maxImports` | `integer` | `15` | Maximum imports before high coupling warning |
| `architSearch.checkCycles` | `boolean` | `true` | Enable direct cycle detection (A↔B) |
| `architSearch.checkDeepCycles` | `boolean` | `true` | Enable multi-level cycle detection |
| `architSearch.deepCycleMaxDepth` | `integer` | `10` | Maximum depth for cycle search (2-20) |
| `architSearch.enforceEncapsulation` | `boolean` | `true` | Warn on internal module imports |
| `architSearch.enableAI` | `boolean` | `true` | Enable AI anomaly detection |
| `architSearch.detectUnusedImports` | `boolean` | `false` | Warn on unused imports |
| `architSearch.showMetricsInSidebar` | `boolean` | `true` | Show metrics in sidebar panel |
| `architSearch.autoExportReport` | `boolean` | `false` | Auto-export report on analysis |
| `architSearch.reportFormat` | `string` | `"html"` | Default report format (json/html/markdown) |

---

## Commands

Access commands via Command Palette (`Ctrl+Shift+P`):

| Command | Description |
|---------|-------------|
| **Archit Search: Analyze Entire Project** | Run full project analysis |
| **Archit Search: Export Architecture Report** | Generate and save analysis report |
| **Archit Search: Show File Metrics** | Display metrics for current file |
| **Archit Search: Detect Deep Circular Dependencies** | Scan entire project for multi-level cycles |
| **Archit Search: Show Refactoring Guide** | Get guidance for fixing issues |
| **Archit Search: Explain This Violation** | Get detailed explanation for a violation |

---

## Quick Fix Actions

When you see a violation, click the 💡 lightbulb icon to access quick fixes:

### For Circular Dependencies
| Icon | Action |
|------|--------|
| 📦 | Extract shared code to a common module |
| 💉 | Apply Dependency Injection pattern |
| 💬 | Comment out this import |

### For Layer Violations
| Icon | Action |
|------|--------|
| 📂 | Create an adapter/facade in the correct layer |
| 🔌 | Depend on abstraction (interface) instead |

### For High Coupling
| Icon | Action |
|------|--------|
| ✂️ | Split file into smaller modules |
| 🏛️ | Apply Facade Pattern to reduce imports |
| 🧹 | Review imports for unused dependencies |

### For Encapsulation Violations
| Icon | Action |
|------|--------|
| 📁 | Import from module index file instead |

### Universal Actions
| Icon | Action |
|------|--------|
| 🔇 | Suppress this warning with comment |

---

## Software Metrics

### Maintainability Index

Calculated using a simplified Halstead formula:

| Grade | Score | Meaning | Action |
|-------|-------|---------|--------|
| **A** | 80-100 | Excellent maintainability | ✅ No action needed |
| **B** | 60-79 | Good maintainability | ⚠️ Monitor |
| **C** | 40-59 | Moderate | 🔧 Consider refactoring |
| **D** | 20-39 | Poor | 🚨 Needs refactoring |
| **F** | 0-19 | Critical | 🆘 Urgent refactoring required |

### Instability Index (Robert C. Martin)

Formula: `I = Ce / (Ca + Ce)`

| Value | Classification | Description |
|-------|---------------|-------------|
| 0.0-0.2 | Stable (Abstract) | Many depend on it, hard to change |
| 0.2-0.5 | Balanced | Good balance of stability |
| 0.5-0.8 | Flexible | Easy to change |
| 0.8-1.0 | Unstable (Concrete) | Highly dependent, sensitive to changes |

### Coupling Metrics

- **Afferent Coupling (Ca)** — How many modules depend on this module
- **Efferent Coupling (Ce)** — How many modules this module depends on
- **Total Coupling** — Ca + Ce (lower is better)

---

## Architecture Reports

### Generate Report

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type **"Archit Search: Export Architecture Report"**
3. Select report format (JSON, HTML, or Markdown)
4. Choose save location

### Report Contents

- **Metadata** — Generation date, version info
- **Project Summary** — Files analyzed, health score, average metrics
- **Dependency Graph** — Total files, dependencies, average per file
- **Circular Dependencies** — List of detected cycles with depth
- **Recommendations** — Actionable suggestions for improvement

### HTML Report Features

The HTML report includes a beautiful dark-themed dashboard with:

- Metric cards with visual indicators
- Cycle list with file paths
- Recommendation section
- Responsive design for all screen sizes

---

## Example Configurations

### Clean Architecture

```json
{
  "architSearch.layers": [
    { "name": "Domain", "pattern": "**/domain/**" },
    { "name": "Application", "pattern": "**/application/**" },
    { "name": "Infrastructure", "pattern": "**/infrastructure/**" },
    { "name": "Presentation", "pattern": "**/presentation/**" }
  ],
  "architSearch.rules": [
    {
      "source": "**/domain/**",
      "disallow": ["**/infrastructure/**", "**/presentation/**"],
      "message": "Domain layer must remain pure"
    }
  ],
  "architSearch.maxImports": 10,
  "architSearch.checkDeepCycles": true
}
```

### React Application

```json
{
  "architSearch.layers": [
    { "name": "Hooks", "pattern": "**/hooks/**" },
    { "name": "Components", "pattern": "**/components/**" },
    { "name": "Pages", "pattern": "**/pages/**" },
    { "name": "Services", "pattern": "**/services/**" }
  ],
  "architSearch.rules": [
    {
      "source": "**/components/**",
      "disallow": ["**/pages/**"],
      "message": "Components should be reusable - don't import from pages"
    },
    {
      "source": "**/hooks/**",
      "disallow": ["**/pages/**", "**/components/**"],
      "message": "Hooks should not depend on UI components"
    }
  ],
  "architSearch.detectUnusedImports": true
}
```

### NestJS Backend

```json
{
  "architSearch.layers": [
    { "name": "Entity", "pattern": "**/entities/**" },
    { "name": "Repository", "pattern": "**/repositories/**" },
    { "name": "Service", "pattern": "**/services/**" },
    { "name": "Controller", "pattern": "**/controllers/**" }
  ],
  "architSearch.rules": [
    {
      "source": "**/entities/**",
      "disallow": ["**/services/**", "**/controllers/**"],
      "message": "Entities should not depend on upper layers"
    }
  ],
  "architSearch.maxImports": 12
}
```

### Minimal Setup

```json
{
  "architSearch.maxImports": 20,
  "architSearch.checkCycles": true,
  "architSearch.checkDeepCycles": true,
  "architSearch.enableAI": true
}
```

---

## Best Practices

### 🎯 Define Layers Early
Establish architecture boundaries at the start of your project. It's easier to maintain rules than to fix spaghetti code later.

### 📐 Start with Loose Thresholds
Begin with higher `maxImports` (e.g., 20) and gradually lower it as your team adapts.

### ✍️ Use Meaningful Rule Messages
Write clear, actionable messages for violations:
```json
{
  "message": "❌ UI cannot access database. Use a service layer instead."
}
```

### 📊 Review AI Insights Weekly
Treat AI suggestions as guidance, not absolute rules. Check the sidebar for anomaly reports.

### 🤝 Share Configuration
Commit `.vscode/settings.json` to version control so all team members have the same rules.

### 🚀 Gradual Adoption
For existing projects, enable features one at a time. Start with cycle detection before adding layer rules.

### 📝 Export Reports for Code Reviews
Generate HTML or Markdown reports before major code reviews or architecture discussions.

---

## Troubleshooting

### Extension Not Activating
- Ensure your workspace contains supported file types (.js, .ts, .py, etc.)
- Try reloading the window (`Ctrl+Shift+P` → "Developer: Reload Window")
- Check the Output panel for errors (View → Output → Select "Archit Search")

### No Violations Showing
- Verify your `settings.json` syntax is valid JSON
- Check that glob patterns match your file structure
- Ensure the relevant checks are enabled (`checkCycles`, `enableAI`, etc.)

### AI Not Providing Insights
- The AI engine needs time to learn (3+ seconds after opening)
- Ensure `enableAI` is set to `true`
- Check that you have enough files in your workspace (5+)

### Metrics Showing Zero
- Metrics are calculated after the learning phase
- Wait for "Learning complete" notification
- Try running "Analyze Entire Project" command

### Deep Cycles Not Detected
- Ensure `checkDeepCycles` is enabled
- The dependency graph is built during the learning phase
- Try increasing `deepCycleMaxDepth` if needed

### Report Export Failed
- Check that you have write permissions to the target directory
- Ensure the workspace has been analyzed first
- Try a different format (JSON is simplest)

### High Memory Usage
- Reduce `deepCycleMaxDepth` for very large projects
- Disable unused features like `detectUnusedImports`
- Exclude `node_modules` and other vendor directories

---

## Technical Architecture

Archit Search is composed of modular components:

```
archit-search/
├── extension.js          # Main entry point
└── lib/
    ├── ImportParser.js       # Multi-language import parsing
    ├── RuleEngine.js         # Architecture rule validation
    ├── GraphAnalyzer.js      # Direct cycle detection (A↔B)
    ├── DeepCycleDetector.js  # Multi-level cycle detection
    ├── AIKernel.js           # Machine learning analysis
    ├── SmartAdvisor.js       # Semantic path analysis
    ├── MetricsCalculator.js  # Software metrics computation
    ├── UnusedImportDetector.js  # Unused import detection
    ├── QuickFixProvider.js   # Code action provider
    ├── ReportExporter.js     # Report generation
    ├── Visualizer.js         # Editor decorations
    ├── StatusBarManager.js   # Status bar UI
    ├── ArchitSidebarProvider.js  # Sidebar webview
    └── Localization.js       # i18n support
```

---

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Archit Search</strong> — <em>Code with architectural confidence.</em>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/Thirawat27">Thirawat27</a>
</p>

<p align="center">
  <a href="https://github.com/Thirawat27/archit-search/issues">Report Bug</a> •
  <a href="https://github.com/Thirawat27/archit-search/issues">Request Feature</a>
</p>
