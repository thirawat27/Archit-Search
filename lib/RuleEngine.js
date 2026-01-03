const fs = require('fs');
const path = require('path');
const { minimatch } = require('minimatch');

/**
 * Index file extensions to check for encapsulation
 */
const INDEX_EXTENSIONS = ['js', 'ts', 'jsx', 'tsx'];

/**
 * RuleEngine validates architecture rules and layer dependencies.
 * Enforces Clean Architecture principles through glob pattern matching.
 */
class RuleEngine {
    constructor() {
        /** @type {Map<string, any>} */
        this.cache = new Map();
    }

    /**
     * Validates if an import violates architecture rules or layer boundaries.
     * 
     * @param {string} sourceRelativePath - Relative path of the source file
     * @param {string} targetRelativePath - Relative path of the import target
     * @param {Array<{source: string, disallow: string[], message?: string}>} rules - Architecture rules
     * @param {Array<{name: string, pattern: string}>} layers - Layer definitions (ordered from inner to outer)
     * @returns {{isViolation: boolean, message: string} | null} Violation result or null if valid
     */
    validate(sourceRelativePath, targetRelativePath, rules, layers) {
        // Normalize paths to forward slashes for cross-platform compatibility
        const normalizedSource = this._normalizePath(sourceRelativePath);
        const normalizedTarget = this._normalizePath(targetRelativePath);

        // 1. Check Explicit Rules (Disallow patterns)
        const ruleViolation = this._checkRuleViolations(normalizedSource, normalizedTarget, rules);
        if (ruleViolation) {
            return ruleViolation;
        }

        // 2. Check Layer Architecture (Dependency direction)
        const layerViolation = this._checkLayerViolations(normalizedSource, normalizedTarget, layers);
        if (layerViolation) {
            return layerViolation;
        }

        return null;
    }

    /**
     * Checks for encapsulation violations (importing internal files when index exists).
     * 
     * @param {string} targetAbsPath - Absolute path of the import target
     * @returns {{isViolation: boolean, message: string} | null} Violation result or null if valid
     */
    checkEncapsulation(targetAbsPath) {
        try {
            const dir = path.dirname(targetAbsPath);
            const filename = path.basename(targetAbsPath);

            // If already importing index, no violation
            if (filename.startsWith('index.')) {
                return null;
            }

            // Check if any index file exists in the parent directory
            const hasIndex = INDEX_EXTENSIONS.some(ext => {
                const indexFile = path.join(dir, `index.${ext}`);
                return fs.existsSync(indexFile);
            });

            if (hasIndex) {
                return {
                    isViolation: true,
                    message: `Encapsulation Warning: Directory has an 'index' file. Import from the directory '${path.basename(dir)}' instead of specific file '${filename}'.`
                };
            }
        } catch {
            // Ignore IO errors silently
        }
        
        return null;
    }

    /**
     * Normalizes a file path to use forward slashes.
     * @param {string} filePath - Path to normalize
     * @returns {string} Normalized path
     * @private
     */
    _normalizePath(filePath) {
        return filePath.replace(/\\/g, '/');
    }

    /**
     * Checks if an import violates any explicit disallow rules.
     * @param {string} source - Normalized source path
     * @param {string} target - Normalized target path
     * @param {Array} rules - Architecture rules
     * @returns {{isViolation: boolean, message: string} | null}
     * @private
     */
    _checkRuleViolations(source, target, rules) {
        for (const rule of rules) {
            if (minimatch(source, rule.source, { matchBase: true })) {
                if (rule.disallow) {
                    for (const pattern of rule.disallow) {
                        if (minimatch(target, pattern, { matchBase: true })) {
                            return {
                                isViolation: true,
                                message: rule.message || `Violation: '${source}' cannot import from '${pattern}'`
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Checks if an import violates layer architecture boundaries.
     * 
     * Layer Rule: Dependencies can only point INWARDS (lower index).
     * - Domain (index 0) -> Cannot import UI (index 3) = VIOLATION
     * - UI (index 3) -> Can import Domain (index 0) = OK
     * 
     * @param {string} source - Normalized source path
     * @param {string} target - Normalized target path
     * @param {Array} layers - Layer definitions
     * @returns {{isViolation: boolean, message: string} | null}
     * @private
     */
    _checkLayerViolations(source, target, layers) {
        if (!layers || layers.length === 0) {
            return null;
        }

        const sourceLayerIndex = this._findLayerIndex(source, layers);
        const targetLayerIndex = this._findLayerIndex(target, layers);

        // Both must be in defined layers to check
        if (sourceLayerIndex === -1 || targetLayerIndex === -1) {
            return null;
        }

        // Violation if inner layer (lower index) imports outer layer (higher index)
        if (sourceLayerIndex < targetLayerIndex) {
            const sourceName = layers[sourceLayerIndex].name;
            const targetName = layers[targetLayerIndex].name;
            return {
                isViolation: true,
                message: `Layer Violation: '${sourceName}' layer cannot depend on outer '${targetName}' layer.`
            };
        }

        return null;
    }

    /**
     * Finds the layer index for a given file path.
     * @param {string} filePath - File path to check
     * @param {Array} layers - Layer definitions
     * @returns {number} Layer index or -1 if not found
     * @private
     */
    _findLayerIndex(filePath, layers) {
        for (let i = 0; i < layers.length; i++) {
            if (minimatch(filePath, layers[i].pattern)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Clears the validation cache.
     */
    clearCache() {
        this.cache.clear();
    }
}

module.exports = RuleEngine;
