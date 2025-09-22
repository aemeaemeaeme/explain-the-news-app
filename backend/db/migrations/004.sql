-- Set safe defaults so the app never sees NULL arrays
ALTER TABLE articles
  ALTER COLUMN tldr_paragraphs     SET DEFAULT '[]'::jsonb,
  ALTER COLUMN why_it_matters      SET DEFAULT '[]'::jsonb,
  ALTER COLUMN key_points          SET DEFAULT '[]'::jsonb,
  ALTER COLUMN perspectives        SET DEFAULT '[]'::jsonb,
  ALTER COLUMN common_ground       SET DEFAULT '[]'::jsonb,
  ALTER COLUMN glossary            SET DEFAULT '[]'::jsonb,
  ALTER COLUMN follow_up_questions SET DEFAULT '[]'::jsonb;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles (domain);
CREATE INDEX IF NOT EXISTS idx_articles_created_at_2 ON articles (created_at DESC);
