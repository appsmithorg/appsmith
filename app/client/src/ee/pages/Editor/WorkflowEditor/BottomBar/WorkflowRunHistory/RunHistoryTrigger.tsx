import { useDispatch, useSelector } from "react-redux";
import { getShowRunHistoryPaneState } from "ee/selectors/workflowRunHistorySelectors";
import React from "react";
import { Button, Tooltip } from "design-system";
import { toggleRunHistoryPane } from "@appsmith/actions/workflowRunHistoryActions";
import {
  WORKFLOW_RUN_HISTORY_PANE_TRIGGER_HIDE_TOOLTIP,
  WORKFLOW_RUN_HISTORY_PANE_TRIGGER_LABEL,
  WORKFLOW_RUN_HISTORY_PANE_TRIGGER_SHOW_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import WorkflowRunHistoryPane from ".";

function RunHistory() {
  // Run history render flag
  const paneVisible = useSelector(getShowRunHistoryPaneState);

  return paneVisible ? <WorkflowRunHistoryPane /> : null;
}

export function RunHistoryTrigger() {
  const dispatch = useDispatch();
  const paneVisible = useSelector(getShowRunHistoryPaneState);

  const onClick = () => {
    dispatch(toggleRunHistoryPane(!paneVisible));
  };

  const tooltipContent = createMessage(
    !paneVisible
      ? WORKFLOW_RUN_HISTORY_PANE_TRIGGER_SHOW_TOOLTIP
      : WORKFLOW_RUN_HISTORY_PANE_TRIGGER_HIDE_TOOLTIP,
  );

  return (
    <Tooltip content={tooltipContent}>
      <Button
        className="t--debugger-count"
        kind={"tertiary"}
        onClick={onClick}
        size="md"
        startIcon={"close-circle-line"}
      >
        {createMessage(WORKFLOW_RUN_HISTORY_PANE_TRIGGER_LABEL)}
      </Button>
    </Tooltip>
  );
}

export default RunHistory;
