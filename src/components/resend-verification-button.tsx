"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/server/actions/auth";

type Status = { kind: "sent" } | { kind: "error"; message: string } | null;

interface ResendVerificationButtonProps {
  // Passed in by the page: the constant lives in a server-only module.
  cooldownMinutes: number;
}

export function ResendVerificationButton({ cooldownMinutes }: ResendVerificationButtonProps) {
  const [status, setStatus] = useState<Status>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleResend() {
    setStatus(null);
    setIsSending(true);

    try {
      const result = await resendVerificationEmail();
      setStatus("error" in result ? { kind: "error", message: result.error } : { kind: "sent" });
    } catch (error) {
      // Thrown errors have their text hidden in production -- show a
      // generic message instead.
      console.error(error);
      setStatus({ kind: "error", message: "Something went wrong. Please try again." });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" onClick={handleResend} isProcessing={isSending}>
        Resend email
      </Button>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        You can request a new email once every {cooldownMinutes} minutes.
      </p>
      {status?.kind === "sent" && (
        <p className="text-sm text-green-700 dark:text-green-500" role="status">
          Sent! Check your inbox for a new link.
        </p>
      )}
      {status?.kind === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {status.message}
        </p>
      )}
    </div>
  );
}
