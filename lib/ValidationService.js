const vscode = require('vscode');
const path = require('path');
const Localization = require('./Localization');

/**
 * Service responsible for orchestrating real-time file validation.
 * Handles duplicate checks, caching, and UI updates.
 */
class ValidationService {
    /**
     * @param {Object} components - Dependency components
     * @param {import('./RuleEngine')} components.engine
     * @param {import('./ImportParser')} components.parser
     * @param {import('./Visualizer')} components.visualizer
     * @param {import('./GraphAnalyzer')} components.graph
     * @param {import('./SmartAdvisor')} components.advisor
     * @param {import('./StatusBarManager')} components.statusBar
     * @param {import('./AIKernel')} components.aiKernel
     * @param {import('./ArchitSidebarProvider')} components.sidebarProvider
     * @param {import('./DeepCycleDetector')} components.deepCycleDetector
     * @param {import('./UnusedImportDetector')} components.unusedImportDetector
     */
    constructor(components) {
        this.engine = components.engine;
        this.parser = components.parser;
        this.visualizer = components.visualizer;
        this.graph = components.graph;
        this.advisor = components.advisor;
        this.statusBar = components.statusBar;
        this.aiKernel = components.aiKernel;
        this.sidebarProvider = components.sidebarProvider;
        this.deepCycleDetector = components.deepCycleDetector;
        this.unusedImportDetector = components.unusedImportDetector;

        this.validationTimeout = undefined;
        this.validationCache = new Map(); // Key: fsPath, Value: { version, violations, stats }
        
        this.DEFAULTS = {
            VALIDATION_THROTTLE_MS: 500,
            MAX_IMPORTS: 20
        };
    }

    /**
     * Triggers validation with throttling.
     * @param {vscode.TextEditor} editor - Active editor
     * @param {number} [throttleMs] - Delay in ms
     */
    triggerValidation(editor, throttleMs) {
        if (!editor || editor.document.uri.scheme !== 'file') {
            // Clean up UI if not a file or no editor
            if (!editor) {
                this.statusBar.update([]);
                this.sidebarProvider.reset();
            }
            return;
        }

        const delay = throttleMs !== undefined ? throttleMs : this.DEFAULTS.VALIDATION_THROTTLE_MS;

        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }

        this.validationTimeout = setTimeout(() => {
            this.validateFile(editor);
        }, delay);
    }

    /**
     * Validates the file in the editor.
     * Checks cache first to optimize performance on tab switching.
     * @param {vscode.TextEditor} editor 
     */
    validateFile(editor) {
        if (!editor) return;
        
        const doc = editor.document;
        const cacheKey = doc.uri.fsPath;
        const cached = this.validationCache.get(cacheKey);

        // Optimization: Use cached result if document version hasn't changed
        // This makes tab switching instant
        if (cached && cached.version === doc.version) {
            this._updateUI(editor, cached.violations, cached.stats);
            return;
        }

        const text = doc.getText();
        const config = vscode.workspace.getConfiguration('architSearch');

        // Validation Settings
        const rules = config.get('rules') || [];
        const layers = config.get('layers') || [];
        const maxImports = config.get('maxImports') || this.DEFAULTS.MAX_IMPORTS;
        const checkEncapsulation = config.get('enforceEncapsulation') !== false;
        const checkCycles = config.get('checkCycles') !== false;
        const enableAI = config.get('enableAI') !== false;
        const detectUnused = config.get('detectUnusedImports') === true;
        const checkDeepCycles = config.get('checkDeepCycles') !== false;

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
        const currentFilePathRelative = workspaceFolder
            ? vscode.workspace.asRelativePath(doc.uri, false)
            : path.basename(doc.fileName);

        // Run Analysis
        const imports = this.parser.parse(text, doc.languageId);
        const violations = [];
        let anomalyScore = '0.0';

        // 1. God Object Check
        if (imports.length > maxImports) {
            violations.push(this._createViolation(
                new vscode.Range(0, 0, 0, 0),
                Localization.get('godObject', imports.length, maxImports),
                vscode.DiagnosticSeverity.Warning
            ));
        }

        // 2. AI Anomaly Detection
        if (enableAI) {
            const anomaly = this.aiKernel.detectAnomaly(text);
            if (anomaly) {
                anomalyScore = anomaly.score;
                if (anomaly.isAnomaly) {
                    violations.push(this._createViolation(
                        new vscode.Range(0, 0, 0, 0),
                        Localization.get('anomaly', anomaly.score, Math.round(this.aiKernel.statsModel?.mean || 0)),
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
            }
        }

        // 3. Unused Imports
        if (detectUnused) {
            const unusedImports = this.unusedImportDetector.detect(text, doc.languageId);
            for (const unused of unusedImports) {
                const startPos = doc.positionAt(unused.index);
                const endPos = doc.positionAt(unused.index + unused.length);
                violations.push(this._createViolation(
                    new vscode.Range(startPos, endPos),
                    `Unused import '${unused.name}' - Consider removing it`,
                    vscode.DiagnosticSeverity.Hint
                ));
            }
        }

        // 4. Deep Cycles
        if (checkDeepCycles && this.deepCycleDetector) {
            const deepCycleResult = this.deepCycleDetector.detectDeepCycle(doc.uri.fsPath);
            if (deepCycleResult?.hasCycle) {
                violations.push(this._createViolation(
                    new vscode.Range(0, 0, 0, 0),
                    `🔄 ${deepCycleResult.message}`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        // 5. Individual Import Checks
        for (const imp of imports) {
            const importViolations = this._checkImport(
                imp, doc, currentFilePathRelative,
                { rules, layers, checkEncapsulation, checkCycles, enableAI }
            );
            violations.push(...importViolations);
        }

        // Process Stats
        const stats = {
            importCount: imports.length,
            anomalyScore: anomalyScore
        };

        // Cache Results
        this.validationCache.set(cacheKey, {
            version: doc.version,
            violations,
            stats
        });

        // Update UI
        this._updateUI(editor, violations, stats);
    }

    _updateUI(editor, violations, stats) {
        this.visualizer.report(editor, violations);
        this.statusBar.update(violations);
        this._updateSidebar(editor.document, violations, stats.importCount, stats.anomalyScore);
    }

    _checkImport(imp, doc, currentFilePathRelative, options) {
        const { rules, layers, checkEncapsulation, checkCycles, enableAI } = options;
        const violations = [];

        let resolvedRelativePath = imp.path;
        let resolvedAbsolutePath = null;

        if (imp.path.startsWith('.')) {
            const currentDir = path.dirname(doc.uri.fsPath);
            resolvedAbsolutePath = path.resolve(currentDir, imp.path);
            resolvedRelativePath = vscode.workspace.asRelativePath(resolvedAbsolutePath, false);
        }

        // Rule Engine Validation
        const archResult = this.engine.validate(
            currentFilePathRelative,
            resolvedRelativePath,
            rules,
            layers
        );

        if (archResult?.isViolation) {
            violations.push(this._createViolation(
                this._createRangeFromImport(doc, imp),
                archResult.message,
                vscode.DiagnosticSeverity.Error
            ));
            return violations;
        }

        if (!resolvedAbsolutePath) return violations;

        // Encapsulation
        if (checkEncapsulation) {
            const encResult = this.engine.checkEncapsulation(resolvedAbsolutePath);
            if (encResult?.isViolation) {
                violations.push(this._createViolation(
                    this._createRangeFromImport(doc, imp),
                    encResult.message,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        // Circular Dependencies
        if (checkCycles) {
            const cycleResult = this.graph.checkCycle(doc.uri.fsPath, resolvedAbsolutePath);
            if (cycleResult?.isCycle) {
                violations.push(this._createViolation(
                    this._createRangeFromImport(doc, imp),
                    cycleResult.message,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        // Semantic Analysis
        if (enableAI) {
            const aiResult = this.advisor.analyze(doc.uri.fsPath, resolvedAbsolutePath);
            if (aiResult?.isSuspicious) {
                violations.push(this._createViolation(
                    this._createRangeFromImport(doc, imp),
                    aiResult.message,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        return violations;
    }

    _createViolation(range, message, severity) {
        return { range, message, severity };
    }

    _createRangeFromImport(doc, imp) {
        const startPos = doc.positionAt(imp.index);
        const endPos = doc.positionAt(imp.index + imp.length);
        return new vscode.Range(startPos, endPos);
    }

    _updateSidebar(doc, violations, importCount, anomalyScore) {
        const hasErrors = violations.some(v => v.severity === vscode.DiagnosticSeverity.Error);
        const hasWarnings = violations.some(v => v.severity === vscode.DiagnosticSeverity.Warning);

        let status = 'Healthy';
        if (hasErrors) status = 'Error';
        else if (hasWarnings) status = 'Warning';

        this.sidebarProvider.refresh({
            filename: path.basename(doc.uri.fsPath),
            status: status,
            violations: violations.length,
            imports: importCount,
            anomalyScore: anomalyScore
        });
    }

    dispose() {
        if (this.validationTimeout) clearTimeout(this.validationTimeout);
        this.validationCache.clear();
    }
}

module.exports = ValidationService;
