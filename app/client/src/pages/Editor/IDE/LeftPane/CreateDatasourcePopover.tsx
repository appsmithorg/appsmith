import React from "react";

import { builderURL } from "ee/RouteBuilder";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useSelector } from "react-redux";
import history from "utils/history";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { Button, Popover, PopoverTrigger } from "@appsmith/ads";

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
