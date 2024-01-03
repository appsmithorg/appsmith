export * from "ce/pages/Applications/WorkflowCardList";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import WorkflowCardListRenderer from "./WorkflowCardListRenderer";
import { hasManageWorkspaceWorkflowPermission } from "@appsmith/utils/permissionHelpers";
import {
  getIsCreatingWorkflow,
  getIsFetchingWorkflows,
  getShowWorkflowFeature,
} from "@appsmith/selectors/workflowSelectors";
import type { WorkflowCardListProps } from "ce/pages/Applications/WorkflowCardList";
import { createWorkflowFromWorkspace } from "@appsmith/actions/workflowActions";

function WorkflowCardList({
  isMobile,
  workflows = [],
  workspace,
  workspaceId,
}: WorkflowCardListProps) {
  const dispatch = useDispatch();
  const showWorkflowFeature = useSelector(getShowWorkflowFeature);
  const isCreatingWorkflow = useSelector((state) =>
    getIsCreatingWorkflow(state, workspaceId),
  );
  const isFetchingWorkflows = useSelector(getIsFetchingWorkflows);
  const onCreateNewWorkflow = useCallback(() => {
    dispatch(createWorkflowFromWorkspace({ workspaceId }));
  }, [createWorkflowFromWorkspace, dispatch, workspaceId]);

  const canManageWorkflows = hasManageWorkspaceWorkflowPermission(
    workspace?.userPermissions,
  );

  // If the workflow feature is not enabled, or if the user is not allowed to manage workflows,
  // or if we are fetching workflows, don't render the workflow list
  if (!showWorkflowFeature || isFetchingWorkflows || !canManageWorkflows)
    return null;

  return (
    <WorkflowCardListRenderer
      createWorkflow={onCreateNewWorkflow}
      isCreatingWorkflow={isCreatingWorkflow}
      isFetchingWorkflows={isFetchingWorkflows}
      isMobile={isMobile}
      workflows={workflows}
      workspaceId={workspaceId}
    />
  );
}

export default WorkflowCardList;
