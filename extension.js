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
const ValidationService = require('./lib/ValidationService');

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

    // Initialize validation service
    const validationService = new ValidationService({
        engine, parser, visualizer, graph, advisor, 
        statusBar, aiKernel, sidebarProvider, 
        deepCycleDetector, unusedImportDetector
    });

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

    // Register event listeners
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            if (editor) {
                validationService.triggerValidation(editor);
            } else {
                validationService.triggerValidation(null);
            }
        }),

        vscode.workspace.onDidChangeTextDocument(event => {
            if (activeEditor && event.document === activeEditor.document) {
                validationService.triggerValidation(activeEditor);
            }
        }),

        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('architSearch')) {
                const newConfig = vscode.workspace.getConfiguration('architSearch');
                Localization.setLanguage(newConfig.get('language') || 'en');
                if (activeEditor) {
                    validationService.triggerValidation(activeEditor);
                }
            }
        })
    );
        
    // Initial validation
    if (activeEditor) {
        validationService.triggerValidation(activeEditor);
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
 * Deactivates the extension.
 */
function deactivate() {
    // Cleanup is handled by disposables
}

module.exports = {
    activate,
    deactivate
};
