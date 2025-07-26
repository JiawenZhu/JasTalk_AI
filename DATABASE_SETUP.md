# Database Setup Guide

This guide will help you set up the database tables for the FoloUp Interview Platform.

## 🗄️ **Database Tables Created**

The following tables are created to store user interviews and practice sessions:

### **1. `interviews` Table**
- Stores user-created interviews
- Contains interview metadata, questions, and settings
- Links to Retell agents for voice interviews

### **2. `practice_sessions` Table**
- Stores individual practice sessions
- Tracks session progress, scores, and completion status
- Links to interviews and agents used

### **3. `questions` Table**
- Stores interview questions
- Supports different question types (behavioral, technical, etc.)
- Includes difficulty levels and categories

### **4. `practice_responses` Table**
- Stores user responses during practice sessions
- Includes AI feedback and scoring
- Tracks response duration and metadata

## 🚀 **Setup Instructions**

### **Option 1: Using Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the **SQL Editor**

2. **Run the Setup Script**
   - Copy the contents of `scripts/setup-database.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute the script

3. **Verify Tables Created**
   - Go to **Table Editor** in the sidebar
   - You should see the new tables: `interviews`, `practice_sessions`, `questions`, `practice_responses`

### **Option 2: Using Supabase CLI**

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Run the migration**
   ```bash
   supabase db push
   ```

## 🔐 **Security Features**

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only access their own data
- Policies ensure data isolation between users

### **Authentication Integration**
- Tables use `auth.uid()` for user identification
- Automatic user context from Supabase Auth

## 📊 **Sample Data**

The setup script includes sample data for testing:
- Sample interviews for different roles
- Sample questions with various types and difficulties
- Test user data for development

## 🔧 **API Integration**

The following API endpoints are available:

### **Interviews**
- `GET /api/interviews` - Get user's interviews
- `POST /api/interviews` - Create new interview

### **Practice Sessions**
- `GET /api/practice-sessions` - Get user's practice sessions
- `POST /api/practice-sessions` - Create new practice session

## 🧪 **Testing the Setup**

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to the practice page**
   - Go to `http://localhost:3000/practice/new`
   - Create a practice session
   - Check the database to see the session saved

3. **Check practice history**
   - Go to `http://localhost:3000/practice/history`
   - Verify that sessions are loaded from the database

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Table doesn't exist" errors**
   - Make sure you ran the setup script in the correct Supabase project
   - Check that the SQL executed successfully

2. **Permission denied errors**
   - Verify RLS policies are correctly set up
   - Check that the user is authenticated

3. **API errors**
   - Ensure environment variables are set correctly
   - Check that the Supabase client is properly configured

### **Development Mode Fallback**

The application includes fallback mechanisms for development:
- If database operations fail, the app falls back to mock data
- Console logs indicate when fallback mode is active
- This allows development to continue even without database setup

## 📝 **Next Steps**

After setting up the database:

1. **Test the practice functionality**
   - Create practice sessions
   - Verify they're saved to the database
   - Check that history loads correctly

2. **Customize the schema** (if needed)
   - Add additional fields to tables
   - Modify RLS policies for your use case
   - Add new indexes for performance

3. **Deploy to production**
   - Run the setup script on your production database
   - Update environment variables
   - Test all functionality in production

## 📚 **Additional Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Schema Design](https://supabase.com/docs/guides/database/schema-design) 
