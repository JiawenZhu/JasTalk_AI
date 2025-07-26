[![GitHub stars](https://img.shields.io/github/stars/JiawenZhu/Roundly.AI?style=social)](https://github.com/JiawenZhu/Roundly.AI/stargazers)
![License](https://img.shields.io/github/license/JiawenZhu/Roundly.AI)

# Roundly.AI - AI-Powered Voice Interview Platform

A comprehensive platform for AI-powered voice interviews and practice sessions. Built with Next.js, featuring advanced voice interactions, conversation logging, and a modern interview interface.

<img src="public/FoloUp.png" alt="Roundly.AI Platform" width="800">

<div style="display: flex; flex-direction: row; gap: 20px; margin: 20px 0;">
  <picture>
    <img src="https://github.com/user-attachments/assets/91adf737-6f62-4f48-ae68-58855bc38ccf" alt="Interview Dashboard" width="400" style="max-width: 100%;">
  </picture>
  <picture>
    <img src="https://github.com/user-attachments/assets/91bbe5d5-1eff-4158-80d9-d98c2a53f59b" alt="Voice Interview Interface" width="400" style="max-width: 100%;">
  </picture>
</div>

## ✨ Key Features

### 🎙️ **AI-Powered Voice Interviews**
- **Natural Conversations:** AI-powered voice interactions that adapt to user responses
- **Real-time Transcription:** Live transcript display during conversations
- **Professional UI:** Clean, responsive interface optimized for voice interactions
- **Multiple Interviewers:** Choose from various AI interviewer personalities
- **Retell AI Integration:** Direct integration with Retell AI for high-quality voice interactions

### 📝 **Conversation Logging & Playback**
- **Audio Recording:** Full audio playback of interview sessions
- **Transcript Review:** Detailed conversation transcripts with timestamps
- **Performance Analysis:** Post-interview analysis and scoring
- **Session History:** Complete history of all practice sessions
- **Professional Player:** Custom audio player with seek, volume, and download controls

### 💻 **Code Analysis & Review**
- **Voice-Enabled Code Review:** AI analyzes code and provides voice feedback
- **Monaco Editor Integration:** Professional coding environment with syntax highlighting
- **Real-time Analysis:** Automatic code analysis and suggestions
- **Dynamic Variables:** Seamless integration with voice agents for code discussions
- **Multiple Programming Languages:** Support for JavaScript, Python, Java, and more

### 🎯 **Practice Session Management**
- **Question Generation:** AI-powered interview question generation from job descriptions
- **Session Continuation:** Resume interrupted practice sessions
- **Progress Tracking:** Track improvement over time with detailed metrics
- **Scoring System:** Comprehensive scoring across multiple categories
- **"Practice Again" Feature:** Reuse questions for multiple practice sessions

### 📊 **Platform Management**
- **Interviewer Management:** Comprehensive dashboard for managing voice agents
- **Usage Analytics:** Track performance and user interactions
- **Organization Support:** Multi-tenant architecture for teams and organizations
- **API Integration:** RESTful APIs for third-party integrations

### 🔧 **Developer Experience**
- **SDK & APIs:** Comprehensive developer tools for integration
- **Webhook Support:** Real-time notifications and event handling
- **Authentication System:** Secure user management with Supabase
- **Documentation:** Complete API documentation and integration guides

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and yarn/npm
- Supabase account
- Retell AI account
- OpenAI API key

### 1. Installation

```bash
git clone https://github.com/JiawenZhu/Roundly.AI.git
cd Roundly.AI
yarn install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Configure your `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys
OPENAI_API_KEY=your_openai_api_key
RETELL_API_KEY=your_retell_api_key

# Application URL
NEXT_PUBLIC_LIVE_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a new [Supabase](https://supabase.com/) project
2. Navigate to SQL Editor
3. Run the database migrations:
   ```bash
   npx supabase db push
   ```
4. Add your Supabase URL and anon key to `.env.local`

### 4. Retell AI Setup

1. Create an account at [Retell AI](https://retell.ai/)
2. Create AI agents in your dashboard
3. Get your API key from [Retell Dashboard](https://dashboard.retellai.com/apiKey)
4. Add the API key to your `.env.local` file

### 5. OpenAI Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file as `OPENAI_API_KEY`

### 6. Start Development

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your interview platform!

## 🎨 Platform Features

### Voice Interview System ✨
- ✅ **AI Interviewers:** Multiple personality types and specialties
- ✅ **Live Voice Interaction:** Real-time voice conversations with AI
- ✅ **Question Generation:** AI-powered questions from job descriptions
- ✅ **Session Management:** Start, pause, and resume interview sessions

### Conversation Logging & Playback
- ✅ **Audio Recording:** Full interview audio with professional player
- ✅ **Transcript Review:** Detailed conversation logs with timestamps
- ✅ **Performance Analysis:** Comprehensive scoring and feedback
- ✅ **Session History:** Complete archive of practice sessions
- ✅ **Download Support:** Export audio and transcripts

### Advanced Voice Technology
- ✅ **Real-time Voice Processing:** Low-latency voice interactions
- ✅ **Dynamic Context:** Context-aware conversations with memory
- ✅ **Multi-modal Support:** Voice, text, and code integration
- ✅ **Custom Personalities:** Diverse interviewer personalities

### Code Integration Features
- ✅ **Voice Code Review:** AI analyzes code and provides voice feedback
- ✅ **Interactive Coding:** Voice-guided coding sessions
- ✅ **Monaco Editor:** Professional coding environment
- ✅ **Multi-language Support:** JavaScript, Python, Java, and more

### Platform Management
- ✅ **User Management:** Comprehensive user and organization management
- ✅ **API Management:** Rate limiting, authentication, and usage tracking
- ✅ **Webhook System:** Real-time event notifications
- ✅ **Analytics Dashboard:** Detailed platform and performance analytics

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Voice AI:** Retell AI SDK
- **Text AI:** OpenAI GPT models
- **Code Editor:** Monaco Editor
- **UI Components:** Custom components with Radix UI primitives

## 📁 Project Structure

```
Roundly.AI/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (client)/          # Client-side routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   └── interviewers/  # Interviewer management
│   │   ├── (user)/            # User-facing routes
│   │   │   └── call/          # Voice interaction interface
│   │   ├── practice/          # Practice session routes
│   │   │   ├── logs/          # Conversation logs
│   │   │   ├── new/           # New practice session
│   │   │   └── complete/      # Session completion
│   │   └── api/               # API endpoints
│   │       ├── conversation-logs/    # Log management
│   │       ├── retell-audio/         # Audio retrieval
│   │       ├── retell-webhook/       # Webhook handling
│   │       └── practice-sessions/    # Session management
│   ├── components/            # Reusable UI components
│   │   ├── call/             # Voice interaction components
│   │   ├── coding/           # Code editor components
│   │   ├── dashboard/        # Dashboard components
│   │   └── practice/         # Practice session components
│   ├── contexts/             # React contexts for state management
│   ├── lib/                  # Utility functions and configurations
│   └── services/             # External service integrations
├── public/                   # Static assets
│   ├── interviewers/        # Interviewer avatar images
│   └── audio/               # Audio assets
├── supabase/                # Database migrations
└── docs/                    # Documentation
```

## 🔧 Platform Features

### Interview Dashboard
Navigate to the **Dashboard** to:
- Upload job descriptions for question generation
- Select AI interviewers for practice sessions
- View recent practice sessions and scores
- Access conversation logs and audio recordings
- Track progress and improvement over time

### Practice Session Management
Manage your interview practice:
- **Question Generation:** AI creates personalized questions from job descriptions
- **Session Continuation:** Resume interrupted practice sessions
- **Progress Tracking:** Monitor improvement with detailed metrics
- **Audio Playback:** Review interviews with full audio and transcript
- **Performance Analysis:** Get comprehensive feedback and scoring

### Conversation Logging
Review your interview performance:
- **Audio Recording:** Full interview audio with professional controls
- **Transcript Review:** Detailed conversation logs with timestamps
- **Performance Metrics:** Comprehensive scoring across multiple categories
- **Session History:** Complete archive of all practice sessions
- **Download Support:** Export audio and transcripts for offline review

### Development Tools
The platform includes comprehensive development features:
- **Live Testing Environment:** Test interviewers without external setup
- **Code Integration:** Voice-enabled code review and analysis
- **Webhook Management:** Real-time event notifications
- **Analytics Dashboard:** Detailed usage and performance metrics

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com/)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

The platform can be deployed on any service supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📚 Documentation

- **[Conversation Log Features](./CONVERSATION_LOG_FEATURES.md)** - Detailed guide to conversation logging and playback
- **[Retell Integration Guide](./RETELL_VOICE_SETUP.md)** - Setup and configuration for Retell AI
- **[API Documentation](./docs/api.md)** - Complete API reference
- **[Database Schema](./supabase_schema.sql)** - Database structure and relationships

## 🤝 Contributing

We welcome contributions to Roundly.AI!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/interview-enhancement`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add interview feature'`
5. Push to the branch: `git push origin feature/interview-enhancement`
6. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**Voice interactions not working:**
- Check microphone permissions
- Verify Retell AI agent configuration
- Test with different browsers
- Ensure Retell API key is valid

**Conversation logs not appearing:**
- Verify webhook configuration
- Check database connection
- Review API response logs
- Ensure proper authentication

**Question generation issues:**
- Confirm OpenAI API key is valid
- Check job description format
- Verify API rate limits
- Review error logs

## 🌟 Show Your Support

If Roundly.AI helps your interview preparation, please ⭐ star this repository!

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/JiawenZhu/Roundly.AI/issues)
- **Documentation:** [Platform Docs](./docs)
- **API Reference:** [API Documentation](./docs/api)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the future of AI-powered interviews**
