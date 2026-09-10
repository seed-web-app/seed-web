-- Grant table permissions to anon & authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.parts TO anon, authenticated;
GRANT SELECT ON public.car_models TO anon, authenticated;
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT SELECT ON public.forum_threads TO anon, authenticated;
GRANT SELECT ON public.forum_replies TO anon, authenticated;
GRANT SELECT ON public.dealer_settings TO anon, authenticated;

-- Drop old restrictive select policies if any
DROP POLICY IF EXISTS "Parts are viewable by authenticated users" ON public.parts;
DROP POLICY IF EXISTS "Public read parts" ON public.parts;
DROP POLICY IF EXISTS "Public read car_models" ON public.car_models;
DROP POLICY IF EXISTS "Public read news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "Public read forum_threads" ON public.forum_threads;
DROP POLICY IF EXISTS "Public read forum_replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Public read dealer_settings" ON public.dealer_settings;

-- Create public read policies
CREATE POLICY "Public read parts" ON public.parts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read car_models" ON public.car_models FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read news_articles" ON public.news_articles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read forum_threads" ON public.forum_threads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read forum_replies" ON public.forum_replies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read dealer_settings" ON public.dealer_settings FOR SELECT TO anon, authenticated USING (true);
