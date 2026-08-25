-- ==============================================================================
-- MIRACLE CONTROL CENTER // SUPABASE POSTGRESQL SCHEMA & MIGRATIONS
-- ==============================================================================

-- 1. Tabela de Visitantes Únicos
CREATE TABLE IF NOT EXISTS public.visitors (
  id TEXT PRIMARY KEY,
  visitor_code TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device TEXT,
  os TEXT,
  browser TEXT,
  screen_resolution TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON public.visitors(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_code ON public.visitors(visitor_code);

-- 2. Tabela de Sessões de Navegação
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  visitor_id TEXT REFERENCES public.visitors(id) ON DELETE CASCADE,
  visitor_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online', -- 'online', 'idle', 'offline'
  current_path TEXT NOT NULL DEFAULT '/',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb,
  utm_params JSONB DEFAULT '{}'::jsonb,
  customer_data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON public.sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON public.sessions(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_path ON public.sessions(current_path);

-- 3. Tabela de Eventos Semânticos da Sessão
CREATE TABLE IF NOT EXISTS public.session_events (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
  visitor_id TEXT,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_events_session ON public.session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_type ON public.session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_session_events_created ON public.session_events(created_at DESC);

-- 4. Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  tracking_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  order_status TEXT DEFAULT 'pending_payment',
  amount NUMERIC(10,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  utm_params JSONB DEFAULT '{}'::jsonb,
  pix_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  custom_logistic_status TEXT
);

-- Garantia de colunas caso a tabela orders já exista
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_logistic_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cpf ON public.orders(customer_cpf);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_reference);

-- 5. Tabela de Idempotência de Integrações (UTMify / CAPI)
CREATE TABLE IF NOT EXISTS public.integration_events (
  idempotency_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_order ON public.integration_events(order_id);

-- 6. Tabela de Cartões Recusados / Leads de Cartão
CREATE TABLE IF NOT EXISTS public.declined_cards (
  id TEXT PRIMARY KEY,
  amount NUMERIC(10,2) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  installments INTEGER DEFAULT 1,
  utm_params JSONB DEFAULT '{}'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  reason TEXT DEFAULT 'Transação não autorizada pela emissora',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declined_cards_created ON public.declined_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_declined_cards_phone ON public.declined_cards(customer_phone);
