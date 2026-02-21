import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge
 * for deduplication of conflicting utility classes.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-primary text-white", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
