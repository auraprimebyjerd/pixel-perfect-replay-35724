export function payoutDetailsError(method: string, number: string, name: string): string | null {
  if (!method) return "Choose a payment method";
  if (number.trim().length < 4 || number.trim().length > 80) return "Enter a valid payout account number";
  if (name.trim().length < 2 || name.trim().length > 120) return "Enter the payout account name";
  return null;
}