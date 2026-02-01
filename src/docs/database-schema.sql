-- =====================================================
-- Universal Job Application Platform - Database Schema
-- Database: PostgreSQL (Supabase)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Users Table
-- Stores authentication and basic user info
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    auth_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- Profiles Table
-- Stores the "Universal Profile" - filled once, used everywhere
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    
    -- Professional Links
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    github_url VARCHAR(500),
    
    -- Professional Info
    current_title VARCHAR(200),
    years_of_experience VARCHAR(20),
    desired_salary VARCHAR(50),
    
    -- Work Authorization
    work_authorization VARCHAR(50),
    requires_sponsorship BOOLEAN DEFAULT false,
    
    -- Cover Letter
    generic_cover_letter TEXT,
    
    -- Skills (stored as JSON array)
    skills JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- =====================================================
-- Education Table
-- Stores user's educational background
-- =====================================================
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    school VARCHAR(255) NOT NULL,
    degree VARCHAR(100),
    field_of_study VARCHAR(200),
    start_date DATE,
    end_date DATE,
    gpa VARCHAR(10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_education_user_id ON education(user_id);

-- =====================================================
-- Experience Table
-- Stores user's work experience
-- =====================================================
CREATE TABLE experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    company VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_experience_user_id ON experience(user_id);

-- =====================================================
-- Documents Table
-- Stores user's uploaded documents (resume, etc.)
-- =====================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL DEFAULT 'resume',
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,  -- S3 or Supabase Storage URL
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_documents_user_id ON documents(user_id);

-- =====================================================
-- Jobs Table (Cache)
-- Caches job listings fetched from RapidAPI/JSearch
-- =====================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255),  -- ID from the job API
    
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    
    description TEXT,
    apply_url VARCHAR(1000),
    
    job_type VARCHAR(50),  -- full-time, part-time, contract, internship
    is_remote BOOLEAN DEFAULT false,
    
    source VARCHAR(100),  -- linkedin, indeed, glassdoor, greenhouse, lever
    logo_url VARCHAR(500),
    
    posted_at DATE,
    expires_at DATE,
    
    -- Raw API response for reference
    raw_data JSONB,
    
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(external_id, source)
);

CREATE INDEX idx_jobs_title ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_source ON jobs(source);

-- =====================================================
-- Job Queue Table
-- Tracks user's application queue and status
-- =====================================================
CREATE TABLE job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id),
    
    -- Status: pending, processing, applied, failed, manual_required
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Error tracking
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Retry tracking
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_job_queue_user_id ON job_queue(user_id);
CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_created_at ON job_queue(created_at DESC);

-- =====================================================
-- Application Log Table
-- Detailed logs of automation attempts
-- =====================================================
CREATE TABLE application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
    
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    
    -- DOM/Page info for debugging
    page_url VARCHAR(1000),
    fields_filled JSONB,  -- Which fields were successfully filled
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_application_logs_queue_id ON application_logs(queue_id);

-- =====================================================
-- Views
-- =====================================================

-- User dashboard view
CREATE VIEW user_application_stats AS
SELECT 
    user_id,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE status = 'applied') as applied_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE status = 'manual_required') as manual_required_count
FROM job_queue
GROUP BY user_id;

-- =====================================================
-- Functions & Triggers
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at
    BEFORE UPDATE ON education
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_updated_at
    BEFORE UPDATE ON experience
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) Policies for Supabase
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own job queue" ON job_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own job queue" ON job_queue
    FOR ALL USING (auth.uid() = user_id);
