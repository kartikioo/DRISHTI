-- ==========================================================
-- DRISHTI: "Eyes for the Blind"
-- Supabase PostgreSQL Schema & Row Level Security (RLS)
-- ==========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'caregiver')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USER PREFERENCES TABLE (Accessibility Settings)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    speech_rate NUMERIC(3,2) DEFAULT 1.0,
    speech_pitch NUMERIC(3,2) DEFAULT 1.0,
    voice_name VARCHAR(100) DEFAULT '',
    auto_speak BOOLEAN DEFAULT TRUE,
    high_contrast BOOLEAN DEFAULT FALSE,
    contrast_theme VARCHAR(50) DEFAULT 'standard-dark' CHECK (contrast_theme IN ('standard-dark', 'yellow-black', 'white-black', 'custom')),
    font_size VARCHAR(20) DEFAULT 'normal' CHECK (font_size IN ('normal', 'large', 'extra-large')),
    sound_cues BOOLEAN DEFAULT TRUE,
    haptic_feedback BOOLEAN DEFAULT TRUE,
    preferred_mode VARCHAR(50) DEFAULT 'general' CHECK (preferred_mode IN ('general', 'text', 'hazards', 'currency', 'people', 'qa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- 3. ANALYSES TABLE (Vision & Scene History)
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT,
    mode VARCHAR(50) DEFAULT 'general',
    custom_prompt TEXT,
    summary TEXT NOT NULL,
    detailed_description TEXT,
    detected_text TEXT,
    detected_objects JSONB DEFAULT '[]'::jsonb,
    hazards JSONB DEFAULT '[]'::jsonb,
    navigation_advice TEXT,
    audio_transcript TEXT,
    ai_provider VARCHAR(50) DEFAULT 'gemini',
    ai_model VARCHAR(50),
    latency_ms INTEGER,
    is_favorite BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_mode ON public.analyses(mode);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- 1. Users table policies
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id OR current_setting('request.jwt.claim.sub', true)::uuid = id);

CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id OR current_setting('request.jwt.claim.sub', true)::uuid = id);

-- 2. User Preferences policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id OR current_setting('request.jwt.claim.sub', true)::uuid = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR current_setting('request.jwt.claim.sub', true)::uuid = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id OR current_setting('request.jwt.claim.sub', true)::uuid = user_id);

-- 3. Analyses policies
CREATE POLICY "Users can view own analyses"
    ON public.analyses
    FOR SELECT
    USING (auth.uid() = user_id OR current_setting('request.jwt.claim.sub', true)::uuid = user_id);

CREATE POLICY "Users can insert own analyses"
    ON public.analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR current_setting('request.jwt.claim.sub', true)::uuid = user_id);

CREATE POLICY "Users can update own analyses"
    ON public.analyses
    FOR UPDATE
    USING (auth.uid() = user_id OR current_setting('request.jwt.claim.sub', true)::uuid = user_id);

CREATE POLICY "Users can delete own analyses"
    ON public.analyses
    FOR DELETE
    USING (auth.uid() = user_id OR current_setting('request.jwt.claim.sub', true)::uuid = user_id);

-- ==========================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION
-- Run in Supabase SQL editor or create via Storage dashboard:
-- ==========================================================
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('drishti-images', 'drishti-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS:
-- CREATE POLICY "Allow authenticated users to upload images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'drishti-images');

-- CREATE POLICY "Allow public read access to drishti-images"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'drishti-images');
