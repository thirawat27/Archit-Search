/**
 * Translation strings for all supported languages.
 * Each language contains keys for various UI messages.
 */
const TRANSLATIONS = {
    en: {
        // === Extension Activation ===
        activeMessage: 'Archit Search (AI Engine) is active!',
        
        // === Status Bar ===
        statusBarHealthy: 'Archit Search: Healthy',
        statusBarError: 'Archit Search: {0} Error{1}',
        statusBarWarning: 'Archit Search: {0} Warning{1}',
        statusBarTooltipHealthy: 'No architecture violations detected.',
        statusBarTooltipViolations: 'Architecture Check: {0} Error(s), {1} Warning(s)',
        
        // === Sidebar ===
        sidebarNoActiveFile: 'No active file',
        sidebarFile: 'File: {0}',
        sidebarStatus: 'Status: {0}',
        sidebarImports: 'Imports: {0}',
        sidebarViolations: 'Violations: {0}',
        sidebarAIInsights: '🧠 AI Insights',
        sidebarAnomalyScore: 'Anomaly Score (Z): {0}',
        sidebarProjectAvgImports: 'Project Avg Imports: {0}',
        sidebarProjectStdDev: 'Project StdDev: {0}',
        
        // === Status Types ===
        statusHealthy: 'Healthy',
        statusError: 'Error',
        statusWarning: 'Warning',
        statusIdle: 'Idle',
        
        // === Violations ===
        godObject: "God Object Alert: This file has {0} imports (Threshold: {1}). Consider refactoring.",
        layerViolation: "Layer Violation: '{0}' layer cannot depend on outer '{1}' layer.",
        encapsulation: "Encapsulation Warning: Directory has an 'index' file. Import from the directory '{0}' instead of specific file '{1}'.",
        circular: "Circular Dependency Detected! '{0}' <-> '{1}'",
        aiSuspicious: "🤖 AI Alert: Suspicious dependency detected. A '{0}' module usually shouldn't depend on a '{1}' module.",
        anomaly: "📈 Statistical Anomaly: This file has unusually high complexity (Z-Score: {0}). Typical is ~{1} imports.",
        violationMsg: "Architecture Violation: Importing from '{0}' is not allowed in this file.",
        
        // === AI Learning ===
        learningStart: "AI Kernel Learning from {0} files...",
        learningDone: "AI Kernel Model Trained.",
        
        // === Pluralization Helper ===
        pluralS: 's'
    },
    th: {
        // === Extension Activation ===
        activeMessage: 'Archit Search (AI Engine) ทำงานแล้ว!',
        
        // === Status Bar ===
        statusBarHealthy: 'Archit Search: สมบูรณ์',
        statusBarError: 'Archit Search: พบ {0} ข้อผิดพลาด',
        statusBarWarning: 'Archit Search: พบ {0} คำเตือน',
        statusBarTooltipHealthy: 'ไม่พบปัญหาในสถาปัตยกรรม',
        statusBarTooltipViolations: 'ตรวจสอบสถาปัตยกรรม: {0} ข้อผิดพลาด, {1} คำเตือน',
        
        // === Sidebar ===
        sidebarNoActiveFile: 'ไม่มีไฟล์ที่เปิดอยู่',
        sidebarFile: 'ไฟล์: {0}',
        sidebarStatus: 'สถานะ: {0}',
        sidebarImports: 'จำนวน Import: {0}',
        sidebarViolations: 'ปัญหาที่พบ: {0}',
        sidebarAIInsights: '🧠 AI วิเคราะห์',
        sidebarAnomalyScore: 'คะแนนความผิดปกติ (Z): {0}',
        sidebarProjectAvgImports: 'ค่าเฉลี่ย Import ของโปรเจค: {0}',
        sidebarProjectStdDev: 'ค่าเบี่ยงเบนมาตรฐาน: {0}',
        
        // === Status Types ===
        statusHealthy: 'สมบูรณ์',
        statusError: 'ผิดพลาด',
        statusWarning: 'เตือน',
        statusIdle: 'รอสั่งการ',
        
        // === Violations ===
        godObject: "🚨 God Object: ไฟล์นี้มีการ import ถึง {0} ไฟล์ (เกณฑ์: {1}) ควรพิจารณาแยกไฟล์ใหม่",
        layerViolation: "⛔ ผิดกฎ Layer: ชั้น '{0}' ไม่สามารถเรียกใช้ชั้นที่อยู่ด้านนอกกว่าอย่าง '{1}' ได้",
        encapsulation: "📦 Encapsulation: กรุณา import ผ่านโฟลเดอร์ '{0}' โดยตรง แทนการเจาะเข้าไฟล์ '{1}' (มี index อยู่แล้ว)",
        circular: "🔄 วงจรอุบาทว์ (Circular Dependency): '{0}' <-> '{1}' วนลูปกันเอง!",
        aiSuspicious: "🤖 AI เตือนภัย: การ import นี้ดูน่าสงสัย ปกติ Module '{0}' ไม่ควรเรียกใช้ '{1}' นะครับ",
        anomaly: "📈 ผิดปกติทางสถิติ: ไฟล์นี้ซับซ้อนเกินค่าเฉลี่ยของทีม (Z-Score: {0}) ปกติควรมี import แค่ประมาณ {1}",
        violationMsg: "⛔ ผิดกฎสถาปัตยกรรม: ไม่อนุญาตให้ import จาก '{0}' ในไฟล์นี้",
        
        // === AI Learning ===
        learningStart: "🧠 AI กำลังเรียนรู้จากไฟล์ {0} ไฟล์...",
        learningDone: "🧠 AI เรียนรู้เสร็จสิ้น พร้อมทำงาน",
        
        // === Pluralization Helper (Thai doesn't use plural) ===
        pluralS: ''
    }
};

/**
 * Default language fallback
 */
const DEFAULT_LANGUAGE = 'en';

/**
 * Supported languages
 */
const SUPPORTED_LANGUAGES = Object.keys(TRANSLATIONS);

/**
 * Localization provides multi-language message formatting.
 * Singleton instance for consistent language settings across the extension.
 */
class Localization {
    /**
     * Creates a new Localization instance.
     */
    constructor() {
        /** @type {string} */
        this.lang = DEFAULT_LANGUAGE;
        
        /** @type {Function[]} */
        this._changeListeners = [];
    }

    /**
     * Sets the current language.
     * Falls back to default if language is not supported.
     * Notifies all registered listeners of the change.
     * 
     * @param {string} lang - Language code (e.g., 'en', 'th')
     */
    setLanguage(lang) {
        const oldLang = this.lang;
        
        if (TRANSLATIONS[lang]) {
            this.lang = lang;
        } else {
            this.lang = DEFAULT_LANGUAGE;
        }
        
        // Notify listeners if language changed
        if (oldLang !== this.lang) {
            this._notifyListeners();
        }
    }

    /**
     * Gets the current language code.
     * 
     * @returns {string} Current language code
     */
    getLanguage() {
        return this.lang;
    }

    /**
     * Gets a localized message by key with optional argument substitution.
     * Arguments replace placeholders in the format {0}, {1}, etc.
     * 
     * @param {string} key - Message key
     * @param {...any} args - Arguments to substitute into the message
     * @returns {string} Localized message
     */
    get(key, ...args) {
        // Try current language, then default, then return key itself
        let message = TRANSLATIONS[this.lang]?.[key] 
            ?? TRANSLATIONS[DEFAULT_LANGUAGE]?.[key] 
            ?? key;

        // Replace placeholders with arguments
        args.forEach((arg, index) => {
            message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
        });

        return message;
    }

    /**
     * Gets plural suffix based on current language and count.
     * 
     * @param {number} count - The count to check
     * @returns {string} Plural suffix ('s' for English, '' for Thai)
     */
    plural(count) {
        if (this.lang === 'th') {
            return ''; // Thai doesn't use plural suffixes
        }
        return count !== 1 ? 's' : '';
    }

    /**
     * Registers a listener to be notified when language changes.
     * 
     * @param {Function} listener - Callback function
     * @returns {Function} Unsubscribe function
     */
    onLanguageChange(listener) {
        this._changeListeners.push(listener);
        
        // Return unsubscribe function
        return () => {
            const index = this._changeListeners.indexOf(listener);
            if (index > -1) {
                this._changeListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notifies all registered listeners of language change.
     * @private
     */
    _notifyListeners() {
        for (const listener of this._changeListeners) {
            try {
                listener(this.lang);
            } catch {
                // Ignore listener errors
            }
        }
    }

    /**
     * Checks if a message key exists.
     * 
     * @param {string} key - Message key to check
     * @returns {boolean} True if key exists in current or default language
     */
    hasKey(key) {
        return key in (TRANSLATIONS[this.lang] ?? {}) || key in TRANSLATIONS[DEFAULT_LANGUAGE];
    }

    /**
     * Gets all message keys for the current language.
     * 
     * @returns {string[]} Array of message keys
     */
    getKeys() {
        return Object.keys(TRANSLATIONS[this.lang] ?? TRANSLATIONS[DEFAULT_LANGUAGE]);
    }

    /**
     * Gets all supported language codes.
     * 
     * @returns {string[]} Array of language codes
     */
    getSupportedLanguages() {
        return [...SUPPORTED_LANGUAGES];
    }

    /**
     * Checks if a language is supported.
     * 
     * @param {string} lang - Language code to check
     * @returns {boolean} True if language is supported
     */
    isLanguageSupported(lang) {
        return lang in TRANSLATIONS;
    }
}

// Export singleton instance
module.exports = new Localization();
