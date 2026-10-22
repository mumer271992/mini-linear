"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/server/actions/invite";

interface AcceptInviteButtonProps {
  token: string;
}

// acceptInvite redirects into the organization on success, so the only
// result that ever comes back here is an error -- e.g. the invite was
// revoked or expired between the page rendering and the click.
export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  async function handleAccept() {
    setError(null);
    setIsAccepting(true);

    const result = await acceptInvite(token);

    if (result?.error) {
      setError(result.error);
      setIsAccepting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" onClick={handleAccept} isProcessing={isAccepting}>
        Accept invite
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
