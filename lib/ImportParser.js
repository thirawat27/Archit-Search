/**
 * Language-specific regex patterns for import detection.
 * Each pattern captures the import path in group 1.
 */
const IMPORT_PATTERNS = {
    'javascript': [
        /(?:import\s+.*?from\s+['"](.*?)['"])/g,
        /(?:import\s+['"](.*?)['"])/g,
        /(?:export\s+.*?from\s+['"](.*?)['"])/g,
        /(?:require\(['"](.*?)['"]\))/g
    ],
    'typescript': [
        /(?:import\s+.*?from\s+['"](.*?)['"])/g,
        /(?:import\s+['"](.*?)['"])/g,
        /(?:export\s+.*?from\s+['"](.*?)['"])/g,
        /(?:require\(['"](.*?)['"]\))/g
    ],
    'javascriptreact': [
        /(?:import\s+.*?from\s+['"](.*?)['"])/g,
        /(?:import\s+['"](.*?)['"])/g,
        /(?:require\(['"](.*?)['"]\))/g
    ],
    'typescriptreact': [
        /(?:import\s+.*?from\s+['"](.*?)['"])/g,
        /(?:import\s+['"](.*?)['"])/g,
        /(?:require\(['"](.*?)['"]\))/g
    ],
    'python': [
        /(?:from\s+(.*?)\s+import)/g,
        /(?:import\s+(.*?)(?:\s+as\s+.*)?$)/gm
    ],
    'go': [
        /import\s+['"](.*?)['"]/g,
        /import\s+\(\s*([\s\S]*?)\s*\)/g
    ],
    'csharp': [
        /using\s+([^;]*);/g
    ],
    'java': [
        /import\s+([^;]*);/g
    ],
    'php': [
        /(?:use|require|include|require_once|include_once)\s+['"]?(.*?)['"]?\s*;/g
    ],
    'rust': [
        /use\s+([^;]*);/g,
        /mod\s+([^;]*);/g
    ],
    'dart': [
        /import\s+['"](.*?)['"]/g
    ],
    'ruby': [
        /(?:require|require_relative)\s+['"](.*?)['"]/g
    ],
    'swift': [
        /import\s+(.*)/g
    ]
};

/**
 * ImportParser extracts import statements from source code.
 * Supports multiple programming languages with language-specific regex patterns.
 */
class ImportParser {
    /**
     * Creates a new ImportParser instance.
     */
    constructor() {
        /** @type {typeof IMPORT_PATTERNS} */
        this.regexMap = IMPORT_PATTERNS;
    }

    /**
     * Parses source code and extracts all import statements.
     * 
     * @param {string} text - Source code to parse
     * @param {string} languageId - VS Code language identifier
     * @returns {Array<{path: string, index: number, length: number, fullMatch: string}>} Array of import information
     */
    parse(text, languageId) {
        const regexes = this.regexMap[languageId] || [];
        
        if (regexes.length === 0) {
            return [];
        }

        return this._extractImports(text, regexes);
    }

    /**
     * Extracts imports from text using provided regex patterns.
     * Uses original text for accurate position indices.
     * 
     * @param {string} text - Source code text
     * @param {RegExp[]} regexes - Array of regex patterns
     * @returns {Array<{path: string, index: number, length: number, fullMatch: string}>}
     * @private
     */
    _extractImports(text, regexes) {
        const imports = [];
        const seen = new Set(); // Prevent duplicate imports at same position

        for (const regex of regexes) {
            // Reset regex state for each iteration
            regex.lastIndex = 0;
            
            let match;
            while ((match = regex.exec(text)) !== null) {
                const importPath = match[1] || match[2] || match[3];
                const matchKey = `${match.index}:${importPath}`;

                if (importPath && !seen.has(matchKey)) {
                    seen.add(matchKey);
                    imports.push({
                        path: importPath,
                        index: match.index,
                        length: match[0].length,
                        fullMatch: match[0]
                    });
                }
            }
        }

        return imports;
    }

    /**
     * Checks if a language is supported by the parser.
     * 
     * @param {string} languageId - VS Code language identifier
     * @returns {boolean} True if language is supported
     */
    isLanguageSupported(languageId) {
        return languageId in this.regexMap;
    }

    /**
     * Gets the list of supported language identifiers.
     * 
     * @returns {string[]} Array of supported language IDs
     */
    getSupportedLanguages() {
        return Object.keys(this.regexMap);
    }
}

module.exports = ImportParser;
