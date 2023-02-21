import React, { useState, useEffect, useRef } from "react";

import Editor from "components/editorComponents/CodeEditor";

import {
  ContentWrapper,
  HighlighedCodeContainer,
  LazyEditorWrapper,
} from "./index.layout";
import { REQUEST_IDLE_CALLBACK_TIMEOUT } from "constants/AppConstants";

/**
 * A wrapper to lazily render CodeEditor component.
 * Need: CodeMirror is a performance intensive component to render.
 * Many widgets have multiple properties that require a CodeEditor component to be rendered.
 * Solution: 1. Lazy load the CodeEditor component when the system is idle.
 * 2. Render a similar looking replica component initially.
 * 3. If there isn't enough idle time to render the CodeEditor component,
 * then render it immediately upon focus event.
 */
function CodeEditor(props: any) {
  const [showEditor, setEditorVisibility] = useState<boolean>(false);
  const [isFocused, setEditorFocused] = useState<boolean>(false);
  const [containsCode, setContainsCode] = useState<boolean>(false);
  const [containsObject, setContainsObject] = useState<boolean>(false);
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  let handle: number;
  const handleFocus = (): void => {
    (window as any).cancelIdleCallback(handle);
    setEditorFocused(true);
    setEditorVisibility(true);
  };

  useEffect(() => {
    if (showEditor && isFocused && wrapperRef.current) {
      const editor = wrapperRef.current.querySelector(
        ".CodeEditorTarget",
      ) as HTMLElement | null;
      if (editor) {
        editor.focus();
      }
    }
  }, [isFocused, showEditor, wrapperRef.current]);

  useEffect(() => {
    // Check if input value contains code
    let str: string = getText();
    if (str && typeof str === "string" && str?.indexOf("{{") > -1)
      setContainsCode(true);
    if (Array.isArray(str) || typeof str === "object") {
      setText(JSON.stringify(str, null, 2));
      setContainsCode(true);
      setContainsObject(true);
      return;
    }
    if (!str) {
      str = props?.placeholder || "";
      setIsPlaceholder(true);
    }
    setText(str.toString());
  }, [props?.input?.value, props?.placeholder]);

  const getText = (): string => {
    const str = props?.input?.value;
    try {
      if (str && typeof str === "string") return str;
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  };

  useEffect(() => {
    function lazyLoadEditor() {
      handle = (window as any).requestIdleCallback(
        () => setEditorVisibility(true),
        {
          timeout: REQUEST_IDLE_CALLBACK_TIMEOUT.highPriority,
        },
      );
    }
    lazyLoadEditor();
    return () => handle && (window as any).cancelIdleCallback(handle);
  }, [isFocused]);

  return (
    <LazyEditorWrapper ref={wrapperRef}>
      {showEditor ? (
        <Editor {...props} />
      ) : (
        <ContentWrapper
          containsCode={containsCode}
          isPlaceholder={isPlaceholder}
        >
          <HighlighedCodeContainer
            className={"LazyCodeEditor"}
            containsCode={containsCode}
            containsObject={containsObject}
            isPlaceholder={isPlaceholder}
            onFocus={handleFocus}
            onMouseEnter={handleFocus}
            tabIndex={0}
          >
            <pre>{text}</pre>
          </HighlighedCodeContainer>
        </ContentWrapper>
      )}
    </LazyEditorWrapper>
  );
}

export default CodeEditor;
