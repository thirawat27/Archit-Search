const vscode = require('vscode');

/**
 * QuickFixProvider provides Code Actions for architecture violations.
 * Implements vscode.CodeActionProvider to offer quick fixes in the editor.
 */
class QuickFixProvider {
    /**
     * Provides code actions for a document.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Range} range - The range of interest
     * @param {vscode.CodeActionContext} context - Context including diagnostics
     * @returns {vscode.CodeAction[]} Array of code actions
     */
    provideCodeActions(document, range, context) {
        const actions = [];

        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== 'Archit Search') {
                continue;
            }

            const message = diagnostic.message.toLowerCase();

            // Circular Dependency fixes
            if (message.includes('circular') || message.includes('cycle')) {
                actions.push(...this._createCycleActions(document, diagnostic));
            }

            // Layer Violation fixes
            if (message.includes('layer')) {
                actions.push(...this._createLayerActions(document, diagnostic));
            }

            // Encapsulation fixes
            if (message.includes('encapsulation') || message.includes('index')) {
                actions.push(...this._createEncapsulationActions(document, diagnostic));
            }

            // High Coupling fixes
            if (message.includes('coupling') || message.includes('god object') || message.includes('imports')) {
                actions.push(...this._createCouplingActions(document, diagnostic));
            }

            // AI Suspicious dependency
            if (message.includes('suspicious') || message.includes('semantic')) {
                actions.push(...this._createSemanticActions(document, diagnostic));
            }

            // Generic action - Add comment to suppress
            actions.push(this._createSuppressAction(document, diagnostic));
        }

        return actions;
    }

    /**
     * Creates actions for circular dependency violations.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Diagnostic} diagnostic - The diagnostic
     * @returns {vscode.CodeAction[]}
     * @private
     */
    _createCycleActions(document, diagnostic) {
        const actions = [];

        // Action 1 - Extract to shared module
        const extractAction = new vscode.CodeAction(
            '📦 Extract shared code to a common module',
            vscode.CodeActionKind.Refactor
        );
        extractAction.diagnostics = [diagnostic];
        extractAction.isPreferred = false;
        extractAction.command = {
            command: 'archit-search.showRefactorGuide',
            title: 'Show Refactor Guide',
            arguments: ['cycle', document.uri]
        };
        actions.push(extractAction);

        // Action 2 - Convert to dependency injection
        const diAction = new vscode.CodeAction(
            '💉 Use Dependency Injection pattern',
            vscode.CodeActionKind.Refactor
        );
        diAction.diagnostics = [diagnostic];
        diAction.command = {
            command: 'archit-search.showRefactorGuide',
            title: 'Show DI Guide',
            arguments: ['dependency-injection', document.uri]
        };
        actions.push(diAction);

        // Action 3 - Comment the import temporarily
        const commentAction = new vscode.CodeAction(
            '💬 Comment out this import',
            vscode.CodeActionKind.QuickFix
        );
        commentAction.diagnostics = [diagnostic];
        commentAction.edit = this._createCommentEdit(document, diagnostic.range);
        actions.push(commentAction);

        return actions;
    }

    /**
     * Creates actions for layer violations.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Diagnostic} diagnostic - The diagnostic
     * @returns {vscode.CodeAction[]}
     * @private
     */
    _createLayerActions(document, diagnostic) {
        const actions = [];

        // Action 1 - Move import to allowed layer
        const moveAction = new vscode.CodeAction(
            '📂 Create an adapter/facade in the correct layer',
            vscode.CodeActionKind.Refactor
        );
        moveAction.diagnostics = [diagnostic];
        moveAction.command = {
            command: 'archit-search.showRefactorGuide',
            title: 'Show Layer Guide',
            arguments: ['layer-adapter', document.uri]
        };
        actions.push(moveAction);

        // Action 2 - Use interface/abstraction
        const interfaceAction = new vscode.CodeAction(
            '🔌 Depend on abstraction (interface) instead',
            vscode.CodeActionKind.Refactor
        );
        interfaceAction.diagnostics = [diagnostic];
        interfaceAction.command = {
            command: 'archit-search.showRefactorGuide',
            title: 'Show Interface Guide',
            arguments: ['interface-segregation', document.uri]
        };
        actions.push(interfaceAction);

        return actions;
    }

    /**
     * Creates actions for encapsulation violations.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Diagnostic} diagnostic - The diagnostic
     * @returns {vscode.CodeAction[]}
     * @private
     */
    _createEncapsulationActions(document, diagnostic) {
        const actions = [];

        // Action - Import from index instead
        const indexAction = new vscode.CodeAction(
            '📁 Import from module index file',
            vscode.CodeActionKind.QuickFix
        );
        indexAction.diagnostics = [diagnostic];
        indexAction.isPreferred = true;
        
        // Try to create edit to fix the import
        const edit = this._createIndexImportEdit(document, diagnostic);
        if (edit) {
            indexAction.edit = edit;
        }
        
        actions.push(indexAction);

        return actions;
    }

    /**
     * Creates actions for high coupling violations.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Diagnostic} diagnostic - The diagnostic
     * @returns {vscode.CodeAction[]}
     * @private
     */
    _createCouplingActions(document, diagnostic) {
        const actions = [];

        // Action 1 - Split into smaller modules
        const splitAction = new vscode.CodeAction(
            '✂️ Split file into smaller modules',
            vscode.CodeActionKind.Refactor
        );
        splitAction.diagnostics = [diagnostic];
        splitAction.command = {
            command: 'archit-search.showRefactorGuide',
            title: 'Show Split Guide',
            arguments: ['split-module', document.uri]
        };
        actions.push(splitAction);

        // Action 2 - Apply facade pattern
        const facadeAction = new vscode.CodeAction(
            '🏛️ Apply Facade Pattern to reduce imports',
            vscode.CodeActionKind.Refactor
        );
        facadeAction.diagnostics = [diagnostic];
        facadeAction.command = {
            command: 'archit-search.showRefactorGuide',
            title: 'Show Facade Guide',
            arguments: ['facade-pattern', document.uri]
        };
        actions.push(facadeAction);

        // Action 3 - Review and remove unused imports
        const unusedAction = new vscode.CodeAction(
            '🧹 Review imports for unused dependencies',
            vscode.CodeActionKind.QuickFix
        );
        unusedAction.diagnostics = [diagnostic];
        unusedAction.command = {
            command: 'editor.action.organizeImports',
            title: 'Organize Imports'
        };
        actions.push(unusedAction);

        return actions;
    }

    /**
     * Creates actions for semantic/AI detected violations.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Diagnostic} diagnostic - The diagnostic
     * @returns {vscode.CodeAction[]}
     * @private
     */
    _createSemanticActions(document, diagnostic) {
        const actions = [];

        // Action - Review dependency
        const reviewAction = new vscode.CodeAction(
            '🔍 Review this dependency relationship',
            vscode.CodeActionKind.QuickFix
        );
        reviewAction.diagnostics = [diagnostic];
        reviewAction.command = {
            command: 'archit-search.explainViolation',
            title: 'Explain Violation',
            arguments: [diagnostic.message]
        };
        actions.push(reviewAction);

        return actions;
    }

    /**
     * Creates a suppress action that adds a comment.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Diagnostic} diagnostic - The diagnostic
     * @returns {vscode.CodeAction}
     * @private
     */
    _createSuppressAction(document, diagnostic) {
        const action = new vscode.CodeAction(
            '🔇 Suppress this warning with comment',
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diagnostic];
        
        const edit = new vscode.WorkspaceEdit();
        const line = diagnostic.range.start.line;
        const position = new vscode.Position(line, 0);
        const lineText = document.lineAt(line).text;
        const indent = lineText.match(/^\s*/)[0];
        
        edit.insert(document.uri, position, `${indent}// archit-ignore: ${diagnostic.code}\n`);
        action.edit = edit;

        return action;
    }

    /**
     * Creates an edit to comment out a line.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Range} range - The range to comment
     * @returns {vscode.WorkspaceEdit}
     * @private
     */
    _createCommentEdit(document, range) {
        const edit = new vscode.WorkspaceEdit();
        const line = document.lineAt(range.start.line);
        const lineText = line.text;
        
        edit.replace(document.uri, line.range, `// ${lineText}`);
        return edit;
    }

    /**
     * Creates an edit to fix import to use index file.
     * 
     * @param {vscode.TextDocument} document - The document
     * @param {vscode.Diagnostic} diagnostic - The diagnostic
     * @returns {vscode.WorkspaceEdit | null}
     * @private
     */
    _createIndexImportEdit(document, diagnostic) {
        try {
            const line = document.lineAt(diagnostic.range.start.line);
            const lineText = line.text;
            
            // Match import path patterns
            const importMatch = lineText.match(/from\s+['"]([^'"]+)['"]/);
            const requireMatch = lineText.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
            
            const match = importMatch || requireMatch;
            if (!match) {
                return null;
            }

            const originalPath = match[1];
            const parts = originalPath.split('/');
            
            // Remove the specific file, keep directory
            if (parts.length > 1) {
                parts.pop(); // Remove filename
                const newPath = parts.join('/');
                const newLineText = lineText.replace(originalPath, newPath);
                
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, line.range, newLineText);
                return edit;
            }
        } catch {
            // Return null if we can't create the edit
        }
        return null;
    }
}

module.exports = QuickFixProvider;
