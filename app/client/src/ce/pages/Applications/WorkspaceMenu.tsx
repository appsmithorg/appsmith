import React from "react";
import styled from "styled-components";
import { Button, Icon, Menu, MenuContent, MenuTrigger } from "@appsmith/ads";
import {
  EditInteractionKind,
  EditableText,
  SavingState,
  notEmptyValidator,
} from "@appsmith/ads-old";
import type { Workspace } from "ee/constants/workspaceConstants";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "pages/common/CustomizedDropdown/dropdownHelpers";
import { ManageEnvironmentsMenu } from "ee/pages/Applications/ManageEnvironmentsMenu";

interface WorkspaceMenuProps {
  canDeleteWorkspace: boolean;
  canInviteToWorkspace: boolean;
  handleDeleteWorkspace: (workspaceId: string) => void;
  handleResetMenuState: () => void;
  handleWorkspaceMenuClose: (open: boolean) => void;
  hasCreateNewApplicationPermission: boolean;
  hasManageWorkspacePermissions: boolean;
  isFetchingResources: boolean;
  isSavingWorkspaceInfo: boolean;
  leaveWS: (workspaceId: string) => void;
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

export const CustomMenuItem = styled.span`
  display: flex;
  align-items: center;
  padding: var(--ads-v2-spaces-3);
  margin-bottom: var(--ads-v2-spaces-1);
  gap: var(--ads-v2-spaces-3);
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  position: relative;
  color: var(--ads-v2-color-fg);
  min-height: 36px;
  box-sizing: border-box;
  font-size: var(--ads-v2-font-size-4);

  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

function WorkspaceMenu({
  canDeleteWorkspace,
  canInviteToWorkspace,
  handleDeleteWorkspace,
  handleResetMenuState,
  handleWorkspaceMenuClose,
  hasManageWorkspacePermissions,
  isFetchingResources,
  isSavingWorkspaceInfo,
  leaveWS,
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
            <CustomMenuItem
              className="workspace-menu-item"
              data-testid="t--workspace-setting"
              onClick={() =>
                getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                  path: `/workspace/${workspace.id}/settings/general`,
                })
              }
            >
              <Icon name="settings-2-line" size="md" />
              Settings
            </CustomMenuItem>
          </>
        )}
        {hasManageWorkspacePermissions && canInviteToWorkspace && (
          <CustomMenuItem
            className="workspace-menu-item"
            onClick={() =>
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: `/workspace/${workspace.id}/settings/members`,
              })
            }
          >
            <Icon name="group-line" size="md" />
            Members
          </CustomMenuItem>
        )}
        <ManageEnvironmentsMenu
          workspaceId={workspace.id}
          workspacePermissions={workspace.userPermissions || []}
        />
        {canInviteToWorkspace && (
          <CustomMenuItem
            className="error-menuitem workspace-menu-item"
            onClick={() => {
              !warnLeavingWorkspace
                ? (setWarnLeavingWorkspace(true), setWarnDeleteWorkspace(false))
                : leaveWS(workspace.id);
            }}
          >
            <Icon name="logout" size="md" />
            {!warnLeavingWorkspace ? "Leave workspace" : "Are you sure?"}
          </CustomMenuItem>
        )}
        {canDeleteWorkspace && (
          <CustomMenuItem
            className="error-menuitem workspace-menu-item"
            onClick={() => {
              warnDeleteWorkspace
                ? handleDeleteWorkspace(workspace.id)
                : (setWarnDeleteWorkspace(true),
                  setWarnLeavingWorkspace(false));
            }}
          >
            <Icon name="delete-bin-line" size="md" />
            {!warnDeleteWorkspace ? "Delete workspace" : "Are you sure?"}
          </CustomMenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

export default WorkspaceMenu;
