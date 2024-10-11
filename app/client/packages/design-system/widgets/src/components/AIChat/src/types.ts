export interface ChatMessage {
  id: string;
  content: string;
  isAssistant: boolean;
  promptSuggestions?: string[];
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
  onApplyAssistantSuggestion?: (suggestion: string) => void;
}
