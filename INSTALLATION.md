# ResumeAI Pro - Installation Guide

## Quick Start

### 1. Download the Extension
- Download or clone this repository to your local machine
- Extract the files to a folder (e.g., `ResumeAI Pro`)

### 2. Install in Chrome
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the ResumeAI Pro folder
6. The extension should now appear in your extensions list

### 3. Configure Settings
1. Click the ResumeAI Pro icon in your Chrome toolbar
2. Click "Settings" in the popup
3. Enter your OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/))
4. Paste your base resume template
5. Choose your optimization level (Conservative/Balanced/Aggressive)
6. Click "Save Settings"

### 4. Test the Extension
1. Open the included `test-extension.html` file in Chrome
2. Click the ResumeAI Pro icon
3. Verify that job information is detected
4. Try generating a resume (requires valid API key)

## Requirements

### System Requirements
- Google Chrome (version 88 or higher)
- Internet connection for OpenAI API calls
- OpenAI API key with GPT-4 access

### API Key Setup
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)
6. Paste it in the extension settings

## Usage Instructions

### Basic Workflow
1. **Navigate to Job Posting**: Go to any job board (LinkedIn, Indeed, etc.)
2. **Open Extension**: Click the ResumeAI Pro icon
3. **Review Detection**: Check that job information is correctly detected
4. **Generate Resume**: Click "Analyze & Generate Resume"
5. **Review Results**: Check ATS score and resume content
6. **Download**: Click "Download PDF" to save your optimized resume

### Supported Job Boards
- LinkedIn Jobs
- Indeed
- Glassdoor
- Monster
- ZipRecruiter
- CareerBuilder
- Dice
- AngelList/Wellfound
- Company career pages

### Optimization Levels
- **Conservative**: Minimal changes, maintains original structure
- **Balanced**: Moderate optimization with keyword integration
- **Aggressive**: Maximum optimization for ATS compatibility

## Troubleshooting

### Common Issues

#### "Service worker registration failed"
- **Cause**: Extension background script has errors
- **Solution**: 
  1. Open Chrome DevTools (F12)
  2. Go to Extensions tab
  3. Click "Inspect views: background page"
  4. Check console for errors
  5. Reload the extension

#### "Could not establish connection. Receiving end does not exist"
- **Cause**: Content script not loaded on the page
- **Solution**:
  1. Refresh the current page
  2. Navigate to a different page and back
  3. Check that the extension is enabled
  4. Try disabling and re-enabling the extension

#### "No job detected"
- Ensure you're on a job posting page
- Try refreshing the page
- Check that the extension is enabled
- Verify the page has loaded completely

#### "API key not configured"
- Go to Settings and enter your OpenAI API key
- Ensure the key starts with `sk-`
- Verify you have GPT-4 access
- Test the API connection in settings

#### "User profile not configured"
- Go to Settings → User Profile tab
- Fill in your personal information
- Add at least one work experience
- Include your skills and education

#### "Error generating resume"
- Check your internet connection
- Verify your API key is valid
- Ensure you have sufficient OpenAI credits
- Check the console for detailed error messages

#### "Side panel not opening"
- **Cause**: Chrome version doesn't support side panels
- **Solution**: 
  1. Update Chrome to latest version
  2. Extension will fallback to opening options page
  3. Use the options page to configure settings

### Performance Tips
- Use a well-formatted base resume template
- Keep job descriptions under 5000 characters
- Ensure stable internet connection during generation
- Close other tabs to free up memory

## Security & Privacy

### Data Handling
- Your resume data is stored locally in your browser
- Job descriptions are processed temporarily and not stored
- API calls are made securely to OpenAI
- No personal data is shared with third parties

### Best Practices
- Use a dedicated API key for this extension
- Regularly update your base resume template
- Review generated content before submitting
- Keep your API key secure and don't share it

## Support

### Getting Help
- Check this installation guide first
- Review the README.md for feature details
- Open an issue on GitHub for bugs
- Contact support for technical issues

### Feature Requests
- Submit feature requests via GitHub issues
- Include detailed descriptions and use cases
- Vote on existing feature requests

## Updates

### Updating the Extension
1. Download the latest version
2. Go to `chrome://extensions/`
3. Click "Remove" on the old version
4. Load the new version using "Load unpacked"
5. Reconfigure settings if needed

### Version History
- v1.0.0: Initial release with core features
- Future versions will include additional job boards and features

## Legal

### Terms of Use
- This extension is for personal use only
- Users are responsible for their API usage costs
- Generated content should be reviewed before submission
- Respect job board terms of service

### Disclaimer
- ResumeAI Pro is a tool to assist with resume optimization
- Users should review all generated content
- No guarantee of job interview success
- Use at your own discretion
