
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  category text NOT NULL DEFAULT 'news',
  image_url text,
  video_url text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles are viewable by everyone" ON public.articles FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can create articles" ON public.articles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update articles" ON public.articles FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete articles" ON public.articles FOR DELETE TO public USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Anyone can upload media" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'media');
CREATE POLICY "Media is publicly accessible" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Anyone can delete media" ON storage.objects FOR DELETE TO public USING (bucket_id = 'media');
