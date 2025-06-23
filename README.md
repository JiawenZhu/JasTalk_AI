[![GitHub stars](https://img.shields.io/github/stars/your-username/AI-Voice-Agent-Marketplace-Platform?style=social)](https://github.com/your-username/AI-Voice-Agent-Marketplace-Platform/stargazers)
![License](https://img.shields.io/github/license/your-username/AI-Voice-Agent-Marketplace-Platform)

# AI Voice Agent Marketplace Platform

A comprehensive marketplace platform for discovering, testing, and integrating AI voice agents. Built with Next.js, featuring advanced voice interactions, code analysis capabilities, and a modern marketplace interface.

<img src="public/FoloUp.png" alt="AI Voice Agent Marketplace" width="800">

<div style="display: flex; flex-direction: row; gap: 20px; margin: 20px 0;">
  <picture>
    <img src="https://github.com/user-attachments/assets/91adf737-6f62-4f48-ae68-58855bc38ccf" alt="Marketplace Dashboard" width="400" style="max-width: 100%;">
  </picture>
  <picture>
    <img src="https://github.com/user-attachments/assets/91bbe5d5-1eff-4158-80d9-d98c2a53f59b" alt="Agent Interface" width="400" style="max-width: 100%;">
  </picture>
</div>

## ✨ Key Features

### 🛍️ **Voice Agent Marketplace**
- **Agent Discovery:** Browse and discover AI voice agents across different categories
- **Agent Testing:** Test voice agents directly in the platform before integration
- **Multiple Personalities:** Explore agents with various conversation styles and specialties
- **Retell AI Integration:** Direct integration with Retell AI agent ecosystem

### 🎙️ **Advanced Voice Interactions**
- **Natural Conversations:** AI-powered voice interactions that adapt to user needs
- **Real-time Transcription:** Live transcript display during conversations
- **Professional UI:** Clean, responsive interface optimized for voice interactions
- **Multi-language Support:** Support for various languages and accents

### 💻 **Code Analysis & Review**
- **Voice-Enabled Code Review:** AI analyzes code and provides voice feedback
- **Monaco Editor Integration:** Professional coding environment with syntax highlighting
- **Real-time Analysis:** Automatic code analysis and suggestions
- **Dynamic Variables:** Seamless integration with voice agents for code discussions
- **Multiple Programming Languages:** Support for JavaScript, Python, Java, and more

### 📊 **Platform Management**
- **Agent Management:** Comprehensive dashboard for managing voice agents
- **Usage Analytics:** Track agent performance and user interactions
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
git clone https://github.com/your-username/AI-Voice-Agent-Marketplace-Platform.git
cd AI-Voice-Agent-Marketplace-Platform
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
2. Create AI agents in your dashboard
3. Get your API key from [Retell Dashboard](https://dashboard.retellai.com/apiKey)
4. Add the API key to your `.env` file

### 5. OpenAI Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file as `OPENAI_API_KEY`

### 6. Start Development

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your marketplace platform!

## 🎨 Platform Features

### Voice Agent Marketplace ✨
- ✅ **Agent Discovery:** Browse and filter voice agents by category, rating, and features
- ✅ **Live Testing:** Test agents directly in the platform with real-time voice interaction
- ✅ **Integration Tools:** Easy-to-use APIs and SDKs for seamless integration
- ✅ **Agent Analytics:** Comprehensive metrics and usage statistics

### Advanced Voice Technology
- ✅ **Real-time Voice Processing:** Low-latency voice interactions
- ✅ **Dynamic Context:** Context-aware conversations with memory
- ✅ **Multi-modal Support:** Voice, text, and code integration
- ✅ **Custom Personalities:** Diverse agent personalities and specializations

### Code Integration Features
- ✅ **Voice Code Review:** AI analyzes code and provides voice feedback
- ✅ **Interactive Coding:** Voice-guided coding sessions
- ✅ **Monaco Editor:** Professional coding environment
- ✅ **Multi-language Support:** JavaScript, Python, Java, and more

### Platform Management
- ✅ **User Management:** Comprehensive user and organization management
- ✅ **API Management:** Rate limiting, authentication, and usage tracking
- ✅ **Webhook System:** Real-time event notifications
- ✅ **Analytics Dashboard:** Detailed platform and agent analytics

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
AI-Voice-Agent-Marketplace-Platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (client)/          # Client-side routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   └── interviews/    # Agent testing interface
│   │   ├── (user)/            # User-facing routes
│   │   │   └── call/          # Voice interaction interface
│   │   └── api/               # API endpoints
│   │       ├── create-interviewer/    # Agent management
│   │       ├── sync-retell-agents/    # Retell integration
│   │       └── execute-code/          # Code execution
│   ├── components/            # Reusable UI components
│   │   ├── call/             # Voice interaction components
│   │   ├── coding/           # Code editor components
│   │   ├── dashboard/        # Dashboard components
│   │   └── ui/               # Base UI components
│   ├── contexts/             # React contexts for state management
│   ├── lib/                  # Utility functions and configurations
│   └── services/             # External service integrations
├── public/                   # Static assets
│   ├── interviewers/        # Agent avatar images
│   └── audio/               # Audio assets
└── supabase_schema.sql      # Database schema
```

## 🔧 Platform Features

### Agent Marketplace
Navigate to the **Dashboard** to:
- Browse available voice agents
- Filter by categories and capabilities
- Test agents with live voice interactions
- View detailed agent specifications
- Access integration documentation

### Agent Management
Manage your voice agents:
- **Sync Retell Agents:** Import agents from your Retell AI account
- **Custom Avatars:** Assign visual representations to agents
- **Performance Tracking:** Monitor agent usage and effectiveness
- **API Keys:** Generate and manage integration credentials

### Development Tools
The platform includes comprehensive development features:
- **Live Testing Environment:** Test agents without external setup
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

## 🤝 Contributing

We welcome contributions to the AI Voice Agent Marketplace Platform!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/marketplace-enhancement`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add marketplace feature'`
5. Push to the branch: `git push origin feature/marketplace-enhancement`
6. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**Agents not loading:**
- Verify Retell API key is valid
- Check agent sync status in dashboard
- Confirm Supabase connection

**Voice interactions not working:**
- Check microphone permissions
- Verify Retell AI agent configuration
- Test with different browsers

**Code analysis issues:**
- Confirm OpenAI API key is valid
- Check code execution environment
- Verify Monaco Editor integration

## 🌟 Show Your Support

If this AI Voice Agent Marketplace Platform helps your development, please ⭐ star this repository!

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/your-username/AI-Voice-Agent-Marketplace-Platform/issues)
- **Documentation:** [Platform Docs](./docs)
- **API Reference:** [API Documentation](./docs/api)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the future of voice AI**
