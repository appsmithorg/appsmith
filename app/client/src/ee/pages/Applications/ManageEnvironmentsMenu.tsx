import React from "react";
import { MenuItem } from "design-system";
import {
  getOnSelectAction,
  DropdownOnSelectActions,
} from "pages/common/CustomizedDropdown/dropdownHelpers";
import { useSelector } from "react-redux";
import { allowManageEnvironmentAccessForWorkspace } from "@appsmith/selectors/environmentSelectors";
import type { AppState } from "@appsmith/reducers";

export const ManageEnvironmentsMenu = ({
  workspaceId,
  workspacePermissions,
}: {
  workspaceId: string;
  workspacePermissions: string[];
}) => {
  const renderManageEnvironmentMenu = useSelector((state: AppState) =>
    allowManageEnvironmentAccessForWorkspace(state, workspacePermissions),
  );

  if (!renderManageEnvironmentMenu) return null;

  return (
    <MenuItem
      data-testid="t--workspace-manage-environments"
      onSelect={() =>
        getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
          path: `/workspace/${workspaceId}/settings/environments`,
        })
      }
      startIcon="datasources-2"
    >
      Environments
    </MenuItem>
  );
};
