import React from "react";
import { noop } from "lodash";

import ApplicationCardList from "./ApplicationCardList";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";

type ResourcesLoaderProps = {
  isMobile: boolean;
  resources: ApplicationPayload[];
  workspaceId: string;
};

function ResourcesLoader({
  isMobile,
  resources,
  workspaceId,
}: ResourcesLoaderProps) {
  return (
    <ApplicationCardList
      applications={resources}
      canInviteToWorkspace={false}
      deleteApplication={noop}
      enableImportExport={false}
      hasCreateNewApplicationPermission={false}
      hasManageWorkspacePermissions={false}
      isMobile={isMobile}
      onClickAddNewButton={noop}
      updateApplicationDispatch={noop}
      workspaceId={workspaceId}
    />
  );
}

export default ResourcesLoader;
