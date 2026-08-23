"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/server/db/session";
import {
  createOrganizationWithOwner,
  findOrganizationBySlug,
} from "@/server/db/organization";
import { Prisma } from "@/generated/prisma/client";

interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

interface CreateOrganizationResult {
  error: string;
}

export async function createOrganization(
  formData: CreateOrganizationRequest,
): Promise<CreateOrganizationResult> {
  const session = await verifySession();

  const name = formData.name?.trim();
  const slug = formData.slug?.trim().toLowerCase();

  if (!name || name.length < 2) {
    return { error: "Organization name must be at least 2 characters." };
  }

  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return {
      error: "Slug can only contain lowercase letters, numbers, and hyphens.",
    };
  }

  const existingOrganization = await findOrganizationBySlug(slug);
  if (existingOrganization) {
    return { error: "An organization with this slug already exists." };
  }

  let organization;
  try {
    organization = await createOrganizationWithOwner({
      name,
      slug,
      ownerId: session.userId,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Two concurrent submissions for the same slug both passed the check
      // above; the DB's unique constraint is the real guard here.
      return { error: "An organization with this slug already exists." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/dashboard/${organization.slug}`);
}
