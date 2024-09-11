import React from "react";
import styled from "styled-components";
import { escapeRegExp } from "lodash";

const TextHighlighter = styled.mark`
  color: var(--ads-highlight-text-default-text-color);
  background-color: var(--ads-highlight-text-default-background-color);
`;

export type HighlightTextProps = {
  highlight: string;
  text: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export function HighlightText(props: HighlightTextProps) {
  const { highlight = "", text = "", ...rest } = props;
  if (!highlight.trim()) {
    return (
      <span data-testid="t--no-highlight" {...rest}>
        {text}
      </span>
    );
  }
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
  const parts: string[] = text.split(regex);

  return (
    <span className="search-highlight" {...rest}>
      {parts.filter(String).map((part, i) => {
        return regex.test(part) ? (
          <TextHighlighter data-testid="t--highlighted-text" key={i}>
            {part}
          </TextHighlighter>
        ) : (
          <span data-testid="t--non-highlighted-text" key={i}>
            {part}
          </span>
        );
      })}
    </span>
  );
}
