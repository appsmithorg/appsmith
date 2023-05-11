import React from "react";
import { Spinner } from "design-system-old";
import {
  ContentWrapper,
  HighlighedCodeContainer,
  ProgressBar,
  ProgressContainer,
  SpinnerContainer,
} from "./styles";
import { ContentKind } from "./types";
import type { EditorProps } from "components/editorComponents/CodeEditor";

export default function CodeEditorFallback({
  input,
  onInteracted,
  placeholder,
  showLoadingProgress,
}: Pick<EditorProps, "input" | "placeholder"> & {
  onInteracted: () => void;
  showLoadingProgress: boolean;
}) {
  const parsedValue = parseInputValue();

  let contentKind: ContentKind;
  let fallbackToRender: string;
  if (!parsedValue) {
    contentKind = ContentKind.PLACEHOLDER;
    fallbackToRender = placeholder || "";
  } else if (typeof parsedValue === "string" && parsedValue.includes("{{")) {
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
    <ContentWrapper contentKind={contentKind}>
      {showLoadingProgress && (
        <ProgressContainer>
          <SpinnerContainer>
            <Spinner />
          </SpinnerContainer>
          <ProgressBar />
        </ProgressContainer>
      )}
      <HighlighedCodeContainer
        className="LazyCodeEditor"
        contentKind={contentKind}
        onFocus={onInteracted}
        onMouseEnter={onInteracted}
        tabIndex={0}
      >
        <pre>{fallbackToRender}</pre>
      </HighlighedCodeContainer>
    </ContentWrapper>
  );
}
