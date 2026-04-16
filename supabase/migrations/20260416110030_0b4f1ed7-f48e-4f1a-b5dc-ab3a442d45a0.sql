INSERT INTO storage.buckets (id, name, public) VALUES ('vault', 'vault', false);

CREATE POLICY "Users can view own vault files" ON storage.objects
FOR SELECT USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to vault" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update vault files" ON storage.objects
FOR UPDATE USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete vault files" ON storage.objects
FOR DELETE USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);