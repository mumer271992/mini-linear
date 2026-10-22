// Returns the path only if it's a same-origin relative path, otherwise null.
// Anything that ends up in redirect() from user input (?next=, a fallback
// path) must go through this -- "https://evil.com" or "//evil.com" would send
// the user off-site right after a trusted first-party action. Backslashes are
// rejected too: browsers normalize "/\evil.com" to "//evil.com".
export function getSafeRedirectPath(path: unknown): string | null {
  if (typeof path !== "string") {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }

  return path;
}

// Search params arrive as string | string[] | undefined (a repeated key
// gives an array) -- take the first value, since these are single-valued.
export function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Builds a /login or /signup link that carries the return path and email
// across, so switching between the two pages doesn't lose either.
export function buildAuthHref(
  pathname: "/login" | "/signup",
  params: { next?: string | null; email?: string | null },
) {
  const searchParams = new URLSearchParams();
  if (params.next) searchParams.set("next", params.next);
  if (params.email) searchParams.set("email", params.email);

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
