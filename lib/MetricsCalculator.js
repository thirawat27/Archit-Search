const fs = require('fs');
const path = require('path');
const ImportParser = require('./ImportParser');



/**
 * Language ID mapping
 */
const EXTENSION_TO_LANGUAGE = {
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.py': 'python',
    '.go': 'go'
};

/**
 * MetricsCalculator computes software architecture metrics.
 * Provides Coupling, Cohesion, Instability, and Maintainability metrics.
 */
class MetricsCalculator {
    /**
     * Creates a new MetricsCalculator instance.
     */
    constructor() {
        /** @type {ImportParser} */
        this.parser = new ImportParser();
        
        /** @type {Map<string, {afferent: number, efferent: number}>} */
        this.couplingData = new Map();
        
        /** @type {Map<string, string[]>} File to its dependencies */
        this.dependencyMap = new Map();
        
        /** @type {Map<string, string[]>} File to files that depend on it */
        this.dependentMap = new Map();
    }

    /**
     * Analyzes codebase and builds metric data.
     * 
     * @param {string[]} filePaths - Array of absolute file paths
     */
    analyze(filePaths) {
        // Reset maps
        this.dependencyMap.clear();
        this.dependentMap.clear();
        this.couplingData.clear();

        // First pass - build dependency map
        for (const filePath of filePaths) {
            const deps = this._getFileDependencies(filePath);
            this.dependencyMap.set(filePath, deps);
        }

        // Second pass - build dependent map (reverse dependencies)
        for (const [file, deps] of this.dependencyMap.entries()) {
            for (const dep of deps) {
                const normalizedDep = this._normalizePath(dep);
                const matchedFile = this._findMatchingFile(normalizedDep, filePaths);
                
                if (matchedFile) {
                    if (!this.dependentMap.has(matchedFile)) {
                        this.dependentMap.set(matchedFile, []);
                    }
                    this.dependentMap.get(matchedFile).push(file);
                }
            }
        }

        // Calculate coupling for each file
        for (const filePath of filePaths) {
            const efferent = this.dependencyMap.get(filePath)?.length || 0;
            const afferent = this.dependentMap.get(filePath)?.length || 0;
            
            this.couplingData.set(filePath, { afferent, efferent });
        }
    }

    /**
     * Gets dependencies of a file.
     * 
     * @param {string} filePath - Absolute file path
     * @returns {string[]} Array of dependency paths
     * @private
     */
    _getFileDependencies(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return [];
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath).toLowerCase();
            const languageId = EXTENSION_TO_LANGUAGE[ext] || 'javascript';
            
            const imports = this.parser.parse(content, languageId);
            return imports.map(imp => imp.path);
        } catch {
            return [];
        }
    }

    /**
     * Normalizes a file path for comparison.
     * 
     * @param {string} filePath - Path to normalize
     * @returns {string} Normalized path
     * @private
     */
    _normalizePath(filePath) {
        return filePath.toLowerCase().replace(/\\/g, '/').replace(/\.[^/.]+$/, '');
    }

    /**
     * Finds a matching file in the file list.
     * 
     * @param {string} normalizedPath - Normalized path to match
     * @param {string[]} filePaths - List of file paths
     * @returns {string | null} Matching file path or null
     * @private
     */
    _findMatchingFile(normalizedPath, filePaths) {
        for (const file of filePaths) {
            const normalizedFile = this._normalizePath(file);
            if (normalizedFile.endsWith(normalizedPath) || normalizedPath.endsWith(normalizedFile)) {
                return file;
            }
        }
        return null;
    }

    /**
     * Calculates the Instability Index for a file.
     * Formula - I = Ce / (Ca + Ce)
     * 0 = maximally stable, 1 = maximally unstable
     * 
     * @param {string} filePath - Absolute file path
     * @returns {{instability: number, classification: string, afferent: number, efferent: number}}
     */
    calculateInstability(filePath) {
        const coupling = this.couplingData.get(filePath) || { afferent: 0, efferent: 0 };
        const { afferent, efferent } = coupling;
        
        const total = afferent + efferent;
        const instability = total > 0 ? efferent / total : 0;

        let classification;
        if (instability <= 0.2) {
            classification = 'Stable (Abstract)';
        } else if (instability <= 0.5) {
            classification = 'Balanced';
        } else if (instability <= 0.8) {
            classification = 'Flexible';
        } else {
            classification = 'Unstable (Concrete)';
        }

        return {
            instability: parseFloat(instability.toFixed(3)),
            classification,
            afferent,
            efferent
        };
    }

    /**
     * Calculates Coupling metrics for a file.
     * 
     * @param {string} filePath - Absolute file path
     * @returns {{afferentCoupling: number, efferentCoupling: number, totalCoupling: number, quality: string}}
     */
    calculateCoupling(filePath) {
        const coupling = this.couplingData.get(filePath) || { afferent: 0, efferent: 0 };
        const { afferent, efferent } = coupling;
        const total = afferent + efferent;

        let quality;
        if (total <= 5) {
            quality = 'Low Coupling (Good)';
        } else if (total <= 15) {
            quality = 'Moderate Coupling';
        } else if (total <= 25) {
            quality = 'High Coupling (Review)';
        } else {
            quality = 'Very High Coupling (Refactor)';
        }

        return {
            afferentCoupling: afferent,
            efferentCoupling: efferent,
            totalCoupling: total,
            quality
        };
    }

    /**
     * Estimates Maintainability Index for a file.
     * Simplified formula based on Halstead Volume, Cyclomatic Complexity, and Lines of Code.
     * 
     * @param {string} filePath - Absolute file path
     * @returns {{index: number, grade: string, suggestions: string[]}}
     */
    calculateMaintainability(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return { index: 0, grade: 'Unknown', suggestions: [] };
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            const loc = lines.length;
            
            // Count complexity indicators
            const complexityIndicators = (content.match(/\b(if|else|for|while|switch|case|catch|&&|\|\||\?)/g) || []).length;
            
            // Count operators and operands (simplified Halstead)
            const operators = (content.match(/[+\-*/%=<>!&|^~]+/g) || []).length;
            const operands = (content.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []).length;
            
            // Simplified Maintainability Index formula
            // MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * Cyclomatic Complexity - 16.2 * ln(LOC)
            const volume = Math.log(operators + operands + 1);
            const complexity = complexityIndicators;
            const locLog = Math.log(loc + 1);
            
            let mi = 171 - (5.2 * volume) - (0.23 * complexity) - (16.2 * locLog);
            mi = Math.max(0, Math.min(100, mi)); // Clamp to 0-100

            const suggestions = [];
            let grade;

            if (mi >= 80) {
                grade = 'A (Excellent)';
            } else if (mi >= 60) {
                grade = 'B (Good)';
            } else if (mi >= 40) {
                grade = 'C (Moderate)';
                suggestions.push('Consider breaking down large functions');
            } else if (mi >= 20) {
                grade = 'D (Poor)';
                suggestions.push('File needs refactoring');
                suggestions.push('Reduce cyclomatic complexity');
            } else {
                grade = 'F (Critical)';
                suggestions.push('Urgent refactoring required');
                suggestions.push('Split into smaller modules');
                suggestions.push('Add documentation');
            }

            if (loc > 300) {
                suggestions.push('File is too long, consider splitting');
            }
            if (complexityIndicators > 20) {
                suggestions.push('High cyclomatic complexity detected');
            }

            return {
                index: parseFloat(mi.toFixed(1)),
                grade,
                suggestions
            };
        } catch {
            return { index: 0, grade: 'Error', suggestions: ['Could not analyze file'] };
        }
    }

    /**
     * Gets a complete metrics report for a file.
     * 
     * @param {string} filePath - Absolute file path
     * @returns {object} Complete metrics object
     */
    getFileMetrics(filePath) {
        return {
            file: path.basename(filePath),
            instability: this.calculateInstability(filePath),
            coupling: this.calculateCoupling(filePath),
            maintainability: this.calculateMaintainability(filePath)
        };
    }

    /**
     * Gets project-wide metrics summary.
     * 
     * @returns {object} Project summary
     */
    getProjectSummary() {
        let totalInstability = 0;
        let totalAfferent = 0;
        let totalEfferent = 0;
        let totalMaintainability = 0;
        let fileCount = 0;

        for (const [filePath] of this.couplingData.entries()) {
            const instability = this.calculateInstability(filePath);
            const maintainability = this.calculateMaintainability(filePath);
            
            totalInstability += instability.instability;
            totalAfferent += instability.afferent;
            totalEfferent += instability.efferent;
            totalMaintainability += maintainability.index;
            fileCount++;
        }

        return {
            filesAnalyzed: fileCount,
            averageInstability: fileCount > 0 ? (totalInstability / fileCount).toFixed(3) : '0.000',
            averageMaintainability: fileCount > 0 ? (totalMaintainability / fileCount).toFixed(1) : '0.0',
            totalAfferentCoupling: totalAfferent,
            totalEfferentCoupling: totalEfferent,
            healthScore: this._calculateHealthScore(totalInstability / fileCount, totalMaintainability / fileCount)
        };
    }

    /**
     * Calculates overall project health score.
     * 
     * @param {number} avgInstability - Average instability
     * @param {number} avgMaintainability - Average maintainability
     * @returns {string} Health score (0-100)
     * @private
     */
    _calculateHealthScore(avgInstability, avgMaintainability) {
        // Weight maintainability 60%, stability 40%
        const stabilityScore = (1 - avgInstability) * 100;
        const score = (avgMaintainability * 0.6) + (stabilityScore * 0.4);
        return score.toFixed(1);
    }

    /**
     * Clears all metric data.
     */
    clear() {
        this.dependencyMap.clear();
        this.dependentMap.clear();
        this.couplingData.clear();
    }
}

module.exports = MetricsCalculator;
