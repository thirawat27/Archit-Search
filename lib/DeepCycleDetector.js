const fs = require('fs');
const path = require('path');
const ImportParser = require('./ImportParser');

/**
 * Configuration for deep cycle detection
 */
const CONFIG = {
    /** Maximum depth for cycle detection to prevent infinite loops */
    MAX_DEPTH: 10,
    /** Maximum files to analyze in a single cycle check */
    MAX_FILES_PER_CHECK: 50,
    /** File size limit in bytes (skip large files) */
    MAX_FILE_SIZE: 500000
};

/**
 * Language ID mapping from file extension
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
    '.rb': 'ruby'
};

/**
 * DeepCycleDetector detects multi-level circular dependencies in the codebase.
 * Unlike simple A → B → A detection, this finds complex cycles like A → B → C → D → A.
 */
class DeepCycleDetector {
    /**
     * Creates a new DeepCycleDetector instance.
     */
    constructor() {
        /** @type {ImportParser} */
        this.parser = new ImportParser();
        
        /** @type {Map<string, string[]>} Dependency graph - file path to array of imported files */
        this.dependencyGraph = new Map();
        
        /** @type {Map<string, number>} File modification times for cache invalidation */
        this.fileTimestamps = new Map();
        
        /** @type {boolean} Whether graph is being built */
        this.isBuilding = false;
    }

    /**
     * Builds the dependency graph from the codebase.
     * 
     * @param {string[]} filePaths - Array of absolute file paths
     */
    buildGraph(filePaths) {
        if (this.isBuilding) {
            return;
        }

        this.isBuilding = true;

        try {
            const limitedFiles = filePaths.slice(0, CONFIG.MAX_FILES_PER_CHECK);

            for (const filePath of limitedFiles) {
                this._processFileForGraph(filePath);
            }
        } finally {
            this.isBuilding = false;
        }
    }

    /**
     * Processes a single file and adds its dependencies to the graph.
     * 
     * @param {string} filePath - Absolute file path
     * @private
     */
    _processFileForGraph(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return;
            }

            const stats = fs.statSync(filePath);
            
            // Skip large files
            if (stats.size > CONFIG.MAX_FILE_SIZE) {
                return;
            }

            // Check cache validity
            const cachedTime = this.fileTimestamps.get(filePath);
            if (cachedTime && cachedTime === stats.mtimeMs) {
                return; // Already processed and unchanged
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const languageId = this._getLanguageId(filePath);
            const imports = this.parser.parse(content, languageId);

            // Resolve import paths to absolute paths
            const resolvedImports = [];
            const fileDir = path.dirname(filePath);

            for (const imp of imports) {
                if (imp.path.startsWith('.')) {
                    const resolved = this._resolveImportPath(fileDir, imp.path);
                    if (resolved) {
                        resolvedImports.push(resolved);
                    }
                }
            }

            this.dependencyGraph.set(filePath, resolvedImports);
            this.fileTimestamps.set(filePath, stats.mtimeMs);

        } catch {
            // Silently ignore file processing errors
        }
    }

    /**
     * Resolves an import path to an absolute file path.
     * 
     * @param {string} fromDir - Directory of the importing file
     * @param {string} importPath - Import path string
     * @returns {string | null} Resolved absolute path or null
     * @private
     */
    _resolveImportPath(fromDir, importPath) {
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', ''];
        const basePath = path.resolve(fromDir, importPath);

        for (const ext of extensions) {
            const fullPath = basePath + ext;
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }

        // Check for index files
        const indexPaths = extensions.map(ext => path.join(basePath, `index${ext}`));
        for (const indexPath of indexPaths) {
            if (fs.existsSync(indexPath)) {
                return indexPath;
            }
        }

        return null;
    }

    /**
     * Gets the language ID for a file.
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
     * Detects deep circular dependencies starting from a file.
     * 
     * @param {string} startFile - Absolute path of the file to check
     * @returns {{hasCycle: boolean, cycle: string[], depth: number, message: string} | null}
     */
    detectDeepCycle(startFile) {
        const visited = new Set();
        const recursionStack = new Set();
        const cyclePath = [];

        const hasCycle = this._dfs(startFile, visited, recursionStack, cyclePath, 0);

        if (hasCycle && cyclePath.length > 2) {
            const fileNames = cyclePath.map(f => path.basename(f));
            return {
                hasCycle: true,
                cycle: cyclePath,
                depth: cyclePath.length - 1,
                message: `🔄 Deep Circular Dependency Detected (${cyclePath.length - 1} levels) - ${fileNames.join(' → ')}`
            };
        }

        return null;
    }

    /**
     * Depth-first search for cycle detection.
     * 
     * @param {string} file - Current file path
     * @param {Set<string>} visited - Globally visited nodes
     * @param {Set<string>} recursionStack - Current recursion stack
     * @param {string[]} cyclePath - Path of the cycle
     * @param {number} depth - Current depth
     * @returns {boolean} True if cycle found
     * @private
     */
    _dfs(file, visited, recursionStack, cyclePath, depth) {
        if (depth > CONFIG.MAX_DEPTH) {
            return false;
        }

        const normalizedFile = file.toLowerCase().replace(/\\/g, '/');

        // Cycle found
        if (recursionStack.has(normalizedFile)) {
            cyclePath.push(file);
            return true;
        }

        if (visited.has(normalizedFile)) {
            return false;
        }

        visited.add(normalizedFile);
        recursionStack.add(normalizedFile);
        cyclePath.push(file);

        const dependencies = this.dependencyGraph.get(file) || [];

        for (const dep of dependencies) {
            if (this._dfs(dep, visited, recursionStack, cyclePath, depth + 1)) {
                return true;
            }
        }

        cyclePath.pop();
        recursionStack.delete(normalizedFile);
        return false;
    }

    /**
     * Gets all cycles in the dependency graph.
     * 
     * @returns {Array<{cycle: string[], depth: number}>} Array of detected cycles
     */
    getAllCycles() {
        const allCycles = [];
        const globalVisited = new Set();

        for (const file of this.dependencyGraph.keys()) {
            if (!globalVisited.has(file.toLowerCase())) {
                const result = this.detectDeepCycle(file);
                if (result?.hasCycle) {
                    allCycles.push({
                        cycle: result.cycle,
                        depth: result.depth
                    });
                    // Mark all files in cycle as visited
                    result.cycle.forEach(f => globalVisited.add(f.toLowerCase()));
                }
            }
        }

        return allCycles;
    }

    /**
     * Gets statistics about the dependency graph.
     * 
     * @returns {{totalFiles: number, totalDependencies: number, averageDependencies: number}}
     */
    getGraphStats() {
        let totalDependencies = 0;
        for (const deps of this.dependencyGraph.values()) {
            totalDependencies += deps.length;
        }

        const totalFiles = this.dependencyGraph.size;
        return {
            totalFiles,
            totalDependencies,
            averageDependencies: totalFiles > 0 ? (totalDependencies / totalFiles).toFixed(2) : '0.00'
        };
    }

    /**
     * Clears the dependency graph and cache.
     */
    clear() {
        this.dependencyGraph.clear();
        this.fileTimestamps.clear();
    }
}

module.exports = DeepCycleDetector;
