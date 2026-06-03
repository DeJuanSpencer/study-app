"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import UploadZone from "./UploadZone";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (deckId: string) => void;
}

export default function UploadModal({
  open,
  onOpenChange,
  onComplete,
}: UploadModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!isProcessing) onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-[22px] font-semibold">
            Add new material
          </DialogTitle>
          <DialogDescription>
            Upload a file, paste text, or import a deck.
          </DialogDescription>
        </DialogHeader>
        <UploadZone
          compact
          onProcessingChange={setIsProcessing}
          onComplete={(id) => {
            onOpenChange(false);
            onComplete?.(id);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
