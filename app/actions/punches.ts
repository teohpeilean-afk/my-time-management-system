"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { haversineMeters } from "@/lib/attendance/geo";
import { nextActionsFor } from "@/lib/attendance/status";
import { todayInKL } from "@/lib/attendance/format";
import type { AttendancePunch, PunchType } from "@/lib/types";

export interface RecordPunchResult {
  ok: boolean;
  withinGeofence: boolean;
  locationName: string | null;
  error?: string;
}

export async function recordPunch(
  employeeId: string,
  punchType: PunchType,
  coords: { lat: number; lng: number } | null,
): Promise<RecordPunchResult> {
  if (!employeeId) {
    return { ok: false, withinGeofence: false, locationName: null, error: "No employee selected." };
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

  const withinGeofence = nearest ? nearest.distance <= nearest.radius_meters : false;

  const { error } = await supabase.from("attendance_punches").insert({
    employee_id: employeeId,
    punch_type: punchType,
    punch_time: new Date().toISOString(),
    location_id: nearest?.id ?? null,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
    distance_meters: nearest?.distance ?? null,
    within_geofence: withinGeofence,
    note: coords ? null : "Location unavailable on device",
  });

  if (error) {
    return { ok: false, withinGeofence: false, locationName: null, error: error.message };
  }

  revalidatePath("/");
  return { ok: true, withinGeofence, locationName: nearest?.name ?? null };
}
