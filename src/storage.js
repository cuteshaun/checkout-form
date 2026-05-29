const STORAGE_KEY = "chaos-form-orders";

/**
 * Read all saved orders from localStorage.
 * Always returns an array, even if nothing is stored or the data is corrupt.
 */
export function getOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Append a single order to the existing list (does not replace previous orders)
 * and persist the result. Returns the updated list.
 */
export function saveOrder(order) {
  const orders = getOrders();
  const updated = [...orders, order];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // If storage is full or unavailable we simply skip persistence.
  }
  return updated;
}

/** Remove all saved orders. */
export function clearOrders() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
