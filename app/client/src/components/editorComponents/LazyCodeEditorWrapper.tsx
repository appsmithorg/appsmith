import React, { useState, useEffect } from "react";
import { isEmpty, get } from "lodash";
import { useSelector } from "react-redux";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import { duotoneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

import Editor from "components/editorComponents/CodeEditor";
import { EditorWrapper } from "./CodeEditor/styledComponents";
import { replayHighlightClass } from "globalStyles/portals";
import {
  EvaluationError,
  getEvalErrorPath,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { AppState } from "reducers";
import styled from "styled-components";
import { Icon, IconSize } from "components/ads";

SyntaxHighlighter.registerLanguage("javascript", js);

export const ReadOnlyInput = styled.input`
  width: 100%;
  background-color: rgba(0, 0, 0, 0) !important;
  font-family: monospace !important;
  font-weight: 400 !important;
  line-height: 21px !important;

  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  min-height: inherit;
  height: -webkit-fill-available !important;
`;

export const HighlighedCodeContainer = styled("div")`
  width: 100%;
  background-color: #fff !important;
  font-family: monospace !important;
  font-weight: 400 !important;
  line-height: 21px !important;

  min-height: inherit;
  padding: 6px 10px !important;

  pre {
    margin: 0 !important;
    overflow: hidden !important;
    font-family: monospace !important;
    padding: 8px !important;
    background: white !important;

    word-wrap: break-word !important;
    white-space: pre-wrap !important;
    word-break: normal !important;

    code {
      background: white !important;
      color: #4b4848 !important;
      font-family: monospace !important;
    }
  }
`;

const LintErrorContainer = styled.div`
  background-color: white;
  padding: 8px;

  position: absolute;
  bottom: 30px;
  left: 50px;
  box-shadow: 0px 4px 8px 1px rgba(0, 0, 0, 0.3);

  display: flex;
`;

const IconWrapper = styled(Icon)`
  margin-right: 4px;
`;

const LazyEditorWrapper = styled("div")`
  position: relative;
`;

const ContentWrapper = styled("div")<{ containsCode: boolean }>`
  overflow: hidden;
  height: ${({ containsCode }) => (containsCode ? "auto" : "38px")};
  min-height: 38px;
  border: 1px solid;
  border-color: inherit;
`;

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
    const str: string = props?.input?.value || props?.placeholder || "";
    if (str && typeof str === "string" && str?.indexOf("{{") > -1)
      setContainsCode(true);
    setText(
      Array.isArray(str) || typeof str === "object"
        ? JSON.stringify(str, null, 2)
        : str,
    );
  }, [props?.input?.value, props?.placeholder]);

  const highlightedText = () => {
    if (!containsCode) {
      return <div>{text}</div>;
    }
    return (
      <SyntaxHighlighter
        language="javascript"
        style={duotoneLight}
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
          <HighlighedCodeContainer>{highlightedText()}</HighlighedCodeContainer>
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
