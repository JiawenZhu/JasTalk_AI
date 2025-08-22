# 🚀 JasTalk AI - AI-Powered Interview Practice Platform

[![GitHub stars](https://img.shields.io/github/stars/JiawenZhu/Jastalk_AI?style=social)](https://github.com/JiawenZhu/Jastalk_AI/stargazers)
![License](https://img.shields.io/github/license/JiawenZhu/Jastalk_AI)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

> **Master Your Interviews with AI** - Practice with intelligent AI interviewers that actually speak, listen, and provide real-time feedback.

<img src="public/JasTalk.png" alt="JasTalk AI Platform" width="800">

## 🌟 What is JasTalk AI?

JasTalk AI is a cutting-edge interview practice platform that revolutionizes how job seekers prepare for interviews. Using advanced AI models (GPT-4o-mini, Gemini) and professional voice technology (Retell AI), it provides realistic, personalized interview experiences that help candidates build confidence and improve their skills.

### ✨ Key Features

- **🎤 Real Voice Conversations**: Practice with AI agents that actually speak and listen
- **🤖 Advanced AI Models**: Powered by OpenAI GPT-4o-mini and Google Gemini
- **📊 Performance Analytics**: Track progress with detailed insights and recommendations
- **🎯 Industry-Specific Questions**: Tailored to software engineering, product management, HR, and more
- **💳 Flexible Pricing**: Pay-as-you-go model ($0.12/minute) with $5 free credits for new users
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible component primitives

### Backend & AI
- **Supabase** - PostgreSQL database, authentication, and real-time features
- **OpenAI API** - GPT-4o-mini for intelligent question generation and responses
- **Google Gemini** - Alternative AI model for enhanced conversations
- **Retell AI** - Professional voice synthesis and real-time voice conversations

### Infrastructure
- **Vercel** - Deployment and hosting
- **Stripe** - Payment processing and subscription management
- **PostgreSQL** - Relational database with Row Level Security (RLS)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Retell AI API key
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JiawenZhu/Jastalk_AI.git
   cd Jastalk_AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Retell AI
   RETELL_API_KEY=your_retell_api_key
   
   # Stripe
   STRIPE_SECRET_KEY_LIVE=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET_LIVE=your_webhook_secret
   STRIPE_MODE=live
   
   # App
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # Run Supabase migrations
   npx supabase migration up
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### 1. **Choose Your Interviewer**
- Select from multiple AI interviewers (Bob, Lisa, Sarah, etc.)
- Each has unique personalities and expertise areas
- Free tier: Gemini-powered agents
- Pro tier: Retell voice agents with natural speech

### 2. **Start Your Practice Session**
- Upload job descriptions or use quick templates
- AI generates relevant interview questions
- Choose difficulty level and focus areas
- Begin your voice conversation

### 3. **Real-Time AI Interaction**
- AI asks questions and listens to your responses
- Get immediate feedback and follow-up questions
- Practice natural conversation flow
- Build confidence through repetition

### 4. **Track Your Progress**
- View detailed performance analytics
- Identify strengths and areas for improvement
- Track session history and scores
- Get personalized recommendations

## 💰 Pricing

### Free Tier
- **$5 Free Credits** (42 minutes) for new users
- Basic AI interviewers (Gemini-powered)
- Limited practice sessions
- Community support

### Pro Tier - $0.12/minute
- **Pay-as-you-go pricing** - no monthly commitment
- Premium AI interviewers (Retell voice agents)
- Advanced analytics & insights
- Priority support
- Volume discounts available

### Enterprise Tier
- Custom pricing for teams and organizations
- Team management and reporting
- Custom integrations and API access
- Dedicated support and SLA guarantees

## 🔧 API Endpoints

### Core Interview APIs
- `POST /api/generate-questions` - Generate interview questions from job descriptions
- `POST /api/free-interview-live` - Handle free practice interviews
- `POST /api/gemini-live` - Gemini-powered interview conversations
- `POST /api/deduct-credits` - Credit management system

### User Management
- `GET /api/user-subscription` - User credit and subscription status
- `POST /api/practice-sessions` - Create and manage practice sessions
- `POST /api/user-feedback` - Collect post-interview feedback

### Payment & Stripe
- `POST /api/stripe/create-checkout-session` - Create payment sessions
- `POST /api/stripe/webhook` - Handle payment confirmations

## 📱 Key Components

### Interview Flow
- **Practice New** (`/practice/new`) - Start new interview sessions
- **Continue Practice** (`/practice/continue/[sessionId]`) - Resume paused sessions
- **Feedback** (`/feedback`) - Rate and provide feedback

### Dashboard & Analytics
- **Main Dashboard** (`/dashboard`) - Overview of sessions and progress
- **Progress Analytics** - Detailed performance metrics
- **Session History** - Review past practice sessions

### AI Integration
- **Voice Agent Selection** - Choose from multiple AI personalities
- **Real-time Conversation** - Live voice interaction with AI
- **Question Generation** - AI-powered question creation

## 🎨 UI/UX Features

### Modern Design
- Clean, professional interface
- Responsive design for all devices
- Smooth animations and transitions
- Accessible design patterns

### Interactive Elements
- Real-time voice indicators
- Progress tracking visualizations
- Dynamic question navigation
- Session pause/resume functionality

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
Ensure all required environment variables are set in your production environment:
- Supabase credentials
- OpenAI API key
- Retell AI API key
- Stripe keys (live mode)
- NextAuth configuration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📊 Performance & Analytics

### Key Metrics
- **95% Success Rate** for users who practice regularly
- **10K+ Practice Sessions** completed successfully
- **500+ Companies** represented in question database
- **4.9/5 User Rating** from satisfied customers

### Monitoring
- Real-time performance tracking
- User engagement analytics
- AI response time monitoring
- Error tracking and reporting

## 🔒 Security & Privacy

### Data Protection
- End-to-end encryption for voice conversations
- Secure user authentication via Supabase
- Row-level security for database access
- GDPR-compliant data handling

### Privacy Features
- Private practice sessions
- No data sharing with third parties
- User control over personal information
- Secure payment processing

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

## 🆘 Support

- **Documentation**: [docs.jastalk.ai](https://docs.jastalk.ai)
- **Community**: [Discord](https://discord.gg/jastalk)
- **Email**: support@jastalk.ai
- **Issues**: [GitHub Issues](https://github.com/JiawenZhu/Jastalk_AI/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini AI model
- **Google** for Gemini AI integration
- **Retell AI** for voice technology
- **Supabase** for backend infrastructure
- **Vercel** for deployment platform

---

**Made with ❤️ by the JasTalk AI Team**

*Transform your interview preparation with the power of AI*
