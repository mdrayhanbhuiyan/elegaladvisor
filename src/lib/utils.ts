import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility to strip HTML tags from a string
 */
export function stripHtml(html: any): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Utility to truncate text to a certain length
 */
export function truncateText(text: string, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
