# Changelog

All notable changes to **Archit Search** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Deep circular dependency detection (multi-level cycles up to 20 levels)
- Software metrics calculation (Maintainability Index, Instability, Coupling)
- Quick fix code actions for all violation types
- Architecture report export (JSON, HTML, Markdown)
- Unused import detection
- Enhanced HTML report with dark-themed dashboard

### Changed
- Improved README documentation with comprehensive feature descriptions
- Enhanced ReportExporter with XSS protection and better UI

### Optimized
- Architecture validation system refactored into `ValidationService` for better maintainability
- Implemented intelligent caching for validation results to ensure instant feedback when switching tabs
- Reduced redundant analysis triggers using document version tracking

---

## [0.0.1] - 2026-01-03

### Added
- 🏛️ **Core Architecture Enforcement**
  - Multi-language import parsing (JavaScript, TypeScript, Python, Go, Java, C#, PHP, Ruby, Rust, Dart)
  - Custom rule engine with glob pattern matching
  - Architecture layer validation with unidirectional dependency enforcement
  - Module encapsulation checking (index.js preference)
  
- 🔄 **Circular Dependency Detection**
  - Direct cycle detection (A ↔ B)
  - Deep cycle detection (A → B → C → A) with configurable depth
  
- 🧠 **AI-Powered Analysis**
  - Statistical anomaly detection using Z-Score analysis
  - Vector Space Model for code tokenization
  - K-Nearest Neighbors classification for file similarity
  - Semantic path analysis based on Clean Architecture principles
  
- 📊 **Software Metrics**
  - Maintainability Index (Grades A-F)
  - Instability Index (Robert C. Martin formula)
  - Afferent and Efferent Coupling metrics
  - Project health score
  
- ⚡ **Quick Fix Actions**
  - Extract shared code to common module
  - Apply Dependency Injection pattern
  - Create adapter/facade
  - Depend on abstraction
  - Split file into smaller modules
  - Suppress warning with comment
  
- 📁 **Report Generation**
  - JSON format for CI/CD integration
  - HTML format with styled dashboard
  - Markdown format for documentation
  
- 🌍 **Localization**
  - Full English language support
  - Full Thai language support (ภาษาไทย)
  
- 🎨 **User Interface**
  - Status bar integration showing overall health
  - Sidebar panel with file metrics and AI insights
  - Editor decorations with violation highlighting
  - Problems panel integration

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes