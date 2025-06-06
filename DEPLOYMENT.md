# Roundly.AI Production Deployment Guide 🚀

## 📋 Environment Variables Required

### Essential Production Variables

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Required)
OPENAI_API_KEY=your_openai_api_key
RETELL_API_KEY=your_retell_api_key

# Application URL (Required)
NEXT_PUBLIC_LIVE_URL=https://your-domain.vercel.app

# Authentication (if using Clerk - Optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 🚀 Vercel Deployment (Recommended)

### Step 1: GitHub Repository Setup

1. **Clone and prepare repository**:
```bash
git clone https://github.com/JiawenZhu/Roundly.AI.git
cd Roundly.AI
yarn install
```

2. **Add all changes and push**:
```bash
git add .
git commit -m "feat: Complete voice-enabled coding interview platform with AI analysis"
git push origin main
```

### Step 2: Vercel Setup

1. **Import Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository: `JiawenZhu/Roundly.AI`

2. **Configure Build Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `yarn build`
   - Output Directory: `.next`
   - Install Command: `yarn install`

3. **Add Environment Variables**:
   Copy all variables from your local `.env` file to Vercel Environment Variables section.

### Step 3: Domain Setup

1. **Configure Domain**:
   - Add your custom domain in Vercel settings
   - Update `NEXT_PUBLIC_LIVE_URL` to your production domain

2. **Update CORS Settings**:
   - Add your domain to Supabase allowed origins
   - Update Retell AI webhook URLs to your production domain

## 🗄️ Database Setup

### Supabase Configuration

1. **Create Production Database**:
   - Create new Supabase project for production
   - Run the complete schema from `supabase_schema.sql`

2. **Configure RLS Policies**:
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.interviewers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
   
   -- Add appropriate policies for your use case
   ```

3. **Add Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## 🤖 AI Services Setup

### OpenAI Configuration

1. **Get Production API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create new API key for production
   - Set up billing and usage limits

2. **Configure Rate Limits**:
   ```env
   OPENAI_API_KEY=sk-your-production-key
   ```

### Retell AI Configuration

1. **Setup Production Agents**:
   - Create production Retell AI agents
   - Configure with dynamic variables support
   - Test voice integration

2. **Configure Webhooks**:
   ```env
   RETELL_API_KEY=your_production_retell_key
   ```

3. **Update Webhook URLs**:
   - Set webhook URL to: `https://your-domain.vercel.app/api/retell-webhook`
   - Configure function call URLs for code analysis

## 🔧 Production Optimizations

### Performance Optimizations

1. **Enable Analytics**:
   ```bash
   yarn add @vercel/analytics @vercel/speed-insights
   ```

2. **Configure Caching**:
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       domains: ['your-domain.com'],
     },
     experimental: {
       esmExternals: false,
     },
   }
   ```

### Security Configurations

1. **Environment Variables Security**:
   - Never commit `.env` files
   - Use Vercel environment variables for all secrets
   - Rotate API keys regularly

2. **CORS Configuration**:
   ```env
   NEXT_PUBLIC_LIVE_URL=https://your-production-domain.com
   ```

## 🧪 Production Testing Checklist

### Pre-Deployment Testing

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Voice interview functionality tested
- [ ] Code analysis API endpoints working
- [ ] Retell AI integration functional
- [ ] OpenAI code analysis working

### Post-Deployment Verification

- [ ] Voice calls can be initiated
- [ ] Code submissions trigger AI analysis
- [ ] Dynamic variables update in Retell calls
- [ ] Interview creation and management works
- [ ] Agent synchronization functional

## 🚨 Troubleshooting

### Common Production Issues

**Build Failures**:
```bash
# Clear cache and rebuild
rm -rf .next
yarn build
```

**Environment Variable Issues**:
- Verify all required variables are set in Vercel
- Check for typos in variable names
- Ensure no spaces around `=` in env values

**API Integration Issues**:
- Verify webhook URLs are using HTTPS
- Check API key validity and permissions
- Monitor rate limits and quotas

### Monitoring and Logging

1. **Setup Error Tracking**:
```bash
yarn add @sentry/nextjs
```

2. **Monitor API Usage**:
- Track OpenAI API usage and costs
- Monitor Retell AI call volumes
- Set up alerts for error rates

## 📊 Production Features

### Enabled Features

✅ **Voice-Enabled Coding Interviews**
- Real-time code analysis with AI feedback
- Monaco editor with syntax highlighting
- Automatic code review triggers
- Dynamic variables integration

✅ **Advanced AI Integration**
- OpenAI GPT-4 for code analysis
- Retell AI for voice interactions
- Real-time transcript processing

✅ **Robust Error Handling**
- Graceful fallbacks for API failures
- Development mode support
- Comprehensive logging

✅ **Production-Ready Architecture**
- Scalable Next.js application
- Serverless API routes
- PostgreSQL database with Supabase

## 🎉 Go Live!

After completing all steps above:

1. **Final Deployment**:
```bash
git push origin main
```

2. **Verify Production**:
   - Test voice interview creation
   - Verify code analysis functionality
   - Check AI agent responses
   - Monitor performance metrics

3. **Share Your Platform**:
   Your Roundly.AI platform is now live at your custom domain! 🚀

---

**Need Help?** Check the troubleshooting section or create an issue in the [GitHub repository](https://github.com/JiawenZhu/Roundly.AI/issues). 
