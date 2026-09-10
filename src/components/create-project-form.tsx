"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createProject } from "@/server/actions/project";
import { PROJECT_PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/lib/project";

const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  summary: z.string().optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

interface CreateProjectFormProps {
  orgSlug: string;
  members: { id: string; name: string }[];
}

// No outer card/border -- the real page and the modal each provide their own
// wrapper, and stacking a card inside the modal's own card would double up.
export function CreateProjectForm({ orgSlug, members }: CreateProjectFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { priority: "MEDIUM", status: "BACKLOG" },
  });

  const onSubmit = async (data: CreateProjectFormValues) => {
    setSubmitError(null);

    const result = await createProject(orgSlug, {
      name: data.name,
      summary: data.summary || undefined,
      description: data.description || undefined,
      targetDate: data.targetDate || undefined,
      assignedToId: data.assignedToId || undefined,
      priority: data.priority,
      status: data.status,
    });

    if (result?.error) {
      setSubmitError(result.error);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Create project</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        <TextField
          id="name"
          label="Name"
          type="text"
          error={errors.name?.message}
          {...register("name")}
        />

        <TextField
          id="summary"
          label="Summary"
          type="text"
          error={errors.summary?.message}
          {...register("summary")}
        />

        <Textarea
          id="description"
          label="Description"
          rows={4}
          error={errors.description?.message}
          {...register("description")}
        />

        <TextField
          id="targetDate"
          label="Target date"
          type="date"
          error={errors.targetDate?.message}
          {...register("targetDate")}
        />

        <Select
          id="assignedToId"
          label="Assignee"
          error={errors.assignedToId?.message}
          {...register("assignedToId")}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>

        <Select
          id="priority"
          label="Priority"
          error={errors.priority?.message}
          {...register("priority")}
        >
          {PROJECT_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          id="status"
          label="Status"
          error={errors.status?.message}
          {...register("status")}
        >
          {PROJECT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {submitError && (
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <Button type="submit" isProcessing={isSubmitting} className="mt-2">
          Create project
        </Button>
      </form>
    </div>
  );
}
