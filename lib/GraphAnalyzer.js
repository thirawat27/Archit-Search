const fs = require('fs');
const path = require('path');
const ImportParser = require('./ImportParser');

/**
 * Language ID mapping from file extension to VS Code language identifier
 */
const EXTENSION_TO_LANGUAGE = {
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.py': 'python',
    '.go': 'go',
    '.cs': 'csharp',
    '.java': 'java',
    '.php': 'php',
    '.rs': 'rust',
    '.dart': 'dart',
    '.rb': 'ruby',
    '.swift': 'swift'
};

/**
 * Simple LRU Cache Implementation to prevent memory leaks in long sessions.
 */
class LRUCache {
    /**
     * Creates a new LRU Cache.
     * @param {number} limit - Maximum number of entries (default: 100)
     */
    constructor(limit = 100) {
        /** @type {number} */
        this.limit = limit;
        /** @type {Map<string, any>} */
        this.cache = new Map();
    }

    /**
     * Gets a value from the cache and refreshes its position.
     * @param {string} key - Cache key
     * @returns {any | null} Cached value or null if not found
     */
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }
        const val = this.cache.get(key);
        // Refresh position by re-inserting
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }

    /**
     * Sets a value in the cache, evicting oldest entry if at limit.
     * @param {string} key - Cache key
     * @param {any} val - Value to cache
     */
    set(key, val) {
        if (this.cache.size >= this.limit) {
            // Evict oldest (first) entry
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        // Ensure fresh position
        this.cache.delete(key);
        this.cache.set(key, val);
    }

    /**
     * Checks if a key exists in the cache.
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Clears all entries from the cache.
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Gets the current cache size.
     * @returns {number}
     */
    get size() {
        return this.cache.size;
    }
}

/**
 * GraphAnalyzer detects circular dependencies between files.
 * Uses LRU caching for performance optimization.
 */
class GraphAnalyzer {
    /**
     * Creates a new GraphAnalyzer instance.
     */
    constructor() {
        /** @type {ImportParser} */
        this.parser = new ImportParser();
        
        // Cache for parsed imports with LRU eviction
        /** @type {LRUCache} */
        this.importsCache = new LRUCache(200);
    }

    /**
     * Checks for a direct circular dependency (A -> B -> A).
     * 
     * @param {string} sourceFile - Absolute path of the source file
     * @param {string} targetFile - Absolute path of the import target
     * @returns {{isCycle: boolean, message: string} | null} Cycle result or null if no cycle
     */
    checkCycle(sourceFile, targetFile) {
        // Validate target file exists
        if (!fs.existsSync(targetFile)) {
            return null;
        }

        // Self-import is always a cycle
        if (this._areSameFile(sourceFile, targetFile)) {
            return { 
                isCycle: true, 
                message: 'Self-import detected!' 
            };
        }

        try {
            const imports = this._getFileImports(targetFile);
            
            // Check if any import in target resolves back to source
            for (const imp of imports) {
                if (imp.path.startsWith('.')) {
                    const targetDir = path.dirname(targetFile);
                    const resolvedImportPath = path.resolve(targetDir, imp.path);
                    
                    if (this._areSameFile(resolvedImportPath, sourceFile)) {
                        return {
                            isCycle: true,
                            message: `Circular Dependency Detected! '${path.basename(sourceFile)}' <-> '${path.basename(targetFile)}'`
                        };
                    }
                }
            }
        } catch {
            // Ignore errors (file read issues, etc.)
        }

        return null;
    }

    /**
     * Gets parsed imports for a file, using cache when available.
     * 
     * @param {string} filePath - Absolute file path
     * @returns {Array} Array of import objects
     * @private
     */
    _getFileImports(filePath) {
        const stats = fs.statSync(filePath);
        const cacheKey = `${filePath}:${stats.mtimeMs}`;

        // Check cache first
        let imports = this.importsCache.get(cacheKey);
        if (imports) {
            return imports;
        }

        // Parse file and cache results
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const languageId = this._getLanguageId(filePath);
        
        imports = this.parser.parse(fileContent, languageId);
        this.importsCache.set(cacheKey, imports);

        return imports;
    }

    /**
     * Gets the VS Code language identifier for a file.
     * 
     * @param {string} filePath - File path
     * @returns {string} Language identifier
     * @private
     */
    _getLanguageId(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return EXTENSION_TO_LANGUAGE[ext] || 'javascript';
    }

    /**
     * Checks if two file paths refer to the same file.
     * Handles path normalization and extension matching.
     * 
     * @param {string} pathA - First file path
     * @param {string} pathB - Second file path
     * @returns {boolean} True if paths refer to same file
     * @private
     */
    _areSameFile(pathA, pathB) {
        const normalizedA = pathA.toLowerCase().replace(/\\/g, '/');
        const normalizedB = pathB.toLowerCase().replace(/\\/g, '/');
        
        // Exact match
        if (normalizedA === normalizedB) {
            return true;
        }
        
        // Check if pathA matches pathB without extension (common import pattern)
        const normalizedBNoExt = normalizedB.replace(/\.[^/.]+$/, '');
        if (normalizedA === normalizedBNoExt || normalizedA.startsWith(normalizedBNoExt)) {
            return true;
        }

        return false;
    }

    /**
     * Clears the import cache.
     */
    clearCache() {
        this.importsCache.clear();
    }
}

module.exports = GraphAnalyzer;
