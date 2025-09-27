// Logger utility for ResumeAI Pro
// Provides comprehensive logging and error tracking

class Logger {
    constructor() {
        this.logLevel = 'info'; // debug, info, warn, error
        this.maxLogs = 1000;
        this.logs = [];
        this.init();
    }

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

    debug(message, data = null) {
        this.log('debug', message, data);
    }

    info(message, data = null) {
        this.log('info', message, data);
    }

    warn(message, data = null) {
        this.log('warn', message, data);
    }

    error(message, data = null) {
        this.log('error', message, data);
    }

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

    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }

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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
