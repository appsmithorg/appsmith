export interface ChatMessage {
  id: string;
  content: string;
  isAssistant: boolean;
}

export interface AIChatProps {
  thread: ChatMessage[];
  prompt: string;
  username: string;
  promptInputPlaceholder?: string;
  chatTitle?: string;
  chatDescription?: string;
  assistantName?: string;
  isWaitingForResponse?: boolean;
  onPromptChange: (prompt: string) => void;
  onSubmit?: () => void;
}
