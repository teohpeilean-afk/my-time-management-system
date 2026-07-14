"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { addLocation, updateLocation, rotateQrSecret } from "@/app/actions/locations";
import { buildQrPayload } from "@/lib/attendance/qr";
import type { ApprovedLocation } from "@/lib/types";

const inputClass =
  "mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900";

function EditableCell({
  value,
  type,
  pending,
  onCommit,
}: {
  value: string;
  type: "text" | "number";
  pending: boolean;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      type={type}
      step="any"
      disabled={pending}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="w-full min-w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    />
  );
}

export function LocationManager({
  locations,
  secretsByLocation,
}: {
  locations: ApprovedLocation[];
  secretsByLocation: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("200");
  const [error, setError] = useState<string | null>(null);
  const [qrShownFor, setQrShownFor] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      router.refresh();
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    run(() =>
      addLocation({
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radius),
      }),
    );
    setName("");
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-5 dark:border-neutral-800"
      >
        <label className="text-xs text-neutral-500 sm:col-span-2">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse B" className={inputClass} />
        </label>
        <label className="text-xs text-neutral-500">
          Latitude
          <input required type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs text-neutral-500">
          Longitude
          <input required type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs text-neutral-500">
          Radius (m)
          <input required type="number" min={1} value={radius} onChange={(e) => setRadius(e.target.value)} className={inputClass} />
        </label>
        <div className="sm:col-span-5">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-brand-600 dark:text-white"
          >
            Add location
          </button>
        </div>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {locations.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
          No approved locations yet — punches can't be geofence-verified until one exists.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Latitude</th>
                <th className="px-4 py-2 font-medium">Longitude</th>
                <th className="px-4 py-2 font-medium">Radius (m)</th>
                <th className="px-4 py-2 font-medium">Active</th>
                <th className="px-4 py-2 font-medium">Site QR</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => {
                const secret = secretsByLocation[loc.id];
                return (
                  <tr key={loc.id} className="border-t border-neutral-200 align-top dark:border-neutral-800">
                    <td className="px-4 py-2">
                      <EditableCell value={loc.name} type="text" pending={pending} onCommit={(v) => run(() => updateLocation(loc.id, { name: v }))} />
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell value={String(loc.latitude)} type="number" pending={pending} onCommit={(v) => run(() => updateLocation(loc.id, { latitude: Number(v) }))} />
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell value={String(loc.longitude)} type="number" pending={pending} onCommit={(v) => run(() => updateLocation(loc.id, { longitude: Number(v) }))} />
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell value={String(loc.radius_meters)} type="number" pending={pending} onCommit={(v) => run(() => updateLocation(loc.id, { radius_meters: Math.round(Number(v)) }))} />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        disabled={pending}
                        checked={loc.active}
                        onChange={(e) => run(() => updateLocation(loc.id, { active: e.target.checked }))}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="space-y-2">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setQrShownFor(qrShownFor === loc.id ? null : loc.id)}
                            className="text-sm text-brand-700 underline dark:text-brand-300"
                          >
                            {qrShownFor === loc.id ? "Hide QR" : "Show QR"}
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => rotateQrSecret(loc.id))}
                            className="text-sm text-neutral-600 underline disabled:opacity-50 dark:text-neutral-400"
                          >
                            Rotate
                          </button>
                        </div>
                        {qrShownFor === loc.id &&
                          (secret ? (
                            <div className="inline-block rounded-md bg-white p-3">
                              <QRCodeSVG value={buildQrPayload(loc.id, secret)} size={160} />
                              <p className="mt-1 max-w-40 text-center text-xs text-neutral-500">
                                Print &amp; post at {loc.name}. Rotating invalidates old posters.
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-neutral-500">No QR secret yet — click Rotate to create one.</p>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
