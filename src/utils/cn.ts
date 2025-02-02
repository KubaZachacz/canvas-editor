import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export const twMergeConfig = {
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-large", "display", "body", "button"] }],
    },
  },
};

export const twMerge = extendTailwindMerge(twMergeConfig);

/** Merge classes with tailwind-merge with clsx full feature */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
