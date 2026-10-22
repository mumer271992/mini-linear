"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { CreateTaskForm } from "@/components/create-task-form";

interface AddTaskButtonProps {
  orgSlug: string;
  projectSlug: string;
  members: { id: string; name: string }[];
}

export function AddTaskButton({ orgSlug, projectSlug, members }: AddTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Modal's onClose already covers every dismiss path (Escape, backdrop,
  // close button) plus the form's own onCreated -- routing all of them
  // through here means a single close always refreshes the list, whether or
  // not a task actually got created.
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
        + Add Task
      </button>

      {isOpen && (
        <Modal onClose={handleClose}>
          <CreateTaskForm
            orgSlug={orgSlug}
            projectSlug={projectSlug}
            members={members}
            onCreated={handleClose}
          />
        </Modal>
      )}
    </>
  );
}
