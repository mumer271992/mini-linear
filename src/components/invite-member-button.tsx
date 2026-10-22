"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { InviteMemberForm } from "@/components/invite-member-form";

interface InviteMemberButtonProps {
  orgSlug: string;
}

// Same close-always-refreshes wiring as AddTaskButton: every dismiss path
// plus a successful invite goes through handleClose.
export function InviteMemberButton({ orgSlug }: InviteMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  function handleClose() {
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        + New Member
      </button>

      {isOpen && (
        <Modal onClose={handleClose}>
          <InviteMemberForm orgSlug={orgSlug} onInvited={handleClose} />
        </Modal>
      )}
    </>
  );
}
