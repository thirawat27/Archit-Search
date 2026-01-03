const fs = require('fs');
const path = require('path');

/**
 * File processing configuration
 */
const CONFIG = {
    /** Maximum number of files to process during learning */
    MAX_FILES: 500,
    /** Minimum token length to consider */
    MIN_TOKEN_LENGTH: 2,
    /** Z-Score threshold for anomaly detection (3 sigma = 99.7% confidence) */
    ANOMALY_THRESHOLD: 3,
    /** Similarity threshold for classification */
    SIMILARITY_THRESHOLD: 0.85
};

/**
 * Stop words to filter out during tokenization
 */
const STOP_WORDS = new Set([
    'const', 'let', 'var', 'import', 'from', 'require', 
    'class', 'function', 'return', 'if', 'else', 'this', 
    'new', 'export', 'default', 'async', 'await', 'for', 
    'while', 'do', 'switch', 'case', 'break', 'continue',
    'try', 'catch', 'finally', 'throw', 'null', 'undefined',
    'true', 'false'
]);

/**
 * AIKernel implements lightweight machine learning concepts for code analysis.
 * Features: Vector Space Models, Statistical Anomaly Detection, and KNN Classification.
 */
class AIKernel {
    /**
     * Creates a new AIKernel instance.
     */
    constructor() {
        /** @type {Map<string, Map<string, number>>} File path to token vector map */
        this.vectors = new Map();
        
        /** @type {{importCounts: number[], loc: number[]}} Project statistics */
        this.projectStats = {
            importCounts: [],
            loc: []
        };

        /** @type {{mean: number, stdDev: number} | null} Computed statistics model */
        this.statsModel = null;

        /** @type {Set<string>} Stop words for tokenization */
        this.stopWords = STOP_WORDS;

        /** @type {boolean} Learning in progress flag */
        this.isLearning = false;
    }

    /**
     * Learns from the codebase (Unsupervised Learning Phase).
     * Builds vector representations and computes project statistics.
     * 
     * @param {string[]} filePaths - Array of absolute file paths to learn from
     */
    learn(filePaths) {
        if (this.isLearning) {
            return;
        }

        this.isLearning = true;

        try {
            // Limit files to prevent blocking
            const targetFiles = filePaths.slice(0, CONFIG.MAX_FILES);

            // Reset stats
            this.projectStats.importCounts = [];
            this.vectors.clear();

            for (const file of targetFiles) {
                this._processFile(file);
            }

            // Compute statistical model
            this.statsModel = this._computeStats(this.projectStats.importCounts);
        } finally {
            this.isLearning = false;
        }
    }

    /**
     * Processes a single file for learning.
     * 
     * @param {string} file - Absolute file path
     * @private
     */
    _processFile(file) {
        try {
            if (!fs.existsSync(file)) {
                return;
            }

            const content = fs.readFileSync(file, 'utf-8');

            // 1. Feature Extraction (Tokenization)
            const tokens = this._tokenize(content);

            // 2. Vectorization
            const vector = this._vectorize(tokens);
            this.vectors.set(file, vector);

            // 3. Collect import statistics
            const importCount = this._countImports(content);
            this.projectStats.importCounts.push(importCount);

        } catch {
            // Silently ignore file read errors
        }
    }

    /**
     * Tokenizes source code into meaningful tokens.
     * 
     * @param {string} content - Source code content
     * @returns {string[]} Array of tokens
     * @private
     */
    _tokenize(content) {
        return content
            .split(/[^a-zA-Z0-9_]/)
            .filter(token => 
                token.length > CONFIG.MIN_TOKEN_LENGTH && 
                !this.stopWords.has(token.toLowerCase())
            );
    }

    /**
     * Creates a term frequency vector from tokens.
     * 
     * @param {string[]} tokens - Array of tokens
     * @returns {Map<string, number>} Token frequency map
     * @private
     */
    _vectorize(tokens) {
        const vector = new Map();
        for (const token of tokens) {
            vector.set(token, (vector.get(token) || 0) + 1);
        }
        return vector;
    }

    /**
     * Counts import/require statements in content.
     * 
     * @param {string} content - Source code content
     * @returns {number} Import count
     * @private
     */
    _countImports(content) {
        const matches = content.match(/\b(import|require)\b/g);
        return matches ? matches.length : 0;
    }

    /**
     * Detects statistical anomalies using Z-Score analysis.
     * 
     * @param {string} fileContent - Source code to analyze
     * @returns {{isAnomaly: boolean, score: string, message?: string} | null} Anomaly result or null
     */
    detectAnomaly(fileContent) {
        if (!this.statsModel) {
            return { isAnomaly: false, score: '0.0' };
        }

        const importCount = this._countImports(fileContent);
        const { mean, stdDev } = this.statsModel;

        // Calculate Z-Score (handles zero stdDev)
        const zScore = stdDev > 0 
            ? (importCount - mean) / stdDev 
            : 0;

        // Return score for sidebar display
        const result = {
            isAnomaly: zScore > CONFIG.ANOMALY_THRESHOLD,
            score: zScore.toFixed(2)
        };

        if (result.isAnomaly) {
            result.message = `📈 Statistical Anomaly: This file has unusually high complexity (Z-Score: ${result.score}). Typical is ~${Math.round(mean)} imports.`;
        }

        return result;
    }

    /**
     * Classifies a file using K-Nearest Neighbors based on vector similarity.
     * 
     * @param {string} currentFile - Absolute path of file to classify
     * @returns {{mostSimilarFile: string, similarity: string} | null} Classification result or null
     */
    classifyLayer(currentFile) {
        const targetVector = this.vectors.get(currentFile);
        if (!targetVector) {
            return null;
        }

        let bestSimilarity = 0;
        let mostSimilarFile = null;

        for (const [file, vector] of this.vectors.entries()) {
            if (file === currentFile) {
                continue;
            }

            const similarity = this._cosineSimilarity(targetVector, vector);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                mostSimilarFile = file;
            }
        }

        if (bestSimilarity > CONFIG.SIMILARITY_THRESHOLD && mostSimilarFile) {
            return {
                mostSimilarFile: path.basename(mostSimilarFile),
                similarity: (bestSimilarity * 100).toFixed(1)
            };
        }

        return null;
    }

    /**
     * Calculates Cosine Similarity between two vectors.
     * Formula: Sim(A, B) = (A · B) / (||A|| × ||B||)
     * 
     * @param {Map<string, number>} vecA - First vector
     * @param {Map<string, number>} vecB - Second vector
     * @returns {number} Similarity score (0-1)
     * @private
     */
    _cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let magA = 0;
        let magB = 0;

        // Calculate dot product and magnitude of A
        for (const [key, valA] of vecA) {
            const valB = vecB.get(key) || 0;
            dotProduct += valA * valB;
            magA += valA * valA;
        }

        // Calculate magnitude of B
        for (const valB of vecB.values()) {
            magB += valB * valB;
        }

        // Handle zero magnitude edge case
        if (magA === 0 || magB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    /**
     * Computes mean and standard deviation from an array of numbers.
     * 
     * @param {number[]} arr - Array of numbers
     * @returns {{mean: number, stdDev: number}} Statistics object
     * @private
     */
    _computeStats(arr) {
        if (arr.length === 0) {
            return { mean: 0, stdDev: 1 };
        }

        const sum = arr.reduce((a, b) => a + b, 0);
        const mean = sum / arr.length;
        
        const squareDiffs = arr.map(x => Math.pow(x - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        return { mean, stdDev: stdDev || 1 }; // Prevent zero stdDev
    }

    /**
     * Gets the number of files in the learned model.
     * 
     * @returns {number} Number of learned files
     */
    getLearnedFileCount() {
        return this.vectors.size;
    }

    /**
     * Checks if the kernel has learned from files.
     * 
     * @returns {boolean} True if learning has been performed
     */
    hasLearned() {
        return this.statsModel !== null;
    }

    /**
     * Clears all learned data.
     */
    reset() {
        this.vectors.clear();
        this.projectStats = { importCounts: [], loc: [] };
        this.statsModel = null;
    }
}

module.exports = AIKernel;
