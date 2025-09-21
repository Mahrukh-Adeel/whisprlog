# WhisprLog 

A gentle, AI-powered journaling application that provides a safe space for self-reflection and emotional awareness. WhisprLog combines beautiful design with intelligent insights, custom goals, and smooth micro-interactions to help users understand their emotional patterns and maintain mental wellness.

## Support & Resources

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check SETUP.md for detailed configuration instructions

---

*WhisprLog - Where your words are heard, and your journey matters.* 💙

---


### Core Functionality
- **Journal Entries**: Write and manage your thoughts with a clean, distraction-free interface
- **AI Emotional Analysis**: Get compassionate insights about your emotional state and patterns
- **Trends & Analytics**: Visualize your emotional journey with detailed analytics and interactive charts
- **Custom Goals**: Set personalized goals beyond basic streaks (e.g., "Write 3 times a week", "Practice gratitude daily")
- **Weekly Check-ins**: Gentle weekly reflection prompts to maintain consistency
- **Profile Management**: Customize your experience with privacy settings and preferences
- **PDF Export**: Export your journal entries and insights as beautifully formatted PDFs
- **Quick Check-ins**: One-tap mood entries with emoji shortcuts for fast journaling

### User Experience
- **Secure Authentication**: Firebase-powered authentication with email/password and anonymous options
- **Beautiful UI**: Modern, calming design with Tailwind CSS and smooth animations
- **Dark Mode**: Complete dark mode support throughout the entire application
- **Micro-interactions**: Gentle animations and smooth transitions for enhanced user experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Gentle Reminders**: Optional notifications to encourage regular journaling
- **Privacy Controls**: Granular privacy settings for data retention and AI analysis

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for beautiful styling
- **Recharts** - Advanced charting library for interactive data visualization
- **Firebase Auth** - Secure user authentication
- **React Router** - Client-side routing
- **Lucide React** - Beautiful, consistent icons

### Backend
- **Node.js** - JavaScript runtime for the server
- **Express.js** - Fast, unopinionated web framework
- **Firebase Admin SDK** - Server-side Firebase integration
- **MongoDB/CosmosDB** - NoSQL database for flexible data storage
- **PDFKit** - PDF generation for data export

### Additional Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Axios** - HTTP client for API calls

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication enabled
- MongoDB/CosmosDB database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mahrukh-Adeel/whisprlog.git
   cd whisprlog
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install frontend dependencies
   cd app
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Anonymous sign-in
   - Generate a service account key and save it as `backend/serviceAccountKey.json`
   - Copy your Firebase config to `app/src/services/firebase.js`

4. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   COSMOSDB_URI=your_mongodb_connection_string
   COSMOSDB_DBNAME=your_database_name
   AI_API_KEY=your_ai_service_api_key
   PORT=5002
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start the backend
   cd backend
   npm start

   # Terminal 2: Start the frontend
   cd app
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173` to access WhisprLog

## � Security & Environment Setup

This project uses environment variables for sensitive configuration. **Never commit API keys or secrets to version control.**

### Environment Files
- `.env.example` - Template for backend environment variables
- `app/.env.example` - Template for frontend environment variables
- `.gitignore` - Excludes sensitive files from version control

### Key Security Features
- Firebase configuration via environment variables
- Service account keys excluded from git
- Comprehensive .gitignore with security patterns
- Environment variable validation
- Secure API key management

See **[SETUP.md](SETUP.md)** for detailed security configuration.

## �📁 Project Structure

```
whisprlog/
├── app/                    # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── services/      # Firebase and API services
│   │   └── AuthContext.jsx # Authentication context
│   ├── package.json
│   └── vite.config.js
├── backend/               # Backend Node.js application
│   ├── controllers/       # Route controllers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── package.json
│   └── index.js          # Server entry point
├── package.json          # Root package configuration
└── README.md
```

## 🔧 Available Scripts

### Frontend (`app/` directory)
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend (`backend/` directory)
```bash
npm start        # Start the server
```

## Key Components

### Authentication System
- **Email/Password**: Traditional sign-up and login
- **Anonymous**: Quick access without account creation
- **Persistent Sessions**: Stay logged in across browser sessions

### Journal Management
- **Rich Text Editor**: Clean interface for writing entries
- **Mood Tracking**: Record emotional state with each entry
- **Quick Check-ins**: One-tap mood entries with emoji shortcuts
- **Tagging System**: Organize entries with custom tags
- **Search & Filter**: Find entries by date, mood, or tags
- **Centralized Submit Logic**: Consistent journaling flow across all entry methods

### AI-Powered Insights
- **Emotional Analysis**: Understand the tone and sentiment of your writing
- **Pattern Recognition**: Identify recurring themes and emotions
- **Personalized Suggestions**: Gentle prompts based on your journaling patterns

### Data Visualization
- **Advanced Mood Timeline**: Interactive charts with accurate axes, tooltips, and smooth animations using Recharts
- **Mood Trends**: Charts showing emotional patterns over time with color-coded sentiment
- **Activity Heatmap**: Visual representation of journaling consistency
- **Statistics Dashboard**: Comprehensive overview of your journaling journey
- **Goal Progress Tracking**: Visual progress bars and streak counters for custom goals

### Custom Goals System
- **Flexible Goal Types**: Frequency goals (e.g., "Write 3 times a week"), streak goals, word count goals, emotion focus goals
- **Progress Tracking**: Real-time progress updates with visual progress bars and completion percentages
- **Streak Counting**: Automatic streak tracking and display for consistent habits
- **Goal Templates**: Pre-built goal templates to help users get started quickly
- **Smart Sync**: Automatic goal progress updates based on journal entries and activities

## Deployment

### Environment Variables
```env
COSMOSDB_URI=your_mongodb_connection_string
COSMOSDB_DBNAME=your_database_name
AI_API_KEY=your_ai_service_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Quality
- Follow existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure responsive design works on all devices
- Test accessibility features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Firebase** for authentication and hosting
- **MongoDB/CosmosDB** for reliable data storage
- **OpenAI** for AI-powered emotional analysis
- **Recharts** for advanced, interactive data visualization
- **Tailwind CSS** for beautiful, responsive design
- **Lucide** for consistent, beautiful icons

## � Troubleshooting & Known Issues

### Common Setup Issues
- **Environment Variables**: Ensure all required environment variables are set (see SETUP.md)
- **Firebase Configuration**: Double-check Firebase project settings and service account key
- **Database Connection**: Verify MongoDB/CosmosDB connection string and permissions
- **AI Integration**: Confirm OpenAI API key and endpoint configuration

### Performance Considerations
- **Large Datasets**: Database queries may slow down with thousands of journal entries
- **Memory Usage**: AI analysis may consume significant memory for long entries
- **Network Latency**: All features require internet connection (offline support planned)

### Security Notes
- **API Keys**: Never commit API keys or secrets to version control
- **Environment Variables**: Use different values for development, staging, and production
- **Database Security**: Regularly rotate database credentials and review access permissions


## Important Security Notes

- **Environment Variables**: Ensure `.env` files are never committed to version control. Use `.env.example` as a template.
- **Service Account Keys**: Never commit `serviceAccountKey.json` or similar sensitive files. These should be added to `.gitignore`.
- **Secrets Management**: Use a secure secrets management tool for production environments.

### Git History Cleanup

If sensitive files were ever committed, you must rewrite the Git history to remove them. Use tools like `git filter-repo` or BFG Repo-Cleaner. Example commands:

#### Using BFG Repo-Cleaner:
```bash
# Install BFG
brew install bfg

# Remove sensitive files from history
bfg --delete-files serviceAccountKey.json
bfg --delete-files .env

# Clean up and push changes
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force
```

#### Using git filter-repo:
```bash
# Install git filter-repo
pip install git-filter-repo

# Remove sensitive files from history
git filter-repo --path backend/.env --invert-paths
git filter-repo --path backend/serviceAccountKey.json --invert-paths

# Push changes
git push origin --force
```