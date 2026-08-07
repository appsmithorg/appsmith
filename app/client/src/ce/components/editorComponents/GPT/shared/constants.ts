import type { QuickAction } from "./types";

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Explain",
    icon: "question-line",
    prompt: "Explain what this code does step by step",
  },
  {
    label: "Fix Errors",
    icon: "bug-line",
    prompt: "Find and fix any bugs or errors in this code",
  },
  {
    label: "Refactor",
    icon: "magic-line",
    prompt: "Refactor this code to be cleaner and more efficient",
  },
  {
    label: "Add Comments",
    icon: "pencil-line",
    prompt: "Add helpful comments to explain this code",
  },
];
