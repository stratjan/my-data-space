
-- News digest items table
CREATE TABLE public.news_items (
  pmid TEXT PRIMARY KEY,
  doi TEXT,
  title TEXT NOT NULL,
  journal TEXT,
  pubdate TIMESTAMPTZ,
  pubtypes JSONB DEFAULT '[]'::jsonb,
  entity TEXT,
  trial_type TEXT,
  study_class TEXT,
  is_oa BOOLEAN,
  oa_url TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  url_pubmed TEXT,
  url_doi TEXT,
  abstract TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public read access (no auth required for this public data)
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news_items" ON public.news_items FOR SELECT USING (true);

-- Metadata table for last generation timestamp
CREATE TABLE public.news_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news_meta" ON public.news_meta FOR SELECT USING (true);

-- SJR metrics table
CREATE TABLE public.journal_metrics (
  journal_lower TEXT PRIMARY KEY,
  journal_name TEXT NOT NULL,
  sjr_value NUMERIC NOT NULL
);
ALTER TABLE public.journal_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read journal_metrics" ON public.journal_metrics FOR SELECT USING (true);
