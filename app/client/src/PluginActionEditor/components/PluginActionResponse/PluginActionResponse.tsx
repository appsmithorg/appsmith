import React, { useCallback } from "react";
import { IDEBottomView, ViewHideBehaviour } from "IDE";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import { useDispatch, useSelector } from "react-redux";
import { setPluginActionEditorDebuggerState } from "../../store";
import { getPluginActionDebuggerState } from "../../store";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { usePluginActionResponseTabs } from "./hooks";

function PluginActionResponse() {
  const dispatch = useDispatch();

  const tabs = usePluginActionResponseTabs();

  // TODO combine API and Query Debugger state
  const { open, responseTabHeight, selectedTab } = useSelector(
    getPluginActionDebuggerState,
  );

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
