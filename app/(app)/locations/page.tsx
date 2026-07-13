import { createClient } from "@/lib/supabase/server";
import { getCurrentSession } from "@/lib/session";
import { AccessDenied } from "@/components/AccessDenied";
import { LocationManager } from "@/components/LocationManager";
import type { ApprovedLocation, LocationQrSecret } from "@/lib/types";

export default async function LocationsPage() {
  const { employee } = await getCurrentSession();
  if (employee?.role !== "hr") {
    return <AccessDenied />;
  }

  const supabase = await createClient();
  const [{ data: locations, error }, { data: secrets }] = await Promise.all([
    supabase.from("approved_locations").select("*").order("name"),
    supabase.from("location_qr_secrets").select("*"),
  ]);

  const secretsByLocation: Record<string, string> = {};
  for (const s of (secrets as LocationQrSecret[]) ?? []) {
    secretsByLocation[s.location_id] = s.secret;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Approved locations</h1>
        <p className="text-sm text-neutral-500">
          Geofence boundaries for punch verification, plus each site&apos;s QR poster.
          Workers scan the poster when punching; rotate a QR to invalidate photographed
          copies.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Unable to load locations — try again.
        </p>
      ) : (
        <LocationManager
          locations={(locations as ApprovedLocation[]) ?? []}
          secretsByLocation={secretsByLocation}
        />
      )}
    </div>
  );
}
