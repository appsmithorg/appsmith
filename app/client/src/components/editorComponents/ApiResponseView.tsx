import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ActionResponse } from "api/ActionAPI";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_HEADERS,
  DEBUGGER_LOGS,
  DEBUGGER_RESPONSE,
} from "ee/constants/messages";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { BottomTab } from "./EntityBottomTabs";
import EntityBottomTabs from "./EntityBottomTabs";
import { DEBUGGER_TAB_KEYS } from "./Debugger/constants";
import { getErrorCount } from "selectors/debuggerSelectors";
import { ActionExecutionResizerHeight } from "PluginActionEditor/components/PluginActionResponse/constants";
import { PluginType, type Action } from "entities/Action";
import { EMPTY_RESPONSE } from "./emptyResponse";
import {
  getPluginActionDebuggerState,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor/store";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import useDebuggerTriggerClick from "./Debugger/hooks/useDebuggerTriggerClick";
import { IDEBottomView, ViewHideBehaviour } from "IDE";
import { ApiResponse } from "PluginActionEditor/components/PluginActionResponse/components/ApiResponse";
import { ApiResponseHeaders } from "PluginActionEditor/components/PluginActionResponse/components/ApiResponseHeaders";

interface Props {
  currentActionConfig: Action;
  theme?: EditorTheme;
  isRunDisabled: boolean;
  onRunClick: () => void;
  actionResponse?: ActionResponse;
  isRunning: boolean;
}

function ApiResponseView(props: Props) {
  const {
    actionResponse = EMPTY_RESPONSE,
    currentActionConfig,
    isRunDisabled = false,
    isRunning,
    theme = EditorTheme.LIGHT,
  } = props;

  const dispatch = useDispatch();
  const errorCount = useSelector(getErrorCount);
  const { open, responseTabHeight, selectedTab } = useSelector(
    getPluginActionDebuggerState,
  );

  const ideViewMode = useSelector(getIDEViewMode);

  const onDebugClick = useDebuggerTriggerClick();

  useEffect(
    function openDefaultTabWhenNoTabIsSelected() {
      if (currentActionConfig.pluginType === PluginType.API && !selectedTab) {
        dispatch(
          setPluginActionEditorDebuggerState({
            open: true,
            selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
          }),
        );
      }
    },
    [selectedTab, dispatch, currentActionConfig.pluginType],
  );

  const onRunClick = () => {
    props.onRunClick();
    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "API_PANE",
    });
  };

  // update the selected tab in the response pane.
  const updateSelectedResponseTab = useCallback(
    (tabKey: string) => {
      if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
        AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
          source: "API_PANE",
        });
      }

      dispatch(
        setPluginActionEditorDebuggerState({ open: true, selectedTab: tabKey }),
      );
    },
    [dispatch],
  );

  // update the height of the response pane on resize.
  const updateResponsePaneHeight = useCallback(
    (height: number) => {
      dispatch(
        setPluginActionEditorDebuggerState({ responseTabHeight: height }),
      );
    },
    [dispatch],
  );

  const tabs: BottomTab[] = [
    {
      key: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
      title: createMessage(DEBUGGER_RESPONSE),
      panelComponent: (
        <ApiResponse
          action={currentActionConfig}
          actionResponse={actionResponse}
          isRunDisabled={isRunDisabled}
          isRunning={isRunning}
          onRunClick={onRunClick}
          responseTabHeight={responseTabHeight}
          theme={theme}
        />
      ),
    },
    {
      key: DEBUGGER_TAB_KEYS.HEADER_TAB,
      title: createMessage(DEBUGGER_HEADERS),
      panelComponent: (
        <ApiResponseHeaders
          actionResponse={actionResponse}
          isRunDisabled={isRunDisabled}
          isRunning={isRunning}
          onDebugClick={onDebugClick}
          onRunClick={onRunClick}
        />
      ),
    },
  ];

  if (ideViewMode === EditorViewMode.FullScreen) {
    tabs.push(
      {
        key: DEBUGGER_TAB_KEYS.LOGS_TAB,
        title: createMessage(DEBUGGER_LOGS),
        panelComponent: <DebuggerLogs searchQuery={currentActionConfig.name} />,
      },
      {
        key: DEBUGGER_TAB_KEYS.ERROR_TAB,
        title: createMessage(DEBUGGER_ERRORS),
        count: errorCount,
        panelComponent: <ErrorLogs />,
      },
    );
  }

  // close the debugger
  //TODO: move this to a common place
  const toggleHide = useCallback(
    () => dispatch(setPluginActionEditorDebuggerState({ open: !open })),
    [dispatch, open],
  );

  return (
    <IDEBottomView
      behaviour={ViewHideBehaviour.COLLAPSE}
      className="t--api-bottom-pane-container"
      height={responseTabHeight}
      hidden={!open}
      onHideClick={toggleHide}
      setHeight={updateResponsePaneHeight}
    >
      <EntityBottomTabs
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        isCollapsed={!open}
        onSelect={updateSelectedResponseTab}
        selectedTabKey={selectedTab || ""}
        tabs={tabs}
      />
    </IDEBottomView>
  );
}

export default ApiResponseView;
