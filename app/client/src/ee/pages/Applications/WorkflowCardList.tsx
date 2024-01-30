export * from "ce/pages/Applications/WorkflowCardList";
import React from "react";
import { useSelector } from "react-redux";
import WorkflowCardListRenderer from "./WorkflowCardListRenderer";
import { hasManageWorkspaceWorkflowPermission } from "@appsmith/utils/permissionHelpers";
import {
  getIsFetchingWorkflows,
  getShowWorkflowFeature,
} from "@appsmith/selectors/workflowSelectors";
import type { WorkflowCardListProps } from "@appsmith/pages/Applications/WorkflowCardList";

function WorkflowCardList({
  isMobile,
  workflows = [],
  workspace,
  workspaceId,
}: WorkflowCardListProps) {
  const showWorkflowFeature = useSelector(getShowWorkflowFeature);
  const isFetchingWorkflows = useSelector(getIsFetchingWorkflows);

  const canManageWorkflows = hasManageWorkspaceWorkflowPermission(
    workspace?.userPermissions,
  );

  // If the workflow feature is not enabled, or if the user is not allowed to manage workflows,
  // or if we are fetching workflows, don't render the workflow list
  if (!showWorkflowFeature || isFetchingWorkflows || !canManageWorkflows)
    return null;

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
