# WhisprLog Reminder System

This document explains how to set up and manage the weekly reminder system for WhisprLog users.

## Overview

The reminder system sends gentle weekly emails to users who have opted in through their privacy settings. It runs as a background job and respects user privacy preferences.

## Features

- **Privacy-First**: Only sends reminders to users who have explicitly enabled `weeklyReminders`
- **Duplicate Prevention**: Tracks reminder history to avoid sending multiple reminders within 7 days
- **Customizable**: Beautiful HTML email templates with personalized content
- **Error Handling**: Robust error handling and logging
- **Scheduled**: Designed to run as a cron job for automated weekly reminders

## Setup Instructions

### 1. Environment Variables

Ensure your `.env` file includes:

```env
COSMOSDB_URI=your_cosmos_db_connection_string
COSMOSDB_DBNAME=whisprlog
FRONTEND_URL=http://localhost:5173
```

### 2. Manual Testing

You can test the reminder system manually:

```bash
# From the backend directory
cd /Users/iapple/Desktop/Mi/whisprlog/backend

# Run the reminder job
npm run reminders
```

### 3. Automated Scheduling (Cron Job)

#### On macOS/Linux:

1. Open your crontab:
```bash
crontab -e
```

2. Add one of these lines (choose based on your preference):

```bash
# Every Monday at 9:00 AM
0 9 * * 1 cd /Users/iapple/Desktop/Mi/whisprlog/backend && npm run reminders

# Every Sunday at 10:00 AM
0 10 * * 0 cd /Users/iapple/Desktop/Mi/whisprlog/backend && npm run reminders

# Every Wednesday at 2:00 PM
0 14 * * 3 cd /Users/iapple/Desktop/Mi/whisprlog/backend && npm run reminders
```

#### On Windows:

Use Task Scheduler:
1. Search for "Task Scheduler" in Windows search
2. Create a new task
3. Set trigger to "Weekly" at your preferred time
4. Set action to "Start a program"
5. Program: `node.exe`
6. Arguments: `/Users/iapple/Desktop/Mi/whisprlog/backend/scripts/reminder-job.js`
7. Start in: `/Users/iapple/Desktop/Mi/whisprlog/backend`

### 4. Production Deployment

For production environments, consider:

1. **Process Manager**: Use PM2 to manage the reminder job:
```bash
npm install -g pm2
pm2 start scripts/reminder-job.js --name "whisprlog-reminders"
pm2 save
pm2 startup
```

2. **Cloud Scheduler**: Use cloud services like:
   - AWS Lambda + CloudWatch Events
   - Google Cloud Functions + Cloud Scheduler
   - Azure Functions + Timer triggers

## How It Works

### 1. User Eligibility Check
- Queries `privacySettings` collection for users with `weeklyReminders: true`
- Checks `reminderHistory` collection to ensure no reminder was sent in the last 7 days
- Fetches user details from Firebase Auth

### 2. Reminder Generation
- Creates personalized HTML email content
- Includes user's display name and relevant links
- Provides gentle reflection prompts

### 3. Sending & Tracking
- Currently logs reminders (ready for email service integration)
- Records sent reminders in `reminderHistory` collection
- Prevents duplicate sends within the 7-day window

## Email Integration

The current implementation logs reminders to console. To send actual emails:

### Option 1: SendGrid
```bash
npm install @sendgrid/mail
```

```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: user.email,
  from: 'noreply@whisprlog.com',
  subject: reminderData.subject,
  html: reminderData.html,
};

await sgMail.send(msg);
```

### Option 2: Firebase Cloud Functions
Deploy the reminder logic as a Firebase Cloud Function with scheduled triggers.

## Database Schema

### privacySettings Collection
```javascript
{
  uid: "user_id",
  weeklyReminders: true,
  // ... other privacy settings
}
```

### reminderHistory Collection
```javascript
{
  uid: "user_id",
  type: "email",
  data: { /* email content */ },
  sentAt: ISODate("2025-09-19T09:00:00.000Z"),
  createdAt: ISODate("2025-09-19T09:00:00.000Z")
}
```

## Monitoring & Logs

The reminder job provides detailed logging:
- Number of eligible users found
- Success/failure counts
- Individual user processing status
- Error details for troubleshooting

## Troubleshooting

### Common Issues:

1. **"No users eligible for reminders"**
   - Check that users have `weeklyReminders: true` in their privacy settings
   - Verify users haven't received reminders in the last 7 days

2. **Firebase Auth errors**
   - Ensure Firebase Admin SDK is properly configured
   - Check that user accounts still exist

3. **Database connection errors**
   - Verify CosmosDB connection string
   - Check network connectivity

### Testing Commands:

```bash
# Check users with reminders enabled
curl -s "http://localhost:5002/api/profile/privacy?uid=test-user" | jq '.weeklyReminders'

# View recent reminder history
# (You'll need to add an API endpoint for this)
```

## Future Enhancements

- [ ] Push notifications via Firebase Cloud Messaging
- [ ] In-app notification system
- [ ] Customizable reminder frequency (daily, weekly, monthly)
- [ ] A/B testing for reminder content
- [ ] Analytics dashboard for reminder effectiveness
- [ ] Integration with calendar apps for scheduled reminders