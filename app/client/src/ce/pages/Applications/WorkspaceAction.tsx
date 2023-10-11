import React from "react";
import { Button } from "design-system";
import { useSelector } from "react-redux";

import {
  getIsCreatingApplicationByWorkspaceId,
  getIsFetchingApplications,
  getUserApplicationsWorkspacesList,
} from "@appsmith/selectors/applicationSelectors";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";

export interface WorkspaceActionProps {
  workspaceId: string;
  isMobile: boolean;
  onCreateNewApplication: (workspaceId: string) => void;
}

function WorkspaceAction({
  isMobile,
  onCreateNewApplication,
  workspaceId,
}: WorkspaceActionProps) {
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isCreatingApplication = Boolean(
    useSelector(getIsCreatingApplicationByWorkspaceId(workspaceId)),
  );
  const workspaceList = useSelector(getUserApplicationsWorkspacesList);
  const workspaceObject = workspaceList.find(
    ({ workspace }) => workspace.id === workspaceId,
  );

  if (!workspaceObject) return null;

  const { applications, workspace } = workspaceObject;

  const hasCreateNewApplicationPermission =
    hasCreateNewAppPermission(workspace.userPermissions) && !isMobile;

  if (
    !hasCreateNewApplicationPermission ||
    isFetchingApplications ||
    applications.length === 0
  )
    return null;

  return (
    <Button
      className="t--new-button createnew"
      isLoading={isCreatingApplication}
      onClick={() => onCreateNewApplication(workspace.id)}
      size="md"
      startIcon={"plus"}
    >
      New
    </Button>
  );
}

export default WorkspaceAction;
