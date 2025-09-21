# =================================
# WhisprLog Setup Instructions
# =================================

## � Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **MongoDB** or **Azure CosmosDB** account
- **Firebase** project with billing enabled (for AI features)

### Verify Installation
```bash
node --version  # Should be v18+
npm --version   # Should be 8+
```

## Quick Start

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/Mahrukh-Adeel/whisprlog.git
cd whisprlog

# Install root dependencies
npm install

# Install frontend dependencies
cd app && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Environment Setup

#### Backend Environment Variables
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
# Database Configuration
COSMOSDB_URI=mongodb://localhost:27017/whisprlog
# OR for Azure CosmosDB:
# COSMOSDB_URI=mongodb://your-cosmosdb-account:your-password@your-cosmosdb-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000

COSMOSDB_DBNAME=whisprlog

# AI Service Configuration (choose one)
# For OpenAI:
OPENAI_API_KEY=your_openai_api_key_here
# For Azure OpenAI:
AZURE_OPENAI_API_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id

# Server Configuration
PORT=5002
NODE_ENV=development
```

#### Frontend Environment Variables
```bash
cd ../app
cp .env.example .env.local
```

Edit `app/.env.local`:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_BASE=http://localhost:5002

# Development Options
VITE_DEBUG=false
```

### 3. Firebase Setup (Detailed)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or "Add project"
   - Enter project name: `whisprlog-dev`
   - Enable Google Analytics (optional but recommended)

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" provider
   - Enable "Anonymous" provider
   - Configure authorized domains (add `localhost` for development)

3. **Generate Service Account Key**
   - Go to Project Settings → Service accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Rename it to `serviceAccountKey.json`
   - Place it in `backend/serviceAccountKey.json`

4. **Get Firebase Config**
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Click "Add app" → Web app (</>)
   - Copy the config object values to your `.env.local` file

### 4. Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition
# macOS with Homebrew:
brew install mongodb-community
brew services start mongodb-community

# Verify connection:
mongosh
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create database user with read/write permissions
4. Get connection string and update `COSMOSDB_URI`

#### Option C: Azure CosmosDB
1. Create Azure account and CosmosDB resource
2. Choose "Azure Cosmos DB for MongoDB" API
3. Get connection string from "Connection strings" section
4. Update `COSMOSDB_URI` with the primary connection string

### 5. AI Service Setup

#### Option A: OpenAI
1. Create account at [OpenAI](https://platform.openai.com/)
2. Generate API key from API Keys section
3. Add to `backend/.env` as `OPENAI_API_KEY`

#### Option B: Azure OpenAI
1. Create Azure OpenAI resource in Azure Portal
2. Deploy a model (e.g., gpt-3.5-turbo)
3. Get API key and endpoint from Azure Portal
4. Update `backend/.env` with Azure-specific variables

### 6. Start Development Servers
```bash
# Terminal 1: Backend Server
cd backend && npm start
# Server will start on http://localhost:5002

# Terminal 2: Frontend Development Server
cd app && npm run dev
# App will be available at http://localhost:5173
```

## 🔧 Environment Variables Reference

### Backend (.env)
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `COSMOSDB_URI` | MongoDB connection string | ✅ | - |
| `COSMOSDB_DBNAME` | Database name | ✅ | `whisprlog` |
| `OPENAI_API_KEY` | OpenAI API key | ✅* | - |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | ✅* | - |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | ✅* | - |
| `AZURE_OPENAI_DEPLOYMENT` | Azure deployment name | ✅* | - |
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ | - |
| `PORT` | Server port | ❌ | `5002` |
| `NODE_ENV` | Environment mode | ❌ | `development` |

*Either OpenAI or Azure OpenAI configuration is required

### Frontend (.env.local)
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | ✅ | - |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | ✅ | - |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | ✅ | - |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | ✅ | - |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | ✅ | - |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | ✅ | - |
| `VITE_API_BASE` | Backend API URL | ❌ | `http://localhost:5002` |
| `VITE_DEBUG` | Enable debug logging | ❌ | `false` |

## 🔒 Security Configuration

### Firebase Security Rules
Update your Firestore security rules (if using Firestore):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Journal entries are private to each user
    match /journalEntries/{entryId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Environment Security
- ✅ Never commit `.env` files to version control
- ✅ Use different Firebase projects for dev/staging/production
- ✅ Regularly rotate API keys and service account keys
- ✅ Store service account keys securely (not in repository)
- ✅ Use environment-specific database instances

## 🏗️ Project Structure

```
whisprlog/
├── app/                          # Frontend React application
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── HomePage.jsx    # Landing page
│   │   │   ├── JournalEntryForm.jsx  # Journal entry form
│   │   │   ├── TrendsPage.jsx  # Analytics dashboard
│   │   │   └── ...
│   │   ├── services/           # API and Firebase services
│   │   ├── utils/              # Utility functions
│   │   └── hooks/              # Custom React hooks
│   ├── package.json
│   └── vite.config.js
├── backend/                      # Backend Node.js application
│   ├── controllers/             # Route controllers
│   ├── routes/                  # API route definitions
│   ├── services/                # Business logic services
│   ├── models/                  # Data models (if applicable)
│   ├── package.json
│   └── index.js                 # Server entry point
├── package.json                 # Root package configuration
├── .gitignore                   # Git ignore rules
└── README.md                    # Project documentation
```

## 🐛 Troubleshooting Guide

### Common Issues & Solutions

#### 1. **Firebase Connection Errors**
```
Error: Firebase: Error (auth/invalid-api-key)
```
**Solutions:**
- Verify Firebase config in `.env.local`
- Check that service account key is in correct location
- Ensure Firebase project is not paused due to billing

#### 2. **Database Connection Errors**
```
MongoError: Authentication failed
```
**Solutions:**
- Check `COSMOSDB_URI` format and credentials
- Verify database user permissions
- Ensure MongoDB is running (for local setup)
- Check network connectivity for cloud databases

#### 3. **CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solutions:**
- Verify `VITE_API_BASE` matches backend URL
- Check backend CORS configuration
- Ensure backend server is running

#### 4. **AI Service Errors**
```
Error: Invalid API key
```
**Solutions:**
- Verify API key format and validity
- Check API key permissions
- Ensure billing is enabled for AI service
- Confirm correct endpoint URLs for Azure OpenAI

#### 5. **Build Errors**
```
Module not found: Can't resolve 'recharts'
```
**Solutions:**
- Run `npm install` in both root and app directories
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

### Debug Mode
Enable detailed logging by setting:
```env
VITE_DEBUG=true
```

### Health Checks
Test your setup with these endpoints:
- Backend health: `http://localhost:5002/health`
- Frontend dev server: `http://localhost:5173`

## 🚀 Deployment

### Development Deployment
```bash
# Build frontend
cd app && npm run build

# Start production servers
cd ../backend && npm start
# Serve built frontend from backend or use nginx
```

### Production Deployment Options

#### Option A: Heroku
1. Create Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using included `Procfile`
4. Configure frontend to point to Heroku backend URL

#### Option B: Vercel + Railway
1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Update frontend environment variables

#### Option C: Docker
```dockerfile
# Build multi-stage Docker image
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5002
CMD ["npm", "start"]
```

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd app && npm test

# Backend tests (if implemented)
cd backend && npm test
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Anonymous authentication
- [ ] Journal entry creation
- [ ] AI analysis of entries
- [ ] Trends and analytics display
- [ ] Custom goals creation and tracking
- [ ] PDF export functionality
- [ ] Dark mode toggle
- [ ] Responsive design on mobile

## 📚 Additional Resources

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

### Development Tools
- [VS Code](https://code.visualstudio.com/) - Recommended IDE
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [Firebase Console](https://console.firebase.google.com/) - Firebase management

### Community & Support
- [GitHub Issues](https://github.com/Mahrukh-Adeel/whisprlog/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/Mahrukh-Adeel/whisprlog/discussions) - Q&A and general discussion

---

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev              # Start frontend dev server
npm start               # Start backend server
npm run build           # Build for production
npm test                # Run tests

# Database
mongosh                 # Connect to MongoDB shell
mongoexport             # Export database data
mongoimport             # Import database data

# Firebase
firebase deploy         # Deploy to Firebase hosting
firebase functions:log  # View function logs
```

---

*Happy coding with WhisprLog! 💙*
