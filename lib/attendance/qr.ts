// Site QR payload format: "TMS|<location_id>|<secret>", both UUIDs.
// Printed on the site poster (see /locations); verified server-side against
// the hr-only location_qr_secrets table via fn_verify_location_qr.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildQrPayload(locationId: string, secret: string): string {
  return `TMS|${locationId}|${secret}`;
}

export function parseQrPayload(payload: string): { locationId: string; secret: string } | null {
  const parts = payload.trim().split("|");
  if (parts.length !== 3 || parts[0] !== "TMS") return null;
  const [, locationId, secret] = parts;
  if (!UUID_RE.test(locationId) || !UUID_RE.test(secret)) return null;
  return { locationId, secret };
}
