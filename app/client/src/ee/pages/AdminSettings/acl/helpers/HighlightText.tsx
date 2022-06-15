import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const TextHighlighter = styled.mark`
  background: ${Colors.FOCUS};
`;

export function HighlightText(props: any) {
  const { highlight = "", text = "" } = props;
  if (!highlight.trim()) {
    return <span data-testid="t--no-highlight">{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts: string[] = text.split(regex);

  return (
    <span>
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
