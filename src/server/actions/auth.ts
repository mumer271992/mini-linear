"use server";

import { redirect } from "next/navigation";
import { generatePasswordHash, verifyPasswordHash } from "@/lib/auth";
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

export async function signup(formData: SignupRequest): Promise<SignupResult> {
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

  redirect("/onboarding");
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResult {
  error: string;
}

export async function login(formData: LoginRequest): Promise<LoginResult> {
  const email = formData.email;
  const password = formData.password;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await findUserByEmail(email);

  // Same generic message whether the email doesn't exist, the password is
  // wrong, or the account has no password set (e.g. an OAuth-only user) --
  // never reveal which case it was, that lets an attacker enumerate emails.
  if (!user || !user.passwordHash) {
    return { error: "Invalid email or password." };
  }

  const isValidPassword = await verifyPasswordHash(password, user.passwordHash);
  if (!isValidPassword) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);

  redirect("/dashboard");
}
