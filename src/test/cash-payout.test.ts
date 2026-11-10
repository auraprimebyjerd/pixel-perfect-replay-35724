import { describe, expect, it } from "vitest";
import { payoutDetailsError } from "@/lib/cash-payout";

describe("Instant Cash payout details", () => {
  it("requires a payment method", () => {
    expect(payoutDetailsError("", "0241234567", "Test Recipient")).toBe("Choose a payment method");
  });
  it("requires a payout account number", () => {
    expect(payoutDetailsError("method-id", "", "Test Recipient")).toBe("Enter a valid payout account number");
  });
  it("requires the payout account name", () => {
    expect(payoutDetailsError("method-id", "0241234567", " ")).toBe("Enter the payout account name");
  });
  it("accepts payout details without any deposit", () => {
    expect(payoutDetailsError("method-id", "0241234567", "Test Recipient")).toBeNull();
  });
});