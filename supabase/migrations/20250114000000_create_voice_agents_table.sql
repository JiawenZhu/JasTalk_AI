-- Create voice_agents table
CREATE TABLE voice_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  voice_id TEXT NOT NULL, -- Gemini TTS voice ID
  language_code TEXT DEFAULT 'en-US',
  personality_type TEXT NOT NULL, -- 'technical', 'behavioral', 'empathetic', 'analytical', 'bilingual'
  specializations TEXT[] DEFAULT '{}',
  voice_description TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert all voice agents from HTML demo
INSERT INTO voice_agents (id, name, display_name, voice_id, personality_type, specializations, voice_description, is_premium) VALUES
-- English voices from HTML demo
('tech-puck', 'Dr. Sarah Chen', 'Dr. Sarah Chen (Technical)', 'Puck', 'technical', '{"Software Engineering", "System Design", "Algorithms"}', 'Upbeat, energetic voice perfect for technical discussions', false),
('analytical-kore', 'Marcus Johnson', 'Marcus Johnson (Analytical)', 'Kore', 'analytical', '{"Data Science", "Analytics", "Problem Solving"}', 'Firm, confident voice for analytical assessments', false),
('empathetic-zephyr', 'Emma Rodriguez', 'Emma Rodriguez (Supportive)', 'Zephyr', 'empathetic', '{"HR", "People Management", "Coaching"}', 'Bright, encouraging voice for comfortable conversations', false),
('behavioral-charon', 'Dr. James Wilson', 'Dr. James Wilson (Behavioral)', 'Charon', 'behavioral', '{"Leadership", "Team Management", "Communication"}', 'Informative, professional voice for behavioral interviews', false),
('tech-fenrir', 'Alex Thompson', 'Alex Thompson (Dynamic)', 'Fenrir', 'technical', '{"Software Engineering", "Startup Culture", "Innovation"}', 'Excitable, dynamic voice for energetic technical discussions', false),
('empathetic-leda', 'Lisa Park', 'Lisa Park (Youthful)', 'Leda', 'empathetic', '{"Junior Roles", "Career Guidance", "Mentoring"}', 'Youthful, friendly voice perfect for entry-level interviews', false),
('analytical-orus', 'Robert Chen', 'Robert Chen (Senior)', 'Orus', 'analytical', '{"Senior Roles", "Executive Interviews", "Strategy"}', 'Firm, authoritative voice for senior-level positions', true),
('behavioral-aoede', 'Maria Santos', 'Maria Santos (Breezy)', 'Aoede', 'behavioral', '{"Culture Fit", "Team Dynamics", "Collaboration"}', 'Breezy, approachable voice for cultural assessments', false),
('empathetic-callirrhoe', 'Jennifer Kim', 'Jennifer Kim (Easy-going)', 'Callirrhoe', 'empathetic', '{"Work-Life Balance", "Wellness", "Support"}', 'Easy-going, calming voice for stress-free interviews', false),
('technical-autonoe', 'David Miller', 'David Miller (Bright)', 'Autonoe', 'technical', '{"Frontend Development", "UI/UX", "Design Systems"}', 'Bright, clear voice perfect for creative technical roles', false),
('analytical-enceladus', 'Dr. Priya Patel', 'Dr. Priya Patel (Methodical)', 'Enceladus', 'analytical', '{"Research", "Data Analysis", "Scientific Method"}', 'Breathy, methodical voice for research-oriented roles', true),
('technical-iapetus', 'Tom Anderson', 'Tom Anderson (Clear)', 'Iapetus', 'technical', '{"Backend Development", "DevOps", "Infrastructure"}', 'Clear, precise voice for technical infrastructure roles', false),
('empathetic-umbriel', 'Sophie Williams', 'Sophie Williams (Relaxed)', 'Umbriel', 'empathetic', '{"Customer Success", "Client Relations", "Service"}', 'Easy-going, relaxed voice for customer-facing roles', false),
('behavioral-algieba', 'Michael Chang', 'Michael Chang (Smooth)', 'Algieba', 'behavioral', '{"Sales", "Business Development", "Negotiation"}', 'Smooth, persuasive voice for business-oriented interviews', false),
('empathetic-despina', 'Rachel Green', 'Rachel Green (Gentle)', 'Despina', 'empathetic', '{"Healthcare", "Education", "Social Work"}', 'Smooth, gentle voice for caring professions', false),
('technical-erinome', 'Kevin Liu', 'Kevin Liu (Crisp)', 'Erinome', 'technical', '{"Mobile Development", "App Design", "Product"}', 'Clear, crisp voice for modern tech roles', false),
('analytical-algenib', 'Frank Rodriguez', 'Frank Rodriguez (Gravelly)', 'Algenib', 'analytical', '{"Security", "Compliance", "Risk Management"}', 'Gravelly, serious voice for security-focused roles', true),
('behavioral-sulafat', 'Nina Patel', 'Nina Patel (Lively)', 'Sulafat', 'behavioral', '{"Marketing", "Communications", "Brand"}', 'Lively, energetic voice for creative and marketing roles', false),

-- International voices
('bilingual-spanish', 'Carlos Mendoza', 'Carlos Mendoza (Español)', 'es-US', 'bilingual', '{"Spanish Interviews", "International Business", "LATAM Markets"}', 'Native Spanish speaker for bilingual interviews', true),
('bilingual-chinese', 'Li Wei', 'Li Wei (中文)', 'zh-CN', 'bilingual', '{"Chinese Interviews", "International Markets", "APAC Business"}', 'Native Mandarin speaker for Chinese interviews', true);

-- Add voice_agent_id and voice_settings to practice_sessions table
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS voice_agent_id TEXT REFERENCES voice_agents(id);
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{"speed": 1.0, "language": "en-US"}';

-- Create index for faster queries
CREATE INDEX idx_voice_agents_personality_type ON voice_agents(personality_type);
CREATE INDEX idx_voice_agents_is_premium ON voice_agents(is_premium);
CREATE INDEX idx_practice_sessions_voice_agent ON practice_sessions(voice_agent_id);

-- Add comments for documentation
COMMENT ON TABLE voice_agents IS 'Available voice agents for interview sessions with personality types and voice characteristics';
COMMENT ON COLUMN voice_agents.personality_type IS 'Type of interviewer personality: technical, behavioral, empathetic, analytical, bilingual';
COMMENT ON COLUMN voice_agents.voice_id IS 'Gemini TTS voice identifier or language code for international voices';
COMMENT ON COLUMN voice_agents.specializations IS 'Array of specialization areas this agent is suited for';
COMMENT ON COLUMN practice_sessions.voice_settings IS 'JSON object containing voice speed, language, and other audio preferences';


