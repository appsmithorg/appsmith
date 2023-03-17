import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { isObject, isString } from "lodash";
import equal from "fast-deep-equal/es6";
import Popper from "pages/Editor/Popper";
import ReactJson from "react-json-view";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { theme } from "constants/DefaultTheme";
import type { Placement } from "popper.js";
import {
  ScrollIndicator,
  Toaster,
  TooltipComponent as Tooltip,
  Variant,
} from "design-system-old";
import { EvaluatedValueDebugButton } from "components/editorComponents/Debugger/DebugCTA";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import type { IPopoverSharedProps } from "@blueprintjs/core";
import { Button, Classes, Collapse, Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { UNDEFINED_VALIDATION } from "utils/validation/common";
import { ReactComponent as CopyIcon } from "assets/icons/menu/copy-snippet.svg";
import copy from "copy-to-clipboard";

import type { EvaluationError } from "utils/DynamicBindingUtils";
import * as Sentry from "@sentry/react";
import { Severity } from "@sentry/react";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor/index";
import type { Indices } from "constants/Layers";
import { Layers } from "constants/Layers";
import { useDispatch, useSelector } from "react-redux";
import { getEvaluatedPopupState } from "selectors/editorContextSelectors";
import type { AppState } from "@appsmith/reducers";
import { setEvalPopupState } from "actions/editorContextActions";

const modifiers: IPopoverSharedProps["modifiers"] = {
  offset: {
    enabled: true,
    offset: "0, 15",
  },
  preventOverflow: {
    enabled: true,
    boundariesElement: "viewport",
    padding: 38,
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
    backgroundColor: "#F8F8F8",
    textColor: "#4B4848",
    editorBackground: "#FFFFFF",
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
  // box-shadow: 0px 12px 28px -6px rgba(0, 0, 0, 0.32);
  box-shadow: 0px 4px 8px -2px rgba(0, 0, 0, 0.1),
    0px 2px 4px -2px rgba(0, 0, 0, 0.06);
  border-radius: 0px;
  pointer-events: all;
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
  border: 1px solid #b3b3b3;
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

const TypeText = styled.pre<{
  colorTheme: EditorTheme;
  padded?: boolean;
  addBorder?: boolean;
}>`
  padding: ${(props) => (props.padded ? "8px" : 0)};
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  color: ${(props) => THEMES[props.colorTheme].editorColor};
  font-size: 12px;
  margin: 5px 0;
  -ms-overflow-style: none;
  white-space: pre-wrap;
  ${(props) => props?.addBorder && "border: 1px solid #b3b3b3;"}
`;

const ErrorText = styled.p`
  margin: ${(props) => props.theme.spaces[2]}px 0px;
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[5]}px;
  border-radius: 0px;
  font-size: 12px;
  line-height: 19px;
  letter-spacing: -0.24px;
  background-color: rgba(226, 44, 44, 0.08);
  border: 1.2px solid ${(props) => props.theme.colors.errorMessage};
  color: ${(props) => props.theme.colors.errorMessage};
  margin-top: 15px;
`;

const StyledIcon = styled(Icon)`
  &.open-collapse {
    transform: rotate(90deg);
  }
  float: right;
`;

const StyledTitle = styled.p`
  margin: 8px 0;
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  cursor: pointer;
`;

const StyledTitleName = styled.p`
  margin: 8px 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
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

function copyContent(
  content: any,
  onCopyContentText = `Evaluated value copied to clipboard`,
) {
  const stringifiedContent = isString(content)
    ? content
    : JSON.stringify(content, null, 2);

  copy(stringifiedContent);
  Toaster.show({
    text: onCopyContentText,
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
  dataTreePath?: string;
  evaluatedPopUpLabel?: string;
  editorRef?: React.RefObject<HTMLDivElement>;
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
  dataTreePath?: string;
  evaluatedPopUpLabel?: string;
  editorRef?: React.RefObject<HTMLDivElement>;
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
  const stringSegments = value.split(/\$\d+/);
  const $params = [...value.matchAll(/\$\d+/g)].map((matches) => matches[0]);

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

export function CurrentValueViewer(props: {
  theme: EditorTheme;
  evaluatedValue: any;
  hideLabel?: boolean;
  preparedStatementViewer?: boolean;
  /** @param {number} [collapseStringsAfterLength=20]
   * This collapses the values visible in (say json) after these many characters and shows ellipsis.
   */
  collapseStringsAfterLength?: number;
  /** @param {string} [onCopyContentText=`Evaluated value copied to clipboard`]
   * This parameter contains the string that is shown when the evaluatedValue is copied.
   */
  onCopyContentText?: string;
}) {
  const [openEvaluatedValue, setOpenEvaluatedValue] = useState(true);
  return (
    <ControlledCurrentValueViewer
      {...props}
      openEvaluatedValue={openEvaluatedValue}
      setOpenEvaluatedValue={(isOpen: boolean) => setOpenEvaluatedValue(isOpen)}
    />
  );
}

const ControlledCurrentValueViewer = memo(
  function ControlledCurrentValueViewer(props: {
    theme: EditorTheme;
    evaluatedValue: any;
    openEvaluatedValue: boolean;
    setOpenEvaluatedValue?: (a: boolean) => void;
    hideLabel?: boolean;
    preparedStatementViewer?: boolean;
    /** @param {number} [collapseStringsAfterLength=20]
     * This collapses the values visible in (say json) after these many characters and shows ellipsis.
     */
    collapseStringsAfterLength?: number;
    /** @param {string} [onCopyContentText=`Evaluated value copied to clipboard`]
     * This parameter contains the string that is shown when the evaluatedValue is copied.
     */
    onCopyContentText?: string;
  }) {
    /* Setting the default value for collapseStringsAfterLength to 20;
       This ensures that earlier code that depends on the value keeps working.
     */
    const collapseStringsAfterLength = props.collapseStringsAfterLength || 20;
    /* Setting the default value; ensuring that earlier code keeps working. */
    const onCopyContentText =
      props.onCopyContentText || `Evaluated value copied to clipboard`;
    const codeWrapperRef = React.createRef<HTMLPreElement>();
    const { openEvaluatedValue, setOpenEvaluatedValue } = props;
    const toggleEvaluatedValue = () => {
      if (!!setOpenEvaluatedValue) setOpenEvaluatedValue(!openEvaluatedValue);
    };
    let content = (
      <CodeWrapper colorTheme={props.theme} ref={codeWrapperRef}>
        {"undefined"}
        <ScrollIndicator containerRef={codeWrapperRef} />
      </CodeWrapper>
    );
    if (props.evaluatedValue !== undefined) {
      if (
        isObject(props.evaluatedValue) ||
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
            collapseStringsAfterLength,
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
                onClick={() =>
                  copyContent(props.evaluatedValue, onCopyContentText)
                }
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
      prevProps.openEvaluatedValue === nextProps.openEvaluatedValue &&
      // Deep-compare evaluated values to ensure we only rerender
      // when the array actually changes
      equal(prevProps.evaluatedValue, nextProps.evaluatedValue)
    );
  },
);

function PopoverContent(props: PopoverContentProps) {
  const typeTextRef = React.createRef<HTMLPreElement>();
  const dispatch = useDispatch();
  const popupContext = useSelector((state: AppState) =>
    getEvaluatedPopupState(state, props.dataTreePath),
  );
  const [openExpectedDataType, setOpenExpectedDataType] = useState(
    !!popupContext?.type,
  );
  const [openExpectedExample, setOpenExpectedExample] = useState(
    !!popupContext?.example,
  );
  const [openEvaluatedValue, setOpenEvaluatedValue] = useState(
    popupContext && popupContext.value !== undefined
      ? popupContext.value
      : true,
  );
  const toggleExpectedDataType = () =>
    setOpenExpectedDataType(!openExpectedDataType);
  const toggleExpectedExample = () =>
    setOpenExpectedExample(!openExpectedExample);
  const { errors, expected, hasError, onMouseEnter, onMouseLeave, theme } =
    props;
  let error: EvaluationError | undefined;
  if (hasError) {
    error = errors[0];
  }

  useEffect(() => {
    dispatch(
      setEvalPopupState(props.dataTreePath, {
        type: openExpectedDataType,
        example: openExpectedExample,
        value: openEvaluatedValue,
      }),
    );
  }, [openExpectedDataType, openExpectedExample, openEvaluatedValue]);

  const getErrorMessage = (error: Error) => {
    return error
      ? error.message
      : `This value does not evaluate to type "${expected?.type}".`;
  };
  return (
    <ContentWrapper
      className="t--CodeEditor-evaluatedValue"
      colorTheme={theme}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {props?.entity && props.entity?.entityName && (
        <StyledTitleName>
          {props?.evaluatedPopUpLabel
            ? props?.evaluatedPopUpLabel
            : props?.entity?.entityName}
        </StyledTitleName>
      )}
      {hasError && error && (
        <ErrorText>
          <span className="t--evaluatedPopup-error">
            {/* errorMessage could be an empty string */}
            {getErrorMessage(error.errorMessage)}
          </span>
          <EvaluatedValueDebugButton
            entity={props.entity}
            error={{
              type: error.errorType,
              message: error.errorMessage,
            }}
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
            <TypeText
              addBorder
              colorTheme={props.theme}
              padded
              ref={typeTextRef}
            >
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
        <ControlledCurrentValueViewer
          evaluatedValue={props.evaluatedValue}
          openEvaluatedValue={openEvaluatedValue}
          preparedStatementViewer={props.preparedStatementViewer}
          setOpenEvaluatedValue={(isOpen: boolean) =>
            setOpenEvaluatedValue(isOpen)
          }
          theme={props.theme}
        />
      )}
    </ContentWrapper>
  );
}

function EvaluatedValuePopup(props: Props) {
  const [contentHovered, setContentHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState(0);
  const [position, setPosition] = useState(undefined);
  const [isDragging, setIsDragging] = useState(false);

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
        customParent={document.body}
        editorRef={props?.editorRef}
        isDraggable
        isDragging={isDragging}
        isOpen={props.isOpen || contentHovered || isDragging}
        modifiers={modifiers}
        placement={placement}
        position={position}
        setIsDragging={setIsDragging}
        setPosition={setPosition}
        targetNode={wrapperRef.current || undefined}
        zIndex={props.popperZIndex || Layers.evaluationPopper}
      >
        <PopoverContent
          dataTreePath={props.dataTreePath}
          editorRef={props?.editorRef}
          entity={props.entity}
          errors={props.errors}
          evaluatedPopUpLabel={props?.evaluatedPopUpLabel}
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
            // @ts-expect-error: setTimeout return type mismatch
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
