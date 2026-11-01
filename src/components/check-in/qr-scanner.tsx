"use client";

import jsQR from "jsqr";
import { Camera, CameraOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onCodeDetected: (code: string) => void;
  isPaused: boolean;
}

type CameraState = "idle" | "starting" | "running" | "unavailable";

const SCAN_INTERVAL_MILLISECONDS = 150;

export function QrScanner({ onCodeDetected, isPaused }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPausedRef = useRef(isPaused);
  const onCodeDetectedRef = useRef(onCodeDetected);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
    onCodeDetectedRef.current = onCodeDetected;
  }, [isPaused, onCodeDetected]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraState("idle");
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (cameraState !== "running") return;
    const intervalId = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || isPausedRef.current || video.readyState < video.HAVE_ENOUGH_DATA) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
      if (qrCode?.data) {
        onCodeDetectedRef.current(qrCode.data);
      }
    }, SCAN_INTERVAL_MILLISECONDS);
    return () => window.clearInterval(intervalId);
  }, [cameraState]);

  async function startCamera() {
    setCameraError(null);
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("running");
    } catch {
      setCameraError("Não foi possível acessar a câmera. Verifique a permissão do navegador ou digite o código.");
      setCameraState("unavailable");
    }
  }

  const isCameraOn = cameraState === "running" || cameraState === "starting";

  return (
    <div className="grid gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-black sm:aspect-video">
        <video ref={videoRef} muted playsInline className={isCameraOn ? "size-full object-cover" : "hidden"} />
        {isCameraOn ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="size-2/3 max-h-64 max-w-64 rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/80">
            <Camera className="size-10" aria-hidden="true" />
            <p className="text-sm">Ligue a câmera e aponte para o QR Code do ticket.</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
      {isCameraOn ? (
        <Button type="button" variant="outline" onClick={stopCamera}>
          <CameraOff /> Desligar câmera
        </Button>
      ) : (
        <Button type="button" onClick={startCamera}>
          <Camera /> Ligar câmera
        </Button>
      )}
    </div>
  );
}
