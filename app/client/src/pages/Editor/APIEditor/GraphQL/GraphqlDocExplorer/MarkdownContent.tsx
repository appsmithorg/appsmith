import React from "react";
import Markdown from "markdown-it";
import { MarkdownContentWrapper } from "./css";

type MarkdownContentProps = {
  description: string;
  type: "description" | "deprecation";
};

export default class MarkdownContent {
  static md = new Markdown({
    breaks: true,
    linkify: true,
  });

  static render(props: MarkdownContentProps) {
    return props.type === "description" ? (
      <MarkdownContentWrapper
        dangerouslySetInnerHTML={{ __html: this.md.render(props.description) }}
      />
    ) : (
      <MarkdownContentWrapper
        dangerouslySetInnerHTML={{ __html: this.md.render(props.description) }}
      />
    );
  }
}
