/** Remove all spaces from a card number string. */
export function normalizeCardNumber(value) {
  return String(value ?? "").replace(/\s+/g, "");
}

/**
 * A card number is valid when, after removing spaces, it contains only digits
 * and has a reasonable length (13–19 digits).
 */
export function isValidCardNumber(value) {
  const normalized = normalizeCardNumber(value);
  return /^\d{13,19}$/.test(normalized);
}

/** Expiration must be MM/YY with a month between 01 and 12. */
export function isValidExpiration(value) {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(String(value ?? "").trim());
}

/** CVV must be exactly 3 or 4 digits. */
export function isValidCvv(value) {
  return /^\d{3,4}$/.test(String(value ?? "").trim());
}

/**
 * Mask a card number, showing only the last four digits preceded by bullets,
 * e.g. "•••• •••• •••• 4242".
 */
export function maskCardNumber(value) {
  const normalized = normalizeCardNumber(value);
  const last4 = normalized.slice(-4);
  return `•••• •••• •••• ${last4}`;
}
