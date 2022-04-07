import React, { useState, useRef, RefObject, useCallback } from "react";
import { connect, useDispatch } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { JSEditorRouteParams } from "constants/routes";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  EXECUTING_FUNCTION,
  EMPTY_JS_OBJECT,
  PARSING_ERROR,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_RESPONSE_LAST_HALF,
} from "@appsmith/constants/messages";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { JSCollection, JSAction } from "entities/JSCollection";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { startExecutingJSFunction } from "actions/jsPaneActions";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import { sortBy } from "lodash";
import { ReactComponent as JSFunction } from "assets/icons/menu/js-function.svg";
import { ReactComponent as RunFunction } from "assets/icons/menu/run.svg";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import Callout from "components/ads/Callout";
import { Variant } from "components/ads/common";
import { EvaluationError } from "utils/DynamicBindingUtils";
import { Severity } from "entities/AppsmithConsole";
import { getJSCollectionIdFromURL } from "pages/Editor/Explorer/helpers";
import { DebugButton } from "./Debugger/DebugCTA";
import { thinScrollbar } from "constants/DefaultTheme";
import { setCurrentTab } from "actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import EntityBottomTabs from "./EntityBottomTabs";
import Icon from "components/ads/Icon";
import { ReactComponent as FunctionSettings } from "assets/icons/menu/settings.svg";
import JSFunctionSettings from "pages/Editor/JSEditor/JSFunctionSettings";
import FlagBadge from "components/utils/FlagBadge";

const ResponseContainer = styled.div`
  ${ResizerCSS}
  // Initial height of bottom tabs
  height: ${(props) => props.theme.actionsBottomTabInitialHeight};
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};

  .react-tabs__tab-panel {
    overflow: hidden;
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

const ResponseTabActionsList = styled.ul`
  height: 100%;
  width: 20%;
  list-style: none;
  padding-left: 0;
  ${thinScrollbar};
  scrollbar-width: thin;
  overflow: auto;
  padding-bottom: 40px;
  margin-top: 0;
`;

const ResponseTabAction = styled.li`
  padding: 10px 0px 10px 20px;
  display: flex;
  align-items: center;
  &:hover {
    cursor: pointer;
    background-color: #f0f0f0;
  }
  .function-name {
    margin-left: 5px;
    display: inline-block;
    flex: 1;
  }
  .function-actions {
    margin-left: auto;
    order: 2;
    svg {
      display: inline-block;
    }
  }
  .run-button {
    margin: 0 15px;
    margin-left: 10px;
  }
  &.active {
    background-color: #f0f0f0;
  }
`;

const TabbedViewWrapper = styled.div`
  height: 100%;

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
    }
  }
`;

const ResponseViewer = styled.div`
  width: 80%;
`;

const NoResponseContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  &.empty {
    background-color: #fafafa;
  }
  .${Classes.ICON} {
    margin-right: 0px;
    svg {
      width: 150px;
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

interface ReduxStateProps {
  responses: Record<string, any>;
  isExecuting: Record<string, boolean>;
}

type Props = ReduxStateProps &
  RouteComponentProps<JSEditorRouteParams> & {
    theme?: EditorTheme;
    jsObject: JSCollection;
    errors: Array<EvaluationError>;
  };

function JSResponseView(props: Props) {
  const { errors, isExecuting, jsObject, responses } = props;
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();
  const [selectActionId, setSelectActionId] = useState("");
  const actionList = jsObject?.actions;
  const sortedActionList = actionList && sortBy(actionList, "name");
  const response =
    selectActionId && selectActionId in responses
      ? responses[selectActionId]
      : "";
  const isRunning = selectActionId && !!isExecuting[selectActionId];
  const errorsList = errors.filter((er) => {
    return er.severity === Severity.ERROR;
  });

  const onDebugClick = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "JS_OBJECT",
    });
    dispatch(setCurrentTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }, []);

  const [openSettings, setOpenSettings] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<
    undefined | JSAction
  >(undefined);
  const isSelectedFunctionAsync = (id: string) => {
    const jsAction = jsObject.actions.find((action) => action.id === id);
    if (!!jsAction) {
      return jsAction?.actionConfiguration.isAsync;
    }
    return false;
  };

  const tabs = [
    {
      key: "body",
      title: "Response",
      panelComponent: (
        <>
          <HelpSection>
            {errorsList.length > 0 ? (
              <StyledCallout
                fill
                label={
                  <FailedMessage>
                    <DebugButton onClick={onDebugClick} />
                  </FailedMessage>
                }
                text={createMessage(PARSING_ERROR)}
                variant={Variant.danger}
              />
            ) : (
              ""
            )}
          </HelpSection>
          <ResponseTabWrapper className={errorsList.length ? "disable" : ""}>
            {sortedActionList && !sortedActionList?.length ? (
              <NoResponseContainer className="flex items-center">
                {createMessage(EMPTY_JS_OBJECT)}
              </NoResponseContainer>
            ) : (
              <>
                <ResponseTabActionsList>
                  {sortedActionList &&
                    sortedActionList?.length > 0 &&
                    sortedActionList.map((action) => {
                      return (
                        <ResponseTabAction
                          className={
                            action.id === selectActionId ? "active" : ""
                          }
                          key={action.id}
                          onClick={() => {
                            setSelectActionId(action.id);
                          }}
                        >
                          <JSFunction />{" "}
                          <div className="function-name">{action.name}</div>
                          <div className="function-actions">
                            {action.actionConfiguration.isAsync ? (
                              <FlagBadge name={"ASYNC"} />
                            ) : (
                              ""
                            )}
                            {isSelectedFunctionAsync(action.id) ? (
                              <FunctionSettings
                                onClick={() => {
                                  setSelectedFunction(action);
                                  setOpenSettings(true);
                                }}
                              />
                            ) : (
                              ""
                            )}

                            <RunFunction
                              className="run-button"
                              onClick={() => {
                                runAction(action);
                              }}
                            />
                          </div>
                        </ResponseTabAction>
                      );
                    })}
                </ResponseTabActionsList>
                <ResponseViewer>
                  {isRunning ? (
                    <LoadingOverlayScreen theme={props.theme}>
                      {createMessage(EXECUTING_FUNCTION)}
                    </LoadingOverlayScreen>
                  ) : !responses.hasOwnProperty(selectActionId) ? (
                    <NoResponseContainer className="empty">
                      <Icon name="no-response" />
                      <Text className="flex items-center" type={TextType.P1}>
                        {EMPTY_RESPONSE_FIRST_HALF()}
                        <RunFunction className="response-run" />
                        {EMPTY_RESPONSE_LAST_HALF()}
                      </Text>
                    </NoResponseContainer>
                  ) : (
                    <ReadOnlyEditor
                      folding
                      height={"100%"}
                      input={{
                        value: response,
                      }}
                    />
                  )}
                </ResponseViewer>
                {openSettings &&
                  !!selectedFunction &&
                  isSelectedFunctionAsync(selectedFunction.id) && (
                    <JSFunctionSettings
                      action={selectedFunction}
                      openSettings={openSettings}
                      toggleSettings={() => {
                        setOpenSettings(!openSettings);
                      }}
                    />
                  )}
              </>
            )}
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

  const runAction = (action: JSAction) => {
    setSelectActionId(action.id);
    const collectionId = getJSCollectionIdFromURL();
    dispatch(
      startExecutingJSFunction({
        collectionName: jsObject?.name || "",
        action: action,
        collectionId: collectionId || "",
      }),
    );
  };

  return (
    <ResponseContainer ref={panelRef}>
      <Resizer panelRef={panelRef} />
      <TabbedViewWrapper>
        <EntityBottomTabs defaultIndex={0} tabs={tabs} />
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
  const isExecuting = (seletedJsObject && seletedJsObject.isExecuting) || {};
  return {
    responses: responses,
    isExecuting: isExecuting,
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));
