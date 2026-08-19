"use server";

import { redirect } from "next/navigation";
import { generatePasswordHash } from "@/lib/auth";
import { createSession } from "@/server/db/session";
import { createUserWithEmail, findUserByEmail } from "@/server/db/user";
import { Prisma } from "@/generated/prisma/client";

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface SignupResult {
  error: string;
}

export default async function signup(
  formData: SignupRequest,
): Promise<SignupResult> {
  const name = formData.name;
  const email = formData.email;
  const password = formData.password;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const isExistingUser = await findUserByEmail(email);
  if (isExistingUser) {
    return { error: "An account with this email already exists." };
  }

  let user;
  try {
    const passwordHash = await generatePasswordHash(password);

    user = await createUserWithEmail({
      name: name,
      email: email,
      passwordHash: passwordHash,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Two concurrent signups for the same email both passed the check above;
      // the DB's unique constraint is the real guard here.
      return { error: "An account with this email already exists." };
    }

    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }

  await createSession(user.id);

  redirect("/dashboard");
}
