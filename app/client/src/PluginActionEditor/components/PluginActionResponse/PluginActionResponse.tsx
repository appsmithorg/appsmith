import React, { useCallback, useEffect, useMemo } from "react";
import { IDEBottomView, ViewHideBehaviour } from "IDE";
import { ActionExecutionResizerHeight } from "./constants";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import { useDispatch, useSelector } from "react-redux";
import { setPluginActionEditorDebuggerState } from "../../store";
import { getPluginActionDebuggerState } from "../../store";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { usePluginActionResponseTabs } from "./hooks";
import { usePluginActionContext } from "../../PluginActionContext";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";
import { hasFailed } from "./utils";
import { useDefaultTab } from "ee/PluginActionEditor/components/PluginActionResponse/hooks/useDefaultTab";

function PluginActionResponse() {
  const dispatch = useDispatch();
  const { actionResponse } = usePluginActionContext();

  const tabs = usePluginActionResponseTabs();

  // TODO combine API and Query Debugger state
  const { open, responseTabHeight, selectedTab } = useSelector(
    getPluginActionDebuggerState,
  );

  const { responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

  const executionFailed = useMemo(
    () => (actionResponse ? hasFailed(actionResponse) : false),
    [actionResponse],
  );

  // These useEffects are used to open the response tab by default for page load queries
  // as for page load queries, query response is available and can be shown in response tab
  useEffect(
    function openResponseTabForPageLoadQueries() {
      // actionResponse and responseDisplayFormat is present only when query has response available
      if (
        !!responseDisplayFormat?.title &&
        actionResponse?.isExecutionSuccess
      ) {
        dispatch(
          setPluginActionEditorDebuggerState({
            open: true,
            selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
          }),
        );
      }
    },
    [
      responseDisplayFormat?.title,
      actionResponse?.isExecutionSuccess,
      dispatch,
    ],
  );

  useEffect(
    function openResponseTabOnError() {
      if (executionFailed) {
        dispatch(
          setPluginActionEditorDebuggerState({
            open: true,
            selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
          }),
        );
      }
    },
    [executionFailed, dispatch],
  );

  useDefaultTab();

  const toggleHide = useCallback(
    () => dispatch(setPluginActionEditorDebuggerState({ open: !open })),
    [dispatch, open],
  );

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

  const updateResponsePaneHeight = useCallback(
    (height: number) => {
      dispatch(
        setPluginActionEditorDebuggerState({ responseTabHeight: height }),
      );
    },
    [dispatch],
  );

  return (
    <IDEBottomView
      behaviour={ViewHideBehaviour.COLLAPSE}
      className="t--action-bottom-pane-container"
      height={responseTabHeight}
      hidden={!open}
      onHideClick={toggleHide}
      setHeight={updateResponsePaneHeight}
    >
      <EntityBottomTabs
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        isCollapsed={!open}
        onSelect={updateSelectedResponseTab}
        selectedTabKey={selectedTab || tabs[0]?.key}
        tabs={tabs}
      />
    </IDEBottomView>
  );
}

export default PluginActionResponse;
