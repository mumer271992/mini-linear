"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { inviteMember } from "@/server/actions/invite";

const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email address"),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

interface InviteMemberFormProps {
  orgSlug: string;
  onInvited?: () => void;
}

export function InviteMemberForm({ orgSlug, onInvited }: InviteMemberFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
  });

  const onSubmit = async (data: InviteMemberFormValues) => {
    setSubmitError(null);

    const result = await inviteMember(orgSlug, { email: data.email });

    if ("error" in result) {
      setSubmitError(result.error);
      return;
    }

    reset();
    onInvited?.();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Invite member</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register("email")}
          />
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            They&apos;ll get an email with a link to join, and will join with the Member role.
          </p>
        </div>

        {submitError && (
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <Button type="submit" isProcessing={isSubmitting} className="mt-2">
          Send invite
        </Button>
      </form>
    </div>
  );
}
