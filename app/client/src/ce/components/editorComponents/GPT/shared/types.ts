export interface QuickAction {
  label: string;
  icon: string;
  prompt: string;
}

export interface CodeBlockPart {
  type: "text" | "code";
  content: string;
  language?: string;
}
