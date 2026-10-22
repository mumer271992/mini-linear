"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createTask } from "@/server/actions/task";
import { TASK_STATUS_OPTIONS } from "@/lib/task";
import type { Task } from "@/generated/prisma/client";

const createTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

interface CreateTaskFormProps {
  orgSlug: string;
  projectSlug: string;
  members: { id: string; name: string }[];
  onCreated?: (task: Task) => void;
}

// createTask doesn't redirect (tasks live in a tab, not their own route), so
// unlike CreateProjectForm this reports success via a callback and resets
// itself instead of navigating away.
export function CreateTaskForm({ orgSlug, projectSlug, members, onCreated }: CreateTaskFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { status: "BACKLOG" },
  });

  const onSubmit = async (data: CreateTaskFormValues) => {
    setSubmitError(null);

    const result = await createTask(orgSlug, projectSlug, {
      title: data.title,
      description: data.description || undefined,
      assignedToId: data.assignedToId || undefined,
      status: data.status,
    });

    if ("error" in result) {
      setSubmitError(result.error);
      return;
    }

    reset();
    onCreated?.(result.task);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Create task</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        <TextField
          id="title"
          label="Title"
          type="text"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          id="description"
          label="Description"
          rows={4}
          error={errors.description?.message}
          {...register("description")}
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
          id="status"
          label="Status"
          error={errors.status?.message}
          {...register("status")}
        >
          {TASK_STATUS_OPTIONS.map((option) => (
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
          Create task
        </Button>
      </form>
    </div>
  );
}
