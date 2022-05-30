import React, { useState, useEffect, Suspense } from "react";
import _ from "lodash";
import { useSelector } from "react-redux";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import duotoneLight from "react-syntax-highlighter/dist/esm/styles/prism/duotone-light";

import CodeEditor from "components/editorComponents/CodeEditor";
import { EditorWrapper } from "./styledComponents";
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
  color: #4b4848 !important;
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

const LazyEditorWrapper = styled("div")<{ value: string }>`
  position: relative;
  min-height: 38px;
  border: 1px solid;
`;

// Lazy load CodeEditor upon focus
function LazyCodeEditorWrapper(props: any) {
  const [isFocused, setFocus] = useState<boolean>(false);
  const [lintError, setLintError] = useState<string>("");
  const [showLintError, setShowLintError] = useState<boolean>(false);
  const dynamicData = useSelector((state: AppState) => state.evaluations.tree);
  const handleFocus = (): void => {
    setFocus(true);
  };

  useEffect(() => {
    const getPropertyValidation = (
      dynamicData: any,
      dataTreePath?: string,
    ): void => {
      if (!dataTreePath) {
        return;
      }

      const errors = _.get(
        dynamicData,
        getEvalErrorPath(dataTreePath),
        [],
      ) as EvaluationError[];

      const lintErrors = errors.filter(
        (error) => error.errorType === PropertyEvaluationErrorType.LINT,
      );

      if (!_.isEmpty(lintErrors)) {
        !lintError && setLintError(lintErrors[0].errorMessage);
      } else {
        lintError && setLintError("");
      }
    };
    getPropertyValidation(dynamicData, props?.dataTreePath);
  }, [dynamicData, props.dataTreePath]);

  const highlightedText = () => {
    return (
      <SyntaxHighlighter
        language="javascript"
        style={duotoneLight}
        wrapLongLines
      >
        {props?.input?.value || props.placeholder || ""}
      </SyntaxHighlighter>
    );
  };

  useEffect(() => {
    function lazyLoadEditor() {
      (window as any).requestIdleCallback(() => setFocus(true));
    }
    lazyLoadEditor();
  }, []);

  return isFocused ? (
    <CodeEditor {...props} />
  ) : (
    // <div>{Editor(props)}</div>
    <LazyEditorWrapper value={props.input.value}>
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
        isFocused={isFocused}
        isNotHover={false}
        isRawView={false}
        isReadOnly={false}
        onMouseEnter={() => setShowLintError(true)}
        onMouseLeave={() => setShowLintError(false)}
        size={props.size}
      >
        <ReadOnlyInput
          className="t--code-editor-wrapper unfocused-code-editor"
          data-testid="lazy-code-editor"
          onFocus={handleFocus}
          placeholder={""}
          type="text"
          value={""}
        />
        <HighlighedCodeContainer>{highlightedText()}</HighlighedCodeContainer>
      </EditorWrapper>
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

  // const CodeEditor = React.lazy((): any =>
  //   import("components/editorComponents/CodeEditor"),
  // );
  // return (
  //   <Suspense
  //     fallback={
  //       <LazyEditorWrapper value={props.input.value}>
  //         <EditorWrapper
  //           border={props.border}
  //           borderLess={props.borderLess}
  //           className={`${props.className} ${replayHighlightClass} ${
  //             lintError ? "t--codemirror-has-error" : ""
  //           }`}
  //           codeEditorVisibleOverflow={props.codeEditorVisibleOverflow}
  //           disabled={props.disabled}
  //           editorTheme={props.theme}
  //           fill={props.fill}
  //           hasError={false}
  //           height={props.height}
  //           hoverInteraction={props.hoverInteraction}
  //           isFocused={isFocused}
  //           isNotHover={false}
  //           isRawView={false}
  //           isReadOnly={false}
  //           onMouseEnter={() => setShowLintError(true)}
  //           onMouseLeave={() => setShowLintError(false)}
  //           size={props.size}
  //         >
  //           <ReadOnlyInput
  //             className="t--code-editor-wrapper unfocused-code-editor"
  //             data-testid="lazy-code-editor"
  //             onFocus={handleFocus}
  //             placeholder={""}
  //             type="text"
  //             value={""}
  //           />
  //           <HighlighedCodeContainer>
  //             {highlightedText()}
  //           </HighlighedCodeContainer>
  //         </EditorWrapper>
  //         {showLintError && lintError && (
  //           <LintErrorContainer>
  //             <IconWrapper
  //               className="close-debugger t--close-debugger"
  //               name="error"
  //               size={IconSize.SMALL}
  //             />
  //             {lintError}
  //           </LintErrorContainer>
  //         )}
  //       </LazyEditorWrapper>
  //     }
  //   >
  //     <CodeEditor {...props} hasFocus />
  //   </Suspense>
  // );

  // return isFocused ? (
  //   <CodeEditor {...props} hasFocus={isFocused} />
  // ) : (
  //   <LazyEditorWrapper lintError={lintError}>
  //     <EditorWrapper
  //       border={props.border}
  //       borderLess={props.borderLess}
  //       className={`${props.className} ${replayHighlightClass} ${
  //         lintError ? "t--codemirror-has-error" : ""
  //       }`}
  //       codeEditorVisibleOverflow={props.codeEditorVisibleOverflow}
  //       disabled={props.disabled}
  //       editorTheme={props.theme}
  //       fill={props.fill}
  //       hasError={false}
  //       height={props.height}
  //       hoverInteraction={props.hoverInteraction}
  //       isFocused={isFocused}
  //       isNotHover={false}
  //       isRawView={false}
  //       isReadOnly={false}
  //       onMouseEnter={() => setShowLintError(true)}
  //       onMouseLeave={() => setShowLintError(false)}
  //       size={props.size}
  //     >
  //       <ReadOnlyInput
  //         className="t--code-editor-wrapper unfocused-code-editor"
  //         data-testid="lazy-code-editor"
  //         onFocus={handleFocus}
  //         placeholder={""}
  //         type="text"
  //         value={""}
  //       />
  //       <HighlighedCodeContainer>{highlightedText()}</HighlighedCodeContainer>
  //     </EditorWrapper>
  //     {showLintError && lintError && (
  //       <LintErrorContainer>
  //         <IconWrapper
  //           className="close-debugger t--close-debugger"
  //           name="error"
  //           size={IconSize.SMALL}
  //         />
  //         {lintError}
  //       </LintErrorContainer>
  //     )}
  //   </LazyEditorWrapper>
  // );

  // useEffect(() => {
  //   if (window.requestIdleCallback) {
  //     window.requestIdleCallback();
  //   }
  // }, []);

  return <div />;
}

export default LazyCodeEditorWrapper;
