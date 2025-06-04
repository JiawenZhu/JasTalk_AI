[![GitHub stars](https://img.shields.io/github/stars/FoloUp/FoloUp?style=social)](https://github.com/FoloUp/FoloUp/stargazers)
![License](https://img.shields.io/github/license/foloup/foloup)
[![Twitter Follow](https://img.shields.io/twitter/follow/SuveenE?style=social)](https://x.com/SuveenE)

# FoloUp - AI-Powered Interview Platform

FoloUp is a modern, open-source platform that empowers companies to conduct sophisticated AI-powered hiring interviews with seamless voice interactions and intelligent analysis.

<img src="https://github.com/user-attachments/assets/fa92ade1-02ea-4332-b5ed-97056dea01c3" alt="FoloUp Logo" width="800">

<div style="display: flex; flex-direction: row; gap: 20px; margin: 20px 0;">
  <picture>
    <img src="https://github.com/user-attachments/assets/91adf737-6f62-4f48-ae68-58855bc38ccf" alt="Interview Dashboard" width="400" style="max-width: 100%;">
  </picture>
  <picture>
    <img src="https://github.com/user-attachments/assets/91bbe5d5-1eff-4158-80d9-d98c2a53f59b" alt="Interview Interface" width="400" style="max-width: 100%;">
  </picture>
</div>

## ✨ Key Features

### 🎯 **Smart Interview Creation**
- **AI-Generated Questions:** Instantly create tailored interview questions from job descriptions
- **Multiple Interviewer Personalities:** Choose from empathetic, explorative, or conversational AI interviewers
- **Retell AI Integration:** Sync your custom AI agents directly from Retell AI dashboard

### 🎙️ **Advanced Voice Interviews**
- **Natural Conversations:** AI-powered voice interviews that adapt to candidate responses
- **Real-time Transcription:** Live transcript display during interviews
- **Professional UI:** Clean, responsive interview interface with no text cutoff issues
- **Tab Switch Detection:** Monitor candidate focus during interviews

### 📊 **Intelligent Analysis & Management**
- **Smart Response Analysis:** AI-powered evaluation of candidate answers
- **Comprehensive Dashboard:** Track candidate performance and interview statistics
- **One-Click Sharing:** Generate unique interview links instantly
- **Multi-organization Support:** Robust user and organization management

### 🔧 **Enhanced Developer Experience**
- **Development Mode Support:** Comprehensive fallbacks for local development
- **Error Handling:** Robust error handling with graceful degradation
- **Authentication System:** Seamless Supabase authentication with development fallbacks
- **Real-time Sync:** Automatic synchronization of Retell AI agents

Here's a [demo video](https://www.loom.com/share/762fd7d12001490bbfdcf3fac37ff173?sid=9a5b2a5a-64df-4c4c-a0e7-fc9765691f81) showcasing the platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and yarn/npm
- Supabase account
- Retell AI account
- OpenAI API key

### 1. Installation

```bash
git clone https://github.com/FoloUp/FoloUp.git
cd FoloUp
yarn install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Configure your `.env` file with the following variables:

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
3. Copy and execute the schema from `supabase_schema.sql`
4. Add your Supabase URL and anon key to `.env`

### 4. Retell AI Setup

1. Create an account at [Retell AI](https://retell.ai/)
2. Create AI agents in your dashboard (organize them in an "Interview" folder)
3. Get your API key from [Retell Dashboard](https://dashboard.retellai.com/apiKey)
4. Add the API key to your `.env` file

### 5. OpenAI Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file as `OPENAI_API_KEY`

### 6. Start Development

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application running!

## 🎨 Recent Improvements

### Authentication & Database Enhancements
- ✅ **Fixed Supabase RLS Issues:** Comprehensive error handling for Row Level Security policies
- ✅ **Development Mode Support:** Automatic fallbacks when authentication is unavailable
- ✅ **Context Synchronization:** Proper loading coordination between auth, organization, and interviews contexts
- ✅ **Server-side API Support:** Robust server-side Supabase client for API routes

### User Interface Improvements
- ✅ **Fixed Text Cutoff:** Resolved interview question display issues with proper flexbox layout
- ✅ **Responsive Design:** Improved mobile and desktop layouts
- ✅ **Loading States:** Enhanced user experience with proper loading indicators
- ✅ **Error Feedback:** Clear error messages and success notifications

### Retell AI Integration
- ✅ **Agent Sync Functionality:** One-click sync of Retell AI agents to your database
- ✅ **Avatar Mapping:** Automatic assignment of appropriate avatar images to agents
- ✅ **Smart Filtering:** Intelligent detection of interview-relevant agents
- ✅ **Duplicate Prevention:** Avoid syncing agents that already exist

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Voice AI:** Retell AI SDK
- **Text AI:** OpenAI GPT models
- **UI Components:** Custom components with Radix UI primitives

## 📁 Project Structure

```
FoloUp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (client)/          # Client-side routes
│   │   ├── (user)/            # User-facing routes
│   │   └── api/               # API endpoints
│   ├── components/            # Reusable UI components
│   │   ├── call/             # Interview interface components
│   │   ├── dashboard/        # Dashboard components
│   │   └── ui/               # Base UI components
│   ├── contexts/             # React contexts for state management
│   ├── lib/                  # Utility functions and configurations
│   └── services/             # External service integrations
├── public/                   # Static assets
│   └── interviewers/        # Avatar images
└── supabase_schema.sql      # Database schema
```

## 🔧 Development Features

### Sync Retell AI Agents
Navigate to **Dashboard → Interviewers** and click **"Sync Retell Agents"** to automatically:
- Fetch all agents from your Retell AI account
- Filter interview-relevant agents
- Assign appropriate avatars and descriptions
- Add new agents to your database
- Skip existing agents to prevent duplicates

### Development Mode Support
The application includes comprehensive development fallbacks:
- **Mock API Responses:** When Retell API is unavailable
- **Authentication Fallbacks:** Test users for local development
- **Database Fallbacks:** Mock data when RLS policies block access
- **Error Recovery:** Graceful degradation with helpful error messages

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com/)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

For detailed contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 🐛 Troubleshooting

### Common Issues

**Interview not loading:**
- Check that your Retell API key is valid
- Ensure agents are properly synced
- Verify Supabase connection

**Authentication errors:**
- Confirm Supabase URL and anon key are correct
- Check RLS policies in Supabase dashboard
- Try development mode fallbacks

**Agent sync issues:**
- Verify Retell API key has proper permissions
- Check console for detailed error messages
- Ensure agents exist in your Retell dashboard

## 🌟 Show Your Support

If FoloUp helps streamline your hiring process, please ⭐ star this repository! It helps us reach more developers and continue improving the platform.

## 🏢 Products Built with FoloUp

<div align="left">
  <a href="https://talvin.ai/" target="_blank">
    <img src="https://pbs.twimg.com/profile_images/1910041959508422656/OEnXp-kO_400x400.jpg" alt="Talvin AI Logo" height="100" style="border-radius: 20%;">
    <p><strong>Talvin AI</strong> - Advanced AI recruiting platform</p>
  </a>
</div>

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/FoloUp/FoloUp/issues)
- **Email:** [suveen.te1@gmail.com](mailto:suveen.te1@gmail.com)
- **Twitter:** [@SuveenE](https://x.com/SuveenE)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the FoloUp team**
