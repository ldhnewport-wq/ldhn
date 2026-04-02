
-- Create lineup_approvals table
CREATE TABLE public.lineup_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  home_coach_initials text,
  away_coach_initials text,
  home_signed_at timestamp with time zone,
  away_signed_at timestamp with time zone,
  locked boolean NOT NULL DEFAULT false,
  locked_at timestamp with time zone,
  unlocked_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create audit log table
CREATE TABLE public.lineup_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by text,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lineup_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_audit_log ENABLE ROW LEVEL SECURITY;

-- lineup_approvals policies
CREATE POLICY "Lineup approvals viewable by everyone" ON public.lineup_approvals FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can insert lineup approvals" ON public.lineup_approvals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update lineup approvals" ON public.lineup_approvals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete lineup approvals" ON public.lineup_approvals FOR DELETE TO authenticated USING (true);

-- audit log policies
CREATE POLICY "Audit log viewable by everyone" ON public.lineup_audit_log FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can insert audit log" ON public.lineup_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lineup_approvals;
