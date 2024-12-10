import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
} from "ee/constants/messages";
import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import Errors from "components/editorComponents/Debugger/Errors";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import {
  getDebuggerSelectedTab,
  getErrorCount,
  getResponsePaneHeight,
} from "selectors/debuggerSelectors";
import { ActionExecutionResizerHeight } from "PluginActionEditor/components/PluginActionResponse/constants";
import { IDEBottomView, ViewHideBehaviour } from "IDE";

export const ResizerMainContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
  overflow: hidden;
`;

export const ResizerContentContainer = styled.div`
  overflow: auto;
  flex: 1;
  position: relative;
  display: flex;

  &.db-form-resizer-content,
  &.saas-form-resizer-content,
  &.api-datasource-content-container {
    flex-direction: column;
    padding: 0 var(--ads-v2-spaces-7) 0 var(--ads-v2-spaces-7);

    & .t--ds-form-header {
      border-bottom: 1px solid var(--ads-v2-color-border);
    }
  }

  &.db-form-resizer-content.db-form-resizer-content-show-tabs,
  &.saas-form-resizer-content.saas-form-resizer-content-show-tabs {
    padding: 0;

    & .t--ds-form-header {
      border-bottom: none;
    }
  }

  &.saas-form-resizer-content.saas-form-resizer-content-show-tabs form {
    padding-bottom: 0;
  }

  border-top: none;

  .db-form-content-container {
    display: flex;
    flex-direction: column;
    width: 100%;

    form {
      flex-grow: 1;
    }
  }
`;

export default function Debugger() {
  const dispatch = useDispatch();

  // fetch the height of the response pane from the store
  const responsePaneHeight = useSelector(getResponsePaneHeight);

  // fetch the selected tab from the store
  const selectedResponseTab = useSelector(getDebuggerSelectedTab);

  // fetch the error count from the store.
  const errorCount = useSelector(getErrorCount);

  // define the tabs for the debugger
  const DEBUGGER_TABS = [
    {
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs hasShortCut />,
    },
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      count: errorCount,
      panelComponent: <Errors hasShortCut />,
    },
  ];

  // set the height of the response pane in the store
  const setResponsePaneHeightFn = useCallback((height: number) => {
    dispatch(setResponsePaneHeight(height));
  }, []);

  // set the selected tab in the store
  const setSelectedResponseTab = useCallback((tabKey: string) => {
    dispatch(setDebuggerSelectedTab(tabKey));
  }, []);

  // close the debugger
  //TODO: move this to a common place
  const onClose = () => dispatch(showDebugger(false));

  // Do not render if response, header or schema tab is selected in the bottom bar.
  const shouldRender = !(
    selectedResponseTab === DEBUGGER_TAB_KEYS.RESPONSE_TAB ||
    selectedResponseTab === DEBUGGER_TAB_KEYS.HEADER_TAB ||
    selectedResponseTab === DEBUGGER_TAB_KEYS.DATASOURCE_TAB
  );

  return (
    <IDEBottomView
      behaviour={ViewHideBehaviour.CLOSE}
      className="t--datasource-bottom-pane-container"
      height={responsePaneHeight}
      hidden={!shouldRender}
      onHideClick={onClose}
      setHeight={setResponsePaneHeightFn}
    >
      <EntityBottomTabs
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        onSelect={setSelectedResponseTab}
        selectedTabKey={selectedResponseTab}
        tabs={DEBUGGER_TABS}
      />
    </IDEBottomView>
  );
}
