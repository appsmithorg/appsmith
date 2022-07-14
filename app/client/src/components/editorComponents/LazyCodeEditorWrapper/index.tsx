import React, { useState, useEffect } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import { duotoneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ascetic } from "react-syntax-highlighter/dist/cjs/styles/hljs";

import Editor from "components/editorComponents/CodeEditor";

import {
  ContentWrapper,
  HighlighedCodeContainer,
  LazyEditorWrapper,
  NoCodeText,
  ReadOnlyInput,
} from "./index.layout";

SyntaxHighlighter.registerLanguage("javascript", js);

/**
 * Shimming request idle callback as it is not avaialble in Safari browser.
 * If unavailable, then use a timeout to process callback on a separate thread.
 */
(window as any).requestIdleCallback =
  (window as any).requestIdleCallback ||
  function(
    cb: (arg0: { didTimeout: boolean; timeRemaining: () => number }) => void,
  ) {
    const start = Date.now();
    return setTimeout(function() {
      cb({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

(window as any).cancelIdleCallback =
  (window as any).cancelIdleCallback ||
  function(id: number) {
    clearTimeout(id);
  };

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
  const [containsCode, setContainsCode] = useState<boolean>(false);
  const [containsObject, setContainsObject] = useState<boolean>(false);
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  let handle: number;
  const handleFocus = (): void => {
    (window as any).cancelIdleCallback(handle);
    setEditorVisibility(true);
  };

  useEffect(() => {
    // Check if input value contains code
    const str: string = getText();
    if (str && typeof str === "string" && str?.indexOf("{{") > -1)
      setContainsCode(true);
    if (Array.isArray(str) || typeof str === "object") {
      setText(JSON.stringify(str, null, 2));
      setContainsCode(true);
      setContainsObject(true);
      return;
    }
    setText(str.toString());
  }, [props?.input?.value, props?.placeholder]);

  const getText = (): string => {
    const str = props?.input?.value;
    try {
      return JSON.parse(str);
    } catch (e) {
      if (!str) {
        setIsPlaceholder(true);
        return props?.placeholder || "";
      }
      return str;
    }
  };

  const highlightedText = () => {
    if (!containsCode || isPlaceholder) {
      return <NoCodeText isPlaceholder={isPlaceholder}>{text}</NoCodeText>;
    }
    return (
      <SyntaxHighlighter
        language="javascript"
        style={containsObject ? ascetic : duotoneLight}
        wrapLongLines
      >
        {text}
      </SyntaxHighlighter>
    );
  };

  useEffect(() => {
    function lazyLoadEditor() {
      handle = (window as any).requestIdleCallback(
        () => setEditorVisibility(true),
        {
          // if callback hasn't executed in 1500 ms, then trigger it urgently
          timeout: 1500,
        },
      );
    }
    lazyLoadEditor();
  }, []);

  return showEditor ? (
    <Editor {...props} />
  ) : (
    <LazyEditorWrapper>
      <ContentWrapper containsCode={containsCode} isPlaceholder={isPlaceholder}>
        <ReadOnlyInput
          className="t--code-editor-wrapper unfocused-code-editor"
          data-testid="lazy-code-editor"
          onFocus={handleFocus}
          placeholder={""}
          readOnly
          type="text"
          value={""}
        />
        <HighlighedCodeContainer
          containsCode={containsCode}
          containsObject={containsObject}
        >
          {highlightedText()}
        </HighlighedCodeContainer>
      </ContentWrapper>
    </LazyEditorWrapper>
  );
}

export default CodeEditor;
