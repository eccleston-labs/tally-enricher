-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_users (
  id uuid NOT NULL,
  name text NOT NULL,
  email USER-DEFINED NOT NULL UNIQUE,
  workspace_id uuid NOT NULL,
  admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_users_pkey PRIMARY KEY (id),
  CONSTRAINT app_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT app_users_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE TABLE public.configurations (
  workspace_id uuid NOT NULL,
  form_provider USER-DEFINED NOT NULL,
  booking_url text,
  success_page_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  CONSTRAINT configurations_pkey PRIMARY KEY (id),
  CONSTRAINT configurations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE TABLE public.criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL UNIQUE,
  min_employees bigint,
  min_funding_usd bigint,
  min_revenue_usd bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT criteria_pkey PRIMARY KEY (id),
  CONSTRAINT criteria_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  qualified boolean NOT NULL DEFAULT false,
  is_test boolean NOT NULL DEFAULT false,
  person_role text,
  person_seniority text,
  company_name text NOT NULL,
  company_employees integer,
  company_funding_usd bigint,
  company_sector text,
  company_revenue_usd bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workspaces_pkey PRIMARY KEY (id)
);
