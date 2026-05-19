# IT Ticketing System — Setup Guide

## What You'll Need
- A Google account (your nationstar.ph email)
- A Google Sheet (where tickets will be stored)
- A Netlify account (free tier is fine)
- A Google Cloud Console project (for OAuth)

---

## STEP 1 — Set Up Your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **"IT Tickets"**.
3. Copy the **Spreadsheet ID** from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - The long string between `/d/` and `/edit` is your ID.
4. Keep this tab open — you'll need it in Step 2.

> **Note:** The Google Apps Script will automatically create the header row and "Tickets" sheet the first time a ticket is created.

---

## STEP 2 — Deploy the Google Apps Script Backend

1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete any existing code in the editor.
3. Paste the entire contents of **`Code.gs`** into the editor.
4. At the top of the script, fill in:
   ```js
   const PERSONAL_GMAIL = "youremail@gmail.com"; // Your personal Gmail
   ```
   (The `@nationstar.ph` domain is already allowed automatically.)
5. Click the **Save** icon (or Ctrl+S).
6. Click **Deploy → New Deployment**.
7. Click the gear icon next to "Type" → select **Web App**.
8. Set:
   - **Description:** IT Ticketing API v1
   - **Execute as:** Me
   - **Who has access:** Anyone
9. Click **Deploy**.
10. **Copy the Web App URL** — it looks like:
    `https://script.google.com/macros/s/XXXXXXXXXX/exec`
    You'll need this in Step 4.

> **Important:** Every time you change Code.gs, you must create a **New Deployment** (not update existing) for changes to take effect.

---

## STEP 3 — Set Up Google OAuth (for Login)

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (e.g., "IT Ticketing").
3. In the left menu: **APIs & Services → OAuth consent screen**.
4. Choose **External** → click **Create**.
5. Fill in:
   - App name: `IT Ticketing System`
   - User support email: your email
   - Developer contact: your email
6. Click **Save and Continue** through all steps.
7. Go to **APIs & Services → Credentials**.
8. Click **+ Create Credentials → OAuth 2.0 Client IDs**.
9. Choose **Web application**.
10. Name it `IT Ticketing Web`.
11. Under **Authorized JavaScript origins**, add:
    - `http://localhost:3000` (for local testing)
    - `https://YOUR-NETLIFY-SITE.netlify.app` (add after deploying to Netlify)
12. Click **Create** → **Copy the Client ID** (looks like `XXXXXXXXXX.apps.googleusercontent.com`).

---

## STEP 4 — Configure the App

Open **`index.html`** and find this section near the top of the `<script>` tag:

```js
const GAS_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";
const PERSONAL_EMAIL = "YOUR_PERSONAL_GMAIL@gmail.com";
const COMPANY_DOMAIN = "nationstar.ph";
```

Replace:
- `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` → the URL from Step 2
- `YOUR_GOOGLE_CLIENT_ID` → the Client ID from Step 3
- `YOUR_PERSONAL_GMAIL@gmail.com` → your personal Gmail address

---

## STEP 5 — Deploy to Netlify

### Option A: Drag & Drop (Easiest)
1. Go to [netlify.com](https://netlify.com) and log in.
2. On your dashboard, find the **"Drag and drop your site folder here"** area.
3. Create a folder on your computer with these two files:
   - `index.html`
   - `netlify.toml`
4. Drag that folder into Netlify.
5. Your site will be live in seconds!

### Option B: GitHub (Recommended for updates)
1. Create a GitHub repo and push `index.html` + `netlify.toml`.
2. In Netlify: **New site → Import from Git → GitHub**.
3. Select your repo → Deploy.

---

## STEP 6 — Final Configuration

After deploying to Netlify:

1. Copy your Netlify site URL (e.g., `https://nationstar-it.netlify.app`).
2. Go back to **Google Cloud Console → Credentials → Your OAuth Client**.
3. Under **Authorized JavaScript origins**, add your Netlify URL.
4. Click **Save**.

If you want a custom domain (e.g., `it.nationstar.ph`):
- In Netlify: **Site Settings → Domain Management → Add Custom Domain**.
- Add that domain to OAuth origins too.

---

## How to Use the App

### Creating a Ticket
1. Click **"+ New Ticket"**.
2. Fill in: Employee Name, Department, Category, Issue Summary.
3. Click **Create Ticket** — the Start Time is automatically recorded.
4. You can create multiple tickets simultaneously — each gets its own start time.

### Completing a Ticket
1. Find the ticket in the list.
2. Click the green **"✓ Close"** button.
3. Add any resolution notes in the Remarks field.
4. Click **"Mark as Complete"** — End Time and Resolution Time are automatically calculated.

### Editing a Ticket
1. Click the **✏️** (pencil) icon to edit any details.
2. You can also change the Status to "In Progress" if needed.

### Dashboard / KPIs
- Click the **"📊 Dashboard"** tab to see:
  - Total tickets, open/closed counts
  - Average resolution time
  - Tickets by category (bar chart)
  - Tickets by department (bar chart)
  - Status breakdown (donut chart)
  - Last 7 days trend

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Google Sign-In button doesn't appear | Check that `GOOGLE_CLIENT_ID` is filled in correctly |
| "Access denied" after sign-in | Check `PERSONAL_EMAIL` and `COMPANY_DOMAIN` in `index.html` |
| Tickets don't load | Check `GAS_URL` is correct; re-deploy the Apps Script |
| CORS errors | Make sure Apps Script is deployed as "Anyone can access" |
| Changes to Code.gs not working | Create a **New Deployment**, not update existing |

---

## File Summary

| File | Purpose |
|------|---------|
| `Code.gs` | Google Apps Script backend — paste into Apps Script editor |
| `index.html` | Full frontend app — deploy to Netlify |
| `netlify.toml` | Netlify security headers config |
| `SETUP.md` | This guide |
