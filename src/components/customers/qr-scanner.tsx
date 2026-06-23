"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2, Flashlight, FlashlightOff } from "lucide-react";

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
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const handleClose = async () => {
    setIsStarting(false);
    setIsTorchOn(false);
    setIsTorchSupported(false);
    if (html5QrCodeRef.current) {
      const scannerInstance = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      try {
        if (scannerInstance.isScanning) {
          await scannerInstance.stop();
        }
      } catch (err) {
        console.error("Error stopping scanner on close:", err);
      }
    }
    onOpenChange(false);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  };

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
          async (decodedText) => {
            if (html5QrCodeRef.current) {
              const scannerInstance = html5QrCodeRef.current;
              html5QrCodeRef.current = null;
              try {
                if (scannerInstance.isScanning) {
                  await scannerInstance.stop();
                }
              } catch (err) {
                console.error("Error stopping scanner on scan:", err);
              }
            }
            onScan(decodedText);
            onOpenChange(false);
          },
          () => {
            // QR code parse error (ignore - happens on every frame without a code)
          }
        );

        if (mounted) {
          setIsStarting(false);
          // Check if torch/flashlight is supported
          try {
            const capabilities = scanner.getRunningTrackCapabilities() as any;
            setIsTorchSupported(!!capabilities.torch);
          } catch (e) {
            console.warn("Torch capability check failed:", e);
          }
        }
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
      setIsTorchOn(false);
      setIsTorchSupported(false);
      if (html5QrCodeRef.current) {
        const scannerInstance = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        try {
          if (scannerInstance.isScanning) {
            scannerInstance.stop().catch(() => {});
          }
        } catch {
          // Ignore
        }
      }
    };
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
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

            {isTorchSupported && (
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 rounded-xl bg-black/60 border-0 hover:bg-black/80 text-white hover:text-white z-10 animate-fade-in"
                onClick={toggleTorch}
              >
                {isTorchOn ? (
                  <FlashlightOff className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Flashlight className="h-5 w-5" />
                )}
              </Button>
            )}

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
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
