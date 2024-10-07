import type { HTMLProps } from "react";

export interface ThreadMessageProps extends HTMLProps<HTMLLIElement> {
  content: string;
  isAssistant: boolean;
  username: string;
}
