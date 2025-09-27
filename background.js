// Background script for ResumeAI Pro
// Handles API communication, data processing, and storage

class ResumeAIProBackground {
    constructor() {
        this.apiKey = null;
        this.userProfile = null;
        this.settings = null;
        this.logger = new Logger();
        this.init();
    }

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

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            if (result.settings) {
                this.settings = result.settings;
                this.apiKey = this.settings.api?.apiKey || null;
                this.userProfile = this.settings.userProfile || null;
            } else {
                this.settings = this.getDefaultSettings();
            }
        } catch (error) {
            this.logger.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

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

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
    }

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

                default:
                    this.logger.warn('Unknown action:', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            this.logger.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleJobDetected(jobData) {
        // Store the detected job data
        await chrome.storage.local.set({
            currentJob: jobData,
            lastJobDetection: new Date().toISOString()
        });

        // Update badge to show job detected
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    }

    async generateResume(jobData) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        if (!this.userProfile) {
            throw new Error('User profile not configured');
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
        return JSON.parse(response);
    }

    async optimizeResume(jobAnalysis, jobData) {
        const baseResume = this.buildBaseResume();
        const systemPrompt = this.settings.prompts?.resumeSystemPrompt || 'You are ResumeAI Pro, an expert resume optimization assistant.';
        const userPrompt = this.settings.prompts?.resumeUserPrompt || this.getDefaultResumeUserPrompt();

        const prompt = userPrompt
            .replace('{baseResume}', baseResume)
            .replace('{jobAnalysis}', JSON.stringify(jobAnalysis, null, 2))
            .replace('{optimizationLevel}', this.settings.parameters?.optimizationLevel || 'balanced');

        return await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-5', systemPrompt);
    }

    async createCoverLetter(jobData, customInstructions) {
        const userProfile = this.buildUserProfile();
        const systemPrompt = this.settings.prompts?.coverLetterSystemPrompt || 'You are ResumeAI Pro, an expert cover letter writer.';
        const userPrompt = this.settings.prompts?.coverLetterUserPrompt || this.getDefaultCoverLetterUserPrompt();

        const prompt = userPrompt
            .replace('{userProfile}', userProfile)
            .replace('{jobData}', JSON.stringify(jobData, null, 2))
            .replace('{customInstructions}', customInstructions);

        return await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-5', systemPrompt);
    }

    buildBaseResume() {
        const profile = this.userProfile;
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

    buildUserProfile() {
        return JSON.stringify(this.userProfile, null, 2);
    }

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
        return JSON.parse(response);
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
        return JSON.parse(response);
    }

    async callOpenAI(prompt, model = 'gpt-5', systemPrompt = null) {
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
                    max_tokens: this.settings.api?.maxTokens || 2000,
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

            return data.choices[0].message.content;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.logApiCall('/v1/chat/completions', 'POST', 0, duration, error);
            throw error;
        }
    }

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
                    max_tokens: 10
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

    async getSettings() {
        return {
            apiKey: this.settings.api?.apiKey || '',
            userProfile: this.settings.userProfile || null,
            optimizationLevel: this.settings.parameters?.optimizationLevel || 'balanced'
        };
    }

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

    async downloadPDF(resumeData) {
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
            const filename = `resume_${jobData.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'optimized'}_${Date.now()}.html`;

            // Trigger download
            chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
            });

            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to simple text download
            const blob = new Blob([resumeData.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            chrome.downloads.download({
                url: url,
                filename: `resume_${Date.now()}.txt`,
                saveAs: true
            });

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    setupSidePanel() {
        // Set up side panel when extension icon is clicked
        chrome.action.onClicked.addListener(async (tab) => {
            try {
                await chrome.sidePanel.open({ tabId: tab.id });
                this.logger.info('Side panel opened for tab:', tab.id);
            } catch (error) {
                this.logger.error('Error opening side panel:', error);
            }
        });
    }

    setupAlarms() {
        // Set up periodic cleanup of old data
        chrome.alarms.create('cleanup', { periodInMinutes: 60 });

        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'cleanup') {
                this.cleanupOldData();
            }
        });
    }

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
                    chrome.action.setBadgeText({ text: '' });
                    this.logger.info('Cleaned up old job data');
                }
            }
        } catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }

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

        const response = await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-5');
        return JSON.parse(response);
    }

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

        const response = await this.callOpenAI(prompt, this.settings.api?.model || 'gpt-5');
        return JSON.parse(response);
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

// Initialize the background service
const resumeAIPro = new ResumeAIProBackground();
