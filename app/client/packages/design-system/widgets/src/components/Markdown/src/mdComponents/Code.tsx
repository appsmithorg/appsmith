import type { ExtraProps } from "react-markdown";
import { Button, Flex, Text } from "@appsmith/wds";
import React, { useState, useCallback } from "react";
import { useThemeContext } from "@appsmith/wds-theming";
import {
  atomOneDark as darkTheme,
  atomOneLight as lightTheme,
} from "react-syntax-highlighter/dist/cjs/styles/hljs";
import SyntaxHighlighter from "react-syntax-highlighter";

type CodeProps = React.ClassAttributes<HTMLElement> &
  React.HTMLAttributes<HTMLElement> &
  ExtraProps;

export const Code = (props: CodeProps) => {
  const { children, className } = props;
  const match = /language-(\w+)/.exec(className ?? "");
  const theme = useThemeContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(String(children)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return match ? (
    <div data-component="code">
      <Flex
        alignItems="center"
        justifyContent="space-between"
        padding="spacing-1"
      >
        <Text size="caption">{match[1]}</Text>
        <Button icon="copy" onPress={handleCopy} size="small" variant="ghost">
          {copied ? "Copied!" : "Copy"}
        </Button>
      </Flex>
      <SyntaxHighlighter
        PreTag="div"
        customStyle={{
          backgroundColor: "var(--color-bg-neutral-subtle)",
        }}
        language={match[1]}
        style={theme.colorMode === "dark" ? darkTheme : lightTheme}
        useInlineStyles
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={className}>{children}</code>
  );
};

export { Code as code };
