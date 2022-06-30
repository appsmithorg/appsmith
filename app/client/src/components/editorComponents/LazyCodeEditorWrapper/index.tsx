import React, { useState, useEffect } from "react";
import { isEmpty, get } from "lodash";
import { useSelector } from "react-redux";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import { duotoneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ascetic } from "react-syntax-highlighter/dist/esm/styles/hljs";

import Editor from "components/editorComponents/CodeEditor";
import { EditorWrapper } from "../CodeEditor/styledComponents";
import { replayHighlightClass } from "globalStyles/portals";
import {
  EvaluationError,
  getEvalErrorPath,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { AppState } from "reducers";
import { IconSize } from "components/ads";
import {
  ContentWrapper,
  HighlighedCodeContainer,
  IconWrapper,
  LazyEditorWrapper,
  LintErrorContainer,
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
  const [lintError, setLintError] = useState<string>("");
  const [showLintError, setShowLintError] = useState<boolean>(false);
  const [containsCode, setContainsCode] = useState<boolean>(false);
  const [containsObject, setContainsObject] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const dynamicData = useSelector((state: AppState) => state.evaluations.tree);
  let handle: number;
  const handleFocus = (): void => {
    (window as any).cancelIdleCallback(handle);
    setEditorVisibility(true);
  };

  useEffect(() => {
    const getPropertyValidation = (
      dynamicData: any,
      dataTreePath?: string,
    ): void => {
      if (!dataTreePath) {
        return;
      }

      const errors = get(
        dynamicData,
        getEvalErrorPath(dataTreePath),
        [],
      ) as EvaluationError[];

      const lintErrors = errors.filter(
        (error) => error.errorType === PropertyEvaluationErrorType.LINT,
      );

      if (!isEmpty(lintErrors)) {
        !lintError && setLintError(lintErrors[0].errorMessage);
      } else {
        lintError && setLintError("");
      }
    };
    getPropertyValidation(dynamicData, props?.dataTreePath);
  }, [dynamicData, props.dataTreePath]);

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
    // If !inputValue; then use placeholder
    if (!str?.toString()?.length) str = props?.placeholder || "";
    setText(str);
  }, [props?.input?.value, props?.placeholder]);

  const getText = (): string => {
    try {
      return JSON.parse(props?.input?.value);
    } catch (e) {
      return props?.input?.value || "";
    }
  };

  const highlightedText = () => {
    if (!containsCode) {
      return <NoCodeText>{text}</NoCodeText>;
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

  const toggleLintErrorVisibility = (flag: boolean) => () =>
    setShowLintError(flag);

  return showEditor ? (
    <Editor {...props} />
  ) : (
    <LazyEditorWrapper>
      <ContentWrapper containsCode={containsCode}>
        <EditorWrapper
          border={props.border}
          borderLess={props.borderLess}
          className={`${props.className} ${replayHighlightClass} ${
            lintError ? "t--codemirror-has-error" : ""
          }`}
          codeEditorVisibleOverflow={props.codeEditorVisibleOverflow}
          disabled={props.disabled}
          editorTheme={props.theme}
          fill={props.fill}
          hasError={false}
          height={props.height}
          hoverInteraction={props.hoverInteraction}
          isFocused={showEditor}
          isNotHover={false}
          isRawView={false}
          isReadOnly={false}
          onMouseEnter={toggleLintErrorVisibility(true)}
          onMouseLeave={toggleLintErrorVisibility(false)}
          size={props.size}
        >
          <ReadOnlyInput
            className="t--code-editor-wrapper unfocused-code-editor"
            data-testid="lazy-code-editor"
            onFocus={handleFocus}
            placeholder={""}
            readOnly
            type="text"
            value={""}
          />
          <HighlighedCodeContainer containsCode={containsCode}>
            {highlightedText()}
          </HighlighedCodeContainer>
        </EditorWrapper>
      </ContentWrapper>
      {showLintError && lintError && (
        <LintErrorContainer>
          <IconWrapper
            className="close-debugger t--close-debugger"
            name="error"
            size={IconSize.SMALL}
          />
          {lintError}
        </LintErrorContainer>
      )}
    </LazyEditorWrapper>
  );
}

export default CodeEditor;
