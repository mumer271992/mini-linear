import { clsx, type ClassValue } from "clsx";

// clsx handles conditional/array/object class inputs, but doesn't dedupe
// conflicting Tailwind utilities — the last matching utility in the output
// wins only if it also comes later in the generated stylesheet.
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
