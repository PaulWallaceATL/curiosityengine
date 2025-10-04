# Complete User Guide - What Each User Type Sees

**Last Updated:** October 4, 2025  
**Status:** ✅ Production Ready

---

## 🎯 Quick Reference

This guide shows **exactly** what each user type sees in the extension and web app.

---

## 👤 INDIVIDUAL USER

> **Account Type:** Personal workspace  
> **Role:** member  
> **Use Case:** Solo professional doing their own LinkedIn research

### Extension - What They See

**🏠 Home Tab:**
```
Header:
├─ 👤 "Personal" badge (cyan)
└─ Logout button

LinkedIn Profile Detected:
└─ [current LinkedIn URL]

📈 Your Activity:
├─ [X] Profiles Analyzed
├─ [X] Emails Drafted
└─ Recent Analyses:
    • Name 1
    • Name 2
    • Name 3

Action Buttons:
├─ 🔍 Analyze Profile
└─ ✉️ Draft Email

If Email selected:
└─ Email Context textarea
    └─ Generate Email button
```

**👤 Context Tab:**
```
Your Context:
"This information will be used to personalize AI-generated analyses and emails."

About Me:
└─ [textarea with their role/company description]

My Objectives:
└─ [textarea with their sales goals]

[Save Context] button
→ Saves to database automatically
✓ "Context saved successfully!"
```

**🔌 Integrations Tab:**
```
Header:
└─ "Connect your tools to streamline your workflow."

📧 Email Integration
├─ Gmail, Outlook, and more
├─ "Send drafted emails directly to your email client"
└─ [Coming Soon] badge

🔗 CRM Integration
├─ Salesforce, HubSpot, and more
├─ "Automatically sync profiles and activities to your CRM"
└─ [Coming Soon] badge
```

### Web App - What They See

**Header:**
```
👤 Personal Workspace (cyan badge)

Sales Curiosity
"Craft compelling outreach with LinkedIn context and your voice."
```

**Tabs:**
```
🏠 Home  |  👤 Context  |  🔌 Integrations  |  [Logout]
```

**🏠 Home Tab:**
```
📈 Your Activity:
├─ [X] Profiles Analyzed
└─ [X] Emails Drafted

LinkedIn Profile Analysis:
├─ LinkedIn URL: [input field]
├─ [🔍 Analyze Profile]
└─ [✉️ Draft Email]

If action selected:
└─ Results display area

🚀 Get the Chrome Extension
└─ [Download Extension] button → /install page
```

**👤 Context Tab:**
```
Your Context:
"This information will be used to personalize AI-generated analyses and emails."

About Me: [textarea - 5 rows]
My Objectives: [textarea - 5 rows]

[Save Context] button
```

**🔌 Integrations Tab:**
```
Integrations
"Connect your tools to streamline your workflow."

[📧 Email Integration Card]
└─ Coming Soon badge

[🔗 CRM Integration Card]
└─ Coming Soon badge
```

---

## 🏢 ORGANIZATION ADMIN

> **Account Type:** Organization  
> **Role:** org_admin  
> **Use Case:** Team leader managing sales team

### Extension - What They See

**🏠 Home Tab:**
```
Header:
├─ 🏢 "[Org Name]" badge (purple)
├─ ADMIN badge (red)
└─ Logout button

LinkedIn Profile Detected:
└─ [current LinkedIn URL]

📊 Team Activity:
Personal Stats:
├─ [X] Profiles Analyzed (your own)
└─ [X] Emails Drafted (your own)

━━━━━━━━━━━━━━━━━━━━━━━━

Team Overview:
├─ [X] Members
├─ [X] Total Analyses
└─ [X] Total Emails

Recent Analyses:
• Name 1
• Name 2  
• Name 3

Action Buttons:
├─ 🔍 Analyze Profile
└─ ✉️ Draft Email
```

**👤 Context Tab:**
```
[Same as individual users]
About Me + Objectives
Save Context button
```

**🔌 Integrations Tab:**
```
Header:
└─ "Manage integrations for your organization from the web dashboard."

[Blue Banner]
Enable integrations for your team
└─ [Open Dashboard] button → Opens web admin dashboard

(No integration cards shown - managed in dashboard)
```

### Web App - What They See

**Header:**
```
🏢 [Organization Name] (purple badge)
ADMIN (indigo badge)

Sales Curiosity
"Team workspace for [Org Name]. Collaborate and track team activity."

[📊 Organization Dashboard] button (top right) → /admin/organization
```

**Tabs:**
```
🏠 Home  |  👤 Context  |  🔌 Integrations  |  [Logout]
```

**🏠 Home Tab:**
```
📊 Team Activity:
Personal Stats:
├─ [X] Profiles Analyzed
└─ [X] Emails Drafted

Team Overview:
├─ [X] Members
├─ [X] Total Analyses
└─ [X] Total Emails

LinkedIn Profile Analysis:
└─ [URL input + action buttons]

🚀 Get the Chrome Extension
└─ [Download Extension] button
```

**👤 Context Tab:**
```
[Same as all users]
```

**🔌 Integrations Tab:**
```
Integrations
"Manage integrations for your organization from the admin dashboard."

[Blue Banner]
Enable integrations for your team
└─ [Open Dashboard] button → /admin/organization

(Actual integration management done in admin dashboard)
```

**🎛️ Organization Dashboard** (`/admin/organization`):
```
Tabs:
Overview | Users | Analyses | Emails | Integrations

OVERVIEW TAB:
├─ Total Users: [X / max_seats]
├─ Profile Analyses: [X]
├─ Emails Generated: [X]
└─ Active Integrations: [X]

Recent Activity:
├─ X analyses in last 24 hours
├─ X emails in last 24 hours
└─ X active users

USERS TAB:
[Search users...] [+ Invite User]

User List:
├─ Name + ADMIN badge (if admin)
├─ Email
├─ Joined date
├─ Activity counts
└─ [Click to expand] → See user context

Invite Flow:
└─ Email + Role → Generate link → Copied to clipboard!

ANALYSES TAB:
├─ [Search profiles...]
└─ All team member analyses with creator name

EMAILS TAB:
├─ [Search emails...]
└─ All team member emails with creator name

INTEGRATIONS TAB:
Grid of integration cards:
├─ Salesforce [Enable/Disable]
├─ HubSpot [Enable/Disable]
├─ Gmail [Enable/Disable]
├─ Outlook [Enable/Disable]
├─ Calendar [Enable/Disable]
└─ Slack [Enable/Disable]

When enabled:
└─ Shows to all team members in their extension
```

---

## 👥 ORGANIZATION MEMBER

> **Account Type:** Organization  
> **Role:** member  
> **Use Case:** Team member contributing to org

### Extension - What They See

**🏠 Home Tab:**
```
Header:
├─ 🏢 "[Org Name]" badge (purple)
├─ Member badge (gray)
└─ Logout button

LinkedIn Profile Detected:
└─ [current LinkedIn URL]

📈 Your Activity:
├─ [X] Profiles Analyzed (your own)
└─ [X] Emails Drafted (your own)

Recent Analyses:
• Name 1
• Name 2
• Name 3

(NO team stats - not an admin)

Action Buttons:
├─ 🔍 Analyze Profile
└─ ✉️ Draft Email
```

**👤 Context Tab:**
```
[Same as all users]

Note: Admin CAN see this context in their dashboard
```

**🔌 Integrations Tab:**
```
Header:
└─ "Your organization admin manages which integrations are available to your team."

IF integrations enabled:
[Green Banner]
✓ Your organization has X integrations enabled: salesforce, gmail

IF no integrations:
[Yellow Banner]
No integrations enabled yet. Ask your organization admin to enable integrations.

(NO integration cards shown - they can't control them)
```

### Web App - What They See

**Header:**
```
🏢 [Organization Name] (purple badge)
Member (gray badge)

Sales Curiosity
"Team workspace for [Org Name]. Collaborate and track team activity."

(NO Organization Dashboard button - not an admin)
```

**Tabs:**
```
🏠 Home  |  👤 Context  |  🔌 Integrations  |  [Logout]
```

**🏠 Home Tab:**
```
📈 Your Activity:
├─ [X] Profiles Analyzed
└─ [X] Emails Drafted

(NO team stats)

LinkedIn Profile Analysis:
└─ [URL input + action buttons]

🚀 Get the Chrome Extension
```

**👤 Context Tab:**
```
[Same as all users]
Note: Admin can view this in their dashboard
```

**🔌 Integrations Tab:**
```
Integrations
"Your organization admin manages which integrations are available to your team."

IF integrations enabled:
[Green Box]
✓ Your organization has X integrations enabled: salesforce, gmail

IF no integrations:
[Yellow Box]
No integrations enabled yet. Ask your organization admin to enable integrations.

(NO integration cards - admin controls these)
```

---

## 🔄 User Flows

### Individual User - Complete Flow

```
1. Visit web app
2. Click "Get Started Free"
3. Select "Individual" account type
4. Enter name, email, password
5. Account created → Login
6. See: 👤 Personal Workspace
7. Web App:
   - Home tab: Enter LinkedIn URL → Analyze
   - Context tab: Save about me + objectives
   - Integrations tab: See coming soon
8. Click "Download Extension"
9. Follow 3-step install guide
10. Extension installed!
11. Extension:
    - Login with same credentials
    - See: 👤 Personal badge
    - Navigate to LinkedIn profile
    - Click extension
    - See stats + action buttons
    - Click "Analyze Profile"
    - Get AI results!
```

### Organization Admin - Complete Flow

```
1. Visit web app
2. Click "Get Started Free"
3. Select "Organization" account type
4. Enter org name, name, email, password
5. Account created → Login
6. See: 🏢 Org name + ADMIN badge
7. See: "Organization Dashboard" button
8. Web App:
   - Home: See team stats (empty at first)
   - Enter URL → Analyze (counts toward team stats)
   - Context: Save personal context
   - Integrations: Link to dashboard
9. Click "Organization Dashboard":
   - Overview: See metrics
   - Users: Click "+ Invite User"
   - Enter email + role → Link copied!
   - Share link with team member
   - Integrations: Enable Salesforce
10. Download extension
11. Extension:
    - Login with credentials
    - See: 🏢 Org + ADMIN badges
    - See: Team stats overview
    - Use on LinkedIn profiles
12. Team member uses invitation:
    - Creates account → auto-joins org
    - Starts using tool
    - Admin sees their work in dashboard!
```

### Organization Member - Complete Flow

```
1. Receive invitation link from admin
2. Click link → /invite/accept?token=xxx
3. See: "You're Invited to [Org Name]"
4. Email pre-filled
5. Enter name + password
6. Account created → auto-joined org with correct role
7. Login to web app
8. See: 🏢 Org name + Member badge
9. NO admin dashboard button (correct!)
10. Web App:
    - Home: See personal stats
    - Enter URLs → Analyze/draft
    - Work appears in admin's dashboard
11. Download extension
12. Extension:
    - Login
    - See: 🏢 Org + Member badges
    - Integrations: See what admin enabled
    - Use tool normally
    - Admin can see their analyses
```

---

## 📊 Feature Matrix

| Feature | Individual | Org Admin | Org Member |
|---------|-----------|-----------|------------|
| **LinkedIn URL Analysis** | ✅ | ✅ | ✅ |
| **Email Drafting** | ✅ | ✅ | ✅ |
| **User Context** | ✅ | ✅ | ✅ |
| **Personal Stats** | ✅ | ✅ | ✅ |
| **Team Stats** | ❌ | ✅ | ❌ |
| **Organization Dashboard** | ❌ | ✅ | ❌ |
| **Invite Users** | ❌ | ✅ | ❌ |
| **Manage Integrations** | ❌ | ✅ | ❌ |
| **See Team Work** | ❌ | ✅ | ❌ |
| **Extension Download** | ✅ | ✅ | ✅ |
| **Coming Soon Integrations** | ✅ | ❌ | ❌ |
| **Org Integration Status** | ❌ | ❌ | ✅ |

---

## 🎨 Visual Identity by User Type

### Badges & Colors

**Individual:**
- 👤 + Cyan (#0ea5e9)
- "Personal" / "Personal Workspace"
- Clean, minimal, focused

**Organization Admin:**
- 🏢 + Purple (#8b5cf6) + ADMIN in Red (#dc2626)
- Organization name prominently displayed
- Team-focused interface

**Organization Member:**
- 🏢 + Purple (#8b5cf6) + Member in Gray (#64748b)
- Organization name displayed
- Personal work with team context

---

## 💡 Common Questions

### "Why can't I see the Organization Dashboard?"
→ You need to be an org_admin. Regular members don't have access.

### "Why don't I see Coming Soon integration buttons?"
→ You're in an organization. Your admin controls integrations from their dashboard.

### "How do I join an organization?"
→ Your admin sends you an invitation link. Click it and create an account.

### "Can I switch from individual to organization?"
→ Not directly. You'd need to create a new organization account.

### "Can org members see each other's work?"
→ No. Only org admins can see all team member work. Members are isolated.

### "Where is my context saved?"
→ Both local storage (extension) and database (synced across devices).

### "How do I download the extension?"
→ Click "Download Extension" in the web app → Follow 3-step guide.

### "Do I need the extension?"
→ No! You can use the web app to enter LinkedIn URLs. Extension just makes it faster.

---

## 🚀 Quick Start for Each Type

### Individual User
```bash
1. Sign up as individual
2. Save your context
3. Enter a LinkedIn URL
4. Analyze or draft email
5. Download extension for faster workflow
```

### Organization Admin
```bash
1. Sign up as organization
2. Go to Organization Dashboard
3. Invite your team
4. Enable integrations you want
5. Use the tool yourself
6. Monitor team activity
```

### Organization Member
```bash
1. Click invitation link from admin
2. Create account
3. Save your context  
4. Start analyzing profiles
5. Download extension
6. Your work helps the team!
```

---

## 📱 Extension Installation (All Users)

### Method 1: Developer Mode (Current)

**Step 1: Download**
- Go to web app `/install` page
- Click "Download Extension Now"
- Save the zip file
- Unzip to any folder

**Step 2: Enable Developer Mode**
- Open Chrome
- Go to `chrome://extensions/`
- Toggle "Developer mode" (top right)

**Step 3: Load Extension**
- Click "Load unpacked"
- Navigate to unzipped folder
- **Select the "dist" folder** (important!)
- Extension appears in Chrome

**Step 4: Use It**
- Navigate to any LinkedIn profile
- Click extension icon
- Login with web app credentials
- Enjoy! 🎉

### Method 2: Chrome Web Store (Future)

Once published:
- Visit Chrome Web Store
- Click "Add to Chrome"
- Done! One click install

---

## 🎊 Success Indicators

### You're Using It Right If:

**Individual User:**
- ✓ See personal badge
- ✓ Personal stats only
- ✓ Coming soon integrations
- ✓ Can analyze profiles
- ✓ Can draft emails

**Org Admin:**
- ✓ See admin badge
- ✓ Team stats visible
- ✓ Can access org dashboard
- ✓ Can invite users
- ✓ Can enable integrations
- ✓ Can see all team work

**Org Member:**
- ✓ See member badge
- ✓ See org name
- ✓ Personal stats only
- ✓ See org integration status
- ✓ NO admin dashboard access
- ✓ Admin can see your work

---

## 🛠️ Troubleshooting

### "Extension won't load"
→ Make sure you selected the **dist** folder, not the root folder

### "Can't see my stats"
→ Refresh the page, stats load after authentication

### "Integration status not showing"
→ Wait a moment after login, it fetches from server

### "Invitation link doesn't work"
→ Check if it expired (7 days). Ask admin for new link

### "Can't access admin dashboard"
→ You need org_admin role. Contact your organization admin

---

## 📚 Related Documentation

- `USER_EXPERIENCE_ENHANCEMENTS.md` - Detailed UX design decisions
- `WEB_APP_OVERHAUL.md` - Web app redesign details
- `HIERARCHY_WALKTHROUGH.md` - System architecture
- `ENHANCEMENTS_SUMMARY.md` - Quick implementation summary

---

**Your Sales Curiosity Engine is ready for users! 🎉**

