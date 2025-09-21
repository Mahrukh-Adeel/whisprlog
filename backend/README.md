# Whisprlog Backend

This backend provides authentication endpoints using Firebase Auth (Google, email/password, and anonymous).

## Setup
1. Add your Firebase service account key to `backend/serviceAccountKey.json`.
2. Set up environment variables (see Environment Variables section below).
3. Run `npm install` in the `backend/` directory.
4. Start the server with `npm start`.

## Environment Variables
Create a `.env` file in the backend directory with the following variables:
- `COSMOSDB_URI` — MongoDB/CosmosDB connection string
- `COSMOSDB_DBNAME` — Database name (default: 'whisprlog')
- `BACKUP_DIR` — Directory to store backup files (default: './backups')
- `PORT` — Server port (default: 5002)
- `AZURE_COMMUNICATION_CONNECTION_STRING` — Azure Communication Services connection string
- `AZURE_COMMUNICATION_EMAIL_FROM` — Sender email address (default: 'noreply@whisprlog.com')
- `FRONTEND_URL` — Frontend application URL (default: 'http://localhost:5173')

## Azure Communication Services Setup

To enable email reminders, set up Azure Communication Services:

### 1. Create Azure Communication Services Resource
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Communication Services"
3. Click "Create" and fill in:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or select existing
   - **Resource Name**: `whisprlog-communication`
   - **Region**: Choose the closest region to your users

### 2. Configure Email Domain
1. In your Communication Services resource, go to "Email" in the left menu
2. Click "Set up email communication"
3. Choose "Azure subdomain" or "Custom domain"
4. Follow the verification steps for your chosen domain

### 3. Get Connection String
1. In your Communication Services resource, go to "Keys" in the left menu
2. Copy the "Connection string" value
3. Add it to your `.env` file as `AZURE_COMMUNICATION_CONNECTION_STRING`

### 4. Configure Sender Email
- Set `AZURE_COMMUNICATION_EMAIL_FROM` in your `.env` file
- Use the verified domain from step 2
- Example: `noreply@whisprlog.azurecomm.net`

### 5. Install Dependencies & Test
```bash
npm install
npm run reminders
```

## Automated Jobs
The backend includes several automated background jobs that can be run via npm scripts:
- `npm run reminders` — Send weekly reminder emails to users with weeklyReminders enabled
- `npm run cleanup` — Clean up old data based on user dataRetention settings
- `npm run backup` — Create automated backups for users with autoBackup enabled

## API Endpoints
- `/` — Health check
- `/api/health` — Database connectivity check
- `/api/profile` — User profile and privacy settings management
- `/api/backup` — Backup operations and monitoring
- Auth endpoints coming soon
