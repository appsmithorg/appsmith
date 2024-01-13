import React from "react";
import styled from "styled-components";
import {
  Button,
  Menu,
  MenuItem,
  MenuContent,
  MenuTrigger,
} from "design-system";
import {
  EditInteractionKind,
  EditableText,
  SavingState,
  notEmptyValidator,
} from "design-system-old";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "pages/common/CustomizedDropdown/dropdownHelpers";
import { ManageEnvironmentsMenu } from "@appsmith/pages/Applications/ManageEnvironmentsMenu";

interface WorkspaceMenuProps {
  canDeleteWorkspace: boolean;
  canInviteToWorkspace: boolean;
  enableImportExport: boolean;
  handleDeleteWorkspace: (workspaceId: string) => void;
  handleResetMenuState: () => void;
  handleWorkspaceMenuClose: (open: boolean) => void;
  hasCreateNewApplicationPermission: boolean;
  hasManageWorkspacePermissions: boolean;
  isFetchingResources: boolean;
  isSavingWorkspaceInfo: boolean;
  leaveWS: (workspaceId: string) => void;
  setSelectedWorkspaceIdForImportApplication: (workspaceId?: string) => void;
  setWarnLeavingWorkspace: (show: boolean) => void;
  setWarnDeleteWorkspace: (show: boolean) => void;
  setWorkspaceToOpenMenu: (value: string | null) => void;
  warnDeleteWorkspace: boolean;
  warnLeavingWorkspace: boolean;
  workspace: Workspace;
  workspaceNameChange: (newName: string, workspaceId: string) => void;
  workspaceToOpenMenu: string | null;
}

const WorkspaceRename = styled(EditableText)`
  padding: 0 2px;
`;

function WorkspaceMenu({
  canDeleteWorkspace,
  canInviteToWorkspace,
  enableImportExport,
  handleDeleteWorkspace,
  handleResetMenuState,
  handleWorkspaceMenuClose,
  hasCreateNewApplicationPermission,
  hasManageWorkspacePermissions,
  isFetchingResources,
  isSavingWorkspaceInfo,
  leaveWS,
  setSelectedWorkspaceIdForImportApplication,
  setWarnDeleteWorkspace,
  setWarnLeavingWorkspace,
  setWorkspaceToOpenMenu,
  warnDeleteWorkspace,
  warnLeavingWorkspace,
  workspace,
  workspaceNameChange,
  workspaceToOpenMenu,
}: WorkspaceMenuProps) {
  return (
    <Menu
      className="t--workspace-name"
      data-testid="t--workspace-name"
      onOpenChange={handleWorkspaceMenuClose}
      open={workspace.id === workspaceToOpenMenu}
    >
      <MenuTrigger>
        <Button
          className="t--options-icon"
          isDisabled={isFetchingResources}
          isIconButton
          kind="tertiary"
          onClick={() => {
            setWorkspaceToOpenMenu(workspace.id);
          }}
          size="md"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent
        align="end"
        onEscapeKeyDown={handleResetMenuState}
        onInteractOutside={handleResetMenuState}
        width="205px"
      >
        {hasManageWorkspacePermissions && (
          <>
            <div
              className="px-3 py-2"
              onKeyDown={(e) => {
                // This is to prevent the Menu component to take focus away from the input
                // https://github.com/radix-ui/primitives/issues/1175
                e.stopPropagation();
              }}
            >
              <WorkspaceRename
                className="t--workspace-rename-input"
                defaultValue={workspace.name}
                editInteractionKind={EditInteractionKind.SINGLE}
                fill
                hideEditIcon={false}
                isEditingDefault={false}
                isInvalid={(value: string) => {
                  return notEmptyValidator(value).message;
                }}
                onBlur={(value: string) => {
                  workspaceNameChange(value, workspace.id);
                }}
                placeholder="Workspace name"
                savingState={
                  isSavingWorkspaceInfo
                    ? SavingState.STARTED
                    : SavingState.NOT_STARTED
                }
                underline
              />
            </div>
            <MenuItem
              data-testid="t--workspace-setting"
              onSelect={() =>
                getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                  path: `/workspace/${workspace.id}/settings/general`,
                })
              }
              startIcon="settings-2-line"
            >
              Settings
            </MenuItem>
          </>
        )}
        {enableImportExport && hasCreateNewApplicationPermission && (
          <MenuItem
            data-testid="t--workspace-import-app"
            onSelect={() =>
              setSelectedWorkspaceIdForImportApplication(workspace.id)
            }
            startIcon="download"
          >
            Import
          </MenuItem>
        )}
        {hasManageWorkspacePermissions && canInviteToWorkspace && (
          <MenuItem
            onSelect={() =>
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: `/workspace/${workspace.id}/settings/members`,
              })
            }
            startIcon="member"
          >
            Members
          </MenuItem>
        )}
        <ManageEnvironmentsMenu
          workspaceId={workspace.id}
          workspacePermissions={workspace.userPermissions || []}
        />
        {canInviteToWorkspace && (
          <MenuItem
            className="error-menuitem"
            onSelect={() => {
              !warnLeavingWorkspace
                ? setWarnLeavingWorkspace(true)
                : leaveWS(workspace.id);
            }}
            startIcon="logout"
          >
            {!warnLeavingWorkspace ? "Leave workspace" : "Are you sure?"}
          </MenuItem>
        )}
        {canDeleteWorkspace && (
          <MenuItem
            className="error-menuitem"
            onSelect={() => {
              warnDeleteWorkspace
                ? handleDeleteWorkspace(workspace.id)
                : setWarnDeleteWorkspace(true);
            }}
            startIcon="delete-bin-line"
          >
            {!warnDeleteWorkspace ? "Delete workspace" : "Are you sure?"}
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

export default WorkspaceMenu;
