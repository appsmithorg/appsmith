import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import {
  atomOneDark as darkTheme,
  lightfair as lightTheme,
} from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { getTypographyClassName, useThemeContext } from "@appsmith/wds-theming";

export const CodeBlock = (props: SyntaxHighlighterProps) => {
  const theme = useThemeContext();

  return (
    <SyntaxHighlighter
      className={getTypographyClassName("body") + " wds-codeblock"}
      {...props}
      style={theme.colorMode === "dark" ? darkTheme : lightTheme}
      useInlineStyles
    >
      {props.children}
    </SyntaxHighlighter>
  );
};
