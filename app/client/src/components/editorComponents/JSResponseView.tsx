import React, { useState, useRef, RefObject, useCallback } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
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
} from "constants/messages";
import { TabComponent } from "components/ads/Tabs";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getActionTabsInitialIndex } from "selectors/editorSelectors";
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
`;

const ResponseTabActionsList = styled.ul`
  height: 100%;
  width: 20%;
  list-style: none;
  padding-left: 0;
  ${thinScrollbar};
  scrollbar-width: thin;
  overflow: auto;
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
  height: calc(100% - 30px);

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
  const initialIndex = useSelector(getActionTabsInitialIndex);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const actionList = jsObject?.actions;
  const sortedActionList = actionList && sortBy(actionList, "name");
  const response =
    selectActionId && !!responses[selectActionId]
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
    setSelectedIndex(1);
  }, []);

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
              <NoResponseContainer>
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
                            runAction(action);
                          }}
                        >
                          <JSFunction />{" "}
                          <div className="function-name">{action.name}</div>
                          <RunFunction className="run-button" />
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
                      <Text type={TextType.P1}>
                        Click <RunFunction /> to get response
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
      key: "ERROR",
      title: createMessage(DEBUGGER_ERRORS),
      panelComponent: <ErrorLogs />,
    },
    {
      key: "LOGS",
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={jsObject?.name} />,
    },
  ];

  const onTabSelect = (index: number) => {
    const debuggerTabKeys = ["ERROR", "LOGS"];
    if (
      debuggerTabKeys.includes(tabs[index].key) &&
      debuggerTabKeys.includes(tabs[selectedIndex].key)
    ) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: tabs[index].key,
      });
    }
    setSelectedIndex(index);
  };

  const runAction = (action: JSAction) => {
    setSelectActionId(action.id);
    const collectionId = getJSCollectionIdFromURL();
    dispatch(
      executeJSFunction({
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
        <TabComponent
          onSelect={onTabSelect}
          selectedIndex={selectedIndex}
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
  const isExecuting = (seletedJsObject && seletedJsObject.isExecuting) || {};
  return {
    responses: responses,
    isExecuting: isExecuting,
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));
