"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addLocation(input: {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  if (!input.name) return { ok: false, error: "Name is required." };
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return { ok: false, error: "Latitude and longitude must be numbers." };
  }
  if (!Number.isFinite(input.radiusMeters) || input.radiusMeters <= 0) {
    return { ok: false, error: "Radius must be a positive number of meters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("approved_locations")
    .insert({
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_meters: Math.round(input.radiusMeters),
    })
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "Only HR can manage locations." };

  // The 0009 migration seeds secrets for existing locations; new ones need
  // their own row before a QR poster can be printed.
  await supabase.from("location_qr_secrets").insert({ location_id: data[0].id });

  revalidatePath("/locations");
  return { ok: true };
}

export async function updateLocation(
  id: string,
  fields: { name?: string; latitude?: number; longitude?: number; radius_meters?: number; active?: boolean },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("approved_locations")
    .update(fields)
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "Only HR can manage locations." };
  revalidatePath("/locations");
  return { ok: true };
}

export async function rotateQrSecret(locationId: string) {
  const supabase = await createClient();
  // Upsert so a location that somehow lacks a secret row gets one.
  const { data, error } = await supabase
    .from("location_qr_secrets")
    .upsert(
      { location_id: locationId, secret: crypto.randomUUID(), rotated_at: new Date().toISOString() },
      { onConflict: "location_id" },
    )
    .select("location_id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "Only HR can rotate QR codes." };
  revalidatePath("/locations");
  return { ok: true };
}
