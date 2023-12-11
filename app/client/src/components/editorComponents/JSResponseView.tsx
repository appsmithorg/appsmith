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
  NO_JS_FUNCTION_RETURN_VALUE,
  UPDATING_JS_COLLECTION,
} from "@appsmith/constants/messages";
import type { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import type { JSAction } from "entities/JSCollection";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { Text } from "design-system";
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
  NoResponse,
  ResponseTabErrorContainer,
  ResponseTabErrorContent,
} from "./ApiResponseView";
import LogHelper from "./Debugger/ErrorLogs/components/LogHelper";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { SourceEntity, Log } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { CloseDebugger } from "./Debugger/DebuggerTabs";

const ResponseContainer = styled.div`
  ${ResizerCSS};
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: ${TAB_MIN_HEIGHT};
  background-color: var(--ads-v2-color-bg);
  height: ${ActionExecutionResizerHeight}px;
  border-top: 1px solid var(--ads-v2-color-border);

  .ads-v2-tabs__panel {
    ${CodeEditorWithGutterStyles};
    overflow-y: auto;
    height: calc(100% - ${TAB_MIN_HEIGHT});
  }
`;

const ResponseTabWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;

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
`;

const ResponseViewer = styled.div`
  width: 100%;
  padding: 0 var(--ads-v2-spaces-7);
`;

const NoReturnValueWrapper = styled.div`
  padding-left: ${(props) => props.theme.spaces[12]}px;
  padding-top: ${(props) => props.theme.spaces[6]}px;
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
  errorCount: number;
}

type Props = ReduxStateProps &
  RouteComponentProps<JSEditorRouteParams> & {
    currentFunction: JSAction | null;
    theme?: EditorTheme;
    errors: Array<EvaluationError>;
    disabled: boolean;
    isLoading: boolean;
    onButtonClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    jsCollectionData: JSCollectionData | undefined;
  };

function JSResponseView(props: Props) {
  const {
    currentFunction,
    disabled,
    errorCount,
    errors,
    isLoading,
    jsCollectionData,
    onButtonClick,
  } = props;
  const [responseStatus, setResponseStatus] = useState<JSResponseState>(
    JSResponseState.NoResponse,
  );
  const jsObject = jsCollectionData?.config;
  const responses = (jsCollectionData && jsCollectionData.data) || {};
  const isDirty = (jsCollectionData && jsCollectionData.isDirty) || {};
  const isExecuting = (jsCollectionData && jsCollectionData.isExecuting) || {};
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
      jsCollectionData &&
      jsCollectionData.config &&
      jsCollectionData.activeJSActionId
    ) {
      every(filteredErrors, (error) => {
        if (
          includes(
            error.id,
            jsCollectionData?.config.id +
              "-" +
              jsCollectionData?.activeJSActionId,
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
                  <NoResponse
                    isButtonDisabled={disabled}
                    isQueryRunning={isLoading}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    onRunClick={onButtonClick}
                  />
                )}
                {responseStatus === JSResponseState.IsExecuting && (
                  <LoadingOverlayScreen theme={props.theme}>
                    {createMessage(EXECUTING_FUNCTION)}
                  </LoadingOverlayScreen>
                )}
                {responseStatus === JSResponseState.NoReturnValue && (
                  <NoReturnValueWrapper>
                    <Text kind="body-m">
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
                      value: response as string,
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

        <CloseDebugger
          className="close-debugger t--close-debugger"
          isIconButton
          kind="tertiary"
          onClick={onClose}
          size="md"
          startIcon="close-modal"
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  ) : null;
}

const mapStateToProps = (state: AppState) => {
  const errorCount = state.ui.debugger.context.errorCount;
  return {
    errorCount,
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));
