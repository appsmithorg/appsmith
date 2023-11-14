import { Button, Popover, PopoverTrigger } from "design-system";
import React from "react";
import history from "utils/history";
import { builderURL } from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

const CreateDatasourcePopover = () => {
  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );
  if (!canCreateDatasource) {
    return null;
  }
  return (
    <Popover open={false}>
      <PopoverTrigger>
        <Button
          className={"t--add-datasource-button"}
          isIconButton
          kind="tertiary"
          onClick={() =>
            history.push(
              builderURL({
                suffix: "datasources/NEW",
              }),
            )
          }
          size="sm"
          startIcon="add-line"
        />
      </PopoverTrigger>
    </Popover>
  );
};

export default CreateDatasourcePopover;
