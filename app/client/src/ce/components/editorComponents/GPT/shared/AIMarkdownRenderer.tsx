import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styled from "styled-components";
import { Button, Tooltip } from "@appsmith/ads";

// ============================================================================
// Styled components for markdown content
// ============================================================================

const MarkdownWrapper = styled.div`
  font-size: 13px;
  line-height: 1.6;
  color: var(--ads-v2-color-fg);

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;
    line-height: 1.3;
    color: var(--ads-v2-color-fg);
  }

  h1 {
    font-size: 18px;
  }
  h2 {
    font-size: 16px;
  }
  h3 {
    font-size: 14px;
  }
  h4,
  h5,
  h6 {
    font-size: 13px;
  }

  p {
    margin: 0 0 12px 0;
  }

  ul,
  ol {
    margin: 0 0 12px 0;
    padding-left: 24px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  code {
    background: var(--ads-v2-color-bg-subtle);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 12px;
  }

  blockquote {
    margin: 0 0 12px 0;
    padding: 8px 16px;
    border-left: 3px solid var(--ads-v2-color-border-emphasis);
    background: var(--ads-v2-color-bg-subtle);
    color: var(--ads-v2-color-fg-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 12px 0;
    font-size: 12px;
  }

  th,
  td {
    padding: 6px 10px;
    border: 1px solid var(--ads-v2-color-border);
    text-align: left;
  }

  th {
    background: var(--ads-v2-color-bg-subtle);
    font-weight: 600;
  }

  hr {
    border: none;
    border-top: 1px solid var(--ads-v2-color-border);
    margin: 16px 0;
  }

  a {
    color: var(--ads-v2-color-fg-brand);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  > *:last-child {
    margin-bottom: 0;
  }
`;

// ============================================================================
// Code block styled components (internal to this renderer)
// ============================================================================

const CodeBlock = styled.div`
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--ads-v2-color-border);
`;

const CodeBlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--ads-v2-color-bg-subtle);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

const CodeBlockLanguage = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-muted);
  text-transform: uppercase;
`;

const CodeBlockActions = styled.div`
  display: flex;
  gap: 4px;
`;

const CodeBlockContent = styled.pre`
  margin: 0;
  padding: 12px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

// ============================================================================
// Code block component with copy button
// ============================================================================

interface CodeBlockWithCopyProps {
  language: string;
  code: string;
}

function CodeBlockWithCopy({ code, language }: CodeBlockWithCopyProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockLanguage>{language || "code"}</CodeBlockLanguage>
        <CodeBlockActions>
          <Tooltip content={copied ? "Copied!" : "Copy"} placement="top">
            <Button
              isIconButton
              kind="tertiary"
              onClick={() => void handleCopy()}
              size="sm"
              startIcon={copied ? "check-line" : "copy-control"}
            />
          </Tooltip>
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>
        <code>{code}</code>
      </CodeBlockContent>
    </CodeBlock>
  );
}

// ============================================================================
// Hoisted constants to avoid re-allocation on every render
// ============================================================================

const REMARK_PLUGINS = [remarkGfm];

const MARKDOWN_COMPONENTS = {
  // Unwrap <pre> so our custom code block renders directly
  pre({ children }: { children?: React.ReactNode }) {
    return (children ?? null) as React.ReactElement;
  },
  code({
    children,
    className,
    ...props
  }: { children?: React.ReactNode; className?: string } & Record<
    string,
    unknown
  >) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;

    if (isInline) {
      return <code {...props}>{children as React.ReactNode}</code>;
    }

    const codeString = String(children).replace(/\n$/, "");
    const language = match ? match[1] : "";

    return <CodeBlockWithCopy code={codeString} language={language} />;
  },
};

// ============================================================================
// Main component
// ============================================================================

interface AIMarkdownRendererProps {
  content: string;
}

export const AIMarkdownRenderer = React.memo(function AIMarkdownRenderer({
  content,
}: AIMarkdownRendererProps) {
  return (
    <MarkdownWrapper>
      <ReactMarkdown
        components={MARKDOWN_COMPONENTS}
        remarkPlugins={REMARK_PLUGINS}
      >
        {content}
      </ReactMarkdown>
    </MarkdownWrapper>
  );
});
