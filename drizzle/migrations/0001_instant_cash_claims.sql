CREATE TABLE public.cash_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  amount numeric NOT NULL,
  front_path text NOT NULL,
  back_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cash_claims TO authenticated;
GRANT ALL ON public.cash_claims TO service_role;
ALTER TABLE public.cash_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash claim read" ON public.cash_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_instant_cash(p_amount numeric, p_front text, p_back text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_amount NOT IN (1, 200, 500, 1000) THEN RAISE EXCEPTION 'Choose GH₵1, 200, 500 or 1000'; END IF;
  IF coalesce(p_front,'') NOT LIKE v_uid::text || '/%' OR coalesce(p_back,'') NOT LIKE v_uid::text || '/%' THEN
    RAISE EXCEPTION 'Upload both sides of your Ghana Card';
  END IF;
  IF EXISTS (SELECT 1 FROM public.cash_claims WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'You have already claimed your instant cash';
  END IF;
  INSERT INTO public.cash_claims (user_id, amount, front_path, back_path) VALUES (v_uid, p_amount, p_front, p_back) RETURNING id INTO v_id;
  INSERT INTO public.wallets (user_id, balance) VALUES (v_uid, p_amount)
    ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + p_amount, updated_at = now();
  INSERT INTO public.transactions (user_id, kind, amount, description, reference_id)
    VALUES (v_uid, 'instant_cash', p_amount, 'Instant cash bonus', v_id);
  INSERT INTO public.notifications (user_id, title, body)
    VALUES (v_uid, 'Instant cash received', 'GH₵' || p_amount || ' has been added to your wallet.');
  PERFORM public.log_audit('cash.claimed', 'cash_claims', v_id, jsonb_build_object('amount', p_amount));
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_instant_cash(numeric, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_instant_cash(numeric, text, text) TO authenticated;