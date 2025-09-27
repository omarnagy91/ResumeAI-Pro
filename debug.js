// Debug script for ResumeAI Pro
// Run this in the browser console to check extension status

console.log('=== ResumeAI Pro Debug Information ===');

// Check if extension is loaded
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome extension APIs available');

    // Check extension ID
    if (chrome.runtime.id) {
        console.log('✅ Extension ID:', chrome.runtime.id);
    }

    // Check permissions
    chrome.permissions.getAll((permissions) => {
        console.log('✅ Permissions:', permissions);
    });

    // Check storage
    chrome.storage.local.get(null, (items) => {
        console.log('✅ Storage items:', Object.keys(items));
        if (items.settings) {
            console.log('✅ Settings loaded:', !!items.settings.api?.apiKey);
        }
    });

} else {
    console.log('❌ Chrome extension APIs not available');
}

// Check if content script is loaded
if (typeof window !== 'undefined') {
    console.log('✅ Window object available');

    // Check for job-related elements
    const jobSelectors = [
        'h1[data-test-id="job-title"]',
        '.job-title',
        '.jobsearch-JobInfoHeader-title',
        '.jobs-description-content__text'
    ];

    let jobFound = false;
    jobSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            console.log('✅ Job element found:', selector, element.textContent.substring(0, 50));
            jobFound = true;
        }
    });

    if (!jobFound) {
        console.log('❌ No job elements found on this page');
    }
}

// Check for common job board indicators
const jobBoards = [
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com'
];

const currentHost = window.location.hostname;
const isJobBoard = jobBoards.some(board => currentHost.includes(board));

if (isJobBoard) {
    console.log('✅ On known job board:', currentHost);
} else {
    console.log('⚠️ Not on known job board:', currentHost);
}

console.log('=== Debug Complete ===');
