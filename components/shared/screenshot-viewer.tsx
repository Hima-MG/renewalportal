"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Minus, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type ScreenshotViewerProps = {
  src: string | null;
  alt: string;
  fileName?: string;
  onClose: () => void;
};

export function ScreenshotViewer({
  src,
  alt,
  fileName,
  onClose,
}: ScreenshotViewerProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!src) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function handleClose() {
    resetView();
    onClose();
  }

  function zoomIn() {
    setScale((s) => Math.min(MAX_SCALE, s + 0.5));
  }

  function zoomOut() {
    setScale((s) => {
      const next = Math.max(MIN_SCALE, s - 0.5);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (scale === 1) return;
    setDragging(true);
    setDragStart({ x: event.clientX - offset.x, y: event.clientY - offset.y });
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!dragging) return;
    setOffset({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  }

  function handlePointerUp() {
    setDragging(false);
  }

  async function handleDownload() {
    if (!src) return;
    setDownloading(true);
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("Download failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName ?? "payment-screenshot.jpg";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the screenshot. Check your connection.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-100 flex flex-col bg-black/90 duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot preview"
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={zoomOut}
            disabled={scale === MIN_SCALE}
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={zoomIn}
            disabled={scale === MAX_SCALE}
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={resetView}
            aria-label="Reset zoom"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="size-4" />
            {downloading ? "Downloading..." : "Download"}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className="relative flex-1 touch-none overflow-hidden select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 150ms ease-out",
          }}
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            unoptimized
            draggable={false}
            className="max-h-[80vh] w-auto max-w-[90vw] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
