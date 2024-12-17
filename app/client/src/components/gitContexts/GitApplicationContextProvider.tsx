import React from "react";
import { useSelector } from "react-redux";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import GitContextProvider from "git/components/GitContextProvider";
import { GitArtifactType } from "git/constants/enums";
import applicationStatusTransformer from "git/artifactHelpers/application/statusTransformer";
import { hasCreateNewAppPermission } from "ee/utils/permissionHelpers";
import { setWorkspaceIdForImport } from "ee/actions/applicationActions";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";

interface GitApplicationContextProviderProps {
  children: React.ReactNode;
}

export default function GitApplicationContextProvider({
  children,
}: GitApplicationContextProviderProps) {
  const artifactType = GitArtifactType.Application;
  const application = useSelector(getCurrentApplication);
  const workspace = useSelector(getCurrentAppWorkspace);
  const isCreateNewApplicationPermitted = hasCreateNewAppPermission(
    workspace.userPermissions,
  );

  return (
    <GitContextProvider
      artifact={application ?? null}
      artifactType={artifactType}
      baseArtifactId={application?.baseId ?? ""}
      isCreateArtifactPermitted={isCreateNewApplicationPermitted}
      setWorkspaceIdForImport={setWorkspaceIdForImport}
      statusTransformer={applicationStatusTransformer}
    >
      {children}
    </GitContextProvider>
  );
}
