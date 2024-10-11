import type { HTMLProps } from "react";
import type { Options } from "react-markdown";

export interface MarkdownProps extends HTMLProps<HTMLDivElement> {
  /** The markdown content to render */
  children: string;
  /** Options for react-markdown */
  options?: Options;
}
