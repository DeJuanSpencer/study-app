"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TestYourselfModalProps {
  concept: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TestYourselfModal({
  concept,
  open,
  onOpenChange,
}: TestYourselfModalProps) {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setResponse("");
      setSubmitted(false);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle
                className="flex items-center gap-2.5"
                style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600 }}
              >
                <span style={{ fontSize: 22 }}>✍️</span>
                Quick self-check
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed" style={{ marginTop: 4 }}>
                Without looking back, explain{" "}
                <strong className="text-foreground">{concept}</strong> in your
                own words. Even a few sentences helps.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write what you remember..."
              className="min-h-[120px] mt-2 resize-y"
              style={{ fontSize: 14, lineHeight: 1.7 }}
            />
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="text-muted-foreground"
              >
                Skip
              </Button>
              <Button
                onClick={() => setSubmitted(true)}
                disabled={!response.trim()}
              >
                Check my understanding
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-5">
            <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
            <h3
              className="text-foreground mb-2"
              style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600 }}
            >
              Nice work!
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 mx-auto max-w-[400px]">
              The act of recalling — even imperfectly — just strengthened your
              memory of this concept. For a full AI evaluation, try{" "}
              <strong className="text-foreground">Explain Mode</strong> from the
              Study Hub.
            </p>
            <Button onClick={() => handleOpenChange(false)}>Got it</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
