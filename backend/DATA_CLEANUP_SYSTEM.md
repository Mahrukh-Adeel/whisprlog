# WhisprLog Data Cleanup System

This document explains how the automated data cleanup system works, which deletes old journal entries based on users' data retention privacy settings.

## Overview

The data cleanup system automatically removes journal entries that are older than the user's specified retention period. This ensures compliance with user privacy preferences and helps manage database storage efficiently.

## Features

- **Privacy-First**: Only deletes data according to user's explicit retention settings
- **Flexible Retention**: Supports 'forever', '1year', and '2years' retention policies
- **Duplicate Prevention**: Tracks cleanup operations to avoid re-processing the same data
- **Comprehensive Logging**: Detailed logs of all cleanup operations
- **Error Handling**: Robust error handling with graceful failure recovery
- **Monitoring**: API endpoints for real-time cleanup statistics

## How It Works

### 1. Retention Policy Check
- Queries `privacySettings` collection for users with retention policies other than 'forever'
- Calculates appropriate cutoff dates based on retention settings:
  - `1year`: Delete entries older than 1 year
  - `2years`: Delete entries older than 2 years
  - `forever`: Never delete entries

### 2. Cleanup Eligibility
- Checks `cleanupHistory` collection to ensure cleanup hasn't run for the user in the last 24 hours
- Prevents duplicate cleanup operations and reduces database load

### 3. Data Deletion
- Identifies journal entries older than the retention cutoff date
- Permanently deletes qualifying entries from the `journalEntries` collection
- Records all deleted entry IDs for audit purposes

### 4. Operation Tracking
- Records each cleanup operation in the `cleanupHistory` collection
- Tracks retention policy applied, number of entries deleted, and timestamps
- Enables monitoring and troubleshooting of cleanup operations

## Database Schema

### privacySettings Collection
```javascript
{
  uid: "user_id",
  dataRetention: "1year", // 'forever', '1year', or '2years'
  // ... other privacy settings
}
```

### cleanupHistory Collection
```javascript
{
  uid: "user_id",
  cleanupType: "dataRetention",
  retentionPolicy: "1year",
  deletedCount: 25,
  deletedEntryIds: [ObjectId("..."), ObjectId("..."), ...],
  completedAt: ISODate("2025-09-19T02:00:00.000Z"),
  createdAt: ISODate("2025-09-19T02:00:00.000Z")
}
```

## Setup Instructions

### 1. Environment Variables
Ensure your `.env` file includes:
```env
COSMOSDB_URI=your_cosmos_db_connection_string
COSMOSDB_DBNAME=whisprlog
```

### 2. Manual Testing
You can test the cleanup system manually:
```bash
# From the backend directory
cd /Users/iapple/Desktop/Mi/whisprlog/backend

# Run the cleanup job
npm run cleanup
```

### 3. Automated Scheduling (Cron Job)

#### On macOS/Linux:
1. Open your crontab:
```bash
crontab -e
```

2. Add one of these lines (choose based on your preference):

```bash
# Daily at 2:00 AM (recommended for regular cleanup)
0 2 * * * cd /Users/iapple/Desktop/Mi/whisprlog/backend && npm run cleanup

# Weekly on Sunday at 3:00 AM
0 3 * * 0 cd /Users/iapple/Desktop/Mi/whisprlog/backend && npm run cleanup

# Monthly on the 1st at 4:00 AM
0 4 1 * * cd /Users/iapple/Desktop/Mi/whisprlog/backend && npm run cleanup
```

#### On Windows:
Use Task Scheduler:
1. Search for "Task Scheduler" in Windows search
2. Create a new task
3. Set trigger to "Daily" at your preferred time
4. Set action to "Start a program"
5. Program: `node.exe`
6. Arguments: `/Users/iapple/Desktop/Mi/whisprlog/backend/scripts/data-cleanup-job.js`
7. Start in: `/Users/iapple/Desktop/Mi/whisprlog/backend`

### 4. Production Deployment
For production environments, consider:
1. **Process Manager**: Use PM2 for reliable job execution
2. **Cloud Scheduler**: Use cloud services like AWS EventBridge, Google Cloud Scheduler
3. **Container Orchestration**: Integrate with Kubernetes CronJobs

## Monitoring & APIs

### Check Cleanup Status
```bash
curl "http://localhost:5002/api/profile/cleanup/status"
```

Response:
```json
{
  "stats": {
    "totalCleanups": 150,
    "totalEntriesDeleted": 2500,
    "recentCleanupsCount": 12,
    "policyBreakdown": [
      { "_id": "1year", "count": 100, "totalDeleted": 1800 },
      { "_id": "2years", "count": 50, "totalDeleted": 700 }
    ],
    "lastCleanup": "2025-09-19T02:00:00.000Z"
  },
  "usersNeedingCleanup": 5,
  "timestamp": "2025-09-19T10:30:00.000Z",
  "status": "active"
}
```

### Get Cleanup Statistics
```bash
curl "http://localhost:5002/api/profile/cleanup/stats"
```

## Safety Features

### Data Protection
- **Audit Trail**: Every deletion is logged with entry IDs and timestamps
- **Policy Verification**: Double-checks retention policies before deletion
- **Rate Limiting**: Prevents running cleanup too frequently (max once per 24 hours per user)
- **Error Recovery**: Failed cleanups don't prevent future runs

### Privacy Compliance
- **User Consent**: Only processes users who have explicitly set retention policies
- **Transparent Logging**: Users can see cleanup history through admin interfaces
- **No Sensitive Data**: Cleanup operations only affect journal entry metadata and content

## Troubleshooting

### Common Issues

1. **"No users needing cleanup"**
   - Check that users have `dataRetention` set to '1year' or '2years' in their privacy settings
   - Verify cleanup hasn't run for those users in the last 24 hours

2. **Database connection errors**
   - Verify CosmosDB connection string and permissions
   - Check network connectivity and firewall settings

3. **Permission errors**
   - Ensure the process has write permissions to the database
   - Verify Firebase Admin SDK is properly configured for user lookups

### Debug Commands

```bash
# Check users with retention policies
curl "http://localhost:5002/api/profile/cleanup/status" | jq '.usersNeedingCleanup'

# View recent cleanup operations
# (Requires database access for manual inspection)

# Test cleanup job manually
cd backend && npm run cleanup
```

## Performance Considerations

### Database Impact
- Cleanup operations are batched to minimize database load
- 500ms delay between user processing to prevent overwhelming the database
- Operations are designed to be idempotent (safe to re-run)

### Storage Optimization
- Reduces database storage costs by removing old, unwanted data
- Improves query performance by reducing table sizes
- Helps maintain database performance over time

## Future Enhancements

- [ ] **Soft Delete**: Implement soft delete with recovery period
- [ ] **Export Before Delete**: Automatically export data before deletion
- [ ] **Custom Retention**: Allow users to set custom retention periods
- [ ] **Cleanup Notifications**: Notify users before deleting their data
- [ ] **Analytics Dashboard**: Visual dashboard for cleanup statistics
- [ ] **Data Archiving**: Archive old data to cheaper storage instead of deleting

## Compliance & Legal

### GDPR Considerations
- Respects user data retention preferences
- Provides audit trail for all data deletion operations
- Allows users to change retention settings at any time
- Implements data minimization principles

### Data Backup Recommendations
- Always backup data before running cleanup operations
- Consider implementing point-in-time recovery
- Document cleanup operations for compliance purposes

This cleanup system ensures that WhisprLog respects user privacy preferences while maintaining efficient database operations and storage management.