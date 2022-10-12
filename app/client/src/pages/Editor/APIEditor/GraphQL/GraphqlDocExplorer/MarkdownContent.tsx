import React from "react";
import Markdown from "markdown-it";

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
    return (
      <div
        className={`graphiql-markdown-${props.type}`}
        dangerouslySetInnerHTML={{ __html: this.md.render(props.description) }}
      />
    );
  }
}
