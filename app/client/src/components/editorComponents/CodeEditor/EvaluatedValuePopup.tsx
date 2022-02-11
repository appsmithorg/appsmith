import React, { memo, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import Popper from "pages/Editor/Popper";
import ReactJson from "react-json-view";
import {
  EditorTheme,
  FieldEntityInformation,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { theme } from "constants/DefaultTheme";
import { Placement } from "popper.js";
import ScrollIndicator from "components/ads/ScrollIndicator";
import { EvaluatedValueDebugButton } from "components/editorComponents/Debugger/DebugCTA";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import Tooltip from "components/ads/Tooltip";
import { Toaster } from "components/ads/Toast";
import { Classes, Collapse, Button, Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { UNDEFINED_VALIDATION } from "utils/validation/common";
import { IPopoverSharedProps } from "@blueprintjs/core";
import { ReactComponent as CopyIcon } from "assets/icons/menu/copy-snippet.svg";
import copy from "copy-to-clipboard";

import { EvaluationError } from "utils/DynamicBindingUtils";
import * as Sentry from "@sentry/react";
import { Severity } from "@sentry/react";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor/index";
import { Indices, Layers } from "constants/Layers";
import { Variant } from "components/ads/common";

const modifiers: IPopoverSharedProps["modifiers"] = {
  offset: {
    enabled: true,
    offset: "0, 15",
  },
  preventOverflow: {
    enabled: true,
    boundariesElement: "viewport",
  },
};
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

const CopyIconWrapper = styled(Button)<{ colorTheme: EditorTheme }>`
  color: ${(props) => THEMES[props.colorTheme].textColor};
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
  padding: 0;
  border-radius: 0;
  display: none;
`;

const CurrentValueWrapper = styled.div<{ colorTheme: EditorTheme }>`
  // max-height: 300px;
  min-height: 28px;
  // overflow-y: auto;
  -ms-overflow-style: none;
  padding: ${(props) => props.theme.spaces[3]}px;
  padding-right: 30px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  position: relative;
  &:hover {
    ${CopyIconWrapper} {
      display: flex;
    }
  }
`;

const CodeWrapper = styled.pre<{ colorTheme: EditorTheme }>`
  margin: 0px 0px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  color: ${(props) => THEMES[props.colorTheme].editorColor};
  font-size: 12px;
  -ms-overflow-style: none;
  white-space: pre-wrap;
  word-break: break-all;
`;

const TypeText = styled.pre<{ colorTheme: EditorTheme; padded?: boolean }>`
  padding: ${(props) => (props.padded ? "8px" : 0)};
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  color: ${(props) => THEMES[props.colorTheme].editorColor};
  font-size: 12px;
  margin: 5px 0;
  -ms-overflow-style: none;
  white-space: pre-wrap;
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

const StyledIcon = styled(Icon)`
  &.open-collapse {
    transform: rotate(90deg);
  }
  float: right;
`;

const StyledTitle = styled.p`
  margin: 8px 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
`;

function CollapseToggle(props: { isOpen: boolean }) {
  const { isOpen } = props;
  return (
    <StyledIcon
      className={isOpen ? "open-collapse" : ""}
      icon={IconNames.CHEVRON_RIGHT}
    />
  );
}

function copyContent(content: any) {
  const stringifiedContent = _.isString(content)
    ? content
    : JSON.stringify(content, null, 2);

  copy(stringifiedContent);
  Toaster.show({
    text: `Evaluated value copied to clipboard`,
    variant: Variant.success,
  });
}

interface Props {
  theme: EditorTheme;
  isOpen: boolean;
  hasError: boolean;
  expected?: CodeEditorExpected;
  evaluatedValue?: any;
  children: JSX.Element;
  errors: EvaluationError[];
  useValidationMessage?: boolean;
  hideEvaluatedValue?: boolean;
  evaluationSubstitutionType?: EvaluationSubstitutionType;
  popperPlacement?: Placement;
  entity?: FieldEntityInformation;
  popperZIndex?: Indices;
}

interface PopoverContentProps {
  hasError: boolean;
  entity?: FieldEntityInformation;
  expected?: CodeEditorExpected;
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
  if (!value) {
    Sentry.captureException("Prepared Statement got no value", {
      level: Severity.Debug,
      extra: { props },
    });
    return <div />;
  }
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
    const codeWrapperRef = React.createRef<HTMLPreElement>();
    const [openEvaluatedValue, setOpenEvaluatedValue] = useState(true);
    const toggleEvaluatedValue = () => {
      setOpenEvaluatedValue(!openEvaluatedValue);
    };
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
          <StyledTitle
            data-testid="evaluated-value-popup-title"
            onClick={toggleEvaluatedValue}
          >
            Evaluated Value
            <CollapseToggle isOpen={openEvaluatedValue} />
          </StyledTitle>
        )}
        <Collapse isOpen={openEvaluatedValue}>
          <CurrentValueWrapper
            className="t-property-evaluated-value"
            colorTheme={props.theme}
          >
            {content}
            {props.hasOwnProperty("evaluatedValue") && (
              <CopyIconWrapper
                colorTheme={props.theme}
                minimal
                onClick={() => copyContent(props.evaluatedValue)}
              >
                <CopyIcon height={34} />
              </CopyIconWrapper>
            )}
          </CurrentValueWrapper>
        </Collapse>
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
  const [openExpectedDataType, setOpenExpectedDataType] = useState(false);
  const toggleExpectedDataType = () =>
    setOpenExpectedDataType(!openExpectedDataType);

  const [openExpectedExample, setOpenExpectedExample] = useState(false);
  const toggleExpectedExample = () =>
    setOpenExpectedExample(!openExpectedExample);
  const {
    errors,
    expected,
    hasError,
    onMouseEnter,
    onMouseLeave,
    theme,
  } = props;
  let error: EvaluationError | undefined;
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
            {/* errorMessage could be an empty string */}
            {error.errorMessage ||
              `This value does not evaluate to type "${expected?.type}".`}
          </span>
          <EvaluatedValueDebugButton
            entity={props.entity}
            error={{ type: error.errorType, message: error.errorMessage }}
          />
        </ErrorText>
      )}
      {props.expected && props.expected.type !== UNDEFINED_VALIDATION && (
        <>
          <StyledTitle onClick={toggleExpectedDataType}>
            Expected Structure
            <CollapseToggle isOpen={openExpectedDataType} />
          </StyledTitle>
          <Collapse isOpen={openExpectedDataType}>
            <TypeText colorTheme={props.theme} padded ref={typeTextRef}>
              {props.expected.type}
            </TypeText>
          </Collapse>
        </>
      )}
      {props.expected && props.expected.type !== UNDEFINED_VALIDATION && (
        <>
          <StyledTitle onClick={toggleExpectedExample}>
            Expected Structure - Example
            <CollapseToggle isOpen={openExpectedExample} />
          </StyledTitle>
          <Collapse isOpen={openExpectedExample}>
            <TypeText colorTheme={props.theme} ref={typeTextRef}>
              <CurrentValueViewer
                evaluatedValue={props.expected.example}
                hideLabel
                theme={props.theme}
              />
            </TypeText>
          </Collapse>
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
  const [timeoutId, setTimeoutId] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const placement: Placement = useMemo(() => {
    if (props.popperPlacement) return props.popperPlacement;
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
      <Popper
        isOpen={props.isOpen || contentHovered}
        modifiers={modifiers}
        placement={placement}
        targetNode={wrapperRef.current || undefined}
        zIndex={props.popperZIndex || Layers.evaluationPopper}
      >
        <PopoverContent
          entity={props.entity}
          errors={props.errors}
          evaluatedValue={props.evaluatedValue}
          expected={props.expected}
          hasError={props.hasError}
          hideEvaluatedValue={props.hideEvaluatedValue}
          onMouseEnter={() => {
            clearTimeout(timeoutId);
            setContentHovered(true);
          }}
          onMouseLeave={() => {
            const id = setTimeout(() => setContentHovered(false), 500);
            setTimeoutId(id);
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

      {props.children}
    </Wrapper>
  );
}

export default EvaluatedValuePopup;
