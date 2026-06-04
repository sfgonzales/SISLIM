-- Supabase SQL schema for the user management prototype

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sprint 3
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Tabla de servicios/productos
CREATE TABLE IF NOT EXISTS public.services (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  provider_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services(provider_id);

-- Tabla de solicitudes de servicios/productos
CREATE TABLE IF NOT EXISTS public.service_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  requester_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  requested_date DATE,
  address TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_service_id ON public.service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_requester_id ON public.service_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON public.service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
