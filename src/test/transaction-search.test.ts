import { describe, expect, it } from "vitest";
import { filterTransactions, txCategory, txLabel } from "@/lib/transactions";

const txs = [
  { id: "1", kind: "loan_disbursement", description: "Loan disbursed to wallet", amount: 1000 },
  { id: "2", kind: "withdrawal", description: "Withdrawal requested", amount: -50 },
  { id: "3", kind: "repayment", description: "Repayment of GH₵ 120 recorded", amount: 0 },
  { id: "4", kind: "adjustment", description: "Admin wallet correction", amount: 25 },
];

describe("filterTransactions", () => {
  it("search matches description text", () => {
    expect(filterTransactions(txs, "disbursed", "all").map((t) => t.id)).toEqual(["1"]);
  });

  it("search matches amount, including negatives", () => {
    expect(filterTransactions(txs, "-50", "all").map((t) => t.id)).toEqual(["2"]);
  });

  it("money-in filter keeps only deposits", () => {
    expect(filterTransactions(txs, "", "in").map((t) => t.id)).toEqual(["1", "4"]);
  });

  it("money-out filter keeps only withdrawals", () => {
    expect(filterTransactions(txs, "", "out").map((t) => t.id)).toEqual(["2"]);
  });

  it("repayment filter keeps only repayments", () => {
    expect(filterTransactions(txs, "", "repayment").map((t) => t.id)).toEqual(["3"]);
  });

  it("empty search with all filter returns everything", () => {
    expect(filterTransactions(txs, "", "all")).toHaveLength(4);
  });

  it("combines search and category filter", () => {
    expect(filterTransactions(txs, "loan", "in").map((t) => t.id)).toEqual(["1"]);
    expect(filterTransactions(txs, "loan", "out")).toEqual([]);
  });
});

describe("txCategory and txLabel", () => {
  it("maps kinds to categories", () => {
    expect(txCategory("loan_disbursement")).toBe("in");
    expect(txCategory("adjustment")).toBe("in");
    expect(txCategory("withdrawal")).toBe("out");
    expect(txCategory("repayment")).toBe("repayment");
  });

  it("gives friendly labels", () => {
    expect(txLabel("loan_disbursement")).toBe("Loan deposit");
    expect(txLabel("withdrawal")).toBe("Withdrawal");
  });
});
