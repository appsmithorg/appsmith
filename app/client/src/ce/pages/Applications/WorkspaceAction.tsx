import React, { useCallback, useState } from "react";
import {
  Button,
  Divider,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import { useSelector } from "react-redux";

import { getIsCreatingApplicationByWorkspaceId } from "@appsmith/selectors/applicationSelectors";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";
import {
  IMPORT_BTN_LABEL,
  WORKSPACE_ACTION_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import { NEW_APP } from "@appsmith/constants/messages";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";

export interface WorkspaceActionProps {
  workspace: Workspace;
  isMobile: boolean;
  enableImportExport: boolean;
  workspaceId: string;
  onCreateNewApplication: (workspaceId: string) => void;
  setSelectedWorkspaceIdForImportApplication: (workspaceId?: string) => void;
}

function WorkspaceAction({
  enableImportExport,
  isMobile,
  onCreateNewApplication,
  setSelectedWorkspaceIdForImportApplication,
  workspace,
}: WorkspaceActionProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isCreatingApplication = Boolean(
    useSelector(getIsCreatingApplicationByWorkspaceId(workspace.id)),
  );

  const openActionMenu = useCallback(() => {
    setIsActionMenuOpen(true);
  }, []);

  const closeActionMenu = useCallback(() => {
    setIsActionMenuOpen(false);
  }, []);

  if (!workspace) return null;

  const hasCreateNewApplicationPermission =
    hasCreateNewAppPermission(workspace.userPermissions) && !isMobile;

  if (!hasCreateNewApplicationPermission || isFetchingApplications) return null;

  return (
    <Menu
      data-testid="t--workspace-action-menu"
      onOpenChange={setIsActionMenuOpen}
      open={isActionMenuOpen}
    >
      <MenuTrigger>
        <Button
          className="t--new-button createnew"
          endIcon="arrow-down-s-line"
          isLoading={isCreatingApplication}
          onClick={openActionMenu}
          size="md"
        >
          {createMessage(WORKSPACE_ACTION_BUTTON)}
        </Button>
      </MenuTrigger>
      <MenuContent
        align="end"
        onEscapeKeyDown={closeActionMenu}
        onInteractOutside={closeActionMenu}
      >
        <MenuItem
          data-testid="t--workspace-action-create-app"
          disabled={!hasCreateNewApplicationPermission}
          onSelect={() => onCreateNewApplication(workspace.id)}
          startIcon="group-control"
        >
          {createMessage(NEW_APP)}
        </MenuItem>
        <Divider className="!block mb-[2px]" />
        {enableImportExport && hasCreateNewApplicationPermission && (
          <MenuItem
            data-testid="t--workspace-import-app"
            onSelect={() =>
              setSelectedWorkspaceIdForImportApplication(workspace.id)
            }
            startIcon="upload-cloud"
          >
            {createMessage(IMPORT_BTN_LABEL)}
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

export default WorkspaceAction;
