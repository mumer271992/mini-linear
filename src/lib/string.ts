export function normalizeString(value: string) {
  return value.trim().toLowerCase();
}

export function slugify(value: string) {
  return normalizeString(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
