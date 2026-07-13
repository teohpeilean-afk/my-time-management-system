"use client";

import { useEffect, useRef, useState } from "react";

const REGION_ID = "tms-qr-scan-region";

// Camera QR scanner for the punch flow. Skippable by design: a worker with a
// broken camera must still be able to punch — the punch is just recorded
// with qr_ok = null and flagged for review, same philosophy as GPS.
export function QrScanStep({
  actionLabel,
  onResult,
  onSkip,
  onCancel,
}: {
  actionLabel: string;
  onResult: (payload: string) => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    // Guard against React strict-mode double-mount in dev.
    if (startedRef.current) return;
    startedRef.current = true;

    let stop: (() => void) | null = null;
    let unmounted = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (unmounted) return;
        const scanner = new Html5Qrcode(REGION_ID);
        stop = () => {
          scanner.stop().catch(() => {});
        };
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 220 },
          (text) => {
            scanner.stop().catch(() => {});
            onResultRef.current(text);
          },
          () => {}, // per-frame decode misses — ignore
        );
      } catch {
        if (!unmounted) {
          setCameraError(
            "Camera unavailable. You can skip the scan — the punch will be flagged for review.",
          );
        }
      }
    })();

    return () => {
      unmounted = true;
      stop?.();
    };
  }, []);

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-sm font-medium">{actionLabel}: scan the site QR poster</p>
      <div id={REGION_ID} className="mx-auto w-full max-w-xs overflow-hidden rounded-md" />
      {cameraError && <p className="text-sm text-amber-700 dark:text-amber-400">{cameraError}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Skip QR (flagged for review)
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-neutral-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
