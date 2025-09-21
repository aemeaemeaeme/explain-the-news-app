-- Add tldr_paragraphs field to support new format
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tldr_paragraphs JSONB;