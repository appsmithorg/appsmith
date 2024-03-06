export * from "ce/pages/Applications/WorkflowCardList";
import React from "react";
import { useSelector } from "react-redux";
import WorkflowCardListRenderer from "./WorkflowCardListRenderer";
import {
  getIsFetchingWorkflows,
  getShowWorkflowFeature,
} from "@appsmith/selectors/workflowSelectors";
import type { WorkflowCardListProps } from "@appsmith/pages/Applications/WorkflowCardList";

function WorkflowCardList({
  isMobile,
  workflows = [],
  workspaceId,
}: WorkflowCardListProps) {
  const showWorkflowFeature = useSelector(getShowWorkflowFeature);
  const isFetchingWorkflows = useSelector(getIsFetchingWorkflows);

  // If the workflow feature is not enabled
  // or if we are fetching workflows, don't render the workflow list
  if (!showWorkflowFeature || isFetchingWorkflows) return null;

  return (
    <WorkflowCardListRenderer
      isFetchingWorkflows={isFetchingWorkflows}
      isMobile={isMobile}
      workflows={workflows}
      workspaceId={workspaceId}
    />
  );
}

export default WorkflowCardList;
