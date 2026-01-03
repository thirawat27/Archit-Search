const vscode = require('vscode');
const Localization = require('./Localization');

/**
 * Status bar colors as constants for maintainability
 */
const STATUS_COLORS = {
    HEALTHY: '#58d258',
    ERROR: '#ff4444',
    WARNING: '#ffbb33'
};

/**
 * Status bar icons
 */
const STATUS_ICONS = {
    HEALTHY: '✅',
    ERROR: '⛔',
    WARNING: '⚠️'
};

/**
 * Manages the VS Code status bar item for architecture health display.
 * Shows real-time violation counts and overall status.
 * Supports multi-language display via Localization.
 */
class StatusBarManager {
    /**
     * Creates a new StatusBarManager instance.
     */
    constructor() {
        /** @type {vscode.StatusBarItem} */
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left, 
            100
        );
        this.statusBarItem.command = 'workbench.action.problems.focus';
        
        // Subscribe to language changes
        this._unsubscribe = Localization.onLanguageChange(() => {
            // Re-render with current data
            this._lastViolations && this.update(this._lastViolations);
        });
        
        /** @type {Array} */
        this._lastViolations = [];
        
        this.update([]); // Show immediately on init
    }

    /**
     * Updates the status bar with current violation information.
     * @param {Array<{severity?: vscode.DiagnosticSeverity, message: string, range: vscode.Range}>} violations - Array of violation objects
     */
    update(violations) {
        this._lastViolations = violations;
        
        if (!violations || violations.length === 0) {
            this._setHealthyStatus();
        } else {
            this._setViolationStatus(violations);
        }
        this.statusBarItem.show();
    }

    /**
     * Sets the status bar to healthy state.
     * @private
     */
    _setHealthyStatus() {
        this.statusBarItem.text = `${STATUS_ICONS.HEALTHY} ${Localization.get('statusBarHealthy')}`;
        this.statusBarItem.color = STATUS_COLORS.HEALTHY;
        this.statusBarItem.tooltip = Localization.get('statusBarTooltipHealthy');
    }

    /**
     * Sets the status bar to violation state with error/warning count.
     * @param {Array<{severity?: vscode.DiagnosticSeverity}>} violations - Array of violations
     * @private
     */
    _setViolationStatus(violations) {
        const errorCount = violations.filter(
            v => !v.severity || v.severity === vscode.DiagnosticSeverity.Error
        ).length;
        const warningCount = violations.length - errorCount;

        if (errorCount > 0) {
            this.statusBarItem.text = `${STATUS_ICONS.ERROR} ${Localization.get('statusBarError', errorCount, Localization.plural(errorCount))}`;
            this.statusBarItem.color = STATUS_COLORS.ERROR;
        } else {
            this.statusBarItem.text = `${STATUS_ICONS.WARNING} ${Localization.get('statusBarWarning', warningCount, Localization.plural(warningCount))}`;
            this.statusBarItem.color = STATUS_COLORS.WARNING;
        }
        
        this.statusBarItem.tooltip = Localization.get('statusBarTooltipViolations', errorCount, warningCount);
    }

    /**
     * Hides the status bar item.
     */
    hide() {
        this.statusBarItem.hide();
    }

    /**
     * Disposes of the status bar item and releases resources.
     */
    dispose() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        this.statusBarItem.dispose();
    }
}

module.exports = StatusBarManager;
