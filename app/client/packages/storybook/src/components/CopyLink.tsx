import * as React from "react";
import { useState } from "react";
import styled from "styled-components";

export const StyledCopyLink = styled.a`
  position: relative;
  color: var(--color-fg-accent);
  display: inline-block;

  &:hover {
    color: var(--color-fg-accent);
  }

  &[data-hint="true"]:after {
    content: "copied";
    position: absolute;
    right: calc(-1 * var(--sizing-13));
    color: var(--color-fg-positive);
  }
`;

export const CopyLink = ({ value }: { value: string }) => {
  const [isHintVisible, setIsHintVisible] = useState(false);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setIsHintVisible(true);
    setTimeout(() => {
      setIsHintVisible(false);
    }, 500);
  };

  return (
    <StyledCopyLink
      data-hint={isHintVisible}
      onClick={() => copyToClipboard(value)}
    >
      {value}
    </StyledCopyLink>
  );
};
