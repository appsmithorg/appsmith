export * from "ce/pages/Applications/WorkspaceAction";
import type { WorkspaceActionProps as CE_WorkspaceActionProps } from "ce/pages/Applications/WorkspaceAction";
import { default as CE_WorkspaceAction } from "ce/pages/Applications/WorkspaceAction";

import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";

import {
  getIsCreatingApplicationByWorkspaceId,
  getUserApplicationsWorkspacesList,
} from "@appsmith/selectors/applicationSelectors";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { createPackageFromWorkspace } from "@appsmith/actions/packageActions";
import { getIsCreatingPackage } from "@appsmith/selectors/packageSelectors";
import {
  NEW_APP,
  NEW_PACKAGE,
  NEW_WORKFLOW,
  WORKSPACE_ACTION_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import {
  hasCreateNewAppPermission,
  hasCreatePackagePermission,
  hasCreateWorkflowPermission,
} from "@appsmith/utils/permissionHelpers";
import { createWorkflowFromWorkspace } from "@appsmith/actions/workflowActions";
import {
  getIsCreatingWorkflow,
  getShowWorkflowFeature,
} from "@appsmith/selectors/workflowSelectors";

const StyledCreateNewButton = styled(Button)`
  margin-left: var(--ads-spaces-3);
`;

function WorkspaceAction(props: CE_WorkspaceActionProps) {
  const { isMobile, onCreateNewApplication, workspaceId } = props;

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const showQueryModule = useSelector(getShowQueryModule);
  const showWorkflowFeature = useSelector(getShowWorkflowFeature);
  const isCreatingApplication = Boolean(
    useSelector(getIsCreatingApplicationByWorkspaceId(workspaceId)),
  );
  const isCreatingPackage = useSelector((state) =>
    getIsCreatingPackage(state, workspaceId),
  );
  const isCreatingWorkflow = useSelector((state) =>
    getIsCreatingWorkflow(state, workspaceId),
  );
  const userWorkspaces = useSelector(getUserApplicationsWorkspacesList);
  const currentUserWorkspace = userWorkspaces.find(
    (w) => w.workspace.id === workspaceId,
  );

  const openActionMenu = useCallback(() => {
    setIsActionMenuOpen(true);
  }, []);

  const closeActionMenu = useCallback(() => {
    setIsActionMenuOpen(false);
  }, []);

  const onCreateNewPackage = useCallback(() => {
    dispatch(createPackageFromWorkspace({ workspaceId }));
  }, [dispatch, createPackageFromWorkspace, workspaceId]);

  const onCreateNewWorkflow = useCallback(() => {
    dispatch(createWorkflowFromWorkspace({ workspaceId }));
  }, [dispatch, createWorkflowFromWorkspace, workspaceId]);

  if (!currentUserWorkspace) return null;

  const { workspace } = currentUserWorkspace;

  const hasCreateNewApplicationPermission =
    hasCreateNewAppPermission(workspace?.userPermissions) && !isMobile;
  const hasCreateNewPackagePermission =
    hasCreatePackagePermission(workspace?.userPermissions) && !isMobile;
  const hasCreateNewWorkflowPermission =
    hasCreateWorkflowPermission(workspace?.userPermissions) && !isMobile;

  const isCreating =
    isCreatingApplication || isCreatingPackage || isCreatingWorkflow;

  if (!showQueryModule && !showWorkflowFeature) {
    return <CE_WorkspaceAction {...props} />;
  }

  // Returns null when in mobile mode and neither create package or app permissions are present
  if (
    isMobile ||
    (!hasCreateNewApplicationPermission &&
      !hasCreateNewPackagePermission &&
      !hasCreateNewWorkflowPermission)
  )
    return null;

  return (
    <Menu
      data-testid="t--workspace-action-menu"
      onOpenChange={setIsActionMenuOpen}
      open={isActionMenuOpen}
    >
      <MenuTrigger>
        <StyledCreateNewButton
          data-testid="t--workspace-action-btn"
          endIcon="arrow-down-s-line"
          isLoading={isCreating}
          kind="primary"
          onClick={openActionMenu}
          size="md"
        >
          {createMessage(WORKSPACE_ACTION_BUTTON)}
        </StyledCreateNewButton>
      </MenuTrigger>
      <MenuContent
        align="end"
        onEscapeKeyDown={closeActionMenu}
        onInteractOutside={closeActionMenu}
      >
        <MenuItem
          data-testid="t--workspace-action-create-app"
          disabled={!hasCreateNewApplicationPermission}
          onSelect={() => onCreateNewApplication(workspaceId)}
          startIcon="apps-line"
        >
          {createMessage(NEW_APP)}
        </MenuItem>
        {showQueryModule && (
          <MenuItem
            data-testid="t--workspace-action-create-package"
            disabled={!hasCreateNewPackagePermission}
            onSelect={onCreateNewPackage}
            startIcon="package"
          >
            {createMessage(NEW_PACKAGE)}
          </MenuItem>
        )}
        {showWorkflowFeature && (
          <MenuItem
            data-testid="t--workspace-action-create-workflow"
            disabled={!hasCreateNewWorkflowPermission}
            onSelect={onCreateNewWorkflow}
            // TODO (Workflows): Change icon to workflow
            startIcon="package"
          >
            {createMessage(NEW_WORKFLOW)}
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

export default WorkspaceAction;
