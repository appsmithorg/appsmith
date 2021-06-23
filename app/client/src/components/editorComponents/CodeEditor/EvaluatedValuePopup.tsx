import React, { memo, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import Popper from "pages/Editor/Popper";
import ReactJson from "react-json-view";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { theme } from "constants/DefaultTheme";
import { Placement } from "popper.js";
import ScrollIndicator from "components/ads/ScrollIndicator";
import DebugButton from "components/editorComponents/Debugger/DebugCTA";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import Tooltip from "components/ads/Tooltip";
import { Classes } from "@blueprintjs/core";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";

const Wrapper = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
`;

type ThemeConfig = {
  backgroundColor: string;
  textColor: string;
  editorColor: string;
  editorBackground: string;
};

type PopupTheme = Record<EditorTheme, ThemeConfig>;

const THEMES: PopupTheme = {
  [EditorTheme.LIGHT]: {
    backgroundColor: "#EBEBEB",
    textColor: "#4B4848",
    editorBackground: "#FAFAFA",
    editorColor: "#1E242B",
  },
  [EditorTheme.DARK]: {
    backgroundColor: "#262626",
    textColor: "#D4D4D4",
    editorBackground: "#1A191C",
    editorColor: "#F4F4F4",
  },
};

const ContentWrapper = styled.div<{ colorTheme: EditorTheme }>`
  width: ${(props) => props.theme.evaluatedValuePopup.width}px;
  max-height: ${(props) => props.theme.evaluatedValuePopup.height}px;
  overflow-y: auto;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  background-color: ${(props) => THEMES[props.colorTheme].backgroundColor};
  color: ${(props) => THEMES[props.colorTheme].textColor};
  padding: 10px;
  box-shadow: 0px 12px 28px -6px rgba(0, 0, 0, 0.32);
  border-radius: 0px;
`;

const CurrentValueWrapper = styled.div<{ colorTheme: EditorTheme }>`
  max-height: 300px;
  overflow-y: auto;
  -ms-overflow-style: none;
  padding: ${(props) => props.theme.spaces[3]}px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
`;

const CodeWrapper = styled.pre<{ colorTheme: EditorTheme }>`
  margin: 0px 0px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  color: ${(props) => THEMES[props.colorTheme].editorColor};
  font-size: 14px;
  -ms-overflow-style: none;
  white-space: pre-wrap;
  word-break: break-all;
`;

const TypeText = styled.pre<{ colorTheme: EditorTheme }>`
  padding: ${(props) => props.theme.spaces[3]}px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  color: ${(props) => THEMES[props.colorTheme].editorColor};
  font-size: 12px;
  margin: 5px 0;
  -ms-overflow-style: none;
`;

const ErrorText = styled.p`
  margin: ${(props) => props.theme.spaces[2]}px 0px;
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[5]}px;
  border-radius: 0px;
  font-size: 14px;
  line-height: 19px;
  letter-spacing: -0.24px;
  background-color: rgba(226, 44, 44, 0.08);
  border: 1.2px solid ${(props) => props.theme.colors.errorMessage};
  color: ${(props) => props.theme.colors.errorMessage};
`;

const StyledTitle = styled.p`
  margin: 8px 0;
`;

const StyledDebugButton = styled(DebugButton)`
  margin-left: auto;
`;

interface Props {
  theme: EditorTheme;
  isOpen: boolean;
  hasError: boolean;
  expected?: string;
  evaluatedValue?: any;
  children: JSX.Element;
  errors: EvaluationError[];
  useValidationMessage?: boolean;
  hideEvaluatedValue?: boolean;
  evaluationSubstitutionType?: EvaluationSubstitutionType;
}

interface PopoverContentProps {
  hasError: boolean;
  expected?: string;
  errors: EvaluationError[];
  useValidationMessage?: boolean;
  evaluatedValue: any;
  theme: EditorTheme;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  hideEvaluatedValue?: boolean;
  preparedStatementViewer: boolean;
}

const PreparedStatementViewerContainer = styled.span`
  .${Classes.POPOVER_TARGET} {
    display: inline-block;
  }
`;

const PreparedStatementParameter = styled.span`
  cursor: pointer;
  text-decoration: underline;
  color: #333;
`;

type PreparedStatementValue = {
  value: string;
  parameters: Record<string, number | string>;
};
export function PreparedStatementViewer(props: {
  evaluatedValue: PreparedStatementValue;
}) {
  const { parameters, value } = props.evaluatedValue;
  const stringSegments = value.split(/\$\d/);
  const $params = [...value.matchAll(/\$\d/g)].map((matches) => matches[0]);
  const paramsWithTooltips = $params.map((param) => (
    <Tooltip content={<span>{parameters[param]}</span>} key={param}>
      <PreparedStatementParameter key={param}>
        {param}
      </PreparedStatementParameter>
    </Tooltip>
  ));

  return (
    <PreparedStatementViewerContainer>
      {stringSegments.map((segment, index) => (
        <span key={segment}>
          {segment}
          {paramsWithTooltips[index]}
        </span>
      ))}
    </PreparedStatementViewerContainer>
  );
}

export const CurrentValueViewer = memo(
  function CurrentValueViewer(props: {
    theme: EditorTheme;
    evaluatedValue: any;
    hideLabel?: boolean;
    preparedStatementViewer?: boolean;
  }) {
    const currentValueWrapperRef = React.createRef<HTMLDivElement>();
    const codeWrapperRef = React.createRef<HTMLPreElement>();

    let content = (
      <CodeWrapper colorTheme={props.theme} ref={codeWrapperRef}>
        {"undefined"}
        <ScrollIndicator containerRef={codeWrapperRef} />
      </CodeWrapper>
    );
    if (props.evaluatedValue !== undefined) {
      if (
        _.isObject(props.evaluatedValue) ||
        Array.isArray(props.evaluatedValue)
      ) {
        if (props.preparedStatementViewer) {
          content = (
            <CodeWrapper colorTheme={props.theme} ref={codeWrapperRef}>
              <PreparedStatementViewer
                evaluatedValue={props.evaluatedValue as PreparedStatementValue}
              />
              <ScrollIndicator containerRef={codeWrapperRef} />
            </CodeWrapper>
          );
        } else {
          const reactJsonProps = {
            theme:
              props.theme === EditorTheme.DARK ? "summerfruit" : "rjv-default",
            name: null,
            enableClipboard: false,
            displayObjectSize: false,
            displayDataTypes: false,
            style: {
              fontSize: "12px",
            },
            collapsed: 2,
            collapseStringsAfterLength: 20,
            shouldCollapse: (field: any) => {
              const index = field.name * 1;
              return index >= 2;
            },
          };
          content = (
            <ReactJson src={props.evaluatedValue} {...reactJsonProps} />
          );
        }
      } else {
        content = (
          <CodeWrapper colorTheme={props.theme} ref={codeWrapperRef}>
            {props.evaluatedValue === null
              ? "null"
              : props.evaluatedValue.toString()}
            <ScrollIndicator containerRef={codeWrapperRef} />
          </CodeWrapper>
        );
      }
    }
    return (
      <>
        {!props.hideLabel && (
          <StyledTitle data-testid="evaluated-value-popup-title">
            Evaluated Value
          </StyledTitle>
        )}
        <CurrentValueWrapper colorTheme={props.theme}>
          <>
            {content}
            <ScrollIndicator containerRef={currentValueWrapperRef} />
          </>
        </CurrentValueWrapper>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.theme === nextProps.theme &&
      prevProps.hideLabel === nextProps.hideLabel &&
      // Deep-compare evaluated values to ensure we only rerender
      // when the array actually changes
      _.isEqual(prevProps.evaluatedValue, nextProps.evaluatedValue)
    );
  },
);

function PopoverContent(props: PopoverContentProps) {
  const typeTextRef = React.createRef<HTMLPreElement>();
  const {
    errors,
    expected,
    hasError,
    onMouseEnter,
    onMouseLeave,
    theme,
    useValidationMessage,
  } = props;
  let error;
  if (hasError) {
    error = errors[0];
  }

  return (
    <ContentWrapper
      className="t--CodeEditor-evaluatedValue"
      colorTheme={theme}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {hasError && error && (
        <ErrorText>
          <span className="t--evaluatedPopup-error">
            {error.errorType === PropertyEvaluationErrorType.VALIDATION &&
            !useValidationMessage
              ? `This value does not evaluate to type "${expected}".`
              : error.errorMessage}
          </span>
          <StyledDebugButton
            className="evaluated-value"
            source={"EVALUATED_VALUE"}
          />
        </ErrorText>
      )}
      {!hasError && props.expected && (
        <>
          <StyledTitle>Expected Data Type</StyledTitle>
          <TypeText colorTheme={props.theme} ref={typeTextRef}>
            {props.expected}
            <ScrollIndicator containerRef={typeTextRef} />
          </TypeText>
        </>
      )}
      {!props.hideEvaluatedValue && (
        <CurrentValueViewer
          evaluatedValue={props.evaluatedValue}
          preparedStatementViewer={props.preparedStatementViewer}
          theme={props.theme}
        />
      )}
    </ContentWrapper>
  );
}

function EvaluatedValuePopup(props: Props) {
  const [contentHovered, setContentHovered] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const placement: Placement = useMemo(() => {
    if (wrapperRef.current) {
      const boundingRect = wrapperRef.current.getBoundingClientRect();
      if (boundingRect.left < theme.evaluatedValuePopup.width) {
        return "right-start";
      }
    }
    return "left-start";
  }, [wrapperRef.current]);

  return (
    <Wrapper ref={wrapperRef}>
      {(props.isOpen || contentHovered) && (
        <Popper
          isOpen
          modifiers={{
            offset: {
              enabled: true,
              offset: "0, 15",
            },
          }}
          placement={placement}
          targetNode={wrapperRef.current || undefined}
          zIndex={5}
        >
          <PopoverContent
            errors={props.errors}
            evaluatedValue={props.evaluatedValue}
            expected={props.expected}
            hasError={props.hasError}
            hideEvaluatedValue={props.hideEvaluatedValue}
            onMouseEnter={() => {
              setContentHovered(true);
            }}
            onMouseLeave={() => {
              setContentHovered(false);
            }}
            preparedStatementViewer={
              props.evaluationSubstitutionType
                ? props.evaluationSubstitutionType ===
                  EvaluationSubstitutionType.PARAMETER
                : false
            }
            theme={props.theme}
            useValidationMessage={props.useValidationMessage}
          />
        </Popper>
      )}
      {props.children}
    </Wrapper>
  );
}

export default EvaluatedValuePopup;
