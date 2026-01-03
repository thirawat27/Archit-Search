const ImportParser = require('./ImportParser');

/**
 * Configuration for unused import detection
 */
const CONFIG = {
    /** Maximum file size to analyze (bytes) */
    MAX_FILE_SIZE: 300000,
    /** Patterns to ignore (e.g., side-effect imports) */
    SIDE_EFFECT_PATTERNS: [
        /^import\s+['"][^'"]+['"]\s*;?\s*$/,
        /^import\s+['"][^'"]+\.css['"]/,
        /^import\s+['"][^'"]+\.scss['"]/,
        /^import\s+['"][^'"]+\.less['"]/,
        /^require\s*\(\s*['"][^'"]+\.css['"]\s*\)/
    ]
};

/**
 * UnusedImportDetector identifies imports that are not used in the file.
 * Supports JavaScript, TypeScript, and common import patterns.
 */
class UnusedImportDetector {
    constructor() {
        /** @type {ImportParser} */
        this.parser = new ImportParser();
    }

    /**
     * Detects unused imports in a file.
     * 
     * @param {string} content - File content
     * @param {string} languageId - Language identifier
     * @returns {Array<{name: string, line: number, index: number, length: number, type: string}>}
     */
    detect(content, languageId) {
        const unusedImports = [];
        const lines = content.split('\n');
        
        // Parse all imports
        const imports = this.parser.parse(content, languageId);
        
        for (const imp of imports) {
            // Skip side-effect imports
            if (this._isSideEffectImport(imp, lines)) {
                continue;
            }
            
            // Extract imported names
            const importedNames = this._extractImportedNames(imp, lines, content);
            
            // Check each name for usage
            for (const nameInfo of importedNames) {
                if (!this._isNameUsed(nameInfo.name, content, imp.index, imp.length)) {
                    unusedImports.push({
                        name: nameInfo.name,
                        line: nameInfo.line,
                        index: imp.index,
                        length: imp.length,
                        type: nameInfo.type // 'default', 'named', 'namespace'
                    });
                }
            }
        }
        
        return unusedImports;
    }

    /**
     * Checks if an import is a side-effect import (no bindings).
     * 
     * @param {object} imp - Import object
     * @param {string[]} lines - File lines
     * @returns {boolean}
     * @private
     */
    _isSideEffectImport(imp, lines) {
        const startLine = this._getLineNumber(lines, imp.index);
        const lineContent = lines[startLine] || '';
        
        return CONFIG.SIDE_EFFECT_PATTERNS.some(pattern => pattern.test(lineContent));
    }

    /**
     * Extracts all named bindings from an import statement.
     * 
     * @param {object} imp - Import object
     * @param {string[]} lines - File lines
     * @param {string} content - Full content
     * @returns {Array<{name: string, line: number, type: string}>}
     * @private
     */
    _extractImportedNames(imp, lines, content) {
        const names = [];
        const startLine = this._getLineNumber(lines, imp.index);
        const importStatement = this._getImportStatement(content, imp.index);
        
        // ES6 import patterns
        // import defaultExport from 'module'
        const defaultMatch = importStatement.match(/import\s+(\w+)\s+from/);
        if (defaultMatch) {
            names.push({ name: defaultMatch[1], line: startLine, type: 'default' });
        }
        
        // import { named1, named2 as alias } from 'module'
        const namedMatch = importStatement.match(/import\s*\{([^}]+)\}/);
        if (namedMatch) {
            const namedImports = namedMatch[1].split(',');
            for (const named of namedImports) {
                const trimmed = named.trim();
                // Handle 'name as alias' pattern
                const aliasMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
                if (aliasMatch) {
                    names.push({ name: aliasMatch[2], line: startLine, type: 'named' });
                } else if (trimmed && /^\w+$/.test(trimmed)) {
                    names.push({ name: trimmed, line: startLine, type: 'named' });
                }
            }
        }
        
        // import * as namespace from 'module'
        const namespaceMatch = importStatement.match(/import\s*\*\s*as\s+(\w+)/);
        if (namespaceMatch) {
            names.push({ name: namespaceMatch[1], line: startLine, type: 'namespace' });
        }
        
        // CommonJS require patterns
        // const name = require('module')
        const requireMatch = importStatement.match(/(?:const|let|var)\s+(\w+)\s*=\s*require/);
        if (requireMatch) {
            names.push({ name: requireMatch[1], line: startLine, type: 'default' });
        }
        
        // const { a, b } = require('module')
        const destructuredRequire = importStatement.match(/(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require/);
        if (destructuredRequire) {
            const destructured = destructuredRequire[1].split(',');
            for (const d of destructured) {
                const trimmed = d.trim();
                const aliasMatch = trimmed.match(/(\w+)\s*:\s*(\w+)/);
                if (aliasMatch) {
                    names.push({ name: aliasMatch[2], line: startLine, type: 'named' });
                } else if (trimmed && /^\w+$/.test(trimmed)) {
                    names.push({ name: trimmed, line: startLine, type: 'named' });
                }
            }
        }
        
        return names;
    }

    /**
     * Gets the full import statement from position.
     * 
     * @param {string} content - File content
     * @param {number} index - Start index
     * @returns {string}
     * @private
     */
    _getImportStatement(content, index) {
        // Find the statement boundaries
        let start = index;
        let end = index;
        
        // Go back to find statement start
        while (start > 0 && content[start - 1] !== '\n' && content[start - 1] !== ';') {
            start--;
        }
        
        // Go forward to find statement end
        while (end < content.length && content[end] !== '\n' && content[end] !== ';') {
            end++;
        }
        
        return content.substring(start, end + 1);
    }

    /**
     * Gets line number from character index.
     * 
     * @param {string[]} lines - File lines
     * @param {number} index - Character index
     * @returns {number}
     * @private
     */
    _getLineNumber(lines, index) {
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for newline
            if (charCount > index) {
                return i;
            }
        }
        return lines.length - 1;
    }

    /**
     * Checks if a name is used in the file content.
     * 
     * @param {string} name - Name to check
     * @param {string} content - File content
     * @param {number} importStart - Import start index
     * @param {number} importLength - Import length
     * @returns {boolean}
     * @private
     */
    _isNameUsed(name, content, importStart, importLength) {
        // Remove the import statement from consideration
        const importEnd = importStart + importLength;
        const beforeImport = content.substring(0, importStart);
        const afterImport = content.substring(importEnd);
        const contentWithoutImport = beforeImport + ' '.repeat(importLength) + afterImport;
        
        // Create regex to find usage (word boundary matching)
        const usageRegex = new RegExp(`\\b${this._escapeRegex(name)}\\b`, 'g');
        
        // Check for usage in JSX attributes, function calls, object access, etc.
        const matches = contentWithoutImport.match(usageRegex);
        
        return matches !== null && matches.length > 0;
    }

    /**
     * Escapes special regex characters.
     * 
     * @param {string} str - String to escape
     * @returns {string}
     * @private
     */
    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Gets suggestions for fixing unused imports.
     * 
     * @param {Array} unusedImports - Array of unused imports
     * @returns {Array<{message: string, action: string}>}
     */
    getSuggestions(unusedImports) {
        const suggestions = [];
        
        for (const unused of unusedImports) {
            suggestions.push({
                message: `Remove unused ${unused.type} import '${unused.name}'`,
                action: 'remove'
            });
        }
        
        if (unusedImports.length > 3) {
            suggestions.unshift({
                message: `Consider using 'Organize Imports' to clean up ${unusedImports.length} unused imports`,
                action: 'organize'
            });
        }
        
        return suggestions;
    }
}

module.exports = UnusedImportDetector;
