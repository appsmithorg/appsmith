import React from "react";
import {
  ContentWrapper,
  HighlighedCodeContainer,
  ProgressBar,
  ProgressContainer,
  SpinnerContainer,
} from "./styles";
import { ContentKind } from "./types";
import type {
  EditorProps,
  EditorStyleProps,
} from "components/editorComponents/CodeEditor";
import { Spinner } from "@appsmith/ads";
import { JS_OBJECT_START_STATEMENT } from "plugins/Linting/constants";

export default function CodeEditorFallback({
  borderLess,
  height,
  input,
  isReadOnly,
  onInteracted,
  placeholder,
  showLineNumbers,
  showLoadingProgress,
}: Pick<
  EditorProps,
  "input" | "placeholder" | "showLineNumbers" | "isReadOnly"
> & {
  onInteracted: () => void;
  showLoadingProgress: boolean;
} & Pick<EditorStyleProps, "height" | "borderLess">) {
  const parsedValue = parseInputValue();

  let contentKind: ContentKind;
  let fallbackToRender: string;
  if (!parsedValue) {
    contentKind = ContentKind.PLACEHOLDER;
    fallbackToRender = placeholder || "";
  } else if (
    typeof parsedValue === "string" &&
    (parsedValue.includes("{{") ||
      parsedValue.startsWith(JS_OBJECT_START_STATEMENT))
  ) {
    contentKind = ContentKind.CODE;
    fallbackToRender = parsedValue;
  } else if (Array.isArray(parsedValue) || typeof parsedValue === "object") {
    contentKind = ContentKind.OBJECT;
    fallbackToRender = JSON.stringify(parsedValue, null, 2);
  } else {
    contentKind = ContentKind.PLAIN_TEXT;
    fallbackToRender = parsedValue;
  }

  function parseInputValue() {
    const value = input.value;
    try {
      if (value && typeof value === "string") return value;
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  return (
    <ContentWrapper
      borderLess={!!borderLess}
      contentKind={contentKind}
      height={height}
      showLineNumbers={showLineNumbers}
    >
      {showLoadingProgress && (
        <ProgressContainer>
          <SpinnerContainer>
            <Spinner size="md" />
          </SpinnerContainer>
          <ProgressBar />
        </ProgressContainer>
      )}
      <HighlighedCodeContainer
        className="LazyCodeEditor"
        contentKind={contentKind}
        isReadOnly={isReadOnly}
        onFocus={onInteracted}
        onMouseEnter={onInteracted}
        showLineNumbers={showLineNumbers}
        tabIndex={0}
      >
        <pre>{fallbackToRender}</pre>
      </HighlighedCodeContainer>
    </ContentWrapper>
  );
}
