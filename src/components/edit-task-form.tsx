"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateTask } from "@/server/actions/task";
import { TASK_STATUS_OPTIONS } from "@/lib/task";
import type { Task } from "@/generated/prisma/client";

const editTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]),
});

type EditTaskFormValues = z.infer<typeof editTaskSchema>;

interface EditTaskFormProps {
  orgSlug: string;
  projectSlug: string;
  task: Task;
  members: { id: string; name: string }[];
  onUpdated?: (task: Task) => void;
}

// Same dirtyFields patch pattern as EditProjectForm, and same no-redirect
// result handling as CreateTaskForm -- only the fields the user actually
// touched get sent, and the caller finds out via a callback since there's
// no route to redirect to.
export function EditTaskForm({
  orgSlug,
  projectSlug,
  task,
  members,
  onUpdated,
}: EditTaskFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      assignedToId: task.assignedToId ?? "",
      status: task.status,
    },
  });

  const onSubmit = async (data: EditTaskFormValues) => {
    setSubmitError(null);

    const patch: Parameters<typeof updateTask>[3] = {};
    if (dirtyFields.title) patch.title = data.title;
    if (dirtyFields.description) patch.description = data.description || null;
    if (dirtyFields.assignedToId) patch.assignedToId = data.assignedToId || null;
    if (dirtyFields.status) patch.status = data.status;

    const result = await updateTask(orgSlug, projectSlug, task.id, patch);

    if ("error" in result) {
      setSubmitError(result.error);
      return;
    }

    onUpdated?.(result.task);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Edit task</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
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

        <Select id="status" label="Status" error={errors.status?.message} {...register("status")}>
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
          Save changes
        </Button>
      </form>
    </div>
  );
}
