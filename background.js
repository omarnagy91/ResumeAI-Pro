// Background script for ResumeAI Pro
// Handles API communication, data processing, and storage

/**
 * Simple logger implementation for service worker
 * Provides structured logging with different levels and API call tracking
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
 * Main background service class for ResumeAI Pro
 * Handles all background operations including API communication, data processing, and storage management
 * @class ResumeAIProBackground
 */
class ResumeAIProBackground {
    /**
     * Creates a new ResumeAIProBackground instance
     * @constructor
     */
    constructor() {
        this.apiKey = null;
        this.userProfile = null;
        this.settings = null;
        this.logger = new Logger();
        this.init();
    }

    /**
     * Initializes the background service
     * Loads settings, sets up message listeners, alarms, and side panel
     * @async
     */
    async init() {
        try {
            await this.loadSettings();
            this.setupMessageListener();
            this.setupAlarms();
            this.setupSidePanel();
            this.logger.info('ResumeAI Pro background service initialized');
        } catch (error) {
            this.logger.error('Failed to initialize background service:', error);
        }
    }

    /**
     * Loads settings from Chrome storage
     * Falls back to default settings if none exist or if loading fails
     * @async
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            this.logger.debug('Settings loaded from storage:', result);

            if (result.settings) {
                this.settings = result.settings;
                this.apiKey = this.settings.api?.apiKey || null;
                this.userProfile = this.settings.userProfile || null;
                this.logger.debug('User profile loaded:', !!this.userProfile);
                this.logger.debug('API key loaded:', !!this.apiKey);
            } else {
                this.logger.warn('No settings found in storage, using defaults');
                this.settings = this.getDefaultSettings();
            }
        } catch (error) {
            this.logger.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Returns the default settings configuration
     * @returns {Object} Default settings object with all configuration options
     */
    getDefaultSettings() {
        return {
            api: {
                apiKey: '',
                model: 'gpt-4o',
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
                resumeSystemPrompt: 'You are ResumeAI Pro, an expert resume optimization assistant.',
                resumeUserPrompt: 'Optimize the following resume for the job requirements...',
                coverLetterSystemPrompt: 'You are ResumeAI Pro, an expert cover letter writer.',
                coverLetterUserPrompt: 'Write a compelling cover letter for this position...',
                atsScoringPrompt: 'Evaluate the ATS compatibility of this resume...'
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

    /**
     * Sets up the message listener for communication with content scripts and popup
     * Handles all incoming messages from other parts of the extension
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
    }

    /**
     * Handles incoming messages from content scripts and popup
     * Routes messages to appropriate handler methods based on action type
     * @param {Object} request - The message request object
     * @param {string} request.action - The action to perform
     * @param {Object} sender - Information about the sender
     * @param {Function} sendResponse - Callback function to send response
     * @async
     */
    async handleMessage(request, sender, sendResponse) {
        try {
            this.logger.debug('Handling message:', request.action);

            switch (request.action) {
                case 'jobDetected':
                    await this.handleJobDetected(request.jobData);
                    sendResponse({ success: true });
                    break;

                case 'generateResume':
                    const resume = await this.generateResume(request.jobData);
                    sendResponse({ success: true, resume });
                    break;

                case 'generateCoverLetter':
                    const coverLetter = await this.generateCoverLetter(request.jobData, request.customInstructions);
                    sendResponse({ success: true, coverLetter });
                    break;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, settings });
                    break;

                case 'getAllSettings':
                    sendResponse({ success: true, settings: this.settings });
                    break;

                case 'saveSettings':
                    await this.saveSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                case 'saveAllSettings':
                    await this.saveAllSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                case 'testApiConnection':
                    const testResult = await this.testApiConnection(request.apiKey, request.model);
                    sendResponse(testResult);
                    break;

                case 'downloadPDF':
                    await this.downloadPDF(request.resumeData, request.type);
                    sendResponse({ success: true });
                    break;

                case 'calculateATSScore':
                    const score = await this.calculateATSScore(request.resume, request.jobData);
                    sendResponse({ success: true, score });
                    break;

                case 'saveCustomInstructions':
                    await this.saveCustomInstructions(request.instructions);
                    sendResponse({ success: true });
                    break;

                case 'importSettings':
                    const result = await this.importSettings(request.settings);
                    sendResponse(result);
                    break;

                default:
                    this.logger.warn('Unknown action:', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            this.logger.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Handles job detection from content script
     * Stores job data and updates extension badge
     * @param {Object} jobData - The detected job information
     * @param {string} jobData.title - Job title
     * @param {string} jobData.company - Company name
     * @param {string} jobData.location - Job location
     * @param {string} jobData.description - Job description
     * @async
     */
    async handleJobDetected(jobData) {
        // Store the detected job data
        await chrome.storage.local.set({
            currentJob: jobData,
            lastJobDetection: new Date().toISOString()
        });

        // Update badge to show job detected
        if (chrome.action && chrome.action.setBadgeText) {
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
        }
    }

    /**
     * Generates an optimized resume for the given job data
     * Performs job analysis, resume optimization, ATS scoring, and consistency verification
     * @param {Object} jobData - The job information to optimize for
     * @param {string} jobData.title - Job title
     * @param {string} jobData.company - Company name
     * @param {string} jobData.description - Job description
     * @returns {Object} Generated resume with scores and metadata
     * @returns {string} returns.content - The optimized resume content
     * @returns {Object} returns.atsScore - ATS compatibility score and recommendations
     * @returns {number} returns.consistencyScore - Storyline consistency score
     * @returns {Object} returns.jobAnalysis - Analysis of job requirements
     * @returns {string} returns.timestamp - Generation timestamp
     * @returns {string} returns.version - Resume version
     * @async
     * @throws {Error} When API key or user profile is not configured
     */
    async generateResume(jobData) {
        this.logger.debug('Starting resume generation with current state:');
        this.logger.debug('API key available:', !!this.apiKey);
        this.logger.debug('User profile available:', !!this.userProfile);
        this.logger.debug('Settings available:', !!this.settings);

        if (!this.apiKey) {
            this.logger.error('API key not configured, attempting to reload settings');
            await this.loadSettings();
            if (!this.apiKey) {
                throw new Error('OpenAI API key not configured');
            }
        }

        if (!this.userProfile) {
            this.logger.error('User profile not configured, attempting to reload settings');
            await this.loadSettings();
            if (!this.userProfile) {
                throw new Error('User profile not configured');
            }
        }

        try {
            this.logger.info('Starting resume generation for job:', jobData.title);

            // Step 1: Analyze job requirements
            const jobAnalysis = await this.analyzeJobRequirements(jobData);

            // Step 2: Generate optimized resume
            const optimizedResume = await this.optimizeResume(jobAnalysis, jobData);

            // Step 3: Calculate ATS score
            const atsScore = await this.calculateATSScore(optimizedResume, jobData);

            // Step 4: Verify storyline consistency
            const consistencyCheck = await this.verifyStorylineConsistency(optimizedResume);

            this.logger.info('Resume generation completed successfully');

            return {
                content: optimizedResume,
                atsScore: atsScore,
                consistencyScore: consistencyCheck.score,
                jobAnalysis: jobAnalysis,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            this.logger.error('Error generating resume:', error);
            throw error;
        }
    }

    /**
     * Generates a personalized cover letter for the given job data
     * Creates a compelling cover letter and calculates match score
     * @param {Object} jobData - The job information to write cover letter for
     * @param {string} jobData.title - Job title
     * @param {string} jobData.company - Company name
     * @param {string} jobData.description - Job description
     * @param {string} [customInstructions=''] - Custom instructions for cover letter generation
     * @returns {Object} Generated cover letter with scores and metadata
     * @returns {string} returns.content - The generated cover letter content
     * @returns {Object} returns.matchScore - Match score against job requirements
     * @returns {string} returns.customInstructions - Custom instructions used
     * @returns {string} returns.timestamp - Generation timestamp
     * @returns {string} returns.version - Cover letter version
     * @async
     * @throws {Error} When API key or user profile is not configured
     */
    async generateCoverLetter(jobData, customInstructions = '') {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        if (!this.userProfile) {
            throw new Error('User profile not configured');
        }

        try {
            this.logger.info('Starting cover letter generation for job:', jobData.title);

            const coverLetter = await this.createCoverLetter(jobData, customInstructions);
            const matchScore = await this.calculateCoverLetterMatch(coverLetter, jobData);

            this.logger.info('Cover letter generation completed successfully');

            return {
                content: coverLetter,
                matchScore: matchScore,
                customInstructions: customInstructions,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            this.logger.error('Error generating cover letter:', error);
            throw error;
        }
    }

    /**
     * Analyzes job requirements and extracts key information
     * Uses AI to parse job description and identify requirements, skills, and qualifications
     * @param {Object} jobData - The job information to analyze
     * @param {string} jobData.title - Job title
     * @param {string} jobData.company - Company name
     * @param {string} jobData.location - Job location
     * @param {string} jobData.description - Job description
     * @returns {Object} Structured analysis of job requirements
     * @returns {Array} returns.requiredSkills - List of required technical and soft skills
     * @returns {Array} returns.preferredQualifications - List of preferred qualifications
     * @returns {Array} returns.keyResponsibilities - List of key responsibilities
     * @returns {Array} returns.industryKeywords - List of industry-specific keywords
     * @returns {Array} returns.companyCulture - Company culture indicators
     * @returns {string} returns.experienceLevel - Required experience level
     * @returns {Array} returns.educationRequirements - Education requirements
     * @async
     */
    async analyzeJobRequirements(jobData) {
        const prompt = `
        Analyze the following job description and extract key requirements, skills, and qualifications:

        Job Title: ${jobData.title}
        Company: ${jobData.company}
        Location: ${jobData.location}
        
        Job Description:
        ${jobData.description}

        Please provide a structured analysis including:
        1. Required skills (technical and soft skills)
        2. Preferred qualifications
        3. Key responsibilities
        4. Industry keywords
        5. Company culture indicators
        6. Experience level required
        7. Education requirements

        Format the response as a JSON object with these categories.
        `;

        const response = await this.callOpenAI(prompt, 'gpt-4');
        return response;
    }

    /**
     * Optimizes resume content based on job analysis
     * Uses AI to tailor resume content for specific job requirements
     * @param {Object} jobAnalysis - The analyzed job requirements
     * @param {Object} jobData - The original job data
     * @returns {string} The optimized resume content
     * @async
     */
    async optimizeResume(jobAnalysis, jobData) {
        // Debug: Check if user profile is loaded
        this.logger.debug('User profile loaded:', !!this.userProfile);
        this.logger.debug('Settings loaded:', !!this.settings);

        if (!this.userProfile) {
            this.logger.error('User profile not loaded, attempting to reload settings');
            await this.loadSettings();
        }

        const baseResume = this.buildBaseResume();
        this.logger.debug('Base resume length:', baseResume.length);
        this.logger.debug('Base resume preview:', baseResume.substring(0, 200) + '...');
        this.logger.debug('Job analysis:', jobAnalysis);

        const systemPrompt = this.settings.prompts?.resumeSystemPrompt || 'You are ResumeAI Pro, an expert resume optimization assistant.';
        const userPrompt = this.settings.prompts?.resumeUserPrompt || this.getDefaultResumeUserPrompt();

        const prompt = userPrompt
            .replace('{baseResume}', baseResume)
            .replace('{jobAnalysis}', JSON.stringify(jobAnalysis, null, 2))
            .replace('{optimizationLevel}', this.settings.parameters?.optimizationLevel || 'balanced');

        this.logger.debug('Final prompt length:', prompt.length);
        this.logger.debug('Final prompt preview:', prompt.substring(0, 500) + '...');

        return await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-4o', systemPrompt);
    }

    /**
     * Creates a personalized cover letter using AI
     * Generates compelling cover letter content based on user profile and job data
     * @param {Object} jobData - The job information
     * @param {string} customInstructions - Custom instructions for cover letter generation
     * @returns {string} The generated cover letter content
     * @async
     */
    async createCoverLetter(jobData, customInstructions) {
        const userProfile = this.buildUserProfile();
        const systemPrompt = this.settings.prompts?.coverLetterSystemPrompt || 'You are ResumeAI Pro, an expert cover letter writer.';
        const userPrompt = this.settings.prompts?.coverLetterUserPrompt || this.getDefaultCoverLetterUserPrompt();

        const prompt = userPrompt
            .replace('{userProfile}', userProfile)
            .replace('{jobData}', JSON.stringify(jobData, null, 2))
            .replace('{customInstructions}', customInstructions);

        return await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-4o', systemPrompt);
    }

    /**
     * Builds base resume content from user profile data
     * Formats user profile information into a structured resume format
     * @returns {string} The formatted base resume content
     */
    buildBaseResume() {
        const profile = this.userProfile;
        this.logger.debug('Building base resume with profile:', profile);

        if (!profile) {
            this.logger.error('No user profile available for building base resume');
            return 'No user profile available. Please configure your profile in the options page.';
        }

        let resume = '';

        // Personal Information
        if (profile.personalInfo?.fullName) {
            resume += `${profile.personalInfo.fullName}\n`;
        }
        if (profile.personalInfo?.email) {
            resume += `Email: ${profile.personalInfo.email}\n`;
        }
        if (profile.personalInfo?.phone) {
            resume += `Phone: ${profile.personalInfo.phone}\n`;
        }
        if (profile.personalInfo?.location) {
            resume += `Location: ${profile.personalInfo.location}\n`;
        }
        if (profile.personalInfo?.linkedin) {
            resume += `LinkedIn: ${profile.personalInfo.linkedin}\n`;
        }
        if (profile.personalInfo?.portfolio) {
            resume += `Portfolio: ${profile.personalInfo.portfolio}\n`;
        }
        resume += '\n';

        // Professional Summary
        if (profile.professionalSummary) {
            resume += `PROFESSIONAL SUMMARY\n${profile.professionalSummary}\n\n`;
        }

        // Experience
        if (profile.experience && profile.experience.length > 0) {
            resume += 'PROFESSIONAL EXPERIENCE\n';
            profile.experience.forEach(exp => {
                resume += `${exp.jobTitle} - ${exp.company}\n`;
                if (exp.location) resume += `${exp.location}\n`;
                resume += `${exp.startDate} - ${exp.currentJob ? 'Present' : exp.endDate}\n`;
                if (exp.description) resume += `${exp.description}\n\n`;
            });
        }

        // Education
        if (profile.education && profile.education.length > 0) {
            resume += 'EDUCATION\n';
            profile.education.forEach(edu => {
                resume += `${edu.degree} in ${edu.field}\n`;
                resume += `${edu.institution}\n`;
                if (edu.graduationDate) resume += `Graduated: ${edu.graduationDate}\n`;
                if (edu.gpa) resume += `GPA: ${edu.gpa}\n\n`;
            });
        }

        // Skills
        if (profile.skills?.technical || profile.skills?.soft) {
            resume += 'SKILLS\n';
            if (profile.skills.technical) {
                resume += `Technical: ${profile.skills.technical}\n`;
            }
            if (profile.skills.soft) {
                resume += `Soft Skills: ${profile.skills.soft}\n`;
            }
            resume += '\n';
        }

        // Certifications
        if (profile.certifications && profile.certifications.length > 0) {
            resume += 'CERTIFICATIONS\n';
            profile.certifications.forEach(cert => {
                resume += `${cert.certName} - ${cert.issuer}\n`;
                if (cert.issueDate) resume += `Issued: ${cert.issueDate}\n`;
                if (cert.expiryDate) resume += `Expires: ${cert.expiryDate}\n\n`;
            });
        }

        return resume;
    }

    /**
     * Builds user profile data as JSON string
     * @returns {string} JSON string representation of user profile
     */
    buildUserProfile() {
        return JSON.stringify(this.userProfile, null, 2);
    }

    /**
     * Calculates ATS compatibility score for resume against job requirements
     * Uses AI to evaluate resume optimization and provide recommendations
     * @param {string} resume - The resume content to score
     * @param {Object} jobData - The job data to compare against
     * @param {string} jobData.description - Job description
     * @returns {Object} ATS score and recommendations
     * @returns {number} returns.score - ATS compatibility score (0-100)
     * @returns {Array} returns.recommendations - List of improvement recommendations
     * @async
     */
    async calculateATSScore(resume, jobData) {
        const prompt = `
        Calculate an ATS compatibility score for this resume against the job requirements:

        RESUME:
        ${resume}

        JOB DESCRIPTION:
        ${jobData.description}

        Evaluate based on:
        1. Keyword match density (2-3 mentions per key term)
        2. Section structure and headers
        3. Format compatibility
        4. Skills alignment
        5. Experience relevance

        Provide a score from 0-100 and specific recommendations for improvement.
        Format as JSON: {"score": number, "recommendations": ["item1", "item2"]}
        `;

        const response = await this.callOpenAI(prompt, 'gpt-4');
        return response;
    }

    async verifyStorylineConsistency(optimizedResume, baseResume) {
        const prompt = `
        Verify that the optimized resume maintains consistency with the base resume:

        BASE RESUME:
        ${baseResume}

        OPTIMIZED RESUME:
        ${optimizedResume}

        Check for:
        1. Timeline consistency (dates, durations)
        2. Achievement accuracy (numbers, metrics)
        3. Role descriptions alignment
        4. Skill progression logic
        5. Education and certification consistency

        Provide a consistency score (0-100) and list any potential contradictions.
        Format as JSON: {"score": number, "contradictions": ["item1", "item2"]}
        `;

        const response = await this.callOpenAI(prompt, 'gpt-4');
        return response;
    }

    /**
     * Makes API call to OpenAI Chat Completions endpoint
     * Handles authentication, request formatting, and error handling
     * @param {string} prompt - The user prompt to send to OpenAI
     * @param {string} [model='gpt-5'] - The OpenAI model to use
     * @param {string} [systemPrompt=null] - Optional system prompt
     * @returns {string} The AI-generated response content
     * @async
     * @throws {Error} When API key is not configured or API call fails
     */
    async callOpenAI(prompt, model = 'gpt-4o', systemPrompt = null) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const startTime = Date.now();

        try {
            const messages = [];

            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            messages.push({
                role: 'user',
                content: prompt
            });

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_completion_tokens: this.settings.api?.maxTokens || 2000,
                    temperature: this.settings.api?.temperature || 0.3
                })
            });

            const duration = Date.now() - startTime;

            if (!response.ok) {
                const error = await response.json();
                this.logger.logApiCall('/v1/chat/completions', 'POST', response.status, duration, error);
                throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            this.logger.logApiCall('/v1/chat/completions', 'POST', response.status, duration);

            // Handle both JSON and text responses
            const content = data.choices[0].message.content;

            // Try to parse as JSON first, fall back to text if it fails
            try {
                return JSON.parse(content);
            } catch (parseError) {
                // If it's not JSON, return the content as-is
                return content;
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.logApiCall('/v1/chat/completions', 'POST', 0, duration, error);
            throw error;
        }
    }

    /**
     * Tests API connection with provided credentials
     * Validates API key and model availability
     * @param {string} apiKey - The OpenAI API key to test
     * @param {string} model - The model to test with
     * @returns {Object} Test result with success status and message
     * @returns {boolean} returns.success - Whether the test was successful
     * @returns {string} returns.message - Success message
     * @returns {string} returns.error - Error message if test failed
     * @async
     */
    async testApiConnection(apiKey, model) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: 'Test connection'
                        }
                    ],
                    max_completion_tokens: 10
                })
            });

            if (response.ok) {
                return { success: true, message: 'API connection successful' };
            } else {
                const error = await response.json();
                return { success: false, error: error.error?.message || 'API test failed' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Gets current settings for the extension
     * Returns a subset of settings relevant to the UI
     * @returns {Object} Current settings object
     * @returns {string} returns.apiKey - Current API key (masked)
     * @returns {Object} returns.userProfile - User profile data
     * @returns {string} returns.optimizationLevel - Current optimization level
     */
    async getSettings() {
        return {
            apiKey: this.settings.api?.apiKey || '',
            userProfile: this.settings.userProfile || null,
            optimizationLevel: this.settings.parameters?.optimizationLevel || 'balanced'
        };
    }

    /**
     * Saves all settings to Chrome storage
     * Updates internal state with new settings
     * @param {Object} settings - The complete settings object to save
     * @async
     * @throws {Error} When saving to storage fails
     */
    async saveAllSettings(settings) {
        try {
            await chrome.storage.local.set({ settings: settings });
            this.settings = settings;
            this.apiKey = settings.api?.apiKey || null;
            this.userProfile = settings.userProfile || null;
            this.logger.info('Settings saved successfully');
        } catch (error) {
            this.logger.error('Error saving settings:', error);
            throw error;
        }
    }

    /**
     * Saves custom instructions for resume and cover letter generation
     * @param {Object} instructions - Custom instructions object
     * @param {string} instructions.coverLetter - Cover letter custom instructions
     * @param {string} instructions.resume - Resume custom instructions
     * @async
     * @throws {Error} When saving to storage fails
     */
    async saveCustomInstructions(instructions) {
        try {
            if (!this.settings.customInstructions) {
                this.settings.customInstructions = {};
            }
            this.settings.customInstructions = instructions;
            await chrome.storage.local.set({ settings: this.settings });
            this.logger.info('Custom instructions saved');
        } catch (error) {
            this.logger.error('Error saving custom instructions:', error);
            throw error;
        }
    }

    /**
     * Imports settings from a JSON object
     * @param {Object} settingsData - The settings data to import
     * @async
     * @throws {Error} When importing fails
     */
    async importSettings(settingsData) {
        try {
            // Validate the settings data
            if (!settingsData || typeof settingsData !== 'object') {
                throw new Error('Invalid settings data');
            }

            // Save to storage
            await chrome.storage.local.set({ settings: settingsData });

            // Update internal state
            this.settings = settingsData;
            this.apiKey = settingsData.api?.apiKey || null;
            this.userProfile = settingsData.userProfile || null;

            this.logger.info('Settings imported successfully');
            return { success: true, message: 'Settings imported successfully' };
        } catch (error) {
            this.logger.error('Error importing settings:', error);
            throw error;
        }
    }

    /**
     * Downloads resume or cover letter as PDF
     * Generates professional PDF using PDFGenerator utility
     * @param {Object} resumeData - The resume or cover letter data to download
     * @param {string} resumeData.content - The content to include in PDF
     * @param {string} [type='resume'] - The type of document (resume or cover-letter)
     * @async
     */
    async downloadPDF(resumeData, type = 'resume') {
        try {
            // Import PDF generator
            const { PDFGenerator } = await import('./utils/pdfGenerator.js');
            const pdfGen = new PDFGenerator();

            // Get current job data
            const result = await chrome.storage.local.get(['currentJob']);
            const jobData = result.currentJob || {};

            // Generate PDF
            const pdfResult = await pdfGen.generatePDF(resumeData, jobData);

            // Create download
            const url = URL.createObjectURL(pdfResult.blob);
            const filename = `${type}_${jobData.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'optimized'}_${Date.now()}.html`;

            // Trigger download
            if (chrome.downloads && chrome.downloads.download) {
                chrome.downloads.download({
                    url: url,
                    filename: filename,
                    saveAs: true
                });
            } else {
                // Fallback: create a simple download link
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
            }

            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to simple text download
            const blob = new Blob([resumeData.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            if (chrome.downloads && chrome.downloads.download) {
                chrome.downloads.download({
                    url: url,
                    filename: `${type}_${Date.now()}.txt`,
                    saveAs: true
                });
            } else {
                // Fallback: create a simple download link
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_${Date.now()}.txt`;
                a.click();
            }

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    /**
     * Sets up side panel functionality
     * Configures extension icon click handler to open side panel
     */
    setupSidePanel() {
        // Set up side panel when extension icon is clicked
        if (chrome.action && chrome.action.onClicked) {
            chrome.action.onClicked.addListener(async (tab) => {
                try {
                    if (chrome.sidePanel && chrome.sidePanel.open) {
                        await chrome.sidePanel.open({ tabId: tab.id });
                        this.logger.info('Side panel opened for tab:', tab.id);
                    } else {
                        // Fallback: open options page if side panel not available
                        chrome.runtime.openOptionsPage();
                    }
                } catch (error) {
                    this.logger.error('Error opening side panel:', error);
                    // Fallback: open options page
                    chrome.runtime.openOptionsPage();
                }
            });
        }
    }

    /**
     * Sets up periodic alarms for maintenance tasks
     * Creates cleanup alarm that runs every hour
     */
    setupAlarms() {
        // Set up periodic cleanup of old data
        if (chrome.alarms && chrome.alarms.create) {
            chrome.alarms.create('cleanup', { periodInMinutes: 60 });

            chrome.alarms.onAlarm.addListener((alarm) => {
                if (alarm.name === 'cleanup') {
                    this.cleanupOldData();
                }
            });
        }
    }

    /**
     * Cleans up old job data based on retention settings
     * Removes job data older than the configured retention period
     * @async
     */
    async cleanupOldData() {
        try {
            const result = await chrome.storage.local.get(['lastJobDetection']);
            if (result.lastJobDetection) {
                const lastDetection = new Date(result.lastJobDetection);
                const now = new Date();
                const hoursDiff = (now - lastDetection) / (1000 * 60 * 60);

                // Clean up job data older than retention period
                const retentionDays = this.settings.advanced?.dataRetention || 30;
                if (hoursDiff > (retentionDays * 24)) {
                    await chrome.storage.local.remove(['currentJob', 'lastJobDetection']);
                    if (chrome.action && chrome.action.setBadgeText) {
                        chrome.action.setBadgeText({ text: '' });
                    }
                    this.logger.info('Cleaned up old job data');
                }
            }
        } catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }

    /**
     * Calculates match score for cover letter against job requirements
     * Uses AI to evaluate how well the cover letter addresses job needs
     * @param {string} coverLetter - The cover letter content to evaluate
     * @param {Object} jobData - The job data to match against
     * @param {string} jobData.description - Job description
     * @returns {Object} Match score object
     * @returns {number} returns.score - Match score (0-100)
     * @async
     */
    async calculateCoverLetterMatch(coverLetter, jobData) {
        const prompt = `
        Calculate a match score for this cover letter against the job requirements:

        COVER LETTER:
        ${coverLetter}

        JOB DESCRIPTION:
        ${jobData.description}

        Evaluate based on:
        1. Relevance to job requirements
        2. Demonstration of required skills
        3. Company knowledge and interest
        4. Professional tone and structure
        5. Call to action effectiveness

        Provide a score from 0-100.
        Format as JSON: {"score": number}
        `;

        const response = await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-4o');
        return response;
    }

    /**
     * Verifies storyline consistency between base and optimized resume
     * Ensures optimization doesn't introduce contradictions or inaccuracies
     * @param {string} optimizedResume - The optimized resume content to verify
     * @returns {Object} Consistency check results
     * @returns {number} returns.score - Consistency score (0-100)
     * @returns {Array} returns.contradictions - List of potential contradictions found
     * @async
     */
    async verifyStorylineConsistency(optimizedResume) {
        const baseResume = this.buildBaseResume();
        const prompt = `
        Verify that the optimized resume maintains consistency with the base resume:

        BASE RESUME:
        ${baseResume}

        OPTIMIZED RESUME:
        ${optimizedResume}

        Check for:
        1. Timeline consistency (dates, durations)
        2. Achievement accuracy (numbers, metrics)
        3. Role descriptions alignment
        4. Skill progression logic
        5. Education and certification consistency

        Provide a consistency score (0-100) and list any potential contradictions.
        Format as JSON: {"score": number, "contradictions": ["item1", "item2"]}
        `;

        const response = await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-4o');
        return response;
    }

    /**
     * Returns the default resume optimization user prompt template
     * Contains placeholders for dynamic content insertion
     * @returns {string} Default resume user prompt template
     */
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

    /**
     * Returns the default cover letter generation user prompt template
     * Contains placeholders for dynamic content insertion
     * @returns {string} Default cover letter user prompt template
     */
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
}

/**
 * Initialize the background service
 * Creates the main ResumeAI Pro background service instance
 */
const resumeAIPro = new ResumeAIProBackground();
