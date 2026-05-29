/* ===========================================================
   Validation + input-formatting helpers for chaos-form.
   Pure functions, no React — kept here so the form does not
   duplicate validation logic.
   =========================================================== */

/** Keep only the digit characters of a value. */
function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/** Today's date as a YYYY-MM-DD string (used for the date input min + comparison). */
export function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

/* ---------- Phone ---------- */

/**
 * Format progressively as a US phone number: "(555) 123-4567".
 * Caps input at 10 digits and accepts spaces, dashes, parentheses, or plain
 * digits as the user types.
 */
export function formatPhone(value) {
  const d = onlyDigits(value).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Valid when there are exactly 10 digits. */
export function isValidPhone(value) {
  return onlyDigits(value).length === 10;
}

/* ---------- Card number ---------- */

/** Remove all spaces from a card number string. */
export function normalizeCardNumber(value) {
  return String(value ?? "").replace(/\s+/g, "");
}

/** Format as groups of four digits: "1234 5678 9012 3456" (capped at 16 digits). */
export function formatCardNumber(value) {
  const d = onlyDigits(value).slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

/** Valid when the normalized value is exactly 16 digits. */
export function isValidCardNumber(value) {
  return /^\d{16}$/.test(normalizeCardNumber(value));
}

/**
 * Mask a card number, showing only the last four digits preceded by bullets,
 * e.g. "•••• •••• •••• 4242".
 */
export function maskCardNumber(value) {
  const last4 = normalizeCardNumber(value).slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/* ---------- Expiration ---------- */

/** Format 4 digits of input as "MM/YY". */
export function formatExpiration(value) {
  const d = onlyDigits(value).slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

/** Valid MM/YY format with a month between 01 and 12. */
export function isValidExpiration(value) {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(String(value ?? "").trim());
}

/**
 * True when a well-formed MM/YY is the current month or earlier.
 * Returns false for malformed input so it never overrides the format error.
 */
export function isExpirationInPast(value) {
  if (!isValidExpiration(value)) return false;
  const [month, year] = String(value).split("/").map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return true;
  if (year === currentYear && month < currentMonth) return true;
  return false;
}

/* ---------- CVV ---------- */

/** Keep at most 3 digits. */
export function formatCvv(value) {
  return onlyDigits(value).slice(0, 3);
}

/** Valid when exactly 3 digits. */
export function isValidCvv(value) {
  return /^\d{3}$/.test(String(value ?? "").trim());
}

/* ---------- Discount code ---------- */

/** Uppercase and strip anything that is not an uppercase letter, digit, or hyphen. */
export function formatDiscountCode(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}
