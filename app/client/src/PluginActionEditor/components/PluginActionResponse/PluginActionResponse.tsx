import React, { useCallback, useEffect, useState } from "react";
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
import { doesPluginRequireDatasource } from "ee/entities/Engine/actionHelpers";
import useShowSchema from "./hooks/useShowSchema";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";

function PluginActionResponse() {
  const dispatch = useDispatch();
  const { action, actionResponse, plugin } = usePluginActionContext();

  const tabs = usePluginActionResponseTabs();
  const pluginRequireDatasource = doesPluginRequireDatasource(plugin);

  const showSchema = useShowSchema(plugin?.id || "") && pluginRequireDatasource;

  // TODO combine API and Query Debugger state
  const { open, responseTabHeight, selectedTab } = useSelector(
    getPluginActionDebuggerState,
  );

  const [showResponseOnFirstLoad, setShowResponseOnFirstLoad] =
    useState<boolean>(false);

  const { responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

  // These useEffects are used to open the response tab by default for page load queries
  // as for page load queries, query response is available and can be shown in response tab
  useEffect(() => {
    // actionResponse and responseDisplayFormat is present only when query has response available
    if (
      responseDisplayFormat &&
      !!responseDisplayFormat?.title &&
      actionResponse &&
      actionResponse.isExecutionSuccess &&
      !showResponseOnFirstLoad
    ) {
      dispatch(
        setPluginActionEditorDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        }),
      );
      setShowResponseOnFirstLoad(true);
    }
  }, [
    responseDisplayFormat,
    actionResponse,
    showResponseOnFirstLoad,
    dispatch,
  ]);

  useEffect(() => {
    if (showSchema && !selectedTab) {
      dispatch(
        setPluginActionEditorDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.SCHEMA_TAB,
        }),
      );
    }
  }, [showSchema, selectedTab, dispatch]);

  // When multiple page load queries exist, we want to response tab by default for all of them
  // Hence this useEffect will reset showResponseOnFirstLoad flag used to track whether to show response tab or not
  useEffect(() => {
    if (action?.id) {
      setShowResponseOnFirstLoad(false);
    }
  }, [action?.id]);

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
