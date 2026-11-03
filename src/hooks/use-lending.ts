import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLendingRules() {
  return useQuery({
    queryKey: ["lending-rules"],
    queryFn: async () => {
      const [s, t] = await Promise.all([
        supabase.from("lending_settings").select("*").eq("id", 1).single(),
        supabase.from("loan_terms").select("*").eq("active", true).order("duration_months"),
      ]);
      return { min: Number(s.data?.min_amount ?? 0), max: Number(s.data?.max_amount ?? 0), terms: t.data ?? [] };
    },
  });
}

export function useQuote(amount: number, duration: number | null) {
  return useQuery({
    queryKey: ["quote", amount, duration],
    enabled: !!duration && amount > 0,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calculate_loan", { p_amount: amount, p_duration: duration! });
      if (error) throw error;
      return data?.[0];
    },
  });
}

