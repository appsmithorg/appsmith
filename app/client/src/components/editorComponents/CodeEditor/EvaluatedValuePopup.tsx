import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { isObject, isString } from "lodash";
import equal from "fast-deep-equal/es6";
import Popper from "pages/Editor/Popper";
import ReactJson from "react-json-view";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { Placement } from "popper.js";
import { EvaluatedValueDebugButton } from "components/editorComponents/Debugger/DebugCTA";
import { EvaluationSubstitutionType } from "constants/EvaluationConstants";
import type { IPopoverSharedProps } from "@blueprintjs/core";
import { Classes, Collapse } from "@blueprintjs/core";
import { UNDEFINED_VALIDATION } from "utils/validation/common";
import copy from "copy-to-clipboard";

import type { CodeEditorExpected } from "components/editorComponents/CodeEditor/index";
import type { Indices } from "constants/Layers";
import { Layers } from "constants/Layers";
import { useDispatch, useSelector } from "react-redux";
import { getEvaluatedPopupState } from "selectors/editorContextSelectors";
import type { DefaultRootState } from "react-redux";
import { setEvalPopupState } from "actions/editorContextActions";
import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";
import { modText } from "utils/helpers";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { getPathNavigationUrl } from "selectors/navigationSelectors";
import { Button, Icon, Link, toast, Tooltip } from "@appsmith/ads";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { DEBUGGER_TAB_KEYS } from "../Debugger/constants";
import { appsmithTelemetry } from "instrumentation";
import localStorage, { LOCAL_STORAGE_KEYS } from "utils/localStorage";

const modifiers: IPopoverSharedProps["modifiers"] = {
  offset: {
    enabled: true,
    offset: "0, 15",
  },
  preventOverflow: {
    enabled: true,
    boundariesElement: "viewport",
    padding: 50,
  },
};
const Wrapper = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
  border-radius: var(--ads-v2-border-radius);
`;

const THEME = {
  backgroundColor: "var(--ads-v2-color-bg)",
  textColor: "var(--ads-v2-color-fg)",
  editorBackground: "var(--ads-v2-color-bg)",
  editorColor: "var(--ads-v2-color-fg)",
};

const ContentWrapper = styled.div<{
  colorTheme: EditorTheme;
  $collapsed?: boolean;
}>`
  width: ${(props) =>
    props.$collapsed ? "auto" : `${props.theme.evaluatedValuePopup.width}px`};
  max-width: ${(props) => props.theme.evaluatedValuePopup.width}px;
  max-height: ${(props) => props.theme.evaluatedValuePopup.height}px;
  overflow-y: auto;
  -ms-overflow-style: none;
  background-color: ${THEME.backgroundColor};
  color: ${THEME.textColor};
  padding: ${(props) => (props.$collapsed ? "0 10px" : "10px")};
  box-shadow: var(--ads-v2-shadow-popovers);
  border-radius: var(--ads-v2-border-radius);
  pointer-events: all;
`;

const CopyIconWrapper = styled(Button)`
  position: absolute !important;
  right: var(--ads-v2-spaces-2);
  top: var(--ads-v2-spaces-2);
  cursor: pointer;
  padding: 0;
  display: none;
  align-self: start;
`;

const CurrentValueWrapper = styled.div<{ colorTheme: EditorTheme }>`
  min-height: 36px;
  -ms-overflow-style: none;
  padding-left: var(--ads-v2-spaces-3);
  padding-right: var(--ads-v2-spaces-2);
  background-color: ${THEME.editorBackground};
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    .copyIconWrapper {
      display: flex;
    }
  }

  /* for audit logs */

  .pushed-content .object-key-val,
  .variable-row {
    border-left: 1px solid var(--ads-v2-color-border) !important;

    .object-key,
    .object-key span,
    span {
      color: var(--ads-v2-color-fg) !important;
      opacity: 1 !important;
    }

    .variable-value > div span {
      color: var(--ads-v2-color-fg-brand) !important;
    }
  }

  .object-key-val {
    .collapsed-icon svg,
    .expanded-icon svg {
      color: var(--ads-v2-color-fg) !important;
    }

    .node-ellipsis {
      color: var(--ads-v2-color-fg-brand) !important;
      letter-spacing: -2px;
    }
  }
`;

const CodeWrapper = styled.pre<{ colorTheme: EditorTheme }>`
  margin: 0px 0px;
  background-color: ${THEME.editorBackground};
  color: ${THEME.editorColor};
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
  background-color: ${THEME.editorBackground};
  color: ${THEME.editorColor};
  font-size: 12px;
  margin: 5px 0;
  -ms-overflow-style: none;
  white-space: pre-wrap;
  border-radius: var(--ads-v2-border-radius);
  ${(props) =>
    props?.addBorder && "border: 1px solid var(--ads-v2-color-border);"}
`;

const ErrorText = styled.p`
  margin: ${(props) => props.theme.spaces[2]}px 0px;
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[5]}px;
  border-radius: var(--ads-v2-border-radius);
  font-size: 12px;
  line-height: 19px;
  letter-spacing: -0.24px;
  background-color: var(--ads-v2-color-bg-error);
  border: 1px solid var(--ads-v2-color-border-error);
  color: var(--ads-v2-color-fg-error);
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

/* Kept as a styled(StyledTitleName) <p> so it stays a direct child of the
   popup wrapper: Cypress locators walk the wrapper's direct p/div children. */
const PopupTitleRow = styled(StyledTitleName)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ads-v2-spaces-2);
  cursor: default;
`;

const PopupTitleText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AsyncFunctionErrorView = styled.div`
  display: flex;
  margin-top: 12px;
  justify-content: space-between;
`;

function CollapseToggle(props: { isOpen: boolean }) {
  const { isOpen } = props;

  return (
    <StyledIcon
      className={isOpen ? "open-collapse" : ""}
      name="arrow-right-s-line"
    />
  );
}

function copyContent(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any,
  onCopyContentText = `Evaluated value copied to clipboard`,
) {
  const stringifiedContent = isString(content)
    ? content
    : JSON.stringify(content, null, 2);

  copy(stringifiedContent);
  toast.show(onCopyContentText, {
    kind: "success",
  });
}

interface Props {
  theme: EditorTheme;
  isOpen: boolean;
  hasError: boolean;
  expected?: CodeEditorExpected;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

interface PreparedStatementValue {
  value: string;
  parameters: Record<string, number | string>;
}

export function PreparedStatementViewer(props: {
  evaluatedValue: PreparedStatementValue;
}) {
  const { parameters, value } = props.evaluatedValue;

  if (!value) {
    appsmithTelemetry.captureException(
      new Error("Prepared statement got no value"),
      {
        errorName: "PreparedStatementError",
        extra: { props },
      },
    );

    return <div />;
  }

  const stringSegments = value.split(/\$\d+/);
  const $params = [...value.matchAll(/\$\d+/g)].map((matches) => matches[0]);

  const paramsWithTooltips = $params.map((param) => (
    <Tooltip content={`${parameters[param]}`} key={param} trigger="hover">
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            Evaluated value
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
                className={"copyIconWrapper"}
                isIconButton
                kind="tertiary"
                onClick={() =>
                  copyContent(props.evaluatedValue, onCopyContentText)
                }
                size="sm"
                startIcon="copy-control"
              />
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
  const popupContext = useSelector((state: DefaultRootState) =>
    getEvaluatedPopupState(state, props.dataTreePath),
  );
  const [openExpectedDataType, setOpenExpectedDataType] = useState(
    !!popupContext?.type,
  );
  const [openExpectedExample, setOpenExpectedExample] = useState(
    props.expected?.openExampleTextByDefault || !!popupContext?.example,
  );
  const [openEvaluatedValue, setOpenEvaluatedValue] = useState(
    popupContext && popupContext.value !== undefined
      ? popupContext.value
      : true,
  );
  // Whole-window collapse is a single editor-wide preference: collapse it once
  // and every binding field shows the slim pill until it is expanded again.
  const [isPopupCollapsed, setIsPopupCollapsed] = useState(
    () =>
      localStorage.getItem(
        LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED,
      ) === "true",
  );
  const { errors, expected, hasError, onMouseEnter, onMouseLeave, theme } =
    props;
  const { entityName } = getEntityNameAndPropertyPath(props.dataTreePath || "");
  const errorWithSource = errors.find(({ kind }) => kind && kind.rootcause);

  const errorNavigationUrl = useSelector((state: DefaultRootState) =>
    getPathNavigationUrl(state, entityName, errorWithSource?.kind?.rootcause),
  );
  const toggleExpectedDataType = () =>
    setOpenExpectedDataType(!openExpectedDataType);
  const toggleExpectedExample = () =>
    setOpenExpectedExample(!openExpectedExample);
  const togglePopupCollapsed = () => {
    const collapsed = !isPopupCollapsed;

    setIsPopupCollapsed(collapsed);
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED,
      String(collapsed),
    );
  };

  let error: EvaluationError | undefined;

  if (hasError) {
    error = errors[0];
  }

  const openDebugger = () => {
    dispatch(showDebugger());
    dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  };

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

  const popupLabel =
    props.evaluatedPopUpLabel || props.entity?.entityName || "Binding preview";

  if (isPopupCollapsed) {
    return (
      <ContentWrapper
        $collapsed
        className="t--CodeEditor-evaluatedValue evaluated-value-popup"
        colorTheme={theme}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <PopupTitleRow>
          <PopupTitleText>{popupLabel}</PopupTitleText>
          {hasError && (
            <Tooltip
              content="Evaluation error — expand to view"
              trigger="hover"
            >
              <Icon
                aria-label="Evaluation error"
                color="var(--ads-v2-color-fg-error)"
                data-testid="t--evaluated-popup-error-indicator"
                name="alert-line"
                role="img"
                size="md"
              />
            </Tooltip>
          )}
          <Tooltip content="Expand" trigger="hover">
            <Button
              aria-label="Expand helper window"
              data-testid="t--evaluated-popup-collapse-toggle"
              isIconButton
              kind="tertiary"
              onClick={togglePopupCollapsed}
              // Keep focus on the editor this popup is anchored to; losing
              // it closes the popup as a side effect of the toggle.
              onMouseDown={(e) => e.preventDefault()}
              size="sm"
              startIcon="arrow-down-s-line"
            />
          </Tooltip>
        </PopupTitleRow>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper
      className="t--CodeEditor-evaluatedValue evaluated-value-popup"
      colorTheme={theme}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <PopupTitleRow>
        <PopupTitleText>{popupLabel}</PopupTitleText>
        <Tooltip content="Collapse" trigger="hover">
          <Button
            aria-label="Collapse helper window"
            data-testid="t--evaluated-popup-collapse-toggle"
            isIconButton
            kind="tertiary"
            onClick={togglePopupCollapsed}
            // Keep focus on the editor this popup is anchored to; losing
            // it closes the popup as a side effect of the toggle.
            onMouseDown={(e) => e.preventDefault()}
            size="sm"
            startIcon="arrow-up-s-line"
          />
        </Tooltip>
      </PopupTitleRow>
      {hasError && error && (
        <ErrorText>
          <span className="t--evaluatedPopup-error">
            {/* errorMessage could be an empty string */}
            {getErrorMessage(error.errorMessage)}
          </span>

          {errorNavigationUrl ? (
            <AsyncFunctionErrorView>
              <Link onClick={openDebugger}>{`See error (${modText()} D)`}</Link>
              <Link target={"_self"} to={errorNavigationUrl}>
                View source
              </Link>
            </AsyncFunctionErrorView>
          ) : (
            <EvaluatedValueDebugButton
              entity={props.entity}
              error={{
                type: error.errorType,
                message: error.errorMessage,
              }}
            />
          )}
        </ErrorText>
      )}
      {props.expected && props.expected.type !== UNDEFINED_VALIDATION && (
        <>
          <StyledTitle onClick={toggleExpectedDataType}>
            Expected structure
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
            Expected structure - example
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

// Roughly two CodeMirror lines: fields taller than this are multiline editors.
export const SHORT_FIELD_MAX_HEIGHT = 60;

export function getEvaluatedPopupPlacement(
  targetLeft: number,
  viewportWidth: number,
  targetHeight: number,
): [Placement, string] {
  // Fields on the right half of the screen (e.g. the property pane) show the
  // popup on their left, floating over the canvas.
  if (targetLeft >= viewportWidth / 2) return ["left-start", "0, 15"];

  // Short wide-form fields (query/API/settings forms) show the popup below the
  // field so it never covers the value being edited; popper flips it above
  // when there is no room underneath.
  if (targetHeight <= SHORT_FIELD_MAX_HEIGHT) return ["bottom-start", "0, 8"];

  // Tall multiline editors (JS editor, multiline API params): below-placement
  // can run out of viewport and get pushed back over the code, so keep the
  // popup on the left as before.
  return ["left-start", "0, 5"];
}

function EvaluatedValuePopup(props: Props) {
  const [contentHovered, setContentHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState(0);
  const [position, setPosition] = useState<
    { top: number; left: number } | undefined
  >(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const isPopupOpen = props.isOpen || contentHovered || isDragging;

  // A hand-dragged position used to stick for the lifetime of the component,
  // so the only way back to the anchored spot was to drag it there by hand.
  // The popup already hides on blur, so reopening it re-anchors to the field —
  // but only for blurs inside the app. When the whole window loses focus
  // (minimize, switching apps), the editor blurs too; discarding the dragged
  // position then would teleport the popup back to its anchor the moment the
  // user returns. document.hasFocus() separates the two cases.
  useEffect(() => {
    if (!isPopupOpen && position !== undefined && document.hasFocus()) {
      setPosition(undefined);
    }
  }, [isPopupOpen, position]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Neither the Wrapper (height:100% of a fixed form row) nor the
  // EditorWrapper (fixed height prop) grows when the user types multiline
  // content: with codeEditorVisibleOverflow the inner .CodeMirror element
  // (height: auto) grows and visibly overflows them. Anchor and measure the
  // .CodeMirror box so placement tracks the code area the user actually sees.
  const getAnchorNode = () => {
    const wrapper = wrapperRef.current;

    if (!wrapper) return null;

    return (
      (wrapper.querySelector(".CodeMirror") as HTMLElement | null) ||
      (wrapper.firstElementChild as HTMLElement | null) ||
      wrapper
    );
  };

  // CodeEditor fields auto-grow while the user types; track the anchor's
  // height so the placement decision below is re-evaluated on growth
  // (a short field can become a tall multiline editor mid-edit).
  const [anchorHeight, setAnchorHeight] = useState(0);

  useEffect(() => {
    // Re-acquire on every open: CodeMirror is instantiated by the parent
    // CodeEditor after this component first mounts, so the mount-time anchor
    // may be a stale fallback.
    const node = getAnchorNode();

    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      setAnchorHeight(entries[0]?.contentRect.height || 0);
    });

    observer.observe(node);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen]);

  const [placement, offset]: [Placement, string] = useMemo(() => {
    if (props.popperPlacement) return [props.popperPlacement, "0, 0"];

    const anchorNode = getAnchorNode();

    if (!anchorNode) return ["left-start", "0, 0"];

    const { height, left } = anchorNode.getBoundingClientRect();

    return getEvaluatedPopupPlacement(left, window.innerWidth, height);
    // props.isOpen keeps the placement fresh each time the popup opens (the
    // ref is null on first render and ref mutation alone never re-renders);
    // anchorHeight keeps it fresh while the field grows.
  }, [wrapperRef.current, props.popperPlacement, props.isOpen, anchorHeight]);

  return (
    <Wrapper ref={wrapperRef}>
      <Popper
        customParent={document.body}
        editorRef={props?.editorRef}
        isDraggable
        isDragging={isDragging}
        isOpen={isPopupOpen}
        modifiers={{
          ...modifiers,
          offset: {
            enabled: true,
            offset,
          },
          flip: {
            enabled: true,
            behavior: placement.startsWith("bottom")
              ? ["bottom", "top"]
              : "flip",
          },
        }}
        placement={placement}
        position={position}
        // Keep the drag grip centered over the popup: the default fixed
        // left offset strands it outside the box when the popup collapses
        // to its slim pill. The handler box must not intercept clicks — on
        // the pill it overlaps the expand toggle — so it passes pointer
        // events through; the visible grip re-enables its own.
        renderDragBlockPositions={{
          left: "calc(50% - 21px)",
          pointerEvents: "none",
        }}
        setIsDragging={setIsDragging}
        setPosition={setPosition}
        targetNode={getAnchorNode() || undefined}
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
