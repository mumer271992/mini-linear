"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateProject } from "@/server/actions/project";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  getTodayDateString,
  isTargetDateValid,
} from "@/lib/project";
import type { findProjectBySlug } from "@/server/db/project";

const editProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  summary: z.string().optional(),
  description: z.string().optional(),
  targetDate: z
    .string()
    .optional()
    .refine((value) => !value || isTargetDateValid(value), {
      message: "Target date cannot be in the past",
    }),
  assignedToId: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
  orgSlug: string;
  projectSlug: string;
  project: NonNullable<Awaited<ReturnType<typeof findProjectBySlug>>>;
  members: { id: string; name: string }[];
}

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

// Edit is a genuinely different flow from create, not a mode toggle on the
// same component: values are prefilled from the existing project, and only
// fields the user actually touches (react-hook-form's dirtyFields) get sent
// -- a real patch, not a full resubmission of everything.
export function EditProjectForm({
  orgSlug,
  projectSlug,
  project,
  members,
}: EditProjectFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      summary: project.summary ?? "",
      description: project.description ?? "",
      targetDate: toDateInputValue(project.targetDate),
      assignedToId: project.assignedToId ?? "",
      priority: project.priority,
      status: project.status,
    },
  });

  const onSubmit = async (data: EditProjectFormValues) => {
    setSubmitError(null);

    const patch: Parameters<typeof updateProject>[2] = {};
    if (dirtyFields.name) patch.name = data.name;
    if (dirtyFields.summary) patch.summary = data.summary || null;
    if (dirtyFields.description) patch.description = data.description || null;
    if (dirtyFields.targetDate) patch.targetDate = data.targetDate || null;
    if (dirtyFields.assignedToId) patch.assignedToId = data.assignedToId || null;
    if (dirtyFields.priority) patch.priority = data.priority;
    if (dirtyFields.status) patch.status = data.status;

    const result = await updateProject(orgSlug, projectSlug, patch);

    if (result?.error) {
      setSubmitError(result.error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
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
        min={getTodayDateString()}
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
        Save changes
      </Button>
    </form>
  );
}
