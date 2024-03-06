import {
  Button,
  Divider,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";

import {
  IMPORT_BTN_LABEL,
  NEW_APP,
  NEW_APP_FROM_TEMPLATE,
  WORKSPACE_ACTION_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getIsCreatingApplicationByWorkspaceId } from "@appsmith/selectors/applicationSelectors";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

export interface WorkspaceActionProps {
  workspace: Workspace;
  isMobile: boolean;
  enableImportExport: boolean;
  workspaceId: string;
  onCreateNewApplication: (workspaceId: string) => void;
  onStartFromTemplate: (workspaceId: string) => void;
  setSelectedWorkspaceIdForImportApplication: (workspaceId?: string) => void;
}

function WorkspaceAction({
  enableImportExport,
  isMobile,
  onCreateNewApplication,
  onStartFromTemplate,
  setSelectedWorkspaceIdForImportApplication,
  workspace,
  workspaceId,
}: WorkspaceActionProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isCreatingApplication = Boolean(
    useSelector(getIsCreatingApplicationByWorkspaceId(workspace.id)),
  );
  const isCreateAppFromTemplatesEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_create_app_from_templates_enabled,
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
          startIcon="apps-line"
        >
          {createMessage(NEW_APP)}
        </MenuItem>
        {<Divider className="!block mb-[2px]" />}
        {isCreateAppFromTemplatesEnabled && (
          <MenuItem
            data-testid="t--workspace-action-create-app-from-template"
            disabled={!hasCreateNewApplicationPermission}
            onSelect={() => onStartFromTemplate(workspaceId)}
            startIcon="layout-2-line"
          >
            {createMessage(NEW_APP_FROM_TEMPLATE)}
          </MenuItem>
        )}
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
