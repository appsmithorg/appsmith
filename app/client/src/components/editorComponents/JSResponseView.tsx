import React, { useState, useRef, RefObject } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { JSEditorRouteParams } from "constants/routes";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
} from "constants/messages";
import { TabComponent } from "components/ads/Tabs";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getActionTabsInitialIndex } from "selectors/editorSelectors";
import { JSAction, JSSubAction } from "entities/JSAction";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { executeJSFunction } from "actions/jsPaneActions";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import { sortBy } from "lodash";
import { ReactComponent as JSFunction } from "assets/icons/menu/js-function.svg";
import { ReactComponent as RunFunction } from "assets/icons/menu/run.svg";

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
`;

const ResponseTabActionsList = styled.ul`
  height: 100%;
  width: 20%;
  list-style: none;
  padding-left: 0;
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

interface ReduxStateProps {
  responses: Record<string, any>;
  isExecuting: Record<string, boolean>;
}

type Props = ReduxStateProps &
  RouteComponentProps<JSEditorRouteParams> & {
    theme?: EditorTheme;
    jsObject: JSAction | undefined;
  };

function JSResponseView(props: Props) {
  const { isExecuting, jsObject, responses } = props;
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
  const tabs = [
    {
      key: "body",
      title: "Response",
      panelComponent: (
        <ResponseTabWrapper>
          {sortedActionList && !sortedActionList?.length ? (
            <NoResponseContainer> Create JS Object </NoResponseContainer>
          ) : (
            <>
              <ResponseTabActionsList>
                {sortedActionList &&
                  sortedActionList?.length > 0 &&
                  sortedActionList.map((action) => {
                    return (
                      <ResponseTabAction
                        className={action.id === selectActionId ? "active" : ""}
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
                    Executing function
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

  const runAction = (action: JSSubAction) => {
    setSelectActionId(action.id);
    dispatch(
      executeJSFunction({
        collectionName: jsObject?.name || "",
        action: action,
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
  props: { jsObject: JSAction | undefined },
) => {
  const jsActions = state.entities.jsActions;
  const { jsObject } = props;
  const seletedJsObject =
    jsObject && jsActions.find((action) => action.config.id === jsObject.id);
  const responses = (seletedJsObject && seletedJsObject.data) || {};
  const isExecuting = (seletedJsObject && seletedJsObject.isExecuting) || {};
  return {
    responses: responses,
    isExecuting: isExecuting,
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));
