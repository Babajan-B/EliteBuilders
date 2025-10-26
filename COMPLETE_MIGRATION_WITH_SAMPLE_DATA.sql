-- =====================================================
-- COMPLETE DATABASE MIGRATION
-- 1. Add AI analysis fields to submissions
-- 2. Add missing fields to challenges
-- 3. Insert 10 sample competitions from top companies
-- =====================================================

-- =====================================================
-- PART 1: Add AI Analysis Fields to Submissions Table
-- =====================================================

-- Add columns for AI analysis results
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS score_llm INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rubric_scores_json JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rationale_md TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN submissions.score_llm IS 'AI-generated score (0-60 points)';
COMMENT ON COLUMN submissions.rubric_scores_json IS 'Detailed rubric breakdown from AI analysis';
COMMENT ON COLUMN submissions.rationale_md IS 'AI rationale explaining the scores';
COMMENT ON COLUMN submissions.ai_analyzed_at IS 'Timestamp when AI analysis was performed';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_submissions_ai_analyzed ON submissions(ai_analyzed_at) WHERE ai_analyzed_at IS NOT NULL;

-- Add computed column for score display
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS score_display INTEGER GENERATED ALWAYS AS (
  COALESCE(score_llm, 0)
) STORED;

COMMENT ON COLUMN submissions.score_display IS 'Display score (uses AI score)';

-- =====================================================
-- PART 2: Add Missing Fields to Challenges Table
-- =====================================================

-- Add description field (separate from brief_md for short description)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add prize_pool as numeric field
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS prize_pool NUMERIC(10, 2);

-- Add start_date
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW();

-- Add end_date (alias for deadline_utc for consistency)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Add difficulty level
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add challenge_id as alias for id (for frontend compatibility)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS challenge_id UUID GENERATED ALWAYS AS (id) STORED;

-- Update existing challenges to have end_date from deadline_utc
UPDATE challenges SET end_date = deadline_utc WHERE end_date IS NULL AND deadline_utc IS NOT NULL;

-- =====================================================
-- PART 3: Insert 10 Sample Competitions
-- =====================================================

-- Step 1: Create a sponsor organization
-- Using your existing sponsor profile: 78eb5166-5fc1-43a6-8cfb-f37b6f82b2f2
INSERT INTO sponsor_orgs (
  id,
  org_name,
  website,
  verified,
  owner_profile_id
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  'EliteBuilders Competitions',
  'https://elitebuilders.com',
  true,
  '78eb5166-5fc1-43a6-8cfb-f37b6f82b2f2'
)
ON CONFLICT (id) DO UPDATE SET
  org_name = EXCLUDED.org_name,
  owner_profile_id = EXCLUDED.owner_profile_id;

-- Step 2: Insert 10 competitions from top tech companies
INSERT INTO challenges (
  id,
  sponsor_org_id,
  title,
  description,
  brief_md,
  prize_pool,
  prize_md,
  start_date,
  end_date,
  deadline_utc,
  difficulty,
  is_active,
  tags,
  rubric_json
) VALUES

-- 1. CreatorPlus - AI Content Creation Tool
(
  'c0000001-0001-0001-0001-000000000001',
  '55555555-5555-5555-5555-555555555555',
  'CreatorPlus: AI-Powered Content Creation Platform',
  'Build an innovative platform that helps creators generate high-quality content using AI tools. Should support text, images, and video content creation.',
  '# CreatorPlus Challenge

## Overview
Build a comprehensive AI-powered content creation platform that empowers creators to generate professional content across multiple formats.

## Requirements
- AI text generation (blogs, scripts, captions)
- AI image generation or editing
- Video content suggestions and optimization
- Multi-platform export (YouTube, Instagram, TikTok, etc.)
- User-friendly interface for non-technical creators

## Bonus Points
- Content calendar and scheduling
- SEO optimization suggestions
- Analytics and performance tracking
- Collaboration features for teams',
  15000.00,
  '**Grand Prize:** $15,000 + 6-month mentorship with top content creators
**Runner-up:** $5,000
**3rd Place:** $2,500',
  NOW(),
  NOW() + INTERVAL '45 days',
  NOW() + INTERVAL '45 days',
  'medium',
  true,
  ARRAY['ai', 'content-creation', 'video', 'creator-economy'],
  '{"weights": {"llm": 0.6, "auto": 0.3}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 2. Google - Cloud Infrastructure
(
  'c0000002-0002-0002-0002-000000000002',
  '55555555-5555-5555-5555-555555555555',
  'Google Cloud: Next-Gen Serverless Architecture',
  'Design and implement a serverless architecture solution using Google Cloud Platform that scales efficiently and reduces operational costs.',
  '# Google Cloud Challenge

Build innovative serverless solutions leveraging Cloud Functions, Cloud Run, and Firebase. Focus on scalability, cost-efficiency, and developer experience.',
  25000.00,
  '**Winner:** $25,000 + Google Cloud credits ($10,000)
**Finalists:** GCP credits and swag',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days',
  'hard',
  true,
  ARRAY['google-cloud', 'serverless', 'cloud', 'infrastructure'],
  '{"weights": {"llm": 0.5, "auto": 0.3}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 3. Microsoft - AI Integration
(
  'c0000003-0003-0003-0003-000000000003',
  '55555555-5555-5555-5555-555555555555',
  'Microsoft Azure AI: Enterprise Automation',
  'Build an AI-powered automation solution for enterprises using Azure AI services and OpenAI integration.',
  '# Microsoft Azure AI Challenge

Create enterprise-grade automation tools using Azure OpenAI, Cognitive Services, and Microsoft Graph API. Solution should improve business productivity.',
  20000.00,
  '**Grand Prize:** $20,000 + Azure credits + Fast-track interview
**Top 3:** Azure credits ($5,000 each)',
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '40 days',
  NOW() + INTERVAL '40 days',
  'hard',
  true,
  ARRAY['azure', 'ai', 'enterprise', 'automation'],
  '{"weights": {"llm": 0.6, "auto": 0.25}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 4. Meta - Social Impact
(
  'c0000004-0004-0004-0004-000000000004',
  '55555555-5555-5555-5555-555555555555',
  'Meta: AR/VR for Social Good',
  'Develop an AR or VR experience that addresses a social or environmental challenge using Meta Quest or Spark AR.',
  '# Meta Social Impact Challenge

Build AR/VR experiences that make a positive impact on society. Use Meta Quest SDK or Spark AR Studio.',
  18000.00,
  '**Winner:** $18,000 + Meta Quest Pro + Mentorship
**Top 5:** Meta Quest 3',
  NOW(),
  NOW() + INTERVAL '50 days',
  NOW() + INTERVAL '50 days',
  'medium',
  true,
  ARRAY['meta', 'ar', 'vr', 'social-impact'],
  '{"weights": {"llm": 0.5, "auto": 0.3}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 5. Amazon - AWS Solutions
(
  'c0000005-0005-0005-0005-000000000005',
  '55555555-5555-5555-5555-555555555555',
  'AWS: Smart IoT Solutions for Smart Cities',
  'Build an IoT solution for smart cities using AWS IoT Core, Lambda, and DynamoDB.',
  '# AWS Smart Cities Challenge

Create innovative IoT solutions that improve urban living. Use AWS IoT services, serverless architecture, and real-time data processing.',
  22000.00,
  '**Grand Prize:** $22,000 + AWS credits ($15,000)
**Top 10:** AWS certification vouchers',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '35 days',
  NOW() + INTERVAL '35 days',
  'hard',
  true,
  ARRAY['aws', 'iot', 'smart-cities', 'serverless'],
  '{"weights": {"llm": 0.55, "auto": 0.3}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 6. Apple - iOS Development
(
  'c0000006-0006-0006-0006-000000000006',
  '55555555-5555-5555-5555-555555555555',
  'Apple: SwiftUI Accessibility Innovation',
  'Create an iOS app that pushes the boundaries of accessibility using SwiftUI and Apple accessibility frameworks.',
  '# Apple Accessibility Challenge

Build apps that make technology accessible to everyone. Use SwiftUI, VoiceOver, and Apple accessibility APIs.',
  16000.00,
  '**Winner:** $16,000 + MacBook Pro + WWDC ticket
**Finalists:** iPad Pro',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '42 days',
  NOW() + INTERVAL '42 days',
  'medium',
  true,
  ARRAY['apple', 'ios', 'swiftui', 'accessibility'],
  '{"weights": {"llm": 0.5, "auto": 0.35}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 7. Netflix - Streaming Tech
(
  'c0000007-0007-0007-0007-000000000007',
  '55555555-5555-5555-5555-555555555555',
  'Netflix: Next-Gen Content Discovery',
  'Build an innovative content discovery and recommendation system using machine learning.',
  '# Netflix Content Discovery Challenge

Create next-generation content discovery experiences. Use ML, personalization, and innovative UI/UX patterns.',
  30000.00,
  '**Grand Prize:** $30,000 + Netflix Engineering internship
**Top 3:** $5,000 each',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '25 days',
  NOW() + INTERVAL '25 days',
  'hard',
  true,
  ARRAY['netflix', 'machine-learning', 'recommendation', 'streaming'],
  '{"weights": {"llm": 0.6, "auto": 0.25}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 8. Stripe - FinTech
(
  'c0000008-0008-0008-0008-000000000008',
  '55555555-5555-5555-5555-555555555555',
  'Stripe: Financial Tools for Small Businesses',
  'Build financial management tools for small businesses using Stripe API and modern web technologies.',
  '# Stripe FinTech Challenge

Create tools that empower small businesses to manage finances, accept payments, and grow. Integrate Stripe APIs creatively.',
  20000.00,
  '**Winner:** $20,000 + Stripe Atlas credits
**Top 5:** $2,000 + Stripe swag',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '38 days',
  NOW() + INTERVAL '38 days',
  'medium',
  true,
  ARRAY['stripe', 'fintech', 'payments', 'small-business'],
  '{"weights": {"llm": 0.55, "auto": 0.3}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 9. Spotify - Music Tech
(
  'c0000009-0009-0009-0009-000000000009',
  '55555555-5555-5555-5555-555555555555',
  'Spotify: AI Music Discovery & Creation',
  'Build tools that help users discover music or create music using AI and Spotify API.',
  '# Spotify Music Innovation Challenge

Innovate in music discovery, playlist creation, or music generation using Spotify API and AI technologies.',
  17000.00,
  '**Grand Prize:** $17,000 + Spotify Premium (lifetime)
**Top 10:** Spotify Premium (1 year)',
  NOW(),
  NOW() + INTERVAL '45 days',
  NOW() + INTERVAL '45 days',
  'easy',
  true,
  ARRAY['spotify', 'music', 'ai', 'discovery'],
  '{"weights": {"llm": 0.5, "auto": 0.35}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
),

-- 10. Shopify - E-commerce
(
  'c0000010-0010-0010-0010-000000000010',
  '55555555-5555-5555-5555-555555555555',
  'Shopify: AI-Powered E-commerce Tools',
  'Create AI-powered tools for Shopify merchants to boost sales, improve customer experience, or automate operations.',
  '# Shopify E-commerce Innovation Challenge

Build apps or tools that help Shopify merchants succeed. Use Shopify APIs, AI, and modern web tech.',
  19000.00,
  '**Winner:** $19,000 + Shopify Plus subscription (1 year)
**Top 5:** Shopify credits',
  NOW() - INTERVAL '4 days',
  NOW() + INTERVAL '33 days',
  NOW() + INTERVAL '33 days',
  'medium',
  true,
  ARRAY['shopify', 'ecommerce', 'ai', 'retail'],
  '{"weights": {"llm": 0.55, "auto": 0.3}, "sections": ["problem_fit", "tech_depth", "ux_flow", "impact"]}'::jsonb
);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check that AI fields were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'submissions'
  AND column_name IN ('score_llm', 'rubric_scores_json', 'rationale_md', 'ai_analyzed_at');

-- Check that challenge fields were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'challenges'
  AND column_name IN ('description', 'prize_pool', 'start_date', 'end_date', 'difficulty');

-- Count competitions
SELECT COUNT(*) as total_competitions FROM challenges;

-- Show all active competitions
SELECT
  id,
  title,
  description,
  prize_pool,
  difficulty,
  end_date,
  is_active
FROM challenges
WHERE is_active = true
ORDER BY prize_pool DESC;

SELECT '✅ Migration completed successfully!' as status;
