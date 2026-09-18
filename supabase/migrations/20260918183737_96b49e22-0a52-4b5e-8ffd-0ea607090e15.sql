-- ad performance events
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page text NOT NULL,
  slot text NOT NULL,
  unit text NOT NULL,
  event text NOT NULL CHECK (event IN ('impression','loaded','failed','clicked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.ad_events TO anon;
GRANT SELECT, INSERT ON public.ad_events TO authenticated;
GRANT ALL ON public.ad_events TO service_role;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can record ad events" ON public.ad_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "signed in users can read ad stats" ON public.ad_events FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_ad_events_created_at ON public.ad_events (created_at DESC);
CREATE INDEX idx_ad_events_page_event ON public.ad_events (page, event);

-- blog
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published posts are public" ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "authors read own posts" ON public.blog_posts FOR SELECT TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "authors insert own posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors update own posts" ON public.blog_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors delete own posts" ON public.blog_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts (published_at DESC);
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- wallet
CREATE TABLE public.wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'USD',
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wallet_accounts TO authenticated;
GRANT ALL ON public.wallet_accounts TO service_role;
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet" ON public.wallet_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_wallet_accounts_updated BEFORE UPDATE ON public.wallet_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit','withdrawal')),
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'simulated' CHECK (status IN ('simulated','pending','completed','failed')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_wallet_tx_user_created ON public.wallet_transactions (user_id, created_at DESC);

-- alerts: richer alert types
ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS alert_type text NOT NULL DEFAULT 'price' CHECK (alert_type IN ('price','percent')),
  ADD COLUMN IF NOT EXISTS target_percentage numeric;
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts (active) WHERE active;

-- watchlist: no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uniq_watchlist_user_coin ON public.watchlist (user_id, coin_id);