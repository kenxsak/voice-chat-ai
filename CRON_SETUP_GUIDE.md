# Automatic Data Cleanup Cron Job Setup Guide

## Overview
The platform includes an automatic cleanup system that deletes leads and conversations older than 90 days to reduce database load and comply with data retention policies.

## What Gets Deleted?
- ✅ **Leads** older than 90 days (from Analytics/Recent Interactions)
- ✅ **Conversations** older than 90 days (from Analytics/Recent Interactions)  
- ✅ **Messages** associated with old conversations

## What's Safe?
- ✅ Tenant accounts and settings
- ✅ Agent configurations
- ✅ Training data (websites, documents)
- ✅ **CRM data** - Any data already sent to your CRM via webhooks remains permanent

## Manual Cleanup (Available Now)
You can manually clean up old data from the dashboard:
1. Go to **Dashboard → General Settings**
2. Scroll to **Data Retention Settings**
3. Click **"Preview What Will Be Deleted"** to see what will be removed
4. Click **"Delete Old Data Now"** to execute cleanup

## Automatic Cleanup Setup

**⚠️ IMPORTANT: Before setting up automatic cleanup, you MUST configure the CRON_SECRET environment variable on your hosting platform. The auto-cleanup endpoint will refuse to execute without it for security reasons.**

### Option 1: Vercel Cron (Recommended for Vercel Deployments)

1. Create a `vercel.json` file in your project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. **REQUIRED:** Add a CRON_SECRET environment variable for security:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add: `CRON_SECRET=your-secret-key-here`
   
3. Deploy to Vercel - the cron job will run daily at 2 AM UTC

### Option 2: External Cron Service (e.g., cron-job.org, EasyCron)

1. Sign up for a free cron service like [cron-job.org](https://cron-job.org)

2. Create a new cron job with:
   - **URL:** `https://yourdomain.com/api/cron/auto-cleanup`
   - **Schedule:** Daily at 2 AM (or your preferred time)
   - **Method:** GET
   - **Headers (if using CRON_SECRET):**
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

3. **REQUIRED:** Set CRON_SECRET environment variable in your hosting platform

### Option 3: GitHub Actions (Free for public/private repos)

1. Create `.github/workflows/cleanup-cron.yml`:
```yaml
name: Auto Cleanup Old Data

on:
  schedule:
    - cron: '0 2 * * *'  # Runs daily at 2 AM UTC
  workflow_dispatch:  # Allows manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X GET "https://yourdomain.com/api/cron/auto-cleanup" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

2. Add CRON_SECRET to GitHub Secrets:
   - Go to Repository → Settings → Secrets → Actions
   - Add new secret: `CRON_SECRET`

### Option 4: Render Cron Jobs

If deployed on Render:
1. Go to Render Dashboard → Your Service
2. Click **Cron Jobs** tab
3. Add new cron job:
   - **Command:** `curl -X GET https://yourdomain.com/api/cron/auto-cleanup`
   - **Schedule:** `0 2 * * *` (daily at 2 AM)

## Cron Schedule Format
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, Sunday = 0)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 2 * * *` - Daily at 2:00 AM
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 3 1 * *` - Monthly on 1st at 3:00 AM

## Testing the Cron Job

Test manually by visiting:
```
https://yourdomain.com/api/cron/auto-cleanup
```

You should see a JSON response like:
```json
{
  "success": true,
  "message": "Auto-cleanup completed successfully",
  "stats": {
    "leadsDeleted": 15,
    "conversationsDeleted": 20,
    "messagesDeleted": 150
  },
  "cutoffDate": "2024-10-15T00:00:00.000Z",
  "retentionDays": 90
}
```

## Security Notes
- **CRON_SECRET is MANDATORY** - the endpoint will refuse to execute without it
- The cron job requires `Authorization: Bearer YOUR_SECRET` header
- Without CRON_SECRET configured, the API returns 500 error
- **IMPORTANT:** You MUST set CRON_SECRET environment variable before using auto-cleanup

## Monitoring
- Check your hosting platform's logs to verify cron execution
- The cleanup API logs to console with `[Auto-Cleanup Cron]` prefix
- Review deletion stats in the API response

## Customizing Retention Period
The default is 90 days. To change it:
1. Edit `src/app/api/cron/auto-cleanup/route.ts`
2. Change line: `const retentionDays = 90;`
3. Redeploy your application

## Troubleshooting

**Cron not running?**
- Verify cron is configured correctly in your platform
- Check platform logs for errors
- Test the endpoint manually first

**Too much data deleted?**
- Check the retention period (default 90 days)
- Use manual cleanup with preview first to verify

**Need to restore data?**
- Data deletion is permanent
- Make sure to sync important data to CRM before cleanup
- Consider exporting data periodically as backup
