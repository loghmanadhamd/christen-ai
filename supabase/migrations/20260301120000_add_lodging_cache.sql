-- Lodging cache table (6-hour TTL managed in code)
CREATE TABLE public.lodging_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resort_name TEXT NOT NULL,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  adults INTEGER NOT NULL,
  result_json JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resort_name, check_in_date, check_out_date, adults)
);

ALTER TABLE public.lodging_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lodging cache" ON public.lodging_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can insert lodging cache" ON public.lodging_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update lodging cache" ON public.lodging_cache FOR UPDATE USING (true);
