# Sales Curiosity Engine - Deployment Guide

Complete step-by-step guide to deploy your Chrome extension and web application.

---

## 📋 Prerequisites

- [ ] Supabase account (database & authentication)
- [ ] OpenAI API key with credits
- [ ] Google Chrome Web Store developer account ($5 one-time fee)
- [ ] Vercel account (for hosting backend)
- [ ] Domain name (optional, for production URL)

---

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "sales-curiosity-engine"
4. Set a strong database password (save it!)
5. Choose region closest to you
6. Wait for project to be created (~2 minutes)

### 1.2 Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file: `supabase-schema.sql` from this repo
3. Copy and paste the ENTIRE contents into the SQL Editor
4. Click "Run" to execute
5. Verify tables were created: Go to **Table Editor** → should see `users` and `linkedin_analyses`

### 1.3 Create Your Admin Account
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
2. Click "Add user" → "Create new user"
3. Enter your email and password
4. Click "Create user"
5. Go to **SQL Editor** and run:
   ```sql
   UPDATE public.users 
   SET is_admin = TRUE 
   WHERE email = 'your-email@example.com';
   ```
   Replace `your-email@example.com` with your actual email

---

## 🔑 Step 2: Configure Environment Variables

### 2.1 Get Supabase Credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

### 2.2 Update `.env.local`
Edit `/apps/sales-curiosity-web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

OPENAI_API_KEY=sk-proj-...your-openai-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Set to 0 when you have OpenAI credits, 1 for mock mode
USE_MOCK_AI=1
NEXT_PUBLIC_MOCK_AI=1

ENABLE_LINKEDIN_FETCH=1
```

---

## 🧪 Step 3: Test Locally

### 3.1 Test Web App
```bash
cd apps/sales-curiosity-web
npm install
npm run dev
```

Visit http://localhost:3000/signup and create a test account.

### 3.2 Test Extension
```bash
cd ../../
npm run build -w @sales-curiosity/extension
```

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `/apps/sales-curiosity-extension/dist`
5. Go to any LinkedIn profile
6. Click extension → "Analyze this LinkedIn page"

---

## 🚀 Step 4: Deploy Backend to Vercel

### 4.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 4.2 Deploy
```bash
cd apps/sales-curiosity-web
vercel login
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** sales-curiosity-web
- **Directory?** `./` (current directory)
- **Build settings?** Yes (auto-detected)

### 4.3 Add Environment Variables to Vercel
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add USE_MOCK_AI
```

Paste the values when prompted. Select "Production" for each.

### 4.4 Deploy to Production
```bash
vercel --prod
```

Save your production URL (e.g., `https://sales-curiosity-web.vercel.app`)

---

## 🌐 Step 5: Prepare Extension for Chrome Web Store

### 5.1 Update Manifest for Production
Edit `/apps/sales-curiosity-extension/src/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Sales Curiosity Extension",
  "version": "1.0.0",
  "description": "AI-powered sales intelligence tool that helps you research prospects and craft personalized outreach.",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Sales Curiosity",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "permissions": ["storage", "activeTab", "scripting", "tabs"],
  "host_permissions": [
    "https://sales-curiosity-web.vercel.app/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["*://*.linkedin.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

**Key changes:**
- ❌ Removed `http://localhost:3000/*`
- ✅ Added your Vercel production URL
- ✅ Limited content scripts to LinkedIn only
- ✅ Updated version to `1.0.0`

### 5.2 Update Extension API Base URL
Edit `/apps/sales-curiosity-extension/src/popup.tsx`:

Change the default API base from:
```typescript
"http://localhost:3000"
```

To:
```typescript
"https://sales-curiosity-web.vercel.app"
```

### 5.3 Build Production Extension
```bash
cd /Users/paulwallace/Desktop/sales-curiosity-engine
npm run build -w @sales-curiosity/extension
```

### 5.4 Create ZIP for Upload
```bash
cd apps/sales-curiosity-extension/dist
zip -r ../sales-curiosity-extension-v1.0.0.zip . -x "*.map"
```

Your ZIP file is now at: `/apps/sales-curiosity-extension/sales-curiosity-extension-v1.0.0.zip`

---

## 🏪 Step 6: Submit to Chrome Web Store

### 6.1 Create Developer Account
1. Go to https://chrome.google.com/webstore/devconsole/
2. Pay $5 one-time registration fee
3. Complete developer profile

### 6.2 Upload Extension
1. Click "New Item"
2. Upload `sales-curiosity-extension-v1.0.0.zip`
3. Fill out store listing:

**Store Listing Details:**

**Name:** Sales Curiosity

**Summary (132 chars max):**
AI-powered sales intelligence for LinkedIn. Analyze profiles and get personalized outreach insights instantly.

**Description:**
```
Sales Curiosity is your AI-powered sales intelligence assistant for LinkedIn. 

🎯 FEATURES:
• Instant LinkedIn Profile Analysis
• AI-Generated Sales Insights
• Personalized Conversation Starters
• Identify Pain Points & Opportunities
• Export Analysis for CRM

💡 HOW IT WORKS:
1. Navigate to any LinkedIn profile
2. Click the Sales Curiosity extension
3. Click "Analyze this LinkedIn page"
4. Get instant AI-powered insights in seconds

📊 WHAT YOU GET:
- Executive Summary of the prospect
- Key Career & Background Insights
- Sales Angles & Talking Points
- Potential Pain Points
- Conversation Starters

Perfect for:
✅ Sales Professionals
✅ Business Development
✅ Recruiters
✅ Marketing Teams
✅ Anyone doing outreach

Transform your LinkedIn prospecting with AI-powered intelligence!
```

**Category:** Productivity

**Language:** English

### 6.3 Add Screenshots
Take 5 screenshots (1280x800 or 640x400):
1. Extension popup on LinkedIn
2. Analysis results showing
3. Executive summary view
4. Conversation starters
5. Admin dashboard (optional)

### 6.4 Privacy Policy
Create a simple privacy policy page on your Vercel site:

Create `/apps/sales-curiosity-web/src/app/privacy/page.tsx`:
```tsx
export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h1>Privacy Policy for Sales Curiosity</h1>
      <p><strong>Last Updated: October 2025</strong></p>
      
      <h2>Data Collection</h2>
      <p>Sales Curiosity collects:</p>
      <ul>
        <li>Your email and account information</li>
        <li>LinkedIn profile URLs you analyze</li>
        <li>Analysis results</li>
      </ul>

      <h2>Data Usage</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Provide AI-powered LinkedIn analysis</li>
        <li>Improve our service</li>
        <li>Store your analysis history</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>We do NOT:</p>
      <ul>
        <li>Sell your data to third parties</li>
        <li>Share your personal information</li>
        <li>Use your data for advertising</li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>We use:</p>
      <ul>
        <li>OpenAI for AI analysis</li>
        <li>Supabase for data storage</li>
      </ul>

      <h2>Contact</h2>
      <p>Questions? Email: your-email@example.com</p>
    </div>
  );
}
```

Deploy and use: `https://sales-curiosity-web.vercel.app/privacy`

### 6.5 Submit for Review
1. Add privacy policy URL
2. Justify permissions:
   - **storage:** Store user preferences and API settings
   - **activeTab:** Analyze current LinkedIn profile
   - **scripting:** Extract profile data from LinkedIn pages
   - **tabs:** Get current tab URL
3. Click "Submit for Review"

**Review Time:** 1-3 business days

---

## ✅ Step 7: Post-Deployment

### 7.1 Make Yourself Admin
```sql
-- In Supabase SQL Editor:
UPDATE public.users 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

### 7.2 Access Admin Dashboard
Visit: `https://sales-curiosity-web.vercel.app/admin/dashboard`

Login with your admin account to see:
- All users
- All LinkedIn analyses
- Search functionality

### 7.3 Test Extension from Store
Once approved:
1. Install from Chrome Web Store
2. Test on LinkedIn profiles
3. Verify analyses are saved to database
4. Check admin dashboard shows the data

---

## 🔄 Updating the Extension

When you make changes:

1. **Update version** in `manifest.json` (e.g., `1.0.0` → `1.0.1`)
2. **Build:** `npm run build -w @sales-curiosity/extension`
3. **Zip:** `cd dist && zip -r ../extension-v1.0.1.zip . -x "*.map"`
4. **Upload:** Go to Chrome Web Store Developer Dashboard → Upload new version
5. **Submit for review**

---

## 🆘 Troubleshooting

### Extension can't connect to backend
- ✅ Check `host_permissions` in manifest includes your Vercel URL
- ✅ Verify API base URL in popup.tsx is correct
- ✅ Check CORS settings in your API routes

### Database not saving analyses
- ✅ Check Supabase RLS policies are set up correctly
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- ✅ Check user is authenticated before analyzing

### OpenAI quota errors
- ✅ Add credits to OpenAI account
- ✅ Or use mock mode: `USE_MOCK_AI=1`

---

## 📊 Next Steps (Future Features)

1. **Salesforce Integration** - Match LinkedIn profiles with CRM data
2. **Outlook Integration** - Auto-draft emails based on analysis
3. **Team Features** - Share analyses with teammates
4. **Analytics** - Track most analyzed profiles
5. **Saved Searches** - Bookmark and organize analyses

---

## 🎉 You're Done!

Your Sales Curiosity extension is now live on the Chrome Web Store!

**Share your extension:**
- Chrome Web Store URL: `https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID`
- Direct install link for users

**Monitor usage:**
- Check admin dashboard daily
- Review user feedback in Chrome Web Store
- Monitor Supabase database growth

Need help? Check the main README.md or create an issue on GitHub.

