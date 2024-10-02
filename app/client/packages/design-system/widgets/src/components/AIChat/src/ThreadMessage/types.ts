export interface ThreadMessageProps {
  id: string;
  content: string;
  role: "assistant" | "user" | "system";
}
