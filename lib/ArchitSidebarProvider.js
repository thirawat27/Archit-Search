const vscode = require('vscode');
const Localization = require('./Localization');

/**
 * Icon mapping for status types
 */
const STATUS_ICONS = {
    'Error': 'error',
    'Warning': 'warning',
    'Healthy': 'check',
    'Idle': 'check'
};

/**
 * ArchitSidebarProvider provides a tree view for architecture health information.
 * Displays file stats, violations, and AI insights in the VS Code sidebar.
 * Supports multi-language display via Localization.
 */
class ArchitSidebarProvider {
    /**
     * Creates a new ArchitSidebarProvider instance.
     * 
     * @param {import('./AIKernel')} aiKernel - AI Kernel instance for stats
     */
    constructor(aiKernel) {
        /** @type {vscode.EventEmitter<void>} */
        this._onDidChangeTreeData = new vscode.EventEmitter();
        
        /** @type {vscode.Event<void>} */
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        
        /** @type {import('./AIKernel')} */
        this.aiKernel = aiKernel;
        
        /** @type {Object} */
        this.currentData = this._getDefaultData();
        
        // Subscribe to language changes
        this._unsubscribe = Localization.onLanguageChange(() => {
            this._onDidChangeTreeData.fire();
        });
    }

    /**
     * Gets default data with localized strings.
     * @returns {Object}
     * @private
     */
    _getDefaultData() {
        return {
            filename: null, // null means "no active file"
            status: 'Idle',
            violations: 0,
            imports: 0,
            anomalyScore: 'N/A'
        };
    }

    /**
     * Refreshes the sidebar with new information.
     * 
     * @param {Object} info - Updated information
     */
    refresh(info) {
        this.currentData = { ...this.currentData, ...info };
        this._onDidChangeTreeData.fire();
    }

    /**
     * Resets the sidebar to default state.
     */
    reset() {
        this.currentData = this._getDefaultData();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the tree item representation for an element.
     * 
     * @param {vscode.TreeItem} element - Tree element
     * @returns {vscode.TreeItem}
     */
    getTreeItem(element) {
        return element;
    }

    /**
     * Gets the children of a tree element.
     * 
     * @param {vscode.TreeItem | undefined} element - Parent element
     * @returns {vscode.TreeItem[]}
     */
    getChildren(element) {
        if (element) {
            return [];
        }

        // Root items
        return this._buildTreeItems();
    }

    /**
     * Builds the full tree item list for the sidebar.
     * 
     * @returns {vscode.TreeItem[]}
     * @private
     */
    _buildTreeItems() {
        const items = [];

        // 1. Current File Header
        items.push(this._createFileItem());

        // 2. Status
        items.push(this._createStatusItem());

        // 3. Imports Count
        items.push(this._createItem(
            Localization.get('sidebarImports', this.currentData.imports), 
            'symbol-interface'
        ));

        // 4. Violations Count
        items.push(this._createItem(
            Localization.get('sidebarViolations', this.currentData.violations), 
            'alert'
        ));

        // 5. Divider
        items.push(this._createDivider());

        // 6. AI Insights Section
        items.push(...this._createAIInsightsItems());

        return items;
    }

    /**
     * Creates the file info tree item.
     * 
     * @returns {vscode.TreeItem}
     * @private
     */
    _createFileItem() {
        const filename = this.currentData.filename || Localization.get('sidebarNoActiveFile');
        const fileItem = new vscode.TreeItem(
            Localization.get('sidebarFile', filename),
            vscode.TreeItemCollapsibleState.None
        );
        fileItem.iconPath = new vscode.ThemeIcon('file-code');
        return fileItem;
    }

    /**
     * Creates the status tree item with appropriate icon.
     * 
     * @returns {vscode.TreeItem}
     * @private
     */
    _createStatusItem() {
        const statusKey = `status${this.currentData.status}`;
        const localizedStatus = Localization.get(statusKey);
        const statusIcon = STATUS_ICONS[this.currentData.status] || 'check';
        
        return this._createItem(
            Localization.get('sidebarStatus', localizedStatus), 
            statusIcon
        );
    }

    /**
     * Creates a divider tree item.
     * 
     * @returns {vscode.TreeItem}
     * @private
     */
    _createDivider() {
        const divider = new vscode.TreeItem('', vscode.TreeItemCollapsibleState.None);
        divider.description = '─────────────';
        return divider;
    }

    /**
     * Creates the AI insights section items.
     * 
     * @returns {vscode.TreeItem[]}
     * @private
     */
    _createAIInsightsItems() {
        const items = [];

        // Section header
        const headerItem = new vscode.TreeItem(
            Localization.get('sidebarAIInsights'),
            vscode.TreeItemCollapsibleState.Expanded
        );
        items.push(headerItem);

        // Anomaly Score
        items.push(this._createItem(
            Localization.get('sidebarAnomalyScore', this.currentData.anomalyScore),
            'pulse'
        ));

        // Project Stats from AI Kernel
        const stats = this._getAIStats();
        items.push(this._createItem(
            Localization.get('sidebarProjectAvgImports', stats.mean), 
            'graph'
        ));
        items.push(this._createItem(
            Localization.get('sidebarProjectStdDev', stats.stdDev), 
            'settings-gear'
        ));

        return items;
    }

    /**
     * Gets AI statistics from the kernel.
     * 
     * @returns {{mean: string, stdDev: string}}
     * @private
     */
    _getAIStats() {
        if (!this.aiKernel?.statsModel) {
            return { mean: '?', stdDev: '?' };
        }

        return {
            mean: String(Math.round(this.aiKernel.statsModel.mean)),
            stdDev: this.aiKernel.statsModel.stdDev.toFixed(1)
        };
    }

    /**
     * Creates a generic tree item with label and icon.
     * 
     * @param {string} label - Item label
     * @param {string} iconName - VS Code icon name
     * @returns {vscode.TreeItem}
     * @private
     */
    _createItem(label, iconName) {
        const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
        item.iconPath = new vscode.ThemeIcon(iconName);
        return item;
    }

    /**
     * Disposes of resources.
     */
    dispose() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        this._onDidChangeTreeData.dispose();
    }
}

module.exports = ArchitSidebarProvider;
