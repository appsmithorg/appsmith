import React, { useState, useEffect } from "react";
import _ from "lodash";
import { useSelector } from "react-redux";

import CodeEditor from "components/editorComponents/CodeEditor";
import { EditorWrapper, ReadOnlyInput } from "./styledComponents";
import { replayHighlightClass } from "globalStyles/portals";
import {
  EvaluationError,
  getEvalErrorPath,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { AppState } from "reducers";
import styled from "styled-components";
import { Icon, IconSize } from "components/ads";

const LintErrorContainer = styled.div`
  background-color: white;
  padding: 8px;

  position: absolute;
  top: -24px;
  left: 50px;
  box-shadow: 0px 4px 8px 1px rgba(0, 0, 0, 0.3);

  display: flex;
`;

const IconWrapper = styled(Icon)`
  margin-right: 4px;
`;

const LazyEditorWrapper = styled.div`
  position: relative;
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

  return isFocused ? (
    <CodeEditor {...props} hasFocus={isFocused} />
  ) : (
    <LazyEditorWrapper>
      <EditorWrapper
        border={props.border}
        borderLess={props.borderLess}
        className={`${props.className} ${replayHighlightClass} ${
          false ? "t--codemirror-has-error" : ""
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
          placeholder={props.placeholder}
          type="text"
          value={props.input.value}
        />
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
}

export default LazyCodeEditorWrapper;
