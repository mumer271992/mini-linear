"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { revokeMembership } from "@/server/actions/member";

interface RevokeMemberButtonProps {
  orgSlug: string;
  membershipId: string;
  memberName: string;
}

// Same confirm → action → refresh flow as deleting a task in TaskList. On
// success the row disappears with the refresh, so isRevoking is only reset
// on error -- both returned errors and thrown ones (e.g. the caller lost
// their own membership or permission since the page loaded).
export function RevokeMemberButton({ orgSlug, membershipId, memberName }: RevokeMemberButtonProps) {
  const [isRevoking, setIsRevoking] = useState(false);
  const router = useRouter();

  async function handleRevoke() {
    if (!window.confirm(`Remove ${memberName} from this organization?`)) {
      return;
    }

    setIsRevoking(true);

    let result: Awaited<ReturnType<typeof revokeMembership>>;
    try {
      result = await revokeMembership(orgSlug, membershipId);
    } catch {
      setIsRevoking(false);
      toast.error("Couldn't remove this member. Refresh the page and try again.");
      return;
    }

    if (result?.error) {
      setIsRevoking(false);
      toast.error(result.error);
      return;
    }

    router.refresh();
  }

  // Tooltip and aria-label live together here so the two can't drift apart.
  return (
    <Tooltip label="Revoke access" side="left">
      <button
        type="button"
        onClick={handleRevoke}
        disabled={isRevoking}
        aria-label={`Revoke access for ${memberName}`}
        className="cursor-pointer text-zinc-500 hover:text-red-600 disabled:cursor-not-allowed"
      >
        {isRevoking ? <Spinner /> : <TrashIcon className="h-4 w-4" />}
      </button>
    </Tooltip>
  );
}
