import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the localized name for a menu item or category
 * @param item - Object with name and optional nameHindi properties
 * @param lang - Language code ('en' | 'hi')
 * @returns The localized name string
 */
export const getLocalizedName = (item: any, lang: "en" | "hi"): string => {
  if (!item) return "";
  if (lang === "hi" && item.nameHindi) {
    return item.nameHindi;
  }
  return item.name || "";
};

/**
 * Get the localized text for any field (name, description, etc.)
 * @param obj - Object containing the field
 * @param field - Field name ('name' | 'description')
 * @param lang - Language code ('en' | 'hi')
 * @returns The localized text string
 */
export const getLocalizedText = (
  obj: any,
  field: "name" | "description",
  lang: "en" | "hi"
): string => {
  if (!obj) return "";
  if (lang === "hi") {
    const hindiField = `${field}Hindi`;
    return obj[hindiField] || obj[field] || "";
  }
  return obj[field] || "";
};
