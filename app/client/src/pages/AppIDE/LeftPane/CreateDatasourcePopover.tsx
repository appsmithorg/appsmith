import { Button, Popover, PopoverTrigger } from "@appsmith/ads";
import React from "react";
import history from "utils/history";
import { builderURL } from "ee/RouteBuilder";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

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
