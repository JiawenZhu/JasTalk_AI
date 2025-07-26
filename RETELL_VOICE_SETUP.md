# Retell Voice Setup Guide 🎤

## Quick Setup for Real Voice Interviews

To enable real voice functionality (instead of mock mode), you need to set up your Retell API credentials.

### 1. Get Your Retell API Key

1. Go to [Retell Console](https://console.retellai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key or copy your existing one

### 2. Set Up Environment Variables

I've already created a `.env.local` file in your project root with the proper structure. Now you need to update it with your actual API keys:

1. **Open the `.env.local` file** in your project root
2. **Replace the placeholder values** with your actual API keys:

```bash
# Retell Configuration
RETELL_API_KEY=your_actual_retell_api_key_here
PRACTICE_AGENT_ID=your_actual_practice_agent_id_here

# Optional: Force real voice mode even in development
FORCE_REAL_VOICE=true
```

**Important:** Replace `your_retell_api_key_here` with your actual Retell API key from the Retell console.

### 3. Create a Practice Agent (Optional)

If you want to use a custom practice agent:

1. Go to [Retell Console](https://console.retellai.com/)
2. Navigate to Agents section
3. Create a new agent for practice interviews
4. Copy the agent ID and add it to `PRACTICE_AGENT_ID`

### 4. Test Real Voice Mode

After setting up the environment variables:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Start a practice interview
3. You should now hear real AI voice responses

### 5. Troubleshooting

#### No Sound
- Check browser permissions for microphone
- Ensure your speakers/headphones are working
- Check browser console for any errors

#### Connection Issues
- Verify your `RETELL_API_KEY` is correct
- Check if your Retell account has sufficient credits
- Ensure your agent is properly configured

#### Development vs Production
- **Development**: Uses mock mode by default (no API key needed)
- **Production**: Requires valid `RETELL_API_KEY`

### 6. Mock Mode vs Real Voice

| Feature | Mock Mode | Real Voice |
|---------|-----------|------------|
| Sound | ❌ No audio | ✅ Real AI voice |
| Responses | ✅ Simulated | ✅ Dynamic AI responses |
| Setup | ✅ No setup required | ⚠️ Requires API key |
| Cost | ✅ Free | 💰 Uses Retell credits |
| Testing | ✅ Perfect for development | ✅ Production ready |

### 7. Environment Variables Reference

```bash
# Required for real voice
RETELL_API_KEY=your_api_key_here

# Optional: Custom practice agent
PRACTICE_AGENT_ID=your_agent_id_here

# Optional: Force real voice in development
FORCE_REAL_VOICE=true

# Optional: Retell configuration
RETELL_BASE_URL=https://api.retellai.com
```

### 8. Quick Test

To quickly test if your setup is working:

1. Update your `RETELL_API_KEY` in `.env.local` (already created)
2. Restart the server
3. Start a practice interview
4. You should hear the AI voice asking questions

If you still don't hear sound, check the browser console for any error messages. 
