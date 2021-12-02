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
} from "constants/messages";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { JSCollection, JSAction } from "entities/JSCollection";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { executeJSFunction } from "actions/jsPaneActions";
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
import CollapseToggle from "pages/Editor/Explorer/Entity/CollapseToggle";
import Collapse from "pages/Editor/Explorer/Entity/Collapse";
import { Colors } from "constants/Colors";

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
  }
  .run-button {
    margin-left: auto;
    margin-right: 15px;
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

const Wrapper = styled.div`
  font-size: 14px;
`;

const Title = styled.div`
  display: grid;
  grid-template-columns: 20px auto 20px;
  cursor: pointer;
  height: 30px;
  align-items: center;
  padding-right: 6px;
  padding-left: 10px;
  &:hover {
    background: ${Colors.ALABASTER_ALT};
  }
  & .t--help-icon {
    svg {
      position: relative;
      top: 4px;
    }
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
  const actionList = jsObject?.actions;
  const sortedActionList = actionList && sortBy(actionList, "name");
  const [selectedVarOrAction, setSelectedVarOrAction] = useState("");

  const response =
    selectedVarOrAction && !!responses[selectedVarOrAction]
      ? responses[selectedVarOrAction]
      : "";
  const isRunning = selectedVarOrAction && !!isExecuting[selectedVarOrAction];
  const errorsList = errors.filter((er) => {
    return er.severity === Severity.ERROR;
  });
  const variablesList = jsObject.variables;

  const [openFunctionsList, setOpenFunctionsList] = useState(true);
  const [openVariablesList, setOpenVariablesList] = useState(true);

  const onDebugClick = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "JS_OBJECT",
    });
    dispatch(setCurrentTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }, []);

  const toggleFunctionList = () => {
    setOpenFunctionsList(!openFunctionsList);
  };

  const toggleVariablesList = () => {
    setOpenVariablesList(!openVariablesList);
  };

  const runAction = (action: JSAction) => {
    setSelectedVarOrAction(action.id);
    const collectionId = getJSCollectionIdFromURL();
    dispatch(
      executeJSFunction({
        collectionName: jsObject?.name || "",
        action: action,
        collectionId: collectionId || "",
      }),
    );
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
          <ResponseTabWrapper className={errors.length ? "disable" : ""}>
            {sortedActionList && !sortedActionList?.length ? (
              <NoResponseContainer className="flex items-center">
                {createMessage(EMPTY_JS_OBJECT)}
              </NoResponseContainer>
            ) : (
              <>
                <ResponseTabActionsList>
                  <Wrapper>
                    <Title onClick={toggleFunctionList}>
                      <CollapseToggle
                        className={""}
                        disabled={false}
                        isOpen={openFunctionsList}
                        isVisible={!!sortedActionList}
                        onClick={toggleFunctionList}
                      />
                      <span className="text-gray-900">Functions</span>
                    </Title>
                    <Collapse isOpen={openFunctionsList} step={0}>
                      {sortedActionList &&
                        sortedActionList?.length > 0 &&
                        sortedActionList.map((action) => {
                          return (
                            <ResponseTabAction
                              className={
                                action.id === selectedVarOrAction
                                  ? "active"
                                  : ""
                              }
                              key={action.id}
                              onClick={() => {
                                runAction(action);
                              }}
                            >
                              <JSFunction />{" "}
                              <div className="function-name">{action.name}</div>
                              <RunFunction className="run-button" />
                            </ResponseTabAction>
                          );
                        })}
                    </Collapse>
                  </Wrapper>
                  <Wrapper>
                    <Title onClick={toggleVariablesList}>
                      <CollapseToggle
                        className={""}
                        disabled={false}
                        isOpen={openVariablesList}
                        isVisible={!!variablesList}
                        onClick={toggleVariablesList}
                      />
                      <span className="text-gray-900">Variables</span>
                    </Title>
                    <Collapse isOpen={openVariablesList} step={1}>
                      {variablesList &&
                        variablesList?.length > 0 &&
                        variablesList.map((objVar) => {
                          return (
                            <ResponseTabAction
                              className={
                                objVar.name === selectedVarOrAction
                                  ? "active"
                                  : ""
                              }
                              key={objVar.name}
                              onClick={() => {
                                setSelectedVarOrAction(objVar.name);
                              }}
                            >
                              <div className="function-name">{objVar.name}</div>
                            </ResponseTabAction>
                          );
                        })}
                    </Collapse>
                  </Wrapper>
                </ResponseTabActionsList>
                <ResponseViewer>
                  {isRunning ? (
                    <LoadingOverlayScreen theme={props.theme}>
                      {createMessage(EXECUTING_FUNCTION)}
                    </LoadingOverlayScreen>
                  ) : !responses.hasOwnProperty(selectedVarOrAction) ? (
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
