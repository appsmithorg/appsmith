import React, { useRef, useEffect } from "react";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useDispatch, useSelector } from "react-redux";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { EntityExplorerWrapper } from "pages/Editor/Explorer/Common/EntityExplorerWrapper";
import Files from "pages/Editor/Explorer/Files";
import {
  ActionEntityContextMenuItemsEnum,
  FilesContextProvider,
} from "pages/Editor/Explorer/Files/FilesContextProvider";
import {
  getCurrentWorkflowId,
  getWorkflowById,
} from "@appsmith/selectors/workflowSelectors";
import type { AppState } from "@appsmith/reducers";
import { hasCreateWorkflowActionsPermission } from "@appsmith/utils/permissionHelpers";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";

function WorkflowEntityExplorer({ isActive }: { isActive: boolean }) {
  const dispatch = useDispatch();
  PerformanceTracker.startTracking(PerformanceTransactionName.ENTITY_EXPLORER);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId]);

  const workflowId = useSelector(getCurrentWorkflowId) || "";
  const workflow = useSelector((state: AppState) =>
    getWorkflowById(state, workflowId),
  );

  const canCreateActions = hasCreateWorkflowActionsPermission(
    workflow.userPermissions,
  );

  return (
    <EntityExplorerWrapper explorerRef={explorerRef} isActive={isActive}>
      <FilesContextProvider
        canCreateActions={canCreateActions}
        editorId={workflowId}
        menuItems={[
          ActionEntityContextMenuItemsEnum.EDIT_NAME,
          ActionEntityContextMenuItemsEnum.DELETE,
        ]}
        parentEntityId={workflowId}
        parentEntityType={ActionParentEntityType.WORKFLOW}
      >
        <Files />
      </FilesContextProvider>
    </EntityExplorerWrapper>
  );
}

WorkflowEntityExplorer.displayName = "WorkflowEntityExplorer";

export default WorkflowEntityExplorer;
