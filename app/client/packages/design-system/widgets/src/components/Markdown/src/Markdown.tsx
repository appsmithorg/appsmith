import React from "react";
import { clsx } from "clsx";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { getTypographyClassName } from "@appsmith/wds-theming";

import styles from "./styles.module.css";
import { components } from "./components";
import type { MarkdownProps } from "./types";

export const Markdown = (props: MarkdownProps) => {
  const { children, className, options, ...rest } = props;

  return (
    <div
      className={clsx(
        styles.markdown,
        getTypographyClassName("body"),
        className,
      )}
      {...rest}
    >
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        {...options}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
