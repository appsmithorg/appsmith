import type { RefObject } from "react";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { withRouter } from "react-router";
import styled from "styled-components";
import { every, includes } from "lodash";
import type { AppState } from "@appsmith/reducers";
import type { JSEditorRouteParams } from "constants/routes";
import {
  createMessage,
  DEBUGGER_LOGS,
  DEBUGGER_ERRORS,
  EXECUTING_FUNCTION,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_JS_RESPONSE_LAST_HALF,
  NO_JS_FUNCTION_RETURN_VALUE,
  UPDATING_JS_COLLECTION,
} from "@appsmith/constants/messages";
import type { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import type { JSCollection, JSAction } from "entities/JSCollection";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import {
  Button,
  Classes,
  Icon,
  IconSize,
  Size,
  Text,
  TextType,
} from "design-system-old";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import EntityBottomTabs from "./EntityBottomTabs";
import { TAB_MIN_HEIGHT } from "design-system-old";
import { CodeEditorWithGutterStyles } from "pages/Editor/JSEditor/constants";
import { getIsSavingEntity } from "selectors/editorSelectors";
import { getJSResponseViewState } from "./utils";
import {
  getDebuggerSelectedTab,
  getFilteredErrors,
  getResponsePaneHeight,
} from "selectors/debuggerSelectors";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import {
  ResponseTabErrorContainer,
  ResponseTabErrorContent,
} from "./ApiResponseView";
import LogHelper from "./Debugger/ErrorLogs/components/LogHelper";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { SourceEntity, Log } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Colors } from "constants/Colors";

const ResponseContainer = styled.div`
  ${ResizerCSS}
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: ${TAB_MIN_HEIGHT};
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};
  height: ${ActionExecutionResizerHeight}px;

  .react-tabs__tab-panel {
    ${CodeEditorWithGutterStyles}
    overflow-y: auto;
    height: calc(100% - ${TAB_MIN_HEIGHT});
  }
  border-top: 1px solid ${Colors.GREY_4};
`;

const ResponseTabWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  &.disable * {
    opacity: 0.8;
    pointer-events: none;
  }
  .response-run {
    margin: 0 10px;
  }
`;

const TabbedViewWrapper = styled.div`
  height: 100%;

  .close-debugger {
    position: absolute;
    top: 0px;
    right: 0px;
    padding: 9px 11px;
  }
  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[11]}px;
      height: ${TAB_MIN_HEIGHT};
    }
  }
`;

const ResponseViewer = styled.div`
  width: 100%;
`;

const NoResponseContainer = styled.div`
  height: 100%;
  width: max-content;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 0 auto;
  &.empty {
    background-color: #fafafa;
  }
  .${Classes.ICON} {
    margin-right: 0px;
    svg {
      width: auto;
      height: 150px;
    }
  }
  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
    color: #090707;
  }
`;

const NoReturnValueWrapper = styled.div`
  padding-left: ${(props) => props.theme.spaces[12]}px;
  padding-top: ${(props) => props.theme.spaces[6]}px;
`;
const InlineButton = styled(Button)`
  display: inline-flex;
  margin: 0 4px;
`;

export enum JSResponseState {
  IsExecuting = "IsExecuting",
  IsDirty = "IsDirty",
  IsUpdating = "IsUpdating",
  NoResponse = "NoResponse",
  ShowResponse = "ShowResponse",
  NoReturnValue = "NoReturnValue",
}

interface ReduxStateProps {
  responses: Record<string, any>;
  isExecuting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  seletedJsObject?: JSCollectionData;
}

type Props = ReduxStateProps &
  RouteComponentProps<JSEditorRouteParams> & {
    currentFunction: JSAction | null;
    theme?: EditorTheme;
    jsObject: JSCollection;
    errorCount: number;
    errors: Array<EvaluationError>;
    disabled: boolean;
    isLoading: boolean;
    onButtonClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  };

function JSResponseView(props: Props) {
  const {
    currentFunction,
    disabled,
    errorCount,
    errors,
    isDirty,
    isExecuting,
    isLoading,
    jsObject,
    onButtonClick,
    responses,
    seletedJsObject,
  } = props;
  const [responseStatus, setResponseStatus] = useState<JSResponseState>(
    JSResponseState.NoResponse,
  );
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();
  const response =
    currentFunction && currentFunction.id && currentFunction.id in responses
      ? responses[currentFunction.id]
      : "";
  // parse error found while trying to execute function
  const hasExecutionParseErrors = responseStatus === JSResponseState.IsDirty;
  // error found while trying to parse JS Object
  const hasJSObjectParseError = errors.length > 0;

  const isSaving = useSelector(getIsSavingEntity);
  useEffect(() => {
    setResponseStatus(
      getJSResponseViewState(
        currentFunction,
        isDirty,
        isExecuting,
        isSaving,
        responses,
      ),
    );
  }, [responses, isExecuting, currentFunction, isSaving, isDirty]);

  const filteredErrors = useSelector(getFilteredErrors);
  let errorMessage: string | undefined;
  let errorType = "ValidationError";

  // action source for analytics.
  let actionSource: SourceEntity = {
    type: ENTITY_TYPE.JSACTION,
    name: "",
    id: "",
  };
  try {
    let errorObject: Log | undefined;
    //get JS execution error from redux store.
    if (
      seletedJsObject &&
      seletedJsObject.config &&
      seletedJsObject.activeJSActionId
    ) {
      every(filteredErrors, (error) => {
        if (
          includes(
            error.id,
            seletedJsObject?.config.id +
              "-" +
              seletedJsObject?.activeJSActionId,
          )
        ) {
          errorObject = error;
          return false;
        }
        return true;
      });
    }
    // update error message.
    if (errorObject) {
      if (errorObject.source) {
        // update action source.
        actionSource = errorObject.source;
      }
      if (errorObject.messages) {
        // update error message.
        errorMessage =
          errorObject.messages[0].message.name +
          ": " +
          errorObject.messages[0].message.message;
        errorType = errorObject.messages[0].message.name;
      }
    }
  } catch (e) {}
  const tabs = [
    {
      key: "response",
      title: "Response",
      panelComponent: (
        <>
          {(hasExecutionParseErrors ||
            (hasJSObjectParseError && errorMessage)) && (
            <ResponseTabErrorContainer>
              <ResponseTabErrorContent>
                <div className="t--js-response-parse-error-call-out">
                  {errorMessage}
                </div>

                <LogHelper
                  logType={LOG_TYPE.EVAL_ERROR}
                  name={errorType}
                  source={actionSource}
                />
              </ResponseTabErrorContent>
            </ResponseTabErrorContainer>
          )}
          <ResponseTabWrapper className={errors.length ? "disable" : ""}>
            <ResponseViewer>
              <>
                {responseStatus === JSResponseState.NoResponse && (
                  <NoResponseContainer>
                    <Icon name="no-response" />
                    <Text type={TextType.P1}>
                      {createMessage(EMPTY_RESPONSE_FIRST_HALF)}
                      <InlineButton
                        disabled={disabled}
                        isLoading={isLoading}
                        onClick={onButtonClick}
                        size={Size.medium}
                        tag="button"
                        text="Run"
                        type="button"
                      />
                      {createMessage(EMPTY_JS_RESPONSE_LAST_HALF)}
                    </Text>
                  </NoResponseContainer>
                )}
                {responseStatus === JSResponseState.IsExecuting && (
                  <LoadingOverlayScreen theme={props.theme}>
                    {createMessage(EXECUTING_FUNCTION)}
                  </LoadingOverlayScreen>
                )}
                {responseStatus === JSResponseState.NoReturnValue && (
                  <NoReturnValueWrapper>
                    <Text type={TextType.P1}>
                      {createMessage(
                        NO_JS_FUNCTION_RETURN_VALUE,
                        currentFunction?.name,
                      )}
                    </Text>
                  </NoReturnValueWrapper>
                )}
                {responseStatus === JSResponseState.ShowResponse && (
                  <ReadOnlyEditor
                    folding
                    height={"100%"}
                    input={{
                      value: response,
                    }}
                  />
                )}
                {responseStatus === JSResponseState.IsUpdating && (
                  <LoadingOverlayScreen theme={props.theme}>
                    {createMessage(UPDATING_JS_COLLECTION)}
                  </LoadingOverlayScreen>
                )}
              </>
            </ResponseViewer>
          </ResponseTabWrapper>
        </>
      ),
    },
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      count: errorCount,
      panelComponent: <ErrorLogs />,
    },
    {
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={jsObject?.name} />,
    },
  ];

  // get the selected tab from the store.
  const selectedResponseTab = useSelector(getDebuggerSelectedTab);
  // set the selected tab in the store.
  const setSelectedResponseTab = useCallback((selectedTab: string) => {
    dispatch(setDebuggerSelectedTab(selectedTab));
  }, []);
  // get the height of the response pane.
  const responseTabHeight = useSelector(getResponsePaneHeight);
  // set the height of the response pane on resize.
  const setResponseHeight = useCallback((height: number) => {
    dispatch(setResponsePaneHeight(height));
  }, []);

  // close the debugger
  const onClose = () => dispatch(showDebugger(false));

  // Do not render if header tab is selected in the bottom bar.
  return !(selectedResponseTab === DEBUGGER_TAB_KEYS.HEADER_TAB) ? (
    <ResponseContainer
      className="t--js-editor-bottom-pane-container"
      ref={panelRef}
    >
      <Resizer
        initialHeight={responseTabHeight}
        onResizeComplete={setResponseHeight}
        panelRef={panelRef}
      />
      <TabbedViewWrapper>
        <EntityBottomTabs
          expandedHeight={`${ActionExecutionResizerHeight}px`}
          onSelect={setSelectedResponseTab}
          selectedTabKey={selectedResponseTab}
          tabs={tabs}
        />

        <Icon
          className="close-debugger t--close-debugger"
          name="close-modal"
          onClick={onClose}
          size={IconSize.XL}
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  ) : null;
}

const mapStateToProps = (
  state: AppState,
  props: { jsObject: JSCollection },
) => {
  const jsActions = state.entities.jsActions;
  const { jsObject } = props;

  const errorCount = state.ui.debugger.context.errorCount;
  const seletedJsObject =
    jsObject &&
    jsActions.find(
      (action: JSCollectionData) => action.config.id === jsObject.id,
    );
  const responses = (seletedJsObject && seletedJsObject.data) || {};
  const isDirty = (seletedJsObject && seletedJsObject.isDirty) || {};
  const isExecuting = (seletedJsObject && seletedJsObject.isExecuting) || {};
  return {
    responses,
    isExecuting,
    isDirty,
    seletedJsObject,
    errorCount,
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));
