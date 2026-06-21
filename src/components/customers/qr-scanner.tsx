"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string) => void;
}

export function QRScannerDialog({
  open,
  onOpenChange,
  onScan,
}: QRScannerDialogProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setIsStarting(true);
    setError(null);

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted || !scannerRef.current) return;

        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
            onOpenChange(false);
          },
          () => {
            // QR code parse error (ignore - happens on every frame without a code)
          }
        );

        if (mounted) setIsStarting(false);
      } catch (err: any) {
        if (mounted) {
          setIsStarting(false);
          setError(
            err?.message || "Camera access denied. Please allow camera permissions."
          );
        }
      }
    };

    // Small delay to ensure the dialog DOM is ready
    const timer = setTimeout(startScanner, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            html5QrCodeRef.current = null;
          });
      }
    };
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan QR / Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner viewport */}
          <div
            className="relative bg-black rounded-xl overflow-hidden"
            style={{ minHeight: "300px" }}
          >
            <div id="qr-reader" ref={scannerRef} className="w-full" />

            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Starting camera...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3 p-4">
                <CameraOff className="h-8 w-8 text-destructive" />
                <p className="text-sm text-center">{error}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Position the QR code or barcode within the scanner frame
          </p>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
