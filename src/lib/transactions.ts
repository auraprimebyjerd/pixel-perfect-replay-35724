export type TxFilter = "all" | "in" | "out" | "repayment";

export const TX_FILTERS: { key: TxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in", label: "Money in" },
  { key: "out", label: "Money out" },
  { key: "repayment", label: "Repayments" },
];

const IN_KINDS = new Set(["loan_disbursement", "adjustment", "instant_cash"]);
const OUT_KINDS = new Set(["withdrawal"]);

export function txCategory(kind: string): "in" | "out" | "repayment" {
  if (IN_KINDS.has(kind)) return "in";
  if (OUT_KINDS.has(kind)) return "out";
  return "repayment";
}

export function txLabel(kind: string): string {
  switch (kind) {
    case "loan_disbursement":
      return "Loan deposit";
    case "withdrawal":
      return "Withdrawal";
    case "repayment":
      return "Repayment";
    case "adjustment":
      return "Adjustment";
    case "instant_cash":
      return "Instant cash";
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1);
  }
}

export interface SearchableTx {
  kind: string;
  description: string;
  amount: number | string | null;
}

/** Keep transactions matching both the search text (description, type or amount) and the category filter. */
export function filterTransactions<T extends SearchableTx>(txs: T[], search: string, filter: TxFilter): T[] {
  const q = search.trim().toLowerCase();
  return txs.filter((t) => {
    if (filter !== "all" && txCategory(t.kind) !== filter) return false;
    if (!q) return true;
    const amountText = Number(t.amount ?? 0).toFixed(2);
    return t.description.toLowerCase().includes(q) || t.kind.toLowerCase().includes(q) || amountText.includes(q);
  });
}
