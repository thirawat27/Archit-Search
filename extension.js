/**
 * @fileoverview Archit Search - Intelligent Architecture Enforcement Extension
 * 
 * A comprehensive VS Code extension that combines rule-based validation with
 * AI-powered anomaly detection to prevent spaghetti code and enforce clean architecture.
 * 
 * @module archit-search
 * @version 0.0.1
 * @license GPL-3.0
 * @author Thirawat27
 * 
 * ## Features
 * - Multi-language import parsing (10+ languages)
 * - Direct circular dependency detection (A ↔ B)
 * - Deep circular dependency detection (A → B → C → A, up to 20 levels)
 * - Architecture layer enforcement
 * - Custom rule engine with glob pattern matching
 * - AI-powered anomaly detection using Vector Space Models
 * - Semantic path analysis for Clean Architecture violations
 * - Software metrics calculation (Maintainability, Instability, Coupling)
 * - Unused import detection
 * - Quick fix code actions
 * - Report generation (JSON, HTML, Markdown)
 * - Multi-language localization (English, Thai)
 */

const vscode = require('vscode');
const path = require('path');

// Core validation modules
const RuleEngine = require('./lib/RuleEngine');
const ImportParser = require('./lib/ImportParser');
const Visualizer = require('./lib/Visualizer');
const GraphAnalyzer = require('./lib/GraphAnalyzer');
const SmartAdvisor = require('./lib/SmartAdvisor');
const StatusBarManager = require('./lib/StatusBarManager');
const AIKernel = require('./lib/AIKernel');
const Localization = require('./lib/Localization');
const ArchitSidebarProvider = require('./lib/ArchitSidebarProvider');

// Advanced analysis modules
const DeepCycleDetector = require('./lib/DeepCycleDetector');
const MetricsCalculator = require('./lib/MetricsCalculator');
const QuickFixProvider = require('./lib/QuickFixProvider');
const ReportExporter = require('./lib/ReportExporter');
const UnusedImportDetector = require('./lib/UnusedImportDetector');

/**
 * Extension configuration defaults
 */
const DEFAULTS = {
    MAX_IMPORTS: 20,
    VALIDATION_THROTTLE_MS: 500,
    AI_LEARNING_DELAY_MS: 3000
};

/**
 * Supported file extensions for AI learning
 */
const SUPPORTED_FILE_PATTERNS = '**/*.{js,jsx,ts,tsx,go,py,java,cs,php,rb,rs,dart}';

/**
 * Activates the extension.
 * 
 * @param {vscode.ExtensionContext} context - Extension context
 */
function activate(context) {
    // Initialize configuration and localization
    const config = vscode.workspace.getConfiguration('architSearch');
    Localization.setLanguage(config.get('language') || 'en');

    console.log(Localization.get('activeMessage'));

    // Initialize core components
    const engine = new RuleEngine();
    const parser = new ImportParser();
    const visualizer = new Visualizer();
    const graph = new GraphAnalyzer();
    const advisor = new SmartAdvisor();
    const statusBar = new StatusBarManager();
    const aiKernel = new AIKernel();
    const sidebarProvider = new ArchitSidebarProvider(aiKernel);

    // Initialize advanced components
    const deepCycleDetector = new DeepCycleDetector();
    const metricsCalculator = new MetricsCalculator();
    const quickFixProvider = new QuickFixProvider();
    const reportExporter = new ReportExporter(metricsCalculator, deepCycleDetector);
    const unusedImportDetector = new UnusedImportDetector();

    // Register sidebar tree view
    const treeView = vscode.window.createTreeView('architSearchSidebar', {
        treeDataProvider: sidebarProvider
    });

    // Register Code Action Provider for quick fixes
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        { scheme: 'file', pattern: SUPPORTED_FILE_PATTERNS },
        quickFixProvider,
        { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.Refactor] }
    );

    // Register commands
    const exportReportCmd = vscode.commands.registerCommand('archit-search.exportReport', async () => {
        const format = await vscode.window.showQuickPick(['json', 'html', 'markdown'], {
            placeHolder: 'Select report format'
        });
        if (format) {
            const success = await reportExporter.exportWithDialog(format);
            if (success) {
                vscode.window.showInformationMessage('Report exported successfully!');
            }
        }
    });

    const showMetricsCmd = vscode.commands.registerCommand('archit-search.showMetrics', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const metrics = metricsCalculator.getFileMetrics(editor.document.uri.fsPath);
            const message = `Maintainability - ${metrics.maintainability.grade} (${metrics.maintainability.index}) | Instability - ${metrics.instability.classification} (${metrics.instability.instability})`;
            vscode.window.showInformationMessage(message);
        }
    });

    const detectDeepCyclesCmd = vscode.commands.registerCommand('archit-search.detectDeepCycles', async () => {
        const cycles = deepCycleDetector.getAllCycles();
        if (cycles.length === 0) {
            vscode.window.showInformationMessage('No deep circular dependencies found!');
        } else {
            vscode.window.showWarningMessage(`Found ${cycles.length} deep circular dependencies. Check the Problems panel.`);
        }
    });

    const showRefactorGuideCmd = vscode.commands.registerCommand('archit-search.showRefactorGuide', (type) => {
        const guides = {
            'cycle': 'To break circular dependencies, extract shared code into a new module that both files can import.',
            'dependency-injection': 'Use Dependency Injection: Pass dependencies as parameters instead of importing directly.',
            'layer-adapter': 'Create an adapter or facade in the correct layer to bridge the dependency gap.',
            'interface-segregation': 'Define an interface/type that abstracts the implementation details.',
            'split-module': 'Identify responsibilities and split the file into focused modules.',
            'facade-pattern': 'Create a facade module that re-exports commonly used dependencies.'
        };
        const guide = guides[type] || 'Review Clean Architecture principles for guidance.';
        vscode.window.showInformationMessage(guide);
    });

    const explainViolationCmd = vscode.commands.registerCommand('archit-search.explainViolation', (message) => {
        vscode.window.showInformationMessage(`AI Analysis - ${message}`);
    });

    const analyzeProjectCmd = vscode.commands.registerCommand('archit-search.analyzeProject', async () => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Archit Search',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Scanning project files...' });
            
            const files = await vscode.workspace.findFiles(SUPPORTED_FILE_PATTERNS);
            const filePaths = files.map(f => f.fsPath);
            
            progress.report({ message: `Analyzing ${filePaths.length} files...` });
            
            // Run all analyses
            aiKernel.learn(filePaths);
            deepCycleDetector.buildGraph(filePaths);
            metricsCalculator.analyze(filePaths);
            
            progress.report({ message: 'Generating report...' });
            
            const cycles = deepCycleDetector.getAllCycles();
            const summary = metricsCalculator.getProjectSummary();
            
            sidebarProvider.refresh({});
            
            const resultMessage = `Analysis complete! Files - ${filePaths.length} | Health - ${summary.healthScore} | Cycles - ${cycles.length}`;
            vscode.window.showInformationMessage(resultMessage);
        });
    });

    // Register disposables
    context.subscriptions.push(
        statusBar, visualizer, treeView, codeActionProvider,
        exportReportCmd, showMetricsCmd, detectDeepCyclesCmd,
        showRefactorGuideCmd, explainViolationCmd, analyzeProjectCmd
    );

    // Start background AI learning
    scheduleAILearning(aiKernel, sidebarProvider, deepCycleDetector, metricsCalculator);

    // Validation state
    let activeEditor = vscode.window.activeTextEditor;
    let validationTimeout = undefined;

    /**
     * Triggers validation with optional throttle.
     * @param {number} throttleMs - Throttle delay in milliseconds
     */
    function triggerValidation(throttleMs = DEFAULTS.VALIDATION_THROTTLE_MS) {
        if (validationTimeout) {
            clearTimeout(validationTimeout);
            validationTimeout = undefined;
        }
        validationTimeout = setTimeout(() => validateCurrentFile(), throttleMs);
    }

    // Initial validation if editor is active
    if (activeEditor) {
        triggerValidation();
    }

    // Register event listeners
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            if (editor) {
                triggerValidation();
            } else {
                // Clear status when no editor is active
                statusBar.update([]);
                sidebarProvider.reset();
            }
        }),

        vscode.workspace.onDidChangeTextDocument(event => {
            if (activeEditor && event.document === activeEditor.document) {
                triggerValidation();
            }
        }),

        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('architSearch')) {
                const newConfig = vscode.workspace.getConfiguration('architSearch');
                Localization.setLanguage(newConfig.get('language') || 'en');
                triggerValidation();
            }
        })
    );

    /**
     * Validates the current file for architecture violations.
     */
    function validateCurrentFile() {
        if (!activeEditor) {
            return;
        }

        const doc = activeEditor.document;
        const text = doc.getText();
        const config = vscode.workspace.getConfiguration('architSearch');

        // Get configuration values
        const rules = config.get('rules') || [];
        const layers = config.get('layers') || [];
        const maxImports = config.get('maxImports') || DEFAULTS.MAX_IMPORTS;
        const checkEncapsulation = config.get('enforceEncapsulation') !== false;
        const checkCycles = config.get('checkCycles') !== false;
        const enableAI = config.get('enableAI') !== false;

        // Resolve file paths
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
        const currentFilePathRelative = workspaceFolder
            ? vscode.workspace.asRelativePath(doc.uri, false)
            : path.basename(doc.fileName);

        // Parse imports
        const imports = parser.parse(text, doc.languageId);

        const violations = [];
        let anomalyScore = '0.0';

        // 1. Check God Object (High Coupling)
        if (imports.length > maxImports) {
            violations.push(createViolation(
                new vscode.Range(0, 0, 0, 0),
                Localization.get('godObject', imports.length, maxImports),
                vscode.DiagnosticSeverity.Warning
            ));
        }

        // 2. AI Anomaly Detection
        if (enableAI) {
            const anomaly = aiKernel.detectAnomaly(text);
            if (anomaly) {
                anomalyScore = anomaly.score;
                if (anomaly.isAnomaly) {
                    violations.push(createViolation(
                        new vscode.Range(0, 0, 0, 0),
                        Localization.get('anomaly', anomaly.score, Math.round(aiKernel.statsModel?.mean || 0)),
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
            }
        }

        // 3. Unused Import Detection
        const detectUnused = config.get('detectUnusedImports') === true;
        if (detectUnused) {
            const unusedImports = unusedImportDetector.detect(text, doc.languageId);
            for (const unused of unusedImports) {
                const startPos = doc.positionAt(unused.index);
                const endPos = doc.positionAt(unused.index + unused.length);
                violations.push(createViolation(
                    new vscode.Range(startPos, endPos),
                    `Unused import '${unused.name}' - Consider removing it`,
                    vscode.DiagnosticSeverity.Hint
                ));
            }
        }

        // 4. Deep Cycle Detection (multi-level cycles like A → B → C → A)
        const checkDeepCycles = config.get('checkDeepCycles') !== false;
        if (checkDeepCycles && deepCycleDetector) {
            const deepCycleResult = deepCycleDetector.detectDeepCycle(doc.uri.fsPath);
            if (deepCycleResult?.hasCycle) {
                violations.push(createViolation(
                    new vscode.Range(0, 0, 0, 0),
                    `🔄 ${deepCycleResult.message}`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        // 5. Check each import for individual violations
        for (const imp of imports) {
            const importViolations = checkImport(
                imp, doc, currentFilePathRelative,
                { rules, layers, checkEncapsulation, checkCycles, enableAI },
                { engine, graph, advisor }
            );
            violations.push(...importViolations);
        }

        // Apply visualizations and update UI
        visualizer.report(activeEditor, violations);
        statusBar.update(violations);

        // Update sidebar
        updateSidebar(sidebarProvider, doc, violations, imports.length, anomalyScore);
    }

    /**
     * Checks a single import for violations.
     */
    function checkImport(imp, doc, currentFilePathRelative, options, components) {
        const { rules, layers, checkEncapsulation, checkCycles, enableAI } = options;
        const { engine, graph, advisor } = components;
        const violations = [];

        let resolvedRelativePath = imp.path;
        let resolvedAbsolutePath = null;

        // Resolve relative imports
        if (imp.path.startsWith('.')) {
            const currentDir = path.dirname(doc.uri.fsPath);
            resolvedAbsolutePath = path.resolve(currentDir, imp.path);
            resolvedRelativePath = vscode.workspace.asRelativePath(resolvedAbsolutePath, false);
        }

        // Check architecture rules
        const archResult = engine.validate(
            currentFilePathRelative,
            resolvedRelativePath,
            rules,
            layers
        );

        if (archResult?.isViolation) {
            violations.push(createViolation(
                createRangeFromImport(doc, imp),
                archResult.message,
                vscode.DiagnosticSeverity.Error
            ));
            return violations; // Stop further checks if strict violation
        }

        // Continue with heuristic checks only for local imports
        if (!resolvedAbsolutePath) {
            return violations;
        }

        // Check encapsulation
        if (checkEncapsulation) {
            const encResult = engine.checkEncapsulation(resolvedAbsolutePath);
            if (encResult?.isViolation) {
                violations.push(createViolation(
                    createRangeFromImport(doc, imp),
                    encResult.message,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        // Check circular dependencies
        if (checkCycles) {
            const cycleResult = graph.checkCycle(doc.uri.fsPath, resolvedAbsolutePath);
            if (cycleResult?.isCycle) {
                violations.push(createViolation(
                    createRangeFromImport(doc, imp),
                    cycleResult.message,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        // AI semantic analysis
        if (enableAI) {
            const aiResult = advisor.analyze(doc.uri.fsPath, resolvedAbsolutePath);
            if (aiResult?.isSuspicious) {
                violations.push(createViolation(
                    createRangeFromImport(doc, imp),
                    aiResult.message,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }

        return violations;
    }
}

/**
 * Schedules AI learning process.
 * 
 * @param {AIKernel} aiKernel - AI Kernel instance
 * @param {ArchitSidebarProvider} sidebarProvider - Sidebar provider instance
 * @param {DeepCycleDetector} deepCycleDetector - Deep cycle detector instance
 * @param {MetricsCalculator} metricsCalculator - Metrics calculator instance
 */
async function scheduleAILearning(aiKernel, sidebarProvider, deepCycleDetector, metricsCalculator) {
    setTimeout(async () => {
        try {
            const files = await vscode.workspace.findFiles(SUPPORTED_FILE_PATTERNS);
            const filePaths = files.map(f => f.fsPath);
            
            console.log(Localization.get('learningStart', filePaths.length));
            
            // AI Kernel learning
            aiKernel.learn(filePaths);
            
            // Build deep cycle dependency graph
            if (deepCycleDetector) {
                deepCycleDetector.buildGraph(filePaths);
                const graphStats = deepCycleDetector.getGraphStats();
                console.log(`[Archit Search] Dependency graph built - ${graphStats.totalFiles} files, ${graphStats.totalDependencies} dependencies`);
            }
            
            // Calculate metrics for all files
            if (metricsCalculator) {
                metricsCalculator.analyze(filePaths);
                const summary = metricsCalculator.getProjectSummary();
                console.log(`[Archit Search] Metrics analyzed - Health Score ${summary.healthScore}`);
            }
            
            console.log(Localization.get('learningDone'));
            
            sidebarProvider.refresh({});
        } catch (err) {
            console.error('AI Learning failed:', err);
        }
    }, DEFAULTS.AI_LEARNING_DELAY_MS);
}

/**
 * Creates a violation object.
 * 
 * @param {vscode.Range} range - Violation range
 * @param {string} message - Violation message
 * @param {vscode.DiagnosticSeverity} severity - Violation severity
 * @returns {{range: vscode.Range, message: string, severity: vscode.DiagnosticSeverity}}
 */
function createViolation(range, message, severity) {
    return { range, message, severity };
}

/**
 * Creates a range from an import position.
 * 
 * @param {vscode.TextDocument} doc - Document
 * @param {{index: number, length: number}} imp - Import info
 * @returns {vscode.Range}
 */
function createRangeFromImport(doc, imp) {
    const startPos = doc.positionAt(imp.index);
    const endPos = doc.positionAt(imp.index + imp.length);
    return new vscode.Range(startPos, endPos);
}

/**
 * Updates the sidebar with current file status.
 * 
 * @param {ArchitSidebarProvider} sidebarProvider - Sidebar provider
 * @param {vscode.TextDocument} doc - Current document
 * @param {Array} violations - Array of violations
 * @param {number} importCount - Number of imports
 * @param {string} anomalyScore - AI anomaly score
 */
function updateSidebar(sidebarProvider, doc, violations, importCount, anomalyScore) {
    const hasErrors = violations.some(v => v.severity === vscode.DiagnosticSeverity.Error);
    const hasWarnings = violations.some(v => v.severity === vscode.DiagnosticSeverity.Warning);

    let status = 'Healthy';
    if (hasErrors) {
        status = 'Error';
    } else if (hasWarnings) {
        status = 'Warning';
    }

    sidebarProvider.refresh({
        filename: path.basename(doc.uri.fsPath),
        status: status,
        violations: violations.length,
        imports: importCount,
        anomalyScore: anomalyScore
    });
}

/**
 * Deactivates the extension.
 */
function deactivate() {
    // Cleanup is handled by disposables
}

module.exports = {
    activate,
    deactivate
};
