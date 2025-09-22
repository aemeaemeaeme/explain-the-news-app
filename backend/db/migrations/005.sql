-- Optional: backfill TLDR paragraphs from headline/subhead for legacy rows
UPDATE articles
SET tldr_paragraphs = jsonb_build_array(
      COALESCE(NULLIF(tldr_headline, ''), 'Summary unavailable'),
      COALESCE(tldr_subhead, '')
    )
WHERE (tldr_paragraphs IS NULL OR jsonb_array_length(tldr_paragraphs) = 0)
  AND (tldr_headline IS NOT NULL OR tldr_subhead IS NOT NULL);
