ALTER TABLE public.cash_claims ADD COLUMN payment_method_id uuid REFERENCES public.payment_methods(id), ADD COLUMN account_number text, ADD COLUMN account_name text;
CREATE OR REPLACE FUNCTION public.claim_instant_cash_with_payout(p_amount numeric, p_front text, p_back text, p_method uuid, p_account_number text, p_account_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF p_amount IS NULL OR p_amount NOT IN (200,500,1000) THEN RAISE EXCEPTION 'Choose GH₵200, 500 or 1000'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE id=p_method AND active) THEN RAISE EXCEPTION 'Choose an active payment method'; END IF;
 IF length(trim(coalesce(p_account_number,''))) < 4 OR length(trim(coalesce(p_account_number,''))) > 80 THEN RAISE EXCEPTION 'Enter a valid payout account number'; END IF;
 IF length(trim(coalesce(p_account_name,''))) < 2 OR length(trim(coalesce(p_account_name,''))) > 120 THEN RAISE EXCEPTION 'Enter the payout account name'; END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='kyc' AND name=p_front AND (storage.foldername(name))[1]=auth.uid()::text) OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='kyc' AND name=p_back AND (storage.foldername(name))[1]=auth.uid()::text) THEN RAISE EXCEPTION 'Upload both sides of your Ghana Card'; END IF;
 v_id := public.claim_instant_cash(p_amount,p_front,p_back);
 UPDATE public.cash_claims SET payment_method_id=p_method, account_number=trim(p_account_number), account_name=trim(p_account_name) WHERE id=v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_instant_cash_with_payout(numeric,text,text,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_instant_cash_with_payout(numeric,text,text,uuid,text,text) TO authenticated;