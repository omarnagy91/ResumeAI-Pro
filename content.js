// Content script for ResumeAI Pro
// Handles job description extraction from web pages

/**
 * Job description extractor class
 * Automatically detects and extracts job information from various job board websites
 * @class JobDescriptionExtractor
 */
class JobDescriptionExtractor {
    /**
     * Creates a new JobDescriptionExtractor instance
     * @constructor
     */
    constructor() {
        this.jobData = null;
        this.isJobPage = false;
        this.init();
    }

    /**
     * Initializes the job description extractor
     * Sets up page detection, message listeners, and page change observers
     */
    init() {
        this.detectJobPage();
        this.setupMessageListener();
        this.observePageChanges();
    }

    /**
     * Detects if the current page is a job posting
     * Checks for known job boards and job-related keywords
     */
    detectJobPage() {
        const url = window.location.href;
        const hostname = window.location.hostname;

        // Check if we're on a known job board
        const jobBoards = [
            'linkedin.com',
            'indeed.com',
            'glassdoor.com',
            'monster.com',
            'ziprecruiter.com',
            'careerbuilder.com',
            'dice.com',
            'angel.co',
            'wellfound.com'
        ];

        this.isJobPage = jobBoards.some(board => hostname.includes(board)) ||
            this.detectJobKeywords();

        if (this.isJobPage) {
            this.extractJobData();
        }
    }

    /**
     * Detects job-related keywords in the page content
     * Used as a fallback for unknown job boards
     * @returns {boolean} True if job keywords are detected
     */
    detectJobKeywords() {
        const jobKeywords = [
            'job', 'career', 'position', 'opening', 'opportunity',
            'employment', 'hiring', 'recruitment', 'vacancy'
        ];

        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const bodyText = document.body.textContent.toLowerCase();

        return jobKeywords.some(keyword =>
            url.includes(keyword) ||
            title.includes(keyword) ||
            bodyText.includes(keyword)
        );
    }

    /**
     * Extracts comprehensive job data from the current page
     * Gathers title, company, location, description, requirements, and skills
     */
    extractJobData() {
        const jobData = {
            title: this.extractJobTitle(),
            company: this.extractCompany(),
            location: this.extractLocation(),
            description: this.extractJobDescription(),
            requirements: this.extractRequirements(),
            skills: this.extractSkills(),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        if (jobData.title && jobData.description) {
            this.jobData = jobData;
            this.notifyBackground(jobData);
        }
    }

    /**
     * Extracts job title from the page using site-specific and generic selectors
     * @returns {string|null} The extracted job title or null if not found
     */
    extractJobTitle() {
        // LinkedIn
        if (window.location.hostname.includes('linkedin.com')) {
            const title = document.querySelector('h1.job-title, .job-details-jobs-unified-top-card__job-title, h1[data-test-id="job-title"]');
            return title ? title.textContent.trim() : null;
        }

        // Indeed
        if (window.location.hostname.includes('indeed.com')) {
            const title = document.querySelector('h1[data-testid="job-title"], .jobsearch-JobInfoHeader-title');
            return title ? title.textContent.trim() : null;
        }

        // Glassdoor
        if (window.location.hostname.includes('glassdoor.com')) {
            const title = document.querySelector('.jobTitle, .JobDetails_jobTitle__');
            return title ? title.textContent.trim() : null;
        }

        // Generic selectors
        const genericSelectors = [
            'h1.job-title',
            'h1[class*="job-title"]',
            'h1[class*="title"]',
            '.job-header h1',
            '.job-title',
            'h1'
        ];

        for (const selector of genericSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isValidJobTitle(element.textContent)) {
                return element.textContent.trim();
            }
        }

        return null;
    }

    /**
     * Extracts company name from the page using site-specific and generic selectors
     * @returns {string|null} The extracted company name or null if not found
     */
    extractCompany() {
        // LinkedIn
        if (window.location.hostname.includes('linkedin.com')) {
            const company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__primary-description-without-tagline a');
            return company ? company.textContent.trim() : null;
        }

        // Indeed
        if (window.location.hostname.includes('indeed.com')) {
            const company = document.querySelector('[data-testid="company-name"], .jobsearch-CompanyInfoContainer');
            return company ? company.textContent.trim() : null;
        }

        // Generic selectors
        const genericSelectors = [
            '.company-name',
            '.job-company',
            '[class*="company"]',
            '.employer',
            '.organization'
        ];

        for (const selector of genericSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 0) {
                return element.textContent.trim();
            }
        }

        return null;
    }

    /**
     * Extracts job location from the page using site-specific and generic selectors
     * @returns {string|null} The extracted job location or null if not found
     */
    extractLocation() {
        // LinkedIn
        if (window.location.hostname.includes('linkedin.com')) {
            const location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__primary-description-without-tagline span');
            return location ? location.textContent.trim() : null;
        }

        // Indeed
        if (window.location.hostname.includes('indeed.com')) {
            const location = document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle');
            return location ? location.textContent.trim() : null;
        }

        // Generic selectors
        const genericSelectors = [
            '.job-location',
            '.location',
            '[class*="location"]',
            '.job-address'
        ];

        for (const selector of genericSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 0) {
                return element.textContent.trim();
            }
        }

        return null;
    }

    /**
     * Extracts job description from the page using site-specific and generic selectors
     * @returns {string|null} The cleaned job description text or null if not found
     */
    extractJobDescription() {
        // LinkedIn
        if (window.location.hostname.includes('linkedin.com')) {
            const description = document.querySelector('.jobs-description-content__text, .jobs-box__html-content, .jobs-description__content');
            return description ? this.cleanText(description.textContent) : null;
        }

        // Indeed
        if (window.location.hostname.includes('indeed.com')) {
            const description = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText');
            return description ? this.cleanText(description.textContent) : null;
        }

        // Glassdoor
        if (window.location.hostname.includes('glassdoor.com')) {
            const description = document.querySelector('.jobDescriptionContent, .JobDetails_jobDescription__');
            return description ? this.cleanText(description.textContent) : null;
        }

        // Generic selectors
        const genericSelectors = [
            '.job-description',
            '.job-content',
            '.description',
            '[class*="description"]',
            '.job-details',
            '.job-summary'
        ];

        for (const selector of genericSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) {
                return this.cleanText(element.textContent);
            }
        }

        return null;
    }

    /**
     * Extracts job requirements from the job description using pattern matching
     * @returns {Array} Array of extracted requirements or empty array if none found
     */
    extractRequirements() {
        const description = this.extractJobDescription();
        if (!description) return [];

        const requirements = [];
        const requirementPatterns = [
            /requirements?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gi,
            /qualifications?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gi,
            /must have[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gi,
            /required[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gi
        ];

        for (const pattern of requirementPatterns) {
            const matches = description.match(pattern);
            if (matches) {
                requirements.push(...matches.map(match => match.replace(/^(requirements?|qualifications?|must have|required)[:\s]+/i, '').trim()));
            }
        }

        return requirements;
    }

    /**
     * Extracts skills from job description by matching against common skills list
     * @returns {Array} Array of detected skills or empty array if none found
     */
    extractSkills() {
        const description = this.extractJobDescription();
        if (!description) return [];

        const commonSkills = [
            'JavaScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Angular', 'Vue',
            'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'SQL', 'MongoDB',
            'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git',
            'Agile', 'Scrum', 'Machine Learning', 'AI', 'Data Science', 'Analytics',
            'Project Management', 'Leadership', 'Communication', 'Problem Solving'
        ];

        const foundSkills = [];
        const lowerDescription = description.toLowerCase();

        for (const skill of commonSkills) {
            if (lowerDescription.includes(skill.toLowerCase())) {
                foundSkills.push(skill);
            }
        }

        return foundSkills;
    }

    /**
     * Cleans extracted text by normalizing whitespace and line breaks
     * @param {string} text - The text to clean
     * @returns {string} The cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    /**
     * Validates if extracted text is a valid job title
     * Filters out navigation elements and non-job related text
     * @param {string} title - The title text to validate
     * @returns {boolean} True if the title appears to be a valid job title
     */
    isValidJobTitle(title) {
        if (!title || title.length < 3) return false;

        const invalidTitles = [
            'home', 'about', 'contact', 'login', 'sign up', 'search',
            'jobs', 'careers', 'company', 'team', 'news', 'blog'
        ];

        const lowerTitle = title.toLowerCase();
        return !invalidTitles.some(invalid => lowerTitle.includes(invalid));
    }

    /**
     * Observes page changes for single-page applications
     * Detects when content changes dynamically and re-scans for job data
     */
    observePageChanges() {
        // Watch for dynamic content changes (SPA navigation)
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldRecheck = true;
                }
            });

            if (shouldRecheck) {
                setTimeout(() => {
                    this.detectJobPage();
                }, 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Sets up message listener for communication with extension background script
     * Responds to requests for job data from the sidebar or popup
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getJobData') {
                sendResponse({
                    isJobPage: this.isJobPage,
                    jobData: this.jobData
                });
            }
        });
    }

    /**
     * Notifies the background script when job data is detected
     * Sends extracted job information to be processed and stored
     * @param {Object} jobData - The extracted job data object
     */
    notifyBackground(jobData) {
        chrome.runtime.sendMessage({
            action: 'jobDetected',
            jobData: jobData
        });
    }
}

/**
 * Initialize the job description extractor
 * Creates the content script instance to detect and extract job information
 */
const jobExtractor = new JobDescriptionExtractor();
