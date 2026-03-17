
-- Create storage bucket for data files
INSERT INTO storage.buckets (id, name, public) VALUES ('data-files', 'data-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read data-files" ON storage.objects FOR SELECT USING (bucket_id = 'data-files');
