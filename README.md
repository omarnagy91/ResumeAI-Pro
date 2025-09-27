# ResumeAI Pro

AI-Powered Chrome Extension for Dynamic Resume Customization

## Overview

ResumeAI Pro is a sophisticated Chrome extension that leverages AI to automatically customize resumes and cover letters for specific job applications. The extension detects job postings on popular job boards, extracts key requirements, and optimizes your resume content for maximum ATS compatibility while maintaining authenticity.

## Key Features

- **🤖 Intelligent Job Description Parser**: Automatically extracts job requirements from any job board
- **📝 GPT-4o Resume Optimization**: AI-powered resume customization for each application
- **💌 Cover Letter Generation**: Create compelling, personalized cover letters with custom instructions
- **📊 ATS Compatibility Scoring**: Ensures 95%+ ATS compatibility with real-time scoring
- **🔒 Storyline Consistency**: Maintains authenticity across all resume versions
- **📄 Professional PDF Generation**: One-click download of optimized resumes and cover letters
- **⚙️ Comprehensive Settings**: Full control over prompts, parameters, and user profile
- **🐛 Advanced Error Handling**: Robust logging and error management system

## Architecture

The extension follows a modular architecture with separate components for different functionalities:

- **Background Script** (`background.js`): Main service worker handling API communication and data processing
- **Content Script** (`content.js`): Detects and extracts job information from web pages
- **Options Page** (`options.js`): Comprehensive settings management interface
- **Sidebar Interface** (`sidebar.js`): Main user interface for resume generation
- **Utilities** (`utils/`): Shared utilities for logging and PDF generation

## Installation

### For Users

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the ResumeAI Pro folder
5. The extension icon should appear in your toolbar
6. Configure your OpenAI API key in the extension options

### For Developers

```bash
# Clone the repository
git clone https://github.com/your-username/resumeai-pro.git
cd resumeai-pro

# Install dependencies (if any)
npm install

# Load in Chrome for development
# Follow the user installation steps above
```

## Configuration

### 1. OpenAI API Setup

1. **Get API Key**: Sign up at [OpenAI](https://platform.openai.com/) and generate an API key
2. **Configure in Extension**: 
   - Right-click the extension icon
   - Select "Options"
   - Enter your API key in the API Configuration tab
   - Test the connection to ensure it's working

### 2. User Profile Configuration

Set up your complete professional profile:
- **Personal Information**: Name, email, phone, location, LinkedIn, portfolio
- **Professional Summary**: Your career overview and objectives
- **Experience**: Work history with detailed descriptions
- **Education**: Academic background and achievements
- **Skills**: Technical and soft skills
- **Certifications**: Professional certifications and licenses

### 3. Advanced Settings

- **Prompts Customization**: Modify AI prompts for personalized results
- **Optimization Parameters**: Adjust keyword density and optimization levels
- **Privacy Settings**: Configure data retention and analytics preferences

## Usage

### Basic Workflow

1. **Navigate to Job Posting**: Go to any job posting on LinkedIn, Indeed, or supported job boards
2. **Open Extension**: Click the ResumeAI Pro extension icon to open the sidebar
3. **Job Detection**: The extension automatically detects and extracts job information
4. **Generate Resume**: Click "Analyze & Generate Resume" for AI optimization
5. **Generate Cover Letter**: Click "Generate Cover Letter" for personalized letters
6. **Review Results**: Wait for AI processing (30-60 seconds) and review compatibility scores
7. **Download PDFs**: Download professional PDFs of your optimized documents

### Advanced Features

- **🎯 Custom Instructions**: Add specific instructions for cover letter generation
- **🔧 Prompt Customization**: Modify AI prompts for personalized results  
- **📈 Parameter Tuning**: Adjust optimization levels, keyword density, and more
- **👤 Profile Management**: Comprehensive user profile with experience, education, and skills
- **💾 Settings Export/Import**: Backup and restore your configuration
- **📊 Performance Analytics**: Track success rates and optimization effectiveness

## Developer Guide

### Project Structure

```
ResumeAI Pro/
├── manifest.json              # Extension manifest (Manifest V3)
├── background.js              # Background service worker
├── content.js                 # Content script for job detection
├── options.html              # Options page HTML
├── options.js                # Options page JavaScript
├── sidebar.html              # Sidebar interface HTML
├── sidebar.js                # Sidebar interface JavaScript
├── debug.js                  # Debug utilities
├── styles/                   # CSS stylesheets
│   ├── options.css
│   └── sidebar.css
├── utils/                    # Utility modules
│   ├── logger.js            # Advanced logging utility
│   └── pdfGenerator.js      # PDF generation utility
├── icons/                   # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md               # This file
```

### API Documentation

#### Background Script (`background.js`)

The main service worker handles all API communication and data processing.

**Key Classes:**
- `ResumeAIProBackground`: Main background service class
- `Logger`: Internal logging utility

**Key Methods:**
- `generateResume(jobData)`: Generates optimized resume content
- `generateCoverLetter(jobData, customInstructions)`: Creates personalized cover letters
- `calculateATSScore(resume, jobData)`: Calculates ATS compatibility scores
- `analyzeJobRequirements(jobData)`: Analyzes job requirements using AI

#### Content Script (`content.js`)

Detects and extracts job information from web pages.

**Key Classes:**
- `JobDescriptionExtractor`: Main content script class

**Key Methods:**
- `detectJobPage()`: Determines if current page is a job posting
- `extractJobData()`: Extracts comprehensive job information
- `extractJobTitle()`, `extractCompany()`, `extractLocation()`: Specific data extractors

#### Options Page (`options.js`)

Manages all extension settings and user profile configuration.

**Key Classes:**
- `ResumeAIProOptions`: Main options page class

**Key Methods:**
- `saveAllSettings()`: Saves complete settings configuration
- `testApiConnection()`: Tests OpenAI API connectivity
- `exportSettings()`, `importSettings()`: Backup/restore functionality

#### Utilities

**Logger (`utils/logger.js`)**
- Advanced logging with multiple levels
- Error tracking and storage
- Performance monitoring

**PDF Generator (`utils/pdfGenerator.js`)**  
- Professional PDF creation
- ATS-optimized formatting
- Custom styling and templates

### Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow coding standards**: Use JSDoc comments and consistent formatting
3. **Test thoroughly**: Ensure all functionality works across supported job boards
4. **Submit pull requests** with detailed descriptions of changes

### Debugging

Use the included debug script (`debug.js`) to troubleshoot issues:

```javascript
// Copy and paste into browser console on any job page
// Provides comprehensive debugging information
```

Common troubleshooting steps:
1. Check browser console for errors
2. Verify API key configuration
3. Ensure content script injection on job pages
4. Test on different job boards

## Supported Job Boards

The extension currently supports job detection and extraction from:

- **LinkedIn Jobs** - Full support with advanced selectors
- **Indeed** - Complete job data extraction
- **Glassdoor** - Company and salary information
- **Monster** - Job descriptions and requirements
- **ZipRecruiter** - Location and company data
- **CareerBuilder** - Skills and qualifications
- **Dice** - Technology-focused positions
- **AngelList/Wellfound** - Startup and tech roles
- **Company career pages** - Generic selectors for most corporate sites

## Privacy & Security

**Data Protection:**
- All processing is done securely through OpenAI's API
- Your profile data is stored locally in your browser storage
- No personal information is shared with third parties
- Job descriptions are processed temporarily and not permanently stored

**Security Features:**
- Secure API communication with OpenAI
- Local data encryption for sensitive information
- Comprehensive logging system for debugging and support
- Optional analytics with full user control

## Performance

**Optimization Features:**
- Lazy loading of extension components
- Efficient job page detection algorithms
- Minimal memory footprint
- Fast PDF generation

**System Requirements:**
- Chrome 88+ (Manifest V3 support)
- 50MB available storage
- Active internet connection for AI processing

## Roadmap

**Upcoming Features:**
- [ ] Integration with additional job boards
- [ ] Advanced analytics and success tracking
- [ ] Team collaboration features
- [ ] Multiple resume template support
- [ ] Interview preparation assistance

## Troubleshooting

**Common Issues:**

1. **Extension not detecting job pages**
   - Refresh the page and try again
   - Check if the job board is supported
   - Ensure content script permissions are granted

2. **API errors or failed generation**
   - Verify OpenAI API key is valid and has credits
   - Check internet connection
   - Review API rate limits

3. **Performance issues**
   - Clear browser cache and extension data
   - Restart browser
   - Check for conflicting extensions

## Support

**Getting Help:**
- 📧 Email: support@resumeaipro.com
- 🐛 Report bugs: [GitHub Issues](https://github.com/your-username/resumeai-pro/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/resumeai-pro/discussions)
- 📖 Documentation: [Wiki](https://github.com/your-username/resumeai-pro/wiki)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the GPT API
- The Chrome Extensions team for Manifest V3
- All contributors and beta testers
