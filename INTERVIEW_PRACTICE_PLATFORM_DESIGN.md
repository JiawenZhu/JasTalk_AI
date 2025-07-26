# Interview Practice Platform Design Specification

## Overview
This document outlines the redesigned interface for the FoloUp application, transforming it into a comprehensive interview practice platform optimized for mobile devices. Users can upload job descriptions, company documents, or provide text descriptions to generate personalized interview questions. The platform supports multiple interview rounds (phone, technical, team, etc.) and provides detailed feedback to help users improve their interview skills, with a primary focus on mobile phone usage.

## Design Philosophy
- **Mobile-First**: Optimized for phone screens and touch interactions
- **Interview-Focused**: Dedicated platform for interview practice and skill improvement
- **Document-Driven**: Upload any file type to generate relevant interview questions
- **Multi-Round Support**: Support for different interview types and rounds
- **Feedback-Rich**: Comprehensive feedback and improvement suggestions
- **Professional**: Clean, modern interface for serious interview preparation

## Mobile-First Design Principles

### Primary Device: Mobile Phones
- **Target Screen Sizes**: 320px - 428px (iPhone SE to iPhone 14 Pro Max)
- **Touch-Optimized**: Large touch targets (minimum 44px)
- **Thumb-Friendly**: Navigation within thumb reach
- **Voice-Centric**: Optimized for voice interactions and recording
- **Offline-Capable**: Basic functionality without internet connection

### Responsive Breakpoints
- **Mobile**: 320px - 767px (Primary focus)
- **Tablet**: 768px - 1023px (Secondary)
- **Desktop**: 1024px+ (Tertiary)

## Core Features

### 1. Document Upload & Question Generation
- **Mobile Camera**: Direct photo capture of documents
- **File Upload**: PDF, Word, Excel, PowerPoint, Text, Markdown, CSV, JSON, XML, HTML
- **Text Input**: Paste job descriptions from Indeed, LinkedIn, or any source
- **URL Import**: Direct import from job posting URLs
- **Question Generation**: AI-powered interview question creation based on uploaded content
- **Customization**: Adjust question difficulty, focus areas, and interview type

### 2. Interview Types & Rounds
- **Phone Interview**: Initial screening questions
- **Technical Interview**: Coding, system design, technical skills
- **Behavioral Interview**: Leadership, teamwork, problem-solving
- **Team Interview**: Collaboration and communication skills
- **Final Round**: Executive-level questions
- **Custom Rounds**: User-defined interview stages

### 3. Practice & Feedback System
- **Voice-Based Practice**: Real-time voice conversation with AI interviewers
- **Response Analysis**: AI-powered analysis of user responses
- **Improvement Suggestions**: Specific recommendations for better answers
- **Performance Tracking**: Progress over time and skill development
- **Mock Interviews**: Full interview simulations with realistic scenarios

## Page Structure (Mobile-First)

### 1. Main Dashboard (`/dashboard`)

#### Mobile Header
- **App Logo**: Compact FoloUp logo
- **User Avatar**: Small profile picture
- **Quick Actions**: Hamburger menu for navigation

#### Hero Section
- **Main Message**: "Master your interviews with AI-powered practice"
- **Subtitle**: "Upload job descriptions, get personalized questions, and improve your skills"
- **Primary CTA**: "Start Practice Interview" (full-width button)

#### Quick Actions Grid (2x2)
1. **Upload Document** card
   - Icon: Upload symbol
   - Text: "Upload Job Description"
   - Action: Opens camera/file picker

2. **Paste Text** card
   - Icon: Text symbol
   - Text: "Paste Job Description"
   - Action: Opens text input modal

3. **Recent Practice** card
   - Icon: Clock symbol
   - Text: "Continue Practice"
   - Action: Shows recent sessions

4. **View Progress** card
   - Icon: Chart symbol
   - Text: "My Progress"
   - Action: Opens analytics

#### Recent Activity Section
- **Section Title**: "Recent Practice Sessions"
- **Session Cards**: Horizontal scrollable list
- **Quick Stats**: Total sessions, average score, improvement trend

### 2. Document Upload (`/upload`)

#### Mobile Upload Interface
**Camera Integration**:
- **Camera Button**: Large, prominent camera icon
- **Photo Preview**: Immediate preview of captured document
- **Retake Option**: Easy retake functionality

**File Selection**:
- **Gallery Access**: Choose from phone gallery
- **File Picker**: Native file picker integration
- **Supported Formats**: Clear indication of supported file types

**Text Input**:
- **Large Text Area**: Full-screen text input
- **Paste Button**: Easy paste from clipboard
- **Template Examples**: Quick templates for common job types

#### Question Generation (Mobile)
**Configuration Panel**:
- **Interview Type**: Large, touch-friendly dropdown
- **Question Count**: Slider with large touch targets
- **Difficulty Level**: Radio buttons with clear labels
- **Focus Areas**: Expandable checkboxes

**Generated Questions**:
- **Question List**: Full-screen scrollable list
- **Question Cards**: Each question in its own card
- **Edit Options**: Swipe actions for editing
- **Start Practice**: Full-width action button

### 3. Interview Practice Session (`/practice/[sessionId]`)

#### Mobile Interview Interface
**Pre-Interview Setup**:
- **Interview Info**: Large, clear display of interview type and duration
- **Voice Settings**: Easy voice selection
- **Practice Mode**: Toggle switch
- **Start Button**: Large, prominent start button

**Interview Interface**:
**Top Section - Progress**:
- **Progress Bar**: Visual progress indicator
- **Question Counter**: "Question 3 of 10"
- **Timer**: Large, visible countdown (if enabled)

**Middle Section - Question**:
- **Question Text**: Large, readable font
- **Question Type**: Small badge (Technical, Behavioral, etc.)
- **Read Aloud**: "Read Question" button

**Bottom Section - Voice Controls**:
- **Record Button**: Large, circular record button
- **Stop Button**: Stop recording
- **Play Button**: Play back response
- **Submit Button**: Submit answer

**Response Display**:
- **Transcription**: Real-time text display
- **Edit Option**: Tap to edit transcription
- **Word Count**: Character/word count
- **Time Display**: Recording duration

#### Post-Interview Analysis (Mobile)
**Immediate Feedback**:
- **Score Display**: Large, prominent score
- **Grade**: Letter grade (A, B, C, D, F)
- **Quick Feedback**: 2-3 key improvement points
- **Detailed Analysis**: Expandable sections

### 4. Mobile Analytics (`/analytics`)

#### Performance Overview
**Dashboard Cards** (Stacked vertically):
1. **Total Practice Sessions** card
2. **Average Score** card
3. **Best Interview Type** card
4. **Improvement Trend** card

#### Detailed Analytics
**Performance by Interview Type**:
- **Tab Navigation**: Horizontal scrollable tabs
- **Chart Display**: Mobile-optimized charts
- **Data Points**: Touch-friendly data visualization

**Skill Breakdown**:
- **Progress Bars**: Visual skill indicators
- **Skill Cards**: Individual skill cards
- **Improvement Tips**: Actionable suggestions

### 5. Mobile Library (`/library`)

#### Question Bank
**Search & Filter**:
- **Search Bar**: Full-width search input
- **Filter Button**: Opens filter modal
- **Sort Options**: Dropdown for sorting

**Question Categories**:
- **Category Cards**: Large, touch-friendly cards
- **Question Count**: Number of questions per category
- **Difficulty Indicators**: Color-coded difficulty levels

## Mobile Navigation

### Bottom Navigation Bar
- **Dashboard**: Home icon
- **Upload**: Upload icon
- **Practice**: Microphone icon
- **Analytics**: Chart icon
- **Library**: Book icon

### Top Navigation
- **Back Button**: Standard back navigation
- **Page Title**: Clear page identification
- **Menu Button**: Hamburger menu for additional options

### Side Menu (Hamburger)
- **Profile**: User profile and settings
- **Practice History**: Complete practice history
- **Settings**: App preferences
- **Help & Support**: Help resources
- **Logout**: Sign out option

## Mobile-Specific Features

### Voice Optimization
- **Noise Reduction**: Background noise filtering
- **Voice Clarity**: Enhanced audio processing
- **Offline Recording**: Local recording capability
- **Audio Compression**: Optimized for mobile networks

### Touch Interactions
- **Large Touch Targets**: Minimum 44px touch areas
- **Swipe Gestures**: Swipe to navigate, edit, delete
- **Long Press**: Context menus and additional options
- **Pull to Refresh**: Refresh content with pull gesture

### Mobile Performance
- **Fast Loading**: Optimized for slower mobile networks
- **Offline Support**: Basic functionality without internet
- **Battery Optimization**: Efficient power usage
- **Storage Management**: Local storage for offline use

## Mobile Color Scheme

### Primary Colors
- **Primary Blue**: #4F46E5 (Indigo)
- **Secondary Blue**: #6366F1
- **Accent Blue**: #3B82F6

### Mobile-Specific Colors
- **Success Green**: #10B981 (Good performance)
- **Warning Yellow**: #F59E0B (Needs improvement)
- **Error Red**: #EF4444 (Poor performance)
- **Info Blue**: #3B82F6 (Information)

### Neutral Colors
- **Background**: #F7F9FC
- **Card Background**: #FFFFFF
- **Border**: #E5E7EB
- **Text Primary**: #111827
- **Text Secondary**: #6B7280

## Mobile Typography

### Font Family
- **Primary**: Inter, system-ui, sans-serif
- **Monospace**: JetBrains Mono (for code snippets)

### Mobile Font Sizes
- **Hero**: 2rem (32px)
- **H1**: 1.75rem (28px)
- **H2**: 1.5rem (24px)
- **H3**: 1.25rem (20px)
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)
- **Caption**: 0.75rem (12px)

## Mobile Component Specifications

### Buttons
- **Primary**: Full-width, blue background, white text
- **Secondary**: Full-width, white background, blue border
- **Success**: Green background, white text
- **Warning**: Yellow background, dark text
- **Error**: Red background, white text
- **Touch Target**: Minimum 44px height

### Cards
- **Full Width**: Cards span full screen width
- **Padding**: 16px padding on all sides
- **Border Radius**: 12px for modern look
- **Shadow**: Subtle shadow for depth
- **Touch Feedback**: Visual feedback on touch

### Forms
- **Large Inputs**: Minimum 44px height
- **Clear Labels**: Above input fields
- **Validation**: Inline error messages
- **Auto-focus**: Smart focus management

### Voice Controls
- **Large Record Button**: 80px circular button
- **Visual Feedback**: Pulsing animation during recording
- **Audio Waveform**: Visual audio representation
- **Playback Controls**: Large, touch-friendly controls

## Mobile Animation & Interactions

### Micro-interactions
- **Touch Feedback**: Immediate visual response
- **Smooth Transitions**: 300ms transition duration
- **Loading States**: Skeleton screens for content
- **Success/Error**: Clear feedback animations

### Voice Interactions
- **Recording Animation**: Pulsing record button
- **Audio Visualization**: Real-time waveform display
- **Playback Progress**: Visual progress indicator
- **Response Analysis**: Animated feedback presentation

## Mobile Accessibility

### Standards
- WCAG 2.1 AA compliance
- Touch target accessibility
- Screen reader compatibility
- High contrast mode support

### Voice-Specific Features
- **Audio Controls**: Voice control accessibility
- **Transcription**: Screen reader-friendly text
- **Visual Indicators**: Clear audio state indicators
- **Alternative Input**: Text input for voice-impaired users

## Mobile Performance Considerations

### Optimization
- **Image Optimization**: Compressed images for mobile
- **Code Splitting**: Lazy loading for components
- **Caching**: Smart caching strategies
- **Network Optimization**: Efficient API calls

### Loading States
- **Skeleton Screens**: Mobile-optimized loading
- **Progressive Loading**: Load content progressively
- **Error Boundaries**: Robust error handling
- **Retry Mechanisms**: Easy retry for failed operations

## Implementation Phases (Mobile-First)

### Phase 1: Core Mobile Platform
1. Mobile-optimized document upload
2. Basic question generation
3. Mobile interview practice interface
4. Touch-friendly navigation

### Phase 2: Advanced Mobile Features
1. Multiple interview types and rounds
2. Voice-based practice sessions
3. Response analysis and feedback
4. Mobile analytics and tracking

### Phase 3: Mobile Intelligence & Personalization
1. AI-powered question generation
2. Personalized feedback and suggestions
3. Advanced mobile analytics
4. Performance prediction

### Phase 4: Mobile Enhancement & Offline
1. Offline functionality
2. Mobile app development
3. Advanced mobile features
4. Cross-platform sync

## Technical Requirements (Mobile-First)

### Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for mobile-first styling
- React Hook Form for mobile forms
- Zustand for state management

### Mobile-Specific
- **PWA Support**: Progressive Web App capabilities
- **Service Workers**: Offline functionality
- **Touch Events**: Optimized touch handling
- **Voice APIs**: Mobile voice processing

### Backend
- Supabase for database and authentication
- OpenAI API for question generation and analysis
- Mobile-optimized file processing
- Voice streaming and transcription

### Mobile Integrations
- **Camera API**: Document photo capture
- **File API**: Native file picker integration
- **Voice APIs**: Speech-to-text, text-to-speech
- **Storage API**: Local storage management

## Database Schema (Mobile-Optimized)

### Core Tables
```sql
-- Users table (extends Supabase auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  mobile_optimized BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table (mobile-optimized)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  filename VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size INTEGER,
  content_text TEXT,
  mobile_upload BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interview sessions table
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES documents(id),
  interview_type VARCHAR NOT NULL,
  question_count INTEGER,
  duration_minutes INTEGER,
  mobile_session BOOLEAN DEFAULT true,
  status VARCHAR DEFAULT 'created',
  score DECIMAL(5,2),
  feedback_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR,
  difficulty VARCHAR,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User responses table (mobile-optimized)
CREATE TABLE user_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id),
  question_id UUID REFERENCES questions(id),
  response_text TEXT,
  response_audio_url VARCHAR,
  duration_seconds INTEGER,
  mobile_response BOOLEAN DEFAULT true,
  score DECIMAL(5,2),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance analytics table
CREATE TABLE performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  interview_type VARCHAR,
  average_score DECIMAL(5,2),
  total_sessions INTEGER,
  mobile_sessions INTEGER DEFAULT 0,
  improvement_rate DECIMAL(5,2),
  last_practice_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Success Metrics (Mobile-Focused)

### User Engagement
- Mobile app usage time
- Document upload via mobile camera
- Voice practice session completion
- Mobile return user rate

### Learning Outcomes
- Mobile practice effectiveness
- Voice response quality
- Skill development on mobile
- User satisfaction on mobile

### Platform Performance
- Mobile app performance
- Voice processing quality on mobile
- Offline functionality usage
- Mobile user retention

---

This design specification creates a comprehensive interview practice platform optimized for mobile phones, with a focus on voice interactions, touch-friendly interfaces, and mobile-first user experience. The platform prioritizes mobile usage while maintaining professional quality for serious interview preparation. 
