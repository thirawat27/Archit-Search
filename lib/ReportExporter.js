const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Available report export formats
 * @readonly
 * @enum {string}
 */
const REPORT_FORMATS = {
    /** JSON format for machine-readable output and CI/CD integration */
    JSON: 'json',
    /** HTML format with styled dashboard visualization */
    HTML: 'html',
    /** Markdown format for documentation and wikis */
    MARKDOWN: 'markdown'
};

/**
 * File extensions for each report format
 * @readonly
 */
const FORMAT_EXTENSIONS = {
    [REPORT_FORMATS.JSON]: 'json',
    [REPORT_FORMATS.HTML]: 'html',
    [REPORT_FORMATS.MARKDOWN]: 'md'
};

/**
 * Thresholds for generating recommendations
 * @readonly
 */
const THRESHOLDS = {
    /** Instability above this triggers a recommendation */
    HIGH_INSTABILITY: 0.7,
    /** Maintainability below this triggers a recommendation */
    LOW_MAINTAINABILITY: 50,
    /** Coupling above this triggers a recommendation */
    HIGH_COUPLING: 15
};

/**
 * Current extension version for report metadata
 */
const EXTENSION_VERSION = '0.0.1';

/**
 * ReportExporter generates comprehensive architecture analysis reports.
 * Supports JSON, HTML, and Markdown export formats with metrics visualization.
 */
class ReportExporter {
    /**
     * Creates a new ReportExporter instance.
     * 
     * @param {import('./MetricsCalculator')} metricsCalculator - Metrics calculator for project analysis
     * @param {import('./DeepCycleDetector')} deepCycleDetector - Deep cycle detector for dependency graph
     */
    constructor(metricsCalculator, deepCycleDetector) {
        /** @type {import('./MetricsCalculator') | null} */
        this.metrics = metricsCalculator;

        /** @type {import('./DeepCycleDetector') | null} */
        this.cycleDetector = deepCycleDetector;
    }

    /**
     * Exports an architecture report to the specified path.
     * 
     * @param {string} format - Report format (use REPORT_FORMATS enum)
     * @param {string} outputPath - Absolute path for the output file
     * @param {object} [additionalData={}] - Additional data to include in the report
     * @param {Array} [additionalData.violations] - Array of detected violations
     * @param {Array} [additionalData.fileMetrics] - Array of per-file metrics
     * @returns {Promise<boolean>} True if export succeeded, false otherwise
     */
    async exportReport(format, outputPath, additionalData = {}) {
        try {
            const reportData = this._collectReportData(additionalData);
            const content = this._generateContent(format, reportData);
            
            fs.writeFileSync(outputPath, content, 'utf-8');
            return true;
        } catch (error) {
            console.error('[ReportExporter] Export failed:', error.message);
            return false;
        }
    }

    /**
     * Generates report content based on format.
     * 
     * @param {string} format - Report format
     * @param {object} reportData - Collected report data
     * @returns {string} Generated content
     * @throws {Error} If format is unknown
     * @private
     */
    _generateContent(format, reportData) {
        switch (format) {
            case REPORT_FORMATS.JSON:
                return this._generateJSON(reportData);
            case REPORT_FORMATS.HTML:
                return this._generateHTML(reportData);
            case REPORT_FORMATS.MARKDOWN:
                return this._generateMarkdown(reportData);
            default:
                throw new Error(`Unknown format: ${format}`);
        }
    }

    /**
     * Collects all report data from metrics and cycle detector.
     * 
     * @param {object} additionalData - Additional data to merge
     * @returns {object} Complete report data object
     * @private
     */
    _collectReportData(additionalData) {
        const projectSummary = this.metrics?.getProjectSummary() || {};
        const cycles = this.cycleDetector?.getAllCycles() || [];
        const graphStats = this.cycleDetector?.getGraphStats() || {};

        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                generatedBy: 'Archit Search',
                version: EXTENSION_VERSION
            },
            summary: projectSummary,
            dependencyGraph: graphStats,
            cycles: cycles.map(c => ({
                files: c.cycle.map(f => path.basename(f)),
                depth: c.depth
            })),
            violations: additionalData.violations || [],
            fileMetrics: additionalData.fileMetrics || [],
            recommendations: this._generateRecommendations(projectSummary, cycles)
        };
    }

    /**
     * Generates actionable recommendations based on analysis results.
     * 
     * @param {object} summary - Project summary metrics
     * @param {Array} cycles - Detected circular dependencies
     * @returns {string[]} Array of recommendation messages
     * @private
     */
    _generateRecommendations(summary, cycles) {
        const recommendations = [];

        // Check for circular dependencies
        if (cycles.length > 0) {
            recommendations.push(
                `🔄 Found ${cycles.length} circular ${cycles.length === 1 ? 'dependency' : 'dependencies'}. ` +
                'Refactor to break cycles using Dependency Injection or extracting shared code.'
            );
        }

        // Check instability
        const instability = parseFloat(summary.averageInstability) || 0;
        if (instability > THRESHOLDS.HIGH_INSTABILITY) {
            recommendations.push(
                `⚠️ High average instability (${instability.toFixed(2)}). ` +
                'Consider adding abstractions (interfaces) to reduce coupling.'
            );
        }

        // Check maintainability
        const maintainability = parseFloat(summary.averageMaintainability) || 100;
        if (maintainability < THRESHOLDS.LOW_MAINTAINABILITY) {
            recommendations.push(
                `📉 Low average maintainability (${maintainability.toFixed(0)}%). ` +
                'Reduce complexity by splitting large files and simplifying logic.'
            );
        }

        // Check for high coupling files
        if (summary.maxCoupling && summary.maxCoupling > THRESHOLDS.HIGH_COUPLING) {
            recommendations.push(
                `📦 Some files have high coupling (${summary.maxCoupling} imports). ` +
                'Consider applying the Facade pattern to reduce dependencies.'
            );
        }

        // Positive message if no issues
        if (recommendations.length === 0) {
            recommendations.push('✅ Architecture looks healthy! Keep up the good work.');
        }

        return recommendations;
    }

    /**
     * Generates JSON format report.
     * 
     * @param {object} data - Report data
     * @returns {string} JSON string
     * @private
     */
    _generateJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Generates HTML format report with styled dashboard.
     * 
     * @param {object} data - Report data
     * @returns {string} HTML string
     * @private
     */
    _generateHTML(data) {
        const cyclesHtml = data.cycles
            .map(c => `<li class="cycle-item">${this._escapeHtml(c.files.join(' → '))} <span class="depth">(depth ${c.depth})</span></li>`)
            .join('');
        
        const recsHtml = data.recommendations
            .map(r => `<li>${this._escapeHtml(r)}</li>`)
            .join('');


        const cyclesCount = data.cycles.length;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Architecture Report - Archit Search</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eee;
            padding: 2rem;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 {
            color: #667eea;
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .subtitle { color: #888; margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
        .card {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        .card h2 { color: #667eea; font-size: 1.2rem; margin-bottom: 1rem; }
        .metric {
            text-align: center;
            padding: 1rem;
        }
        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
        }
        .metric-label { color: #888; font-size: 0.9rem; margin-top: 0.5rem; }
        .metric-good .metric-value { color: #4ade80; }
        .metric-warn .metric-value { color: #fbbf24; }
        .metric-bad .metric-value { color: #f87171; }
        ul { list-style: none; }
        li { padding: 0.75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        li:last-child { border-bottom: none; }
        .cycle-item { font-family: 'Fira Code', monospace; font-size: 0.9rem; }
        .depth { color: #888; font-size: 0.8rem; }
        .section { margin-top: 2rem; }
        footer { 
            text-align: center; 
            color: #666; 
            margin-top: 3rem; 
            padding-top: 1rem; 
            border-top: 1px solid rgba(255, 255, 255, 0.1); 
        }
        footer a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️ Architecture Report</h1>
        <p class="subtitle">Generated ${data.metadata.generatedAt} by Archit Search v${data.metadata.version}</p>

        <div class="grid">
            <div class="card metric ${this._getHealthClass(data.summary.healthScore)}">
                <div class="metric-value">${data.summary.healthScore || 0}%</div>
                <div class="metric-label">Health Score</div>
            </div>
            <div class="card metric">
                <div class="metric-value">${data.summary.filesAnalyzed || 0}</div>
                <div class="metric-label">Files Analyzed</div>
            </div>
            <div class="card metric ${this._getInstabilityClass(data.summary.averageInstability)}">
                <div class="metric-value">${data.summary.averageInstability || '0.00'}</div>
                <div class="metric-label">Avg Instability</div>
            </div>
            <div class="card metric ${cyclesCount > 0 ? 'metric-bad' : 'metric-good'}">
                <div class="metric-value">${cyclesCount}</div>
                <div class="metric-label">Circular Dependencies</div>
            </div>
        </div>

        ${cyclesCount > 0 ? `
        <div class="section">
            <div class="card">
                <h2>🔄 Circular Dependencies (${cyclesCount})</h2>
                <ul>${cyclesHtml}</ul>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <div class="card">
                <h2>💡 Recommendations</h2>
                <ul>${recsHtml}</ul>
            </div>
        </div>

        <footer>
            <p>Generated by <a href="https://github.com/Thirawat27/archit-search">Archit Search</a> — Code with architectural confidence.</p>
        </footer>
    </div>
</body>
</html>`;
    }

    /**
     * Gets CSS class for health score display.
     * 
     * @param {number|string} health - Health score
     * @returns {string} CSS class name
     * @private
     */
    _getHealthClass(health) {
        const score = parseFloat(health) || 0;
        if (score >= 80) return 'metric-good';
        if (score >= 50) return 'metric-warn';
        return 'metric-bad';
    }

    /**
     * Gets CSS class for instability display.
     * 
     * @param {number|string} instability - Instability value
     * @returns {string} CSS class name
     * @private
     */
    _getInstabilityClass(instability) {
        const value = parseFloat(instability) || 0;
        if (value <= 0.3) return 'metric-good';
        if (value <= 0.6) return 'metric-warn';
        return 'metric-bad';
    }

    /**
     * Escapes HTML special characters to prevent XSS.
     * 
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     * @private
     */
    _escapeHtml(str) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
    }

    /**
     * Generates Markdown format report.
     * 
     * @param {object} data - Report data
     * @returns {string} Markdown string
     * @private
     */
    _generateMarkdown(data) {
        const cyclesList = data.cycles
            .map(c => `- \`${c.files.join(' → ')}\` (depth ${c.depth})`)
            .join('\n');
        
        const recsList = data.recommendations
            .map(r => `- ${r}`)
            .join('\n');

        const cyclesSection = data.cycles.length > 0
            ? `\n## 🔄 Circular Dependencies (${data.cycles.length})\n\n${cyclesList}\n`
            : '';

        return `# 🏛️ Architecture Report

**Generated:** ${data.metadata.generatedAt}  
**Generator:** Archit Search v${data.metadata.version}

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| Files Analyzed | ${data.summary.filesAnalyzed || 0} |
| Health Score | ${data.summary.healthScore || 0}% |
| Avg Instability | ${data.summary.averageInstability || '0.00'} |
| Avg Maintainability | ${data.summary.averageMaintainability || '0.00'} |
| Circular Dependencies | ${data.cycles.length} |
${cyclesSection}
## 💡 Recommendations

${recsList}

---

*Generated by [Archit Search](https://github.com/Thirawat27/archit-search) — Code with architectural confidence.*
`;
    }

    /**
     * Opens a save dialog and exports the report to the selected location.
     * 
     * @param {string} format - Report format (use REPORT_FORMATS enum)
     * @param {object} [data={}] - Additional data to include 
     * @returns {Promise<boolean>} True if export succeeded, false if cancelled or failed
     */
    async exportWithDialog(format, data = {}) {
        const ext = FORMAT_EXTENSIONS[format] || 'txt';
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `archit-report-${timestamp}.${ext}`;

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFilename),
            filters: {
                'Report Files': [ext]
            },
            title: 'Export Architecture Report'
        });

        if (!uri) {
            return false; // User cancelled
        }

        const success = await this.exportReport(format, uri.fsPath, data);
        
        if (success) {
            vscode.window.showInformationMessage(
                `Architecture report exported successfully to ${path.basename(uri.fsPath)}`
            );
        } else {
            vscode.window.showErrorMessage('Failed to export architecture report.');
        }

        return success;
    }

    /**
     * Gets available report formats.
     * 
     * @returns {string[]} Array of format names
     */
    static getAvailableFormats() {
        return Object.values(REPORT_FORMATS);
    }
}

module.exports = ReportExporter;
module.exports.REPORT_FORMATS = REPORT_FORMATS;
