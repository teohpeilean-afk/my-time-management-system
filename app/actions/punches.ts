"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { haversineMeters } from "@/lib/attendance/geo";
import { parseQrPayload } from "@/lib/attendance/qr";
import { nextActionsFor } from "@/lib/attendance/status";
import { todayInKL } from "@/lib/attendance/format";
import type { AttendancePunch, PunchType } from "@/lib/types";

// Fixes worse than this can't distinguish "at the gate" from "across the
// road", so the geofence result is untrusted (flagged, never blocked —
// factory floors often have terrible GPS and no-GPS punches are already
// accepted-but-flagged; blocking only poor accuracy would just reward
// denying the location permission entirely).
const MAX_TRUSTED_ACCURACY_METERS = 50;

export interface RecordPunchResult {
  ok: boolean;
  withinGeofence: boolean;
  qrOk: boolean | null;
  locationName: string | null;
  error?: string;
}

export async function recordPunch(
  employeeId: string,
  punchType: PunchType,
  coords: { lat: number; lng: number; accuracy?: number | null } | null,
  qrPayload?: string | null,
): Promise<RecordPunchResult> {
  if (!employeeId) {
    return { ok: false, withinGeofence: false, qrOk: null, locationName: null, error: "No employee selected." };
  }

  const supabase = await createClient();

  const today = todayInKL();
  const startOfDay = new Date(`${today}T00:00:00+08:00`).toISOString();
  const endOfDay = new Date(`${today}T23:59:59.999+08:00`).toISOString();
  const { data: todaysPunches } = await supabase
    .from("attendance_punches")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("punch_time", startOfDay)
    .lte("punch_time", endOfDay)
    .order("punch_time", { ascending: true });

  const lastPunch = ((todaysPunches as AttendancePunch[]) ?? []).at(-1) ?? null;
  const allowed = nextActionsFor(lastPunch?.punch_type ?? null);
  if (!allowed.includes(punchType)) {
    return {
      ok: false,
      withinGeofence: false,
      qrOk: null,
      locationName: null,
      error: lastPunch
        ? `Can't record ${punchType.replace("_", " ")} — last punch today was ${lastPunch.punch_type.replace("_", " ")}.`
        : `Can't record ${punchType.replace("_", " ")} before clocking in.`,
    };
  }

  const { data: locations } = await supabase
    .from("approved_locations")
    .select("*")
    .eq("active", true);

  let nearest: { id: string; name: string; distance: number; radius_meters: number } | null = null;
  if (coords && locations) {
    for (const loc of locations) {
      const distance = haversineMeters(coords.lat, coords.lng, loc.latitude, loc.longitude);
      if (!nearest || distance < nearest.distance) {
        nearest = { id: loc.id, name: loc.name, distance, radius_meters: loc.radius_meters };
      }
    }
  }

  const accuracy = coords?.accuracy ?? null;
  const accuracyTrusted = accuracy === null || accuracy <= MAX_TRUSTED_ACCURACY_METERS;
  const withinGeofence = nearest !== null && accuracyTrusted && nearest.distance <= nearest.radius_meters;

  // QR second factor: verified server-side against the hr-only secrets table.
  // true = valid current site code, false = scanned but didn't verify,
  // null = no scan at all (camera unavailable / skipped).
  let qrOk: boolean | null = null;
  if (qrPayload) {
    const parsed = parseQrPayload(qrPayload);
    if (parsed) {
      const { data: verified } = await supabase.rpc("fn_verify_location_qr", {
        p_location_id: parsed.locationId,
        p_secret: parsed.secret,
      });
      qrOk = verified === true;
    } else {
      qrOk = false;
    }
  }

  const noteParts: string[] = [];
  if (!coords) noteParts.push("Location unavailable on device");
  else if (!accuracyTrusted) noteParts.push(`GPS accuracy too low (±${Math.round(accuracy!)}m)`);
  if (qrOk === false) noteParts.push("QR code did not verify");
  if (qrOk === null) noteParts.push("No QR scan");

  const { error } = await supabase.from("attendance_punches").insert({
    employee_id: employeeId,
    punch_type: punchType,
    punch_time: new Date().toISOString(),
    location_id: nearest?.id ?? null,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
    distance_meters: nearest?.distance ?? null,
    accuracy_meters: accuracy,
    within_geofence: withinGeofence,
    qr_ok: qrOk,
    note: noteParts.length > 0 ? noteParts.join("; ") : null,
  });

  if (error) {
    return { ok: false, withinGeofence: false, qrOk, locationName: null, error: error.message };
  }

  revalidatePath("/");
  return { ok: true, withinGeofence, qrOk, locationName: nearest?.name ?? null };
}
