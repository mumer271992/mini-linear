"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { generatePasswordHash, verifyPasswordHash } from "@/lib/auth";
import { createSession, deleteSession, verifySessionAllowUnverified } from "@/server/db/session";
import { createUserWithEmail, findUserByEmail, findUserById } from "@/server/db/user";
import { Prisma } from "@/generated/prisma/client";
import { getSafeRedirectPath } from "@/lib/redirect";
import { sendVerificationLink } from "@/lib/email-verification";

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  // Where to go after signing up (e.g. back to an invite). Validated here --
  // anything that isn't a same-origin path falls back to /dashboard.
  next?: string;
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

  // Sent after the response so a slow email provider never holds up signup
  // (after() still runs even though redirect() below throws). A failed send
  // mustn't fail signup either -- the account and session already exist,
  // and the verify-email page lets them request another link.
  const recipient = { id: user.id, name: user.name, email: user.email };
  after(async () => {
    try {
      await sendVerificationLink(recipient);
    } catch (error) {
      console.error(error);
    }
  });

  // Unverified users are bounced to /verify-email by verifySession, except on
  // the invite page, where accepting the invite verifies them instead.
  redirect(getSafeRedirectPath(formData.next) ?? "/dashboard");
}

interface LoginRequest {
  email: string;
  password: string;
  // Same as SignupRequest.next.
  next?: string;
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

  redirect(getSafeRedirectPath(formData.next) ?? "/dashboard");
}

export async function logout(fallbackPath?: string) {
  await deleteSession();

  // Only follow the caller-supplied path if it's same-origin -- see
  // getSafeRedirectPath for what that rules out.
  redirect(getSafeRedirectPath(fallbackPath) ?? "/");
}

type ResendVerificationResult = { error: string } | { success: true };

// No cooldown yet: a user can only ever email their own address, but they
// could still burn through the Resend quota -- add a rate limit if that
// becomes a concern.
export async function resendVerificationEmail(): Promise<ResendVerificationResult> {
  const session = await verifySessionAllowUnverified();

  if (session.isEmailVerified) {
    return { error: "Your email is already verified." };
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return { error: "Something went wrong. Please try again." };
  }

  try {
    await sendVerificationLink(user);
  } catch (error) {
    console.error(error);
    return { error: "Couldn't send the email. Please try again." };
  }

  return { success: true };
}
