"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/string";
import { createOrganization } from "@/server/actions/organization";

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

    const result = await createOrganization({
      name: data.name,
      slug: data.slug,
    });

    if (result?.error) {
      setSubmitError(result.error);
    }
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

        <Button type="submit" isProcessing={isSubmitting} className="mt-2">
          Create organization
        </Button>
      </form>
    </div>
  );
}
