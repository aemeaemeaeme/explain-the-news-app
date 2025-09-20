CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tldr TEXT NOT NULL,
  eli5 TEXT NOT NULL,
  why_matters TEXT NOT NULL,
  key_points TEXT NOT NULL,
  bias_left INTEGER NOT NULL,
  bias_center INTEGER NOT NULL,
  bias_right INTEGER NOT NULL,
  bias_confidence TEXT NOT NULL,
  perspectives TEXT NOT NULL,
  common_ground TEXT NOT NULL,
  glossary TEXT NOT NULL,
  follow_ups TEXT NOT NULL,
  source_info TEXT NOT NULL,
  reading_time INTEGER NOT NULL,
  tone TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_created_at ON articles(created_at);
