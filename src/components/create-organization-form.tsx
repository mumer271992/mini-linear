"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/ui/text-field";
import { slugify } from "@/lib/string";

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
});

type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>;

export function CreateOrganizationForm() {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
  });

  const onSubmit = async (data: CreateOrganizationFormValues) => {
    setSubmitError(null);
    // TODO: wire up a createOrganization server action
    console.log("create organization", data);
  };

  return (
    <div className="w-full max-w-sm rounded-lg border border-black/[.08] p-8 dark:border-white/[.145]">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create organization
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Set up your organization to get started.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <TextField
          id="name"
          label="Name"
          type="text"
          error={errors.name?.message}
          {...register("name", {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              if (!slugManuallyEdited) {
                setValue("slug", slugify(event.target.value), {
                  shouldValidate: true,
                });
              }
            },
          })}
        />

        <TextField
          id="slug"
          label="Slug"
          type="text"
          error={errors.slug?.message}
          {...register("slug", {
            onChange: () => setSlugManuallyEdited(true),
          })}
        />

        {submitError && (
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isSubmitting ? "Creating..." : "Create organization"}
        </button>
      </form>
    </div>
  );
}
