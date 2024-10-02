export interface Message {
  id: string;
  content: string;
  role: "assistant" | "user" | "system";
}

export interface AIChatProps {
  thread: Message[];
  prompt: string;
  promptInputPlaceholder?: string;
  title?: string;
  description?: string;
  assistantName?: string;
  isWaitingForResponse?: boolean;
  onPromptChange: (prompt: string) => void;
  onSubmit?: () => void;
}
