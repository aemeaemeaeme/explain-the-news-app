-- Update articles table to support new comprehensive analysis schema
ALTER TABLE articles DROP COLUMN IF EXISTS tldr;
ALTER TABLE articles DROP COLUMN IF EXISTS eli5;
ALTER TABLE articles DROP COLUMN IF EXISTS why_matters;
ALTER TABLE articles DROP COLUMN IF EXISTS key_points;
ALTER TABLE articles DROP COLUMN IF EXISTS perspectives;
ALTER TABLE articles DROP COLUMN IF EXISTS common_ground;
ALTER TABLE articles DROP COLUMN IF EXISTS glossary;
ALTER TABLE articles DROP COLUMN IF EXISTS follow_ups;
ALTER TABLE articles DROP COLUMN IF EXISTS source_info;
ALTER TABLE articles DROP COLUMN IF EXISTS tone;
ALTER TABLE articles DROP COLUMN IF EXISTS sentiment;

-- Add new columns for comprehensive schema
ALTER TABLE articles ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS byline TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TEXT;

-- TL;DR fields
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tldr_headline TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tldr_subhead TEXT;

-- ELI5 fields
ALTER TABLE articles ADD COLUMN IF NOT EXISTS eli5_summary TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS eli5_analogy TEXT;

-- Analysis fields
ALTER TABLE articles ADD COLUMN IF NOT EXISTS why_it_matters JSONB;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS key_points JSONB;

-- Bias fields
ALTER TABLE articles ADD COLUMN IF NOT EXISTS bias_rationale TEXT;

-- Perspectives and content
ALTER TABLE articles ADD COLUMN IF NOT EXISTS perspectives JSONB;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS common_ground JSONB;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS glossary JSONB;

-- Sentiment fields  
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sentiment_positive INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sentiment_neutral INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sentiment_negative INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sentiment_rationale TEXT;

-- Source information
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_mix TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS follow_up_questions JSONB;

-- Update tone column to use new enum values
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tone TEXT CHECK (tone IN ('factual', 'neutral', 'opinionated', 'satirical'));