import React from "react";
import styled from "styled-components";
import { Button } from "../../Button";
import { toast } from "../../Toast";

interface CodeBlockProps {
  code?: string;
}

function CodeBlock({ code }: CodeBlockProps) {
  return (
    <Wrapper
      onClick={() => {
        code && navigator.clipboard.writeText(code.toString());
        toast.show("Copied to clipboard", { kind: "success" });
      }}
    >
      <Code>{code}</Code>
      <Button isIconButton kind="tertiary" startIcon="copy-control" />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 4px;
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-colors-content-surface-hover-bg);
  width: fit-content;
`;

const Code = styled.div`
  font-size: 14px;
  font-family: var(--ads-v2-font-family-code);
  white-space: pre-wrap;
`;

export { CodeBlock };
