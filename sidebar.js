// Sidebar script for ResumeAI Pro
// Handles sidebar UI interactions and communication with background script

class ResumeAIProSidebar {
    constructor() {
        this.currentJob = null;
        this.currentResume = null;
        this.currentCoverLetter = null;
        this.isGenerating = false;
        this.logger = new Logger();
        this.init();
    }

    async init() {
        try {
            await this.loadSettings();
            this.setupEventListeners();
            this.checkCurrentPage();
            this.updateUI();
            this.logger.info('ResumeAI Pro sidebar initialized');
        } catch (error) {
            this.logger.error('Failed to initialize sidebar:', error);
            this.showError('Failed to initialize sidebar. Please refresh and try again.');
        }
    }

    async loadSettings() {
        try {
            const response = await this.sendMessage({ action: 'getSettings' });
            if (response.success) {
                this.settings = response.settings;
                this.updateApiStatus();
            }
        } catch (error) {
            this.logger.error('Error loading settings:', error);
        }
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('analyze-job')?.addEventListener('click', () => this.handleAnalyzeJob());
        document.getElementById('generate-cover-letter')?.addEventListener('click', () => this.handleGenerateCoverLetter());
        document.getElementById('download-resume')?.addEventListener('click', () => this.handleDownloadResume());
        document.getElementById('download-cover-letter')?.addEventListener('click', () => this.handleDownloadCoverLetter());
        document.getElementById('regenerate-resume')?.addEventListener('click', () => this.handleRegenerateResume());
        document.getElementById('regenerate-cover-letter')?.addEventListener('click', () => this.handleRegenerateCoverLetter());

        // Options and refresh
        document.getElementById('options-btn')?.addEventListener('click', () => this.openOptions());
        document.getElementById('refresh-job')?.addEventListener('click', () => this.refreshJobData());

        // Custom instructions modal
        document.getElementById('close-instructions')?.addEventListener('click', () => this.hideCustomInstructions());
        document.getElementById('save-instructions')?.addEventListener('click', () => this.saveCustomInstructions());
        document.getElementById('cancel-instructions')?.addEventListener('click', () => this.hideCustomInstructions());

        // Error handling
        document.getElementById('close-error')?.addEventListener('click', () => this.hideError());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async checkCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Send message to content script to check for job data
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getJobData' });

            if (response && response.isJobPage && response.jobData) {
                this.currentJob = response.jobData;
                this.updateJobStatus('success', 'Job detected!', 'Ready to generate optimized resume');
                this.showJobInfo();
                this.logger.info('Job detected:', this.currentJob.title);
            } else {
                this.updateJobStatus('error', 'No job detected', 'Navigate to a job posting to get started');
                this.logger.debug('No job detected on current page');
            }
        } catch (error) {
            this.logger.error('Error checking current page:', error);
            this.updateJobStatus('error', 'Error scanning page', 'Please refresh and try again');
        }
    }

    updateJobStatus(type, title, description) {
        const indicator = document.getElementById('status-indicator');
        const statusTitle = document.getElementById('status-title');
        const statusDescription = document.getElementById('status-description');

        indicator.className = `status-indicator ${type}`;
        statusTitle.textContent = title;
        statusDescription.textContent = description;
    }

    showJobInfo() {
        if (!this.currentJob) return;

        const jobInfoCard = document.getElementById('job-info');
        const jobTitle = document.getElementById('job-title');
        const jobCompany = document.getElementById('job-company');
        const jobLocation = document.getElementById('job-location');

        jobTitle.textContent = this.currentJob.title || 'Unknown Title';
        jobCompany.textContent = this.currentJob.company || 'Unknown Company';
        jobLocation.textContent = this.currentJob.location || 'Unknown Location';

        jobInfoCard.style.display = 'block';
    }

    async refreshJobData() {
        this.logger.info('Refreshing job data');
        await this.checkCurrentPage();
    }

    async handleAnalyzeJob() {
        if (!this.currentJob) {
            this.showError('No job data available');
            return;
        }

        if (!this.settings?.apiKey) {
            this.showError('Please configure your OpenAI API key in settings');
            this.openOptions();
            return;
        }

        if (!this.settings?.userProfile) {
            this.showError('Please configure your user profile in settings');
            this.openOptions();
            return;
        }

        this.startResumeGeneration();
    }

    async handleGenerateCoverLetter() {
        if (!this.currentJob) {
            this.showError('No job data available');
            return;
        }

        if (!this.settings?.apiKey) {
            this.showError('Please configure your OpenAI API key in settings');
            this.openOptions();
            return;
        }

        // Show custom instructions modal
        this.showCustomInstructions();
    }

    async startResumeGeneration() {
        this.isGenerating = true;
        this.showGenerationProgress('Generating Your Resume');
        this.updateProgress(0, 'Analyzing job requirements...');

        try {
            // Step 1: Analyze job
            this.updateProgress(25, 'Analyzing job requirements...');
            await this.delay(1000);

            // Step 2: Optimize content
            this.updateProgress(50, 'Optimizing resume content...');
            const response = await this.sendMessage({
                action: 'generateResume',
                jobData: this.currentJob
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to generate resume');
            }

            // Step 3: ATS scoring
            this.updateProgress(75, 'Calculating ATS score...');
            await this.delay(1000);

            // Step 4: Finalizing
            this.updateProgress(100, 'Finalizing resume...');
            await this.delay(500);

            this.currentResume = response.resume;
            this.showResumePreview();
            this.logger.info('Resume generated successfully');

        } catch (error) {
            this.logger.error('Error generating resume:', error);
            this.showError(`Error generating resume: ${error.message}`);
            this.hideGenerationProgress();
        } finally {
            this.isGenerating = false;
        }
    }

    async startCoverLetterGeneration(customInstructions = '') {
        this.isGenerating = true;
        this.showGenerationProgress('Generating Your Cover Letter');
        this.updateProgress(0, 'Analyzing job requirements...');

        try {
            // Step 1: Analyze job
            this.updateProgress(25, 'Analyzing job requirements...');
            await this.delay(1000);

            // Step 2: Generate cover letter
            this.updateProgress(50, 'Generating cover letter...');
            const response = await this.sendMessage({
                action: 'generateCoverLetter',
                jobData: this.currentJob,
                customInstructions: customInstructions
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to generate cover letter');
            }

            // Step 3: Finalizing
            this.updateProgress(100, 'Finalizing cover letter...');
            await this.delay(500);

            this.currentCoverLetter = response.coverLetter;
            this.showCoverLetterPreview();
            this.logger.info('Cover letter generated successfully');

        } catch (error) {
            this.logger.error('Error generating cover letter:', error);
            this.showError(`Error generating cover letter: ${error.message}`);
            this.hideGenerationProgress();
        } finally {
            this.isGenerating = false;
        }
    }

    showGenerationProgress(title) {
        const progressCard = document.getElementById('generation-progress');
        const progressTitle = document.getElementById('progress-title');

        progressTitle.textContent = title;
        progressCard.style.display = 'block';
        document.getElementById('job-info').style.display = 'none';
        document.getElementById('resume-preview').style.display = 'none';
        document.getElementById('cover-letter-preview').style.display = 'none';
    }

    hideGenerationProgress() {
        document.getElementById('generation-progress').style.display = 'none';
    }

    updateProgress(percentage, stepText) {
        const progressFill = document.getElementById('progress-fill');
        const progressDetails = document.getElementById('progress-details');
        const steps = document.querySelectorAll('.step');

        progressFill.style.width = `${percentage}%`;
        progressDetails.textContent = stepText;

        // Update step indicators
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            const maxStep = Math.ceil(percentage / 25);

            if (stepNumber <= maxStep) {
                step.classList.add('active');
                if (stepNumber < maxStep) {
                    step.classList.add('completed');
                }
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        // Update current step text
        const currentStep = Math.ceil(percentage / 25);
        if (currentStep <= 4) {
            const stepElement = document.getElementById(`step-${currentStep}`);
            if (stepElement) {
                const textElement = stepElement.querySelector('.step-text');
                if (textElement) {
                    textElement.textContent = stepText;
                }
            }
        }
    }

    showResumePreview() {
        if (!this.currentResume) return;

        const previewCard = document.getElementById('resume-preview');
        const resumeContent = document.getElementById('resume-content');
        const atsScore = document.getElementById('ats-score');

        // Display resume content (truncated for preview)
        const truncatedContent = this.currentResume.content.length > 1000
            ? this.currentResume.content.substring(0, 1000) + '...'
            : this.currentResume.content;

        resumeContent.innerHTML = `<pre>${this.escapeHtml(truncatedContent)}</pre>`;
        atsScore.textContent = `${this.currentResume.atsScore.score}%`;

        // Hide generation progress and show preview
        this.hideGenerationProgress();
        previewCard.style.display = 'block';
    }

    showCoverLetterPreview() {
        if (!this.currentCoverLetter) return;

        const previewCard = document.getElementById('cover-letter-preview');
        const coverLetterContent = document.getElementById('cover-letter-content');
        const coverLetterScore = document.getElementById('cover-letter-score');

        // Display cover letter content (truncated for preview)
        const truncatedContent = this.currentCoverLetter.content.length > 1000
            ? this.currentCoverLetter.content.substring(0, 1000) + '...'
            : this.currentCoverLetter.content;

        coverLetterContent.innerHTML = `<pre>${this.escapeHtml(truncatedContent)}</pre>`;
        coverLetterScore.textContent = `${this.currentCoverLetter.matchScore}%`;

        // Hide generation progress and show preview
        this.hideGenerationProgress();
        previewCard.style.display = 'block';
    }

    async handleDownloadResume() {
        if (!this.currentResume) {
            this.showError('No resume to download');
            return;
        }

        try {
            await this.sendMessage({
                action: 'downloadPDF',
                resumeData: this.currentResume,
                type: 'resume'
            });
            this.logger.info('Resume downloaded successfully');
        } catch (error) {
            this.logger.error('Error downloading resume:', error);
            this.showError(`Download error: ${error.message}`);
        }
    }

    async handleDownloadCoverLetter() {
        if (!this.currentCoverLetter) {
            this.showError('No cover letter to download');
            return;
        }

        try {
            await this.sendMessage({
                action: 'downloadPDF',
                resumeData: this.currentCoverLetter,
                type: 'cover-letter'
            });
            this.logger.info('Cover letter downloaded successfully');
        } catch (error) {
            this.logger.error('Error downloading cover letter:', error);
            this.showError(`Download error: ${error.message}`);
        }
    }

    async handleRegenerateResume() {
        if (this.isGenerating) return;

        this.currentResume = null;
        document.getElementById('resume-preview').style.display = 'none';
        this.handleAnalyzeJob();
    }

    async handleRegenerateCoverLetter() {
        if (this.isGenerating) return;

        this.currentCoverLetter = null;
        document.getElementById('cover-letter-preview').style.display = 'none';
        this.showCustomInstructions();
    }

    showCustomInstructions() {
        document.getElementById('custom-instructions-modal').style.display = 'flex';
    }

    hideCustomInstructions() {
        document.getElementById('custom-instructions-modal').style.display = 'none';
    }

    async saveCustomInstructions() {
        const coverLetterInstructions = document.getElementById('cover-letter-instructions').value;
        const resumeInstructions = document.getElementById('resume-instructions').value;

        try {
            await this.sendMessage({
                action: 'saveCustomInstructions',
                instructions: {
                    coverLetter: coverLetterInstructions,
                    resume: resumeInstructions
                }
            });

            this.hideCustomInstructions();

            // Start cover letter generation with custom instructions
            await this.startCoverLetterGeneration(coverLetterInstructions);

            this.logger.info('Custom instructions saved and cover letter generation started');
        } catch (error) {
            this.logger.error('Error saving custom instructions:', error);
            this.showError(`Error saving instructions: ${error.message}`);
        }
    }

    openOptions() {
        chrome.runtime.openOptionsPage();
    }

    showError(message) {
        const errorCard = document.getElementById('error-display');
        const errorContent = document.getElementById('error-content');

        errorContent.textContent = message;
        errorCard.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        document.getElementById('error-display').style.display = 'none';
    }

    updateApiStatus() {
        const apiStatus = document.getElementById('api-status');
        if (this.settings?.apiKey) {
            apiStatus.textContent = 'API: Connected';
            apiStatus.className = 'status-badge connected';
        } else {
            apiStatus.textContent = 'API: Not Connected';
            apiStatus.className = 'status-badge disconnected';
        }
    }

    updateUI() {
        // Update last updated timestamp
        const lastUpdated = document.getElementById('last-updated');
        lastUpdated.textContent = new Date().toLocaleTimeString();
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + R: Refresh job data
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.refreshJobData();
        }

        // Ctrl/Cmd + O: Open options
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            this.openOptions();
        }
    }

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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResumeAIProSidebar();
});
