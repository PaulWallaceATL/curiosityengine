# Testing Guide - New Chrome Extension Features

## Quick Start

### 1. Build and Load Extension
```bash
cd apps/sales-curiosity-extension
npm run build
```

Then load the `dist` folder as an unpacked extension in Chrome at `chrome://extensions/`

### 2. Test the Context Page

1. Open the extension popup
2. Login with your credentials
3. Click on the **Context** tab (👤)
4. Fill in both fields:
   - **About Me**: e.g., "I'm a Sales Director at TechCorp, specializing in enterprise healthcare solutions..."
   - **My Objectives**: e.g., "Looking to connect with healthcare decision-makers, build relationships with CMOs..."
5. Click **Save Context**
6. You should see a green success message

### 3. Test Profile Analysis

1. Navigate to any LinkedIn profile (e.g., https://linkedin.com/in/someone)
2. Open the extension popup
3. Click on the **Home** tab (🏠)
4. You should see "LinkedIn Profile Detected" with the URL
5. Click the **Analyze Profile** button (blue button)
6. Click **Start Analysis** in the confirmation dialog
7. Wait for the AI to generate analysis
8. Review the results with:
   - Executive Summary
   - Key Insights
   - Sales Angles
   - Potential Pain Points
   - Conversation Starters
9. Test export buttons: TXT, PDF, DOCX

### 4. Test Email Drafting (NEW!)

1. On a LinkedIn profile, open the extension
2. Click the **Draft Email** button (purple button)
3. **Optional**: Add email-specific context, e.g.:
   - "I want to highlight our new AI-powered documentation features"
   - "Keep it casual and focus on solving their healthcare compliance challenges"
   - "Mention that we just closed a deal with a similar company"
4. Click **Generate Email**
5. Wait for the AI to draft the email
6. You should see a formatted email with:
   - Subject line
   - Personalized greeting
   - Body that references their profile
   - Professional closing
7. Test export options

### 5. Test Integrations Page

1. Click on the **Integrations** tab (🔌)
2. Review the placeholder cards for:
   - Email Integration (with "Coming Soon" badge)
   - CRM Integration (with "Coming Soon" badge)
3. Verify buttons are disabled

## Testing with Different Contexts

### Scenario 1: No User Context
- Skip the Context page
- Run analysis or draft email
- AI should still work but be more generic

### Scenario 2: With User Context
- Fill in Context page with specific details
- Run analysis or draft email
- AI should personalize based on your role and objectives

### Scenario 3: Email with Specific Instructions
- Fill in Context page
- Choose "Draft Email"
- Add very specific instructions like:
  - "Mention our upcoming webinar on AI in healthcare"
  - "Focus on ROI and include our 30% efficiency improvement stat"
- Email should incorporate these specific points

## Verification Checklist

- [ ] Navigation tabs switch between pages
- [ ] Context is saved and persists after closing/reopening
- [ ] Both "Analyze Profile" and "Draft Email" buttons appear on LinkedIn profiles
- [ ] "Not a LinkedIn Page" warning shows on non-LinkedIn sites
- [ ] Email context textarea appears when "Draft Email" is selected
- [ ] Cancel buttons work and reset the state
- [ ] Loading states show during AI processing
- [ ] Results display properly formatted
- [ ] Export buttons work (TXT, PDF, DOCX)
- [ ] Clear button resets the interface
- [ ] Integration page shows placeholder content

## Mock Mode Testing

If you don't have OpenAI credits yet:

1. The extension will use mock AI responses by default
2. Mock responses include realistic content based on the profile data
3. Mock responses indicate they are test data at the bottom
4. To enable real OpenAI:
   - Add `OPENAI_API_KEY` to your backend `.env.local`
   - Set `USE_MOCK_AI=0`
   - Restart your backend server

## Troubleshooting

### Extension not detecting LinkedIn
- Make sure you're on a profile page (not feed or search)
- Refresh the LinkedIn page after installing/updating the extension

### Context not saving
- Check Chrome console for storage errors
- Verify you're logged in
- Try clearing extension storage and re-saving

### API errors
- Check backend is running
- Verify API endpoint in extension settings
- Check browser console for detailed error messages

## Next Steps

After testing, you can:
1. Package the extension for distribution
2. Update the Chrome Web Store listing
3. Document the new features for users
4. Set up analytics to track feature usage

