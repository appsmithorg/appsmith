import React, { useCallback, useRef } from "react";
import type { RefObject } from "react";
import Resizer, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import { Button } from "design-system";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { CloseDebugger } from "components/editorComponents/Debugger/DebuggerTabs";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import { useDispatch, useSelector } from "react-redux";
import { stopEventPropagation } from "utils/AppsmithUtils";
import {
  getRunHistoryResponsePaneHeight,
  getRunHistorySelectedTab,
} from "@appsmith/selectors/workflowRunHistorySelectors";
import { RUN_HISTORY_TAB_KEYS } from "./helpers";
import {
  setRunHistoryResponsePaneHeight,
  toggleRunHistoryPane,
} from "@appsmith/actions/workflowRunHistoryActions";
import { setDebuggerSelectedTab } from "actions/debuggerActions";
import {
  WORKFLOW_RUN_HISTORY_PANE_TRIGGER_TAB,
  createMessage,
} from "@appsmith/constants/messages";
import { RunHistoryTab } from "./RunHistoryTab";

const TABS_HEADER_HEIGHT = 36;

export const ClosePane = styled(Button)`
  &.close-debugger {
    position: absolute;
    top: 3px;
    right: 0px;
    padding: 9px 11px;
  }
`;

const Container = styled.div`
  ${ResizerCSS};
  position: absolute;
  bottom: 0;
  height: ${ActionExecutionResizerHeight}px;
  min-height: ${TABS_HEADER_HEIGHT}px;
  background-color: ${(props) => props.theme.colors.debugger.background};
  border-top: 1px solid ${Colors.ALTO};

  ul.ads-v2-tabs__list {
    padding: 0px ${(props) => props.theme.spaces[12]}px;
  }
  .ads-v2-tabs__panel {
    height: calc(100% - ${TABS_HEADER_HEIGHT}px);
  }
`;

function WorkflowRunHistoryPane() {
  const dispatch = useDispatch();
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const selectedTab = useSelector(getRunHistorySelectedTab);
  const responsePaneHeight = useSelector(getRunHistoryResponsePaneHeight);
  const updateResponsePaneHeight = useCallback((height: number) => {
    dispatch(setRunHistoryResponsePaneHeight(height));
  }, []);

  const setSelectedTab = (tabKey: string) => {
    if (tabKey === selectedTab) return;
    if (tabKey === "") tabKey = RUN_HISTORY_TAB_KEYS.RUN_HISTORY;
    dispatch(setDebuggerSelectedTab(tabKey));
  };
  const onClose = () => dispatch(toggleRunHistoryPane(false));

  const RUN_HISTORY_TABS = [
    {
      key: RUN_HISTORY_TAB_KEYS.RUN_HISTORY,
      title: createMessage(WORKFLOW_RUN_HISTORY_PANE_TRIGGER_TAB),
      panelComponent: <RunHistoryTab />,
    },
  ];
  return (
    <Container
      className="t--debugger-tabs-container"
      onClick={stopEventPropagation}
      ref={panelRef}
    >
      <Resizer
        initialHeight={responsePaneHeight}
        onResizeComplete={(height: number) => {
          updateResponsePaneHeight(height);
        }}
        panelRef={panelRef}
        snapToHeight={ActionExecutionResizerHeight}
      />
      <EntityBottomTabs
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        onSelect={setSelectedTab}
        selectedTabKey={selectedTab}
        tabs={RUN_HISTORY_TABS}
      />
      <CloseDebugger
        className="close-debugger t--close-debugger"
        isIconButton
        kind="tertiary"
        onClick={onClose}
        size="md"
        startIcon="close-modal"
      />
    </Container>
  );
}

export default WorkflowRunHistoryPane;
