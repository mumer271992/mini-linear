"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { CreateProjectForm } from "@/components/create-project-form";

interface CreateProjectModalProps {
  orgSlug: string;
  members: { id: string; name: string }[];
}

export function CreateProjectModal({ orgSlug, members }: CreateProjectModalProps) {
  const router = useRouter();

  return (
    <Modal onClose={() => router.push(`/dashboard/${orgSlug}/projects`)}>
      <CreateProjectForm orgSlug={orgSlug} members={members} />
    </Modal>
  );
}
