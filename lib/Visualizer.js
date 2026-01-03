const vscode = require('vscode');

/**
 * Decoration style configuration - Ghost Text Style
 */
const DECORATION_STYLES = {
    error: {
        backgroundColor: undefined, // No background
        textDecoration: undefined, // No strikethrough
        color: new vscode.ThemeColor('editorCodeLens.foreground'),
        margin: '0 0 0 3em',
        fontStyle: 'italic',
        prefix: '// 🛑 ' // Comment style
    },
    warning: {
        backgroundColor: undefined,
        textDecoration: undefined,
        color: new vscode.ThemeColor('editorCodeLens.foreground'),
        margin: '0 0 0 3em',
        fontStyle: 'italic',
        prefix: '// ⚠️ ' // Comment style
    }
};

/**
 * Diagnostic source identifier for architecture violations
 */
const DIAGNOSTIC_SOURCE = 'Archit Search';

/**
 * Visualizer renders architecture violations in the VS Code editor.
 * Uses "Ghost Text" style to append warnings as virtual comments.
 */
class Visualizer {
    /**
     * Creates a new Visualizer instance.
     */
    constructor() {
        /** @type {vscode.DiagnosticCollection} */
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('architecture-violations');

        /** @type {vscode.TextEditorDecorationType} */
        this.errorDecorationType = this._createDecorationType(DECORATION_STYLES.error);

        /** @type {vscode.TextEditorDecorationType} */
        this.warningDecorationType = this._createDecorationType(DECORATION_STYLES.warning);
    }

    /**
     * Creates a text editor decoration type from style configuration.
     * 
     * @param {object} style - Style configuration
     * @returns {vscode.TextEditorDecorationType}
     * @private
     */
    _createDecorationType(style) {
        return vscode.window.createTextEditorDecorationType({
            isWholeLine: true, // Apply to whole line to push text to the end
            after: {
                color: style.color,
                margin: style.margin,
                fontStyle: style.fontStyle
            }
        });
    }

    /**
     * Clears all decorations and diagnostics from the editor.
     * 
     * @param {vscode.TextEditor} editor - The text editor to clear
     */
    clear(editor) {
        if (!editor) {
            return;
        }

        editor.setDecorations(this.errorDecorationType, []);
        editor.setDecorations(this.warningDecorationType, []);
        this.diagnosticCollection.set(editor.document.uri, []);
    }

    /**
     * Reports violations by applying decorations and diagnostics.
     * 
     * @param {vscode.TextEditor} editor - The text editor to decorate
     * @param {Array<{range: vscode.Range, message: string, severity?: vscode.DiagnosticSeverity}>} violations - Array of violations
     */
    report(editor, violations) {
        if (!editor) {
            return;
        }

        const errorDecorations = [];
        const warningDecorations = [];
        const diagnostics = [];

        for (const violation of violations) {
            const severity = violation.severity ?? vscode.DiagnosticSeverity.Error;
            const isError = severity === vscode.DiagnosticSeverity.Error;
            const style = isError ? DECORATION_STYLES.error : DECORATION_STYLES.warning;

            // Create decoration
            const decoration = this._createDecoration(violation.range, violation.message, style.prefix);

            if (isError) {
                errorDecorations.push(decoration);
            } else {
                warningDecorations.push(decoration);
            }

            // Create diagnostic
            diagnostics.push(this._createDiagnostic(violation, severity));
        }

        // Apply decorations and diagnostics
        editor.setDecorations(this.errorDecorationType, errorDecorations);
        editor.setDecorations(this.warningDecorationType, warningDecorations);
        this.diagnosticCollection.set(editor.document.uri, diagnostics);
    }

    /**
     * Creates a decoration options object.
     * 
     * @param {vscode.Range} range - Text range for the decoration
     * @param {string} message - Violation message
     * @param {string} prefix - Prefix string to display (e.g., '// ⚠️ ')
     * @returns {vscode.DecorationOptions}
     * @private
     */
    _createDecoration(range, message, prefix) {
        return {
            range: range,
            hoverMessage: message,
            renderOptions: {
                after: {
                    contentText: `${prefix}${message}`
                }
            }
        };
    }

    /**
     * Creates a diagnostic object.
     * 
     * @param {{range: vscode.Range, message: string}} violation - Violation data
     * @param {vscode.DiagnosticSeverity} severity - Diagnostic severity
     * @returns {vscode.Diagnostic}
     * @private
     */
    _createDiagnostic(violation, severity) {
        const diagnostic = new vscode.Diagnostic(
            violation.range,
            violation.message,
            severity
        );
        diagnostic.source = DIAGNOSTIC_SOURCE;
        diagnostic.code = severity === vscode.DiagnosticSeverity.Error 
            ? 'ARCH_ERROR' 
            : 'ARCH_WARN';
        return diagnostic;
    }

    /**
     * Clears diagnostics for a specific document URI.
     * 
     * @param {vscode.Uri} uri - Document URI
     */
    clearForDocument(uri) {
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Clears all diagnostics across all documents.
     */
    clearAll() {
        this.diagnosticCollection.clear();
    }

    /**
     * Disposes of all resources.
     */
    dispose() {
        this.diagnosticCollection.dispose();
        this.errorDecorationType.dispose();
        this.warningDecorationType.dispose();
    }
}

module.exports = Visualizer;
