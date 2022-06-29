import React, {
  useEffect,
  useRef,
  RefObject,
  useCallback,
  useState,
} from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { JSEditorRouteParams } from "constants/routes";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  EXECUTING_FUNCTION,
  PARSING_ERROR,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_JS_RESPONSE_LAST_HALF,
  NO_JS_FUNCTION_RETURN_VALUE,
  JS_ACTION_EXECUTION_ERROR,
  UPDATING_JS_COLLECTION,
} from "@appsmith/constants/messages";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { JSCollection, JSAction } from "entities/JSCollection";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import Callout from "components/ads/Callout";
import { Variant } from "components/ads/common";
import { EvaluationError } from "utils/DynamicBindingUtils";
import { DebugButton } from "./Debugger/DebugCTA";
import { setCurrentTab } from "actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import EntityBottomTabs from "./EntityBottomTabs";
import Icon from "components/ads/Icon";
import { TAB_MIN_HEIGHT } from "components/ads/Tabs";
import { theme } from "constants/DefaultTheme";
import { Button, Size } from "components/ads";
import { CodeEditorWithGutterStyles } from "pages/Editor/JSEditor/constants";
import { getIsSavingEntity } from "selectors/editorSelectors";
import { getJSResponseViewState } from "./utils";

const ResponseContainer = styled.div`
  ${ResizerCSS}
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: ${TAB_MIN_HEIGHT};
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};
  height: ${({ theme }) => theme.actionsBottomTabInitialHeight};

  .react-tabs__tab-panel {
    ${CodeEditorWithGutterStyles}
    overflow-y: auto;
    height: calc(100% - ${TAB_MIN_HEIGHT});
  }
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
const HelpSection = styled.div`
  padding-bottom: 5px;
  padding-top: 10px;
`;

const FailedMessage = styled.div`
  display: flex;
  align-items: center;
  margin-left: 5px;
`;

const StyledCallout = styled(Callout)`
  .${Classes.TEXT} {
    line-height: normal;
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
}

type Props = ReduxStateProps &
  RouteComponentProps<JSEditorRouteParams> & {
    currentFunction: JSAction | null;
    theme?: EditorTheme;
    jsObject: JSCollection;
    errors: Array<EvaluationError>;
    disabled: boolean;
    isLoading: boolean;
    onButtonClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  };

function JSResponseView(props: Props) {
  const {
    currentFunction,
    disabled,
    errors,
    isDirty,
    isExecuting,
    isLoading,
    jsObject,
    onButtonClick,
    responses,
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
  const onDebugClick = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "JS_OBJECT",
    });
    dispatch(setCurrentTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }, []);
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
  const tabs = [
    {
      key: "response",
      title: "Response",
      panelComponent: (
        <>
          {(hasExecutionParseErrors || hasJSObjectParseError) && (
            <HelpSection
              className={`${
                hasJSObjectParseError
                  ? "t--js-response-parse-error-call-out"
                  : "t--function-execution-parse-error-call-out"
              }`}
            >
              <StyledCallout
                fill
                label={
                  <FailedMessage>
                    <DebugButton
                      className="js-editor-debug-cta"
                      onClick={onDebugClick}
                    />
                  </FailedMessage>
                }
                text={
                  hasJSObjectParseError
                    ? createMessage(PARSING_ERROR)
                    : createMessage(
                        JS_ACTION_EXECUTION_ERROR,
                        `${jsObject.name}.${currentFunction?.name}`,
                      )
                }
                variant={Variant.danger}
              />
            </HelpSection>
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
      panelComponent: <ErrorLogs />,
    },
    {
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={jsObject?.name} />,
    },
  ];

  return (
    <ResponseContainer ref={panelRef}>
      <Resizer panelRef={panelRef} />
      <TabbedViewWrapper>
        <EntityBottomTabs
          containerRef={panelRef}
          defaultIndex={0}
          expandedHeight={theme.actionsBottomTabInitialHeight}
          tabs={tabs}
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  );
}

const mapStateToProps = (
  state: AppState,
  props: { jsObject: JSCollection },
) => {
  const jsActions = state.entities.jsActions;
  const { jsObject } = props;
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
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));
