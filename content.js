// Content script for ResumeAI Pro
// Handles job description extraction from web pages

class JobDescriptionExtractor {
    constructor() {
        this.jobData = null;
        this.isJobPage = false;
        this.init();
    }

    init() {
        this.detectJobPage();
        this.setupMessageListener();
        this.observePageChanges();
    }

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

    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    isValidJobTitle(title) {
        if (!title || title.length < 3) return false;

        const invalidTitles = [
            'home', 'about', 'contact', 'login', 'sign up', 'search',
            'jobs', 'careers', 'company', 'team', 'news', 'blog'
        ];

        const lowerTitle = title.toLowerCase();
        return !invalidTitles.some(invalid => lowerTitle.includes(invalid));
    }

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

    notifyBackground(jobData) {
        chrome.runtime.sendMessage({
            action: 'jobDetected',
            jobData: jobData
        });
    }
}

// Initialize the job description extractor
const jobExtractor = new JobDescriptionExtractor();
