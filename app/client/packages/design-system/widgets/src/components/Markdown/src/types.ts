import type { Options } from "react-markdown";

export interface MarkdownProps {
  /** The markdown content to render */
  children: string;
  /** Options for react-markdown */
  options?: Options;
  /** Additional CSS classes to apply to the component */
  className?: string;
}
