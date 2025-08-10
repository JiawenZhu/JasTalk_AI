# Roundly.AI Deployment Guide

## Overview

This guide covers deploying Roundly.AI to various platforms, including Vercel (recommended), Netlify, and other hosting providers.

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository**: Code pushed to GitHub
2. **Supabase Project**: Database and authentication configured
3. **Retell AI Account**: API key and agents set up
4. **OpenAI API Key**: For question generation
5. **Environment Variables**: All required keys configured

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys
OPENAI_API_KEY=your_openai_api_key
RETELL_API_KEY=your_retell_api_key

# Application URL
NEXT_PUBLIC_LIVE_URL=https://your-domain.com

# Optional: Database URL (for direct connections)
DATABASE_URL=your_database_url
```

## Vercel Deployment (Recommended)

### 1. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository and click "Deploy"

### 2. Configure Environment Variables

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add each environment variable from your `.env.local` file
3. Set the environment to "Production" for all variables

### 3. Configure Build Settings

Vercel will automatically detect Next.js and configure:
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `yarn install` or `npm install`

### 4. Deploy

1. Click "Deploy" in the Vercel dashboard
2. Vercel will build and deploy your application
3. Your app will be available at `https://your-project.vercel.app`

### 5. Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS records as instructed by Vercel

## Netlify Deployment

### 1. Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Connect your GitHub account and select the repository

### 2. Configure Build Settings

Set the following build settings:
- **Build command**: `npm run build` or `yarn build`
- **Publish directory**: `.next`
- **Node version**: 18 or higher

### 3. Environment Variables

1. Go to "Site settings" → "Environment variables"
2. Add all environment variables from your `.env.local` file

### 4. Deploy

1. Click "Deploy site"
2. Netlify will build and deploy your application
3. Your app will be available at `https://your-site.netlify.app`

## Railway Deployment

### 1. Connect to Railway

1. Go to [Railway Dashboard](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2. Configure Environment Variables

1. Go to "Variables" tab
2. Add all environment variables from your `.env.local` file

### 3. Deploy

1. Railway will automatically detect Next.js and deploy
2. Your app will be available at the provided Railway URL

## Docker Deployment

### 1. Build Docker Image

```bash
# Build the image
docker build -t roundly-ai .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key \
  -e OPENAI_API_KEY=your_openai_key \
  -e RETELL_API_KEY=your_retell_key \
  roundly-ai
```

### 2. Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  roundly-ai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - RETELL_API_KEY=${RETELL_API_KEY}
      - NEXT_PUBLIC_LIVE_URL=${NEXT_PUBLIC_LIVE_URL}
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## AWS Deployment

### 1. AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
5. Add environment variables
6. Deploy

### 2. AWS EC2

1. Launch an EC2 instance with Ubuntu
2. Install Node.js and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. Clone your repository:
   ```bash
   git clone https://github.com/JiawenZhu/Roundly.AI.git
   cd Roundly.AI
   ```

4. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

5. Create ecosystem file for PM2:
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'roundly-ai',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         NEXT_PUBLIC_SUPABASE_URL: 'your_supabase_url',
         NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_supabase_key',
         OPENAI_API_KEY: 'your_openai_key',
         RETELL_API_KEY: 'your_retell_key'
       }
     }]
   }
   ```

6. Start with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

## Database Setup

### 1. Supabase Migration

After deployment, run database migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 2. Verify Database

Check that all tables are created:
- `conversation_logs`
- `practice_sessions`
- `questions`
- `practice_responses`

## Webhook Configuration

### 1. Retell Webhooks

Configure Retell webhooks to point to your deployed application:

1. Go to [Retell Dashboard](https://dashboard.retellai.com/)
2. Navigate to "Webhooks"
3. Add webhook URL: `https://your-domain.com/api/retell-webhook`
4. Select events: `call_started`, `call_ended`, `transcript_updated`

### 2. Verify Webhook

Test webhook delivery:
1. Make a test call
2. Check webhook logs in Retell dashboard
3. Verify data is stored in your database

## SSL Configuration

### 1. Vercel/Netlify
SSL is automatically configured by these platforms.

### 2. Custom Domain
For custom domains, configure SSL certificates:
- **Let's Encrypt**: Free SSL certificates
- **Cloudflare**: SSL proxy service
- **AWS Certificate Manager**: For AWS deployments

## Monitoring and Logs

### 1. Application Logs

Monitor your application:
- **Vercel**: Built-in logging and analytics
- **Netlify**: Function logs and build logs
- **Railway**: Application logs in dashboard
- **AWS**: CloudWatch logs

### 2. Error Tracking

Set up error tracking:
- **Sentry**: Error monitoring and performance tracking
- **LogRocket**: Session replay and error tracking
- **Bugsnag**: Error reporting and monitoring

## Performance Optimization

### 1. Build Optimization

```bash
# Analyze bundle size
npm run build
npm run analyze

# Optimize images
npm run optimize-images
```

### 2. Caching

Configure caching headers:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600'
          }
        ]
      }
    ]
  }
}
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use platform-specific secret management
- Rotate API keys regularly

### 2. CORS Configuration
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://your-domain.com'
          }
        ]
      }
    ]
  }
}
```

### 3. Rate Limiting
Implement rate limiting for API endpoints:
```javascript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Implement rate limiting logic
  return NextResponse.next()
}
```

## Troubleshooting

### Common Issues

**Build Failures**
- Check Node.js version (18+ required)
- Verify all dependencies are installed
- Check for TypeScript errors

**Environment Variables**
- Ensure all variables are set in deployment platform
- Check variable names match exactly
- Verify API keys are valid

**Database Connection**
- Check Supabase URL and keys
- Verify database migrations are applied
- Test connection from deployment environment

**Webhook Issues**
- Verify webhook URL is accessible
- Check webhook signature verification
- Monitor webhook delivery logs

### Debug Commands

```bash
# Check build locally
npm run build

# Test production build
npm run start

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Verify database connection
npx supabase status
```

## Support

For deployment issues:
- **Documentation**: [Platform Docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/JiawenZhu/Roundly.AI/issues)
- **Community**: [Discord Server](https://discord.gg/roundly)

---

**Last Updated**: January 2024 
