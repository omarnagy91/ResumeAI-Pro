// Options page script for ResumeAI Pro
// Handles settings management and user profile configuration

/**
 * Simple logger implementation for options page
 * Provides logging functionality for the options page interface
 * @class Logger
 */
class Logger {
    /**
     * Creates a new Logger instance
     * @constructor
     */
    constructor() {
        this.logLevel = 'info';
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
     * Internal logging method that formats and outputs log messages
     * @param {string} level - The log level (debug, info, warn, error)
     * @param {string} message - The message to log
     * @param {Object} [data=null] - Optional data object to include with the message
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        if (data) {
            console[level] || console.log(logMessage, data);
        } else {
            console[level] || console.log(logMessage);
        }
    }
}

/**
 * Main options page class for ResumeAI Pro
 * Handles all settings management, user interface interactions, and form validation
 * @class ResumeAIProOptions
 */
class ResumeAIProOptions {
    /**
     * Creates a new ResumeAIProOptions instance
     * @constructor
     */
    constructor() {
        this.currentTab = 'api';
        this.settings = {};
        this.logger = new Logger();
        this.init();
    }

    /**
     * Initializes the options page
     * Loads settings, sets up UI, and populates forms
     * @async
     */
    async init() {
        try {
            await this.loadSettings();
            this.setupEventListeners();
            this.setupTabs();
            this.populateForms();
            this.logger.info('ResumeAI Pro options page initialized');
        } catch (error) {
            this.logger.error('Failed to initialize options page:', error);
            this.showNotification('Failed to load settings. Please refresh the page.', 'error');
        }
    }

    /**
     * Loads settings from background script
     * Falls back to default settings if loading fails
     * @async
     */
    async loadSettings() {
        try {
            const response = await this.sendMessage({ action: 'getAllSettings' });
            if (response.success) {
                this.settings = response.settings;
            } else {
                this.settings = this.getDefaultSettings();
            }
        } catch (error) {
            this.logger.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Returns the default settings configuration for the options page
     * @returns {Object} Default settings object with all configuration options
     */
    getDefaultSettings() {
        return {
            api: {
                apiKey: '',
                model: 'gpt-5',
                temperature: 0.3,
                maxTokens: 2000
            },
            userProfile: {
                personalInfo: {
                    fullName: '',
                    email: '',
                    phone: '',
                    location: '',
                    linkedin: '',
                    portfolio: ''
                },
                professionalSummary: '',
                experience: [],
                education: [],
                skills: {
                    technical: '',
                    soft: ''
                },
                certifications: []
            },
            prompts: {
                resumeSystemPrompt: this.getDefaultResumeSystemPrompt(),
                resumeUserPrompt: this.getDefaultResumeUserPrompt(),
                coverLetterSystemPrompt: this.getDefaultCoverLetterSystemPrompt(),
                coverLetterUserPrompt: this.getDefaultCoverLetterUserPrompt(),
                atsScoringPrompt: this.getDefaultATSScoringPrompt()
            },
            parameters: {
                keywordDensity: 3,
                optimizationLevel: 'balanced'
            },
            advanced: {
                autoGenerate: false,
                includeCoverLetter: true,
                storylineVerification: true,
                dataRetention: 30,
                analytics: false
            }
        };
    }

    getDefaultResumeSystemPrompt() {
        return `You are ResumeAI Pro, an expert resume optimization assistant. Your role is to create ATS-friendly, professional resumes that maximize interview opportunities while maintaining authenticity.

Key principles:
1. Maintain the candidate's authentic voice and experience
2. Optimize for ATS compatibility with strategic keyword placement
3. Ensure chronological accuracy and consistency
4. Use quantifiable achievements and metrics
5. Follow professional formatting standards
6. Preserve the candidate's unique value proposition

Always provide accurate, professional content that the candidate can confidently submit.`;
    }

    getDefaultResumeUserPrompt() {
        return `Optimize the following resume for the job requirements while maintaining authenticity and consistency:

BASE RESUME:
{baseResume}

JOB ANALYSIS:
{jobAnalysis}

OPTIMIZATION LEVEL: {optimizationLevel}

Please optimize the resume by:
1. Incorporating relevant keywords naturally (2-3 mentions per key term)
2. Highlighting matching skills and experience
3. Adjusting language to match company culture
4. Maintaining chronological accuracy
5. Preserving quantifiable achievements
6. Ensuring ATS compatibility

Return only the optimized resume content, maintaining professional formatting.`;
    }

    getDefaultCoverLetterSystemPrompt() {
        return `You are ResumeAI Pro, an expert cover letter writer. Create compelling, personalized cover letters that complement the resume and demonstrate genuine interest in the position.

Key principles:
1. Show genuine enthusiasm for the role and company
2. Connect your experience to specific job requirements
3. Demonstrate knowledge of the company/industry
4. Maintain a professional yet personable tone
5. Keep it concise (3-4 paragraphs, under 400 words)
6. Include a strong call to action

Always create authentic, engaging content that helps the candidate stand out.`;
    }

    getDefaultCoverLetterUserPrompt() {
        return `Write a compelling cover letter for this position:

USER PROFILE:
{userProfile}

JOB DATA:
{jobData}

CUSTOM INSTRUCTIONS:
{customInstructions}

Create a personalized cover letter that:
1. Demonstrates genuine interest in the role
2. Connects relevant experience to job requirements
3. Shows knowledge of the company/industry
4. Maintains professional yet personable tone
5. Includes a strong call to action

Return only the cover letter content.`;
    }

    getDefaultATSScoringPrompt() {
        return `Evaluate the ATS compatibility of this resume against the job requirements:

RESUME:
{resume}

JOB DESCRIPTION:
{jobDescription}

Evaluate based on:
1. Keyword match density (2-3 mentions per key term)
2. Section structure and headers
3. Format compatibility
4. Skills alignment
5. Experience relevance

Provide a score from 0-100 and specific recommendations for improvement.
Format as JSON: {"score": number, "recommendations": ["item1", "item2"]}`;
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // API configuration
        document.getElementById('api-key')?.addEventListener('input', (e) => this.validateApiKey(e.target.value));
        document.getElementById('toggle-api-key')?.addEventListener('click', () => this.toggleApiKeyVisibility());
        document.getElementById('api-temperature')?.addEventListener('input', (e) => this.updateTemperatureValue(e.target.value));
        document.getElementById('keyword-density')?.addEventListener('input', (e) => this.updateKeywordDensityValue(e.target.value));
        document.getElementById('test-api')?.addEventListener('click', () => this.testApiConnection());

        // Dynamic lists
        document.getElementById('add-experience')?.addEventListener('click', () => this.addExperienceItem());
        document.getElementById('add-education')?.addEventListener('click', () => this.addEducationItem());
        document.getElementById('add-certification')?.addEventListener('click', () => this.addCertificationItem());

        // File operations
        document.getElementById('export-settings')?.addEventListener('click', () => this.exportSettings());
        document.getElementById('import-settings')?.addEventListener('click', () => this.importSettings());
        document.getElementById('import-file')?.addEventListener('change', (e) => this.handleImportFile(e));
        document.getElementById('reset-settings')?.addEventListener('click', () => this.resetSettings());

        // Save and cancel
        document.getElementById('save-settings')?.addEventListener('click', () => this.saveAllSettings());
        document.getElementById('cancel-settings')?.addEventListener('click', () => this.cancelSettings());

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupTabs() {
        this.switchTab('api');
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
    }

    populateForms() {
        // API Configuration
        document.getElementById('api-key').value = this.settings.api?.apiKey || '';
        document.getElementById('api-model').value = this.settings.api?.model || 'gpt-5';
        document.getElementById('api-temperature').value = this.settings.api?.temperature || 0.3;
        document.getElementById('max-tokens').value = this.settings.api?.maxTokens || 2000;

        // User Profile
        const personalInfo = this.settings.userProfile?.personalInfo || {};
        document.getElementById('full-name').value = personalInfo.fullName || '';
        document.getElementById('email').value = personalInfo.email || '';
        document.getElementById('phone').value = personalInfo.phone || '';
        document.getElementById('location').value = personalInfo.location || '';
        document.getElementById('linkedin').value = personalInfo.linkedin || '';
        document.getElementById('portfolio').value = personalInfo.portfolio || '';
        document.getElementById('professional-summary').value = this.settings.userProfile?.professionalSummary || '';
        document.getElementById('technical-skills').value = this.settings.userProfile?.skills?.technical || '';
        document.getElementById('soft-skills').value = this.settings.userProfile?.skills?.soft || '';

        // Experience, Education, Certifications
        this.populateDynamicLists();

        // Prompts
        document.getElementById('resume-system-prompt').value = this.settings.prompts?.resumeSystemPrompt || '';
        document.getElementById('resume-user-prompt').value = this.settings.prompts?.resumeUserPrompt || '';
        document.getElementById('cover-letter-system-prompt').value = this.settings.prompts?.coverLetterSystemPrompt || '';
        document.getElementById('cover-letter-user-prompt').value = this.settings.prompts?.coverLetterUserPrompt || '';
        document.getElementById('ats-scoring-prompt').value = this.settings.prompts?.atsScoringPrompt || '';

        // Parameters
        document.getElementById('keyword-density').value = this.settings.parameters?.keywordDensity || 3;
        document.getElementById('optimization-level').value = this.settings.parameters?.optimizationLevel || 'balanced';

        // Advanced Settings
        document.getElementById('auto-generate').checked = this.settings.advanced?.autoGenerate || false;
        document.getElementById('include-cover-letter').checked = this.settings.advanced?.includeCoverLetter !== false;
        document.getElementById('storyline-verification').checked = this.settings.advanced?.storylineVerification !== false;
        document.getElementById('data-retention').value = this.settings.advanced?.dataRetention || 30;
        document.getElementById('analytics').checked = this.settings.advanced?.analytics || false;

        // Update range values
        this.updateTemperatureValue(this.settings.api?.temperature || 0.3);
        this.updateKeywordDensityValue(this.settings.parameters?.keywordDensity || 3);
    }

    populateDynamicLists() {
        // Experience
        const experienceList = document.getElementById('experience-list');
        experienceList.innerHTML = '';
        (this.settings.userProfile?.experience || []).forEach(exp => {
            this.addExperienceItem(exp);
        });

        // Education
        const educationList = document.getElementById('education-list');
        educationList.innerHTML = '';
        (this.settings.userProfile?.education || []).forEach(edu => {
            this.addEducationItem(edu);
        });

        // Certifications
        const certificationsList = document.getElementById('certifications-list');
        certificationsList.innerHTML = '';
        (this.settings.userProfile?.certifications || []).forEach(cert => {
            this.addCertificationItem(cert);
        });
    }

    addExperienceItem(data = {}) {
        const template = document.getElementById('experience-template');
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('.experience-item');

        // Populate with data if provided
        if (data.jobTitle) item.querySelector('.job-title').value = data.jobTitle;
        if (data.company) item.querySelector('.company').value = data.company;
        if (data.startDate) item.querySelector('.start-date').value = data.startDate;
        if (data.endDate) item.querySelector('.end-date').value = data.endDate;
        if (data.currentJob) item.querySelector('.current-job').checked = data.currentJob;
        if (data.location) item.querySelector('.location').value = data.location;
        if (data.description) item.querySelector('.description').value = data.description;

        // Add remove functionality
        item.querySelector('.remove-item').addEventListener('click', () => {
            item.remove();
        });

        document.getElementById('experience-list').appendChild(item);
    }

    addEducationItem(data = {}) {
        const template = document.getElementById('education-template');
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('.education-item');

        // Populate with data if provided
        if (data.degree) item.querySelector('.degree').value = data.degree;
        if (data.field) item.querySelector('.field').value = data.field;
        if (data.institution) item.querySelector('.institution').value = data.institution;
        if (data.graduationDate) item.querySelector('.graduation-date').value = data.graduationDate;
        if (data.gpa) item.querySelector('.gpa').value = data.gpa;

        // Add remove functionality
        item.querySelector('.remove-item').addEventListener('click', () => {
            item.remove();
        });

        document.getElementById('education-list').appendChild(item);
    }

    addCertificationItem(data = {}) {
        const template = document.getElementById('certification-template');
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('.certification-item');

        // Populate with data if provided
        if (data.certName) item.querySelector('.cert-name').value = data.certName;
        if (data.issuer) item.querySelector('.issuer').value = data.issuer;
        if (data.issueDate) item.querySelector('.issue-date').value = data.issueDate;
        if (data.expiryDate) item.querySelector('.expiry-date').value = data.expiryDate;
        if (data.credentialId) item.querySelector('.credential-id').value = data.credentialId;

        // Add remove functionality
        item.querySelector('.remove-item').addEventListener('click', () => {
            item.remove();
        });

        document.getElementById('certifications-list').appendChild(item);
    }

    validateApiKey(apiKey) {
        const isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
        const input = document.getElementById('api-key');

        if (apiKey && !isValid) {
            input.style.borderColor = '#dc3545';
        } else {
            input.style.borderColor = '#ddd';
        }
    }

    toggleApiKeyVisibility() {
        const input = document.getElementById('api-key');
        const button = document.getElementById('toggle-api-key');

        if (input.type === 'password') {
            input.type = 'text';
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
            input.type = 'password';
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
    }

    updateTemperatureValue(value) {
        document.getElementById('temperature-value').textContent = value;
    }

    updateKeywordDensityValue(value) {
        document.getElementById('keyword-density-value').textContent = value;
    }

    async testApiConnection() {
        const apiKey = document.getElementById('api-key').value;
        const model = document.getElementById('api-model').value;

        if (!apiKey) {
            this.showTestResult('Please enter an API key first', 'error');
            return;
        }

        const testButton = document.getElementById('test-api');
        const originalText = testButton.textContent;
        testButton.textContent = 'Testing...';
        testButton.disabled = true;

        try {
            const response = await this.sendMessage({
                action: 'testApiConnection',
                apiKey: apiKey,
                model: model
            });

            if (response.success) {
                this.showTestResult('API connection successful!', 'success');
            } else {
                this.showTestResult(`API test failed: ${response.error}`, 'error');
            }
        } catch (error) {
            this.logger.error('API test error:', error);
            this.showTestResult(`API test failed: ${error.message}`, 'error');
        } finally {
            testButton.textContent = originalText;
            testButton.disabled = false;
        }
    }

    showTestResult(message, type) {
        const resultDiv = document.getElementById('api-test-result');
        resultDiv.textContent = message;
        resultDiv.className = `test-result ${type}`;
        resultDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }

    setupRealTimeValidation() {
        // Add real-time validation for form fields
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    validateField(field) {
        // Basic validation logic
        if (field.hasAttribute('required') && !field.value.trim()) {
            field.style.borderColor = '#dc3545';
            return false;
        }

        if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
            field.style.borderColor = '#dc3545';
            return false;
        }

        if (field.type === 'url' && field.value && !this.isValidUrl(field.value)) {
            field.style.borderColor = '#dc3545';
            return false;
        }

        field.style.borderColor = '#ddd';
        return true;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Saves all settings to storage
     * Collects form data and sends to background script for storage
     * @async
     */
    async saveAllSettings() {
        try {
            const settings = this.collectFormData();

            const response = await this.sendMessage({
                action: 'saveAllSettings',
                settings: settings
            });

            if (response.success) {
                this.showNotification('Settings saved successfully!', 'success');
                this.updateLastSaved();
            } else {
                throw new Error(response.error || 'Failed to save settings');
            }
        } catch (error) {
            this.logger.error('Error saving settings:', error);
            this.showNotification(`Error saving settings: ${error.message}`, 'error');
        }
    }

    collectFormData() {
        return {
            api: {
                apiKey: document.getElementById('api-key').value,
                model: document.getElementById('api-model').value,
                temperature: parseFloat(document.getElementById('api-temperature').value),
                maxTokens: parseInt(document.getElementById('max-tokens').value)
            },
            userProfile: {
                personalInfo: {
                    fullName: document.getElementById('full-name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    location: document.getElementById('location').value,
                    linkedin: document.getElementById('linkedin').value,
                    portfolio: document.getElementById('portfolio').value
                },
                professionalSummary: document.getElementById('professional-summary').value,
                experience: this.collectExperienceData(),
                education: this.collectEducationData(),
                skills: {
                    technical: document.getElementById('technical-skills').value,
                    soft: document.getElementById('soft-skills').value
                },
                certifications: this.collectCertificationsData()
            },
            prompts: {
                resumeSystemPrompt: document.getElementById('resume-system-prompt').value,
                resumeUserPrompt: document.getElementById('resume-user-prompt').value,
                coverLetterSystemPrompt: document.getElementById('cover-letter-system-prompt').value,
                coverLetterUserPrompt: document.getElementById('cover-letter-user-prompt').value,
                atsScoringPrompt: document.getElementById('ats-scoring-prompt').value
            },
            parameters: {
                keywordDensity: parseInt(document.getElementById('keyword-density').value),
                optimizationLevel: document.getElementById('optimization-level').value
            },
            advanced: {
                autoGenerate: document.getElementById('auto-generate').checked,
                includeCoverLetter: document.getElementById('include-cover-letter').checked,
                storylineVerification: document.getElementById('storyline-verification').checked,
                dataRetention: parseInt(document.getElementById('data-retention').value),
                analytics: document.getElementById('analytics').checked
            }
        };
    }

    collectExperienceData() {
        const items = [];
        document.querySelectorAll('.experience-item').forEach(item => {
            items.push({
                jobTitle: item.querySelector('.job-title').value,
                company: item.querySelector('.company').value,
                startDate: item.querySelector('.start-date').value,
                endDate: item.querySelector('.end-date').value,
                currentJob: item.querySelector('.current-job').checked,
                location: item.querySelector('.location').value,
                description: item.querySelector('.description').value
            });
        });
        return items;
    }

    collectEducationData() {
        const items = [];
        document.querySelectorAll('.education-item').forEach(item => {
            items.push({
                degree: item.querySelector('.degree').value,
                field: item.querySelector('.field').value,
                institution: item.querySelector('.institution').value,
                graduationDate: item.querySelector('.graduation-date').value,
                gpa: item.querySelector('.gpa').value
            });
        });
        return items;
    }

    collectCertificationsData() {
        const items = [];
        document.querySelectorAll('.certification-item').forEach(item => {
            items.push({
                certName: item.querySelector('.cert-name').value,
                issuer: item.querySelector('.issuer').value,
                issueDate: item.querySelector('.issue-date').value,
                expiryDate: item.querySelector('.expiry-date').value,
                credentialId: item.querySelector('.credential-id').value
            });
        });
        return items;
    }

    async exportSettings() {
        try {
            const settings = this.collectFormData();
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resumeai-pro-settings-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);
            this.showNotification('Settings exported successfully!', 'success');
        } catch (error) {
            this.logger.error('Error exporting settings:', error);
            this.showNotification(`Error exporting settings: ${error.message}`, 'error');
        }
    }

    importSettings() {
        document.getElementById('import-file').click();
    }

    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const settings = JSON.parse(text);

            // Validate settings structure
            if (this.validateSettingsStructure(settings)) {
                this.settings = settings;
                this.populateForms();
                this.showNotification('Settings imported successfully!', 'success');
            } else {
                throw new Error('Invalid settings file format');
            }
        } catch (error) {
            this.logger.error('Error importing settings:', error);
            this.showNotification(`Error importing settings: ${error.message}`, 'error');
        }
    }

    validateSettingsStructure(settings) {
        // Basic validation of settings structure
        return settings &&
            settings.api &&
            settings.userProfile &&
            settings.prompts &&
            settings.parameters &&
            settings.advanced;
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
            try {
                this.settings = this.getDefaultSettings();
                this.populateForms();
                this.showNotification('Settings reset to default values', 'success');
            } catch (error) {
                this.logger.error('Error resetting settings:', error);
                this.showNotification(`Error resetting settings: ${error.message}`, 'error');
            }
        }
    }

    cancelSettings() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            window.close();
        }
    }

    updateLastSaved() {
        const lastSaved = document.getElementById('last-saved');
        lastSaved.textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Sends message to background script
     * Wraps Chrome extension messaging API in a Promise
     * @param {Object} message - The message to send
     * @returns {Promise} Promise that resolves with the response
     * @async
     */
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }
}

/**
 * Initialize the options page when DOM is loaded
 * Creates the main options page instance and sets up the interface
 */
document.addEventListener('DOMContentLoaded', () => {
    new ResumeAIProOptions();
});
