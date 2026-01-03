const path = require('path');
const Localization = require('./Localization');

/**
 * Concept keywords for semantic classification.
 * Used to determine the architectural layer of a file.
 */
const CONCEPTS = {
    'Presentation': ['view', 'page', 'screen', 'ui', 'component', 'widget', 'frontend', 'render', 'template'],
    'Business': ['controller', 'service', 'manager', 'logic', 'handler', 'processor', 'usecase', 'interactor'],
    'Data': ['model', 'entity', 'schema', 'repo', 'repository', 'database', 'store', 'dao', 'dto', 'orm'],
    'Utility': ['util', 'utils', 'helper', 'helpers', 'common', 'lib', 'shared', 'config', 'constant']
};

/**
 * Allowed dependency directions based on Clean Architecture.
 * Key (source) can import from Value (target) concepts.
 */
const ALLOWED_FLOW = {
    'Presentation': ['Business', 'Presentation', 'Utility'],
    'Business': ['Data', 'Business', 'Utility'],
    'Data': ['Data', 'Utility'],
    'Utility': ['Utility']
};

/**
 * SmartAdvisor provides AI-like heuristic analysis for architectural dependencies.
 * Uses semantic path analysis to detect suspicious import patterns.
 */
class SmartAdvisor {
    /**
     * Creates a new SmartAdvisor instance.
     */
    constructor() {
        /** @type {typeof CONCEPTS} */
        this.concepts = CONCEPTS;
        
        /** @type {typeof ALLOWED_FLOW} */
        this.allowedFlow = ALLOWED_FLOW;
    }

    /**
     * Analyzes an import and determines if it's architecturally suspicious.
     * 
     * @param {string} sourcePath - Absolute path of the current file
     * @param {string} importPath - Path of the imported module
     * @returns {{isSuspicious: boolean, score: number, message: string} | null} Analysis result or null if can't analyze
     */
    analyze(sourcePath, importPath) {
        const sourceConcept = this.classify(sourcePath);
        const targetConcept = this.classify(importPath);

        // Cannot judge if concepts are unknown
        if (sourceConcept === 'Unknown' || targetConcept === 'Unknown') {
            return null;
        }

        // Check if dependency flow is allowed
        const allowedTargets = this.allowedFlow[sourceConcept];
        
        if (!allowedTargets || !allowedTargets.includes(targetConcept)) {
            const confidence = this._calculateConfidence(sourcePath, importPath, sourceConcept, targetConcept);
            
            return {
                isSuspicious: true,
                score: confidence,
                message: Localization.get('aiSuspicious', sourceConcept, targetConcept)
            };
        }

        return null;
    }

    /**
     * Classifies a file path into an architectural concept.
     * 
     * @param {string} filePath - File path to classify
     * @returns {string} Concept name or 'Unknown'
     */
    classify(filePath) {
        const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
        const segments = normalizedPath.split('/');

        // Check last 3 segments (folder hierarchy + filename)
        const significantSegments = segments.slice(-3);

        for (const [concept, keywords] of Object.entries(this.concepts)) {
            const hasMatch = keywords.some(keyword => 
                significantSegments.some(segment => segment.includes(keyword))
            );
            
            if (hasMatch) {
                return concept;
            }
        }

        return 'Unknown';
    }

    /**
     * Calculates confidence score for a suspicious detection.
     * Higher scores indicate stronger certainty of architectural violation.
     * 
     * @param {string} source - Source file path
     * @param {string} target - Target file path
     * @param {string} sourceConcept - Classified source concept
     * @param {string} targetConcept - Classified target concept
     * @returns {number} Confidence score (0-100)
     * @private
     */
    _calculateConfidence(source, target, sourceConcept, targetConcept) {
        let confidence = 70; // Base confidence

        // Higher confidence for well-known violations
        const severeViolations = [
            { source: 'Data', target: 'Presentation' },
            { source: 'Utility', target: 'Presentation' },
            { source: 'Utility', target: 'Business' }
        ];

        const isSevere = severeViolations.some(v => 
            v.source === sourceConcept && v.target === targetConcept
        );

        if (isSevere) {
            confidence = 95;
        } else {
            // Increase confidence if file names clearly indicate concepts
            const sourceBasename = path.basename(source).toLowerCase();
            const targetBasename = path.basename(target).toLowerCase();

            const sourceKeywords = this.concepts[sourceConcept] || [];
            const targetKeywords = this.concepts[targetConcept] || [];

            if (sourceKeywords.some(k => sourceBasename.includes(k))) {
                confidence += 5;
            }
            if (targetKeywords.some(k => targetBasename.includes(k))) {
                confidence += 5;
            }
        }

        return Math.min(confidence, 100);
    }

    /**
     * Gets all classified concepts.
     * 
     * @returns {string[]} Array of concept names
     */
    getConcepts() {
        return Object.keys(this.concepts);
    }

    /**
     * Gets keywords for a specific concept.
     * 
     * @param {string} concept - Concept name
     * @returns {string[] | undefined} Keywords or undefined if not found
     */
    getKeywordsForConcept(concept) {
        return this.concepts[concept];
    }
}

module.exports = SmartAdvisor;
