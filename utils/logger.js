// Logger utility for ResumeAI Pro
// Provides comprehensive logging and error tracking

/**
 * Advanced logger utility for ResumeAI Pro
 * Provides comprehensive logging, error tracking, and performance monitoring
 * @class Logger
 */
class Logger {
    /**
     * Creates a new Logger instance
     * @constructor
     */
    constructor() {
        this.logLevel = 'info'; // debug, info, warn, error
        this.maxLogs = 1000;
        this.logs = [];
        this.init();
    }

    /**
     * Initializes the logger
     * Loads log level from storage and sets up global error handlers
     */
    init() {
        // Load log level from storage
        chrome.storage.local.get(['logLevel']).then(result => {
            this.logLevel = result.logLevel || 'info';
        });

        // Set up error handling
        window.addEventListener('error', (event) => {
            this.error('Uncaught error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled promise rejection:', event.reason);
        });
    }

    /**
     * Logs a debug message
     * @param {string} message - The debug message to log
     * @param {Object} [data=null] - Optional data object to include with the message
     */
    debug(message, data = null) {
        this.log('debug', message, data);
    }

    /**
     * Logs an info message
     * @param {string} message - The info message to log
     * @param {Object} [data=null] - Optional data object to include with the message
     */
    info(message, data = null) {
        this.log('info', message, data);
    }

    /**
     * Logs a warning message
     * @param {string} message - The warning message to log
     * @param {Object} [data=null] - Optional data object to include with the message
     */
    warn(message, data = null) {
        this.log('warn', message, data);
    }

    /**
     * Logs an error message
     * @param {string} message - The error message to log
     * @param {Object} [data=null] - Optional data object to include with the message
     */
    error(message, data = null) {
        this.log('error', message, data);
    }

    /**
     * Internal logging method that formats, stores, and outputs log messages
     * @param {string} level - The log level (debug, info, warn, error)
     * @param {string} message - The message to log
     * @param {Object} [data=null] - Optional data object to include with the message
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data: data ? JSON.stringify(data, null, 2) : null,
            url: window.location?.href || 'background'
        };

        // Add to logs array
        this.logs.push(logEntry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Console logging based on level
        if (this.shouldLog(level)) {
            const consoleMethod = this.getConsoleMethod(level);
            if (data) {
                console[consoleMethod](`[${timestamp}] ${message}`, data);
            } else {
                console[consoleMethod](`[${timestamp}] ${message}`);
            }
        }

        // Store critical errors
        if (level === 'error') {
            this.storeError(logEntry);
        }
    }

    /**
     * Determines if a message should be logged based on current log level
     * @param {string} level - The log level to check
     * @returns {boolean} True if the message should be logged
     */
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }

    /**
     * Gets the appropriate console method for a log level
     * @param {string} level - The log level
     * @returns {string} The console method name
     */
    getConsoleMethod(level) {
        switch (level) {
            case 'debug': return 'debug';
            case 'info': return 'info';
            case 'warn': return 'warn';
            case 'error': return 'error';
            default: return 'log';
        }
    }

    async storeError(logEntry) {
        try {
            const result = await chrome.storage.local.get(['errors']);
            const errors = result.errors || [];
            errors.push(logEntry);

            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }

            await chrome.storage.local.set({ errors });
        } catch (error) {
            console.error('Failed to store error:', error);
        }
    }

    /**
     * Retrieves logged messages with optional filtering
     * @param {string} [level=null] - Optional level filter (debug, info, warn, error)
     * @param {number} [limit=100] - Maximum number of logs to return
     * @returns {Array} Array of log entries
     * @async
     */
    async getLogs(level = null, limit = 100) {
        let filteredLogs = this.logs;

        if (level) {
            filteredLogs = this.logs.filter(log => log.level === level);
        }

        return filteredLogs.slice(-limit);
    }

    async getErrors() {
        try {
            const result = await chrome.storage.local.get(['errors']);
            return result.errors || [];
        } catch (error) {
            console.error('Failed to get errors:', error);
            return [];
        }
    }

    clearLogs() {
        this.logs = [];
    }

    async clearStoredErrors() {
        try {
            await chrome.storage.local.remove(['errors']);
        } catch (error) {
            console.error('Failed to clear stored errors:', error);
        }
    }

    setLogLevel(level) {
        this.logLevel = level;
        chrome.storage.local.set({ logLevel: level });
    }

    // Performance timing
    time(label) {
        console.time(label);
    }

    timeEnd(label) {
        console.timeEnd(label);
    }

    // API call logging
    /**
     * Logs API call information with performance metrics
     * @param {string} endpoint - The API endpoint that was called
     * @param {string} method - The HTTP method used (GET, POST, etc.)
     * @param {number} status - The HTTP status code returned
     * @param {number} duration - The duration of the API call in milliseconds
     * @param {Error} [error=null] - Optional error object if the call failed
     */
    logApiCall(endpoint, method, status, duration, error = null) {
        const logData = {
            endpoint,
            method,
            status,
            duration: `${duration}ms`,
            error: error ? error.message : null
        };

        if (error || status >= 400) {
            this.error(`API call failed: ${method} ${endpoint}`, logData);
        } else {
            this.info(`API call: ${method} ${endpoint}`, logData);
        }
    }
}

/**
 * Export Logger class for use in other modules
 * Supports both CommonJS and browser environments
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
