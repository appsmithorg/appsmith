import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GitArtifactType, GitContextProvider } from "git";
import {
  getCurrentApplication,
  getWorkspaceIdForImport,
} from "ee/selectors/applicationSelectors";
import { hasCreateNewAppPermission } from "ee/utils/permissionHelpers";
import {
  fetchAllApplicationsOfWorkspace,
  setWorkspaceIdForImport,
} from "ee/actions/applicationActions";
import {
  getApplicationsOfWorkspace,
  getCurrentAppWorkspace,
} from "ee/selectors/selectedWorkspaceSelectors";
import { applicationStatusTransformer } from "git/artifact-helpers/application";

interface GitApplicationContextProviderProps {
  children: React.ReactNode;
}

export default function GitApplicationContextProvider({
  children,
}: GitApplicationContextProviderProps) {
  const dispatch = useDispatch();

  const artifactType = GitArtifactType.Application;
  const application = useSelector(getCurrentApplication);
  const applications = useSelector(getApplicationsOfWorkspace);
  const workspace = useSelector(getCurrentAppWorkspace);
  const importWorkspaceId = useSelector(getWorkspaceIdForImport);
  const isCreateNewApplicationPermitted = hasCreateNewAppPermission(
    workspace.userPermissions,
  );

  const setImportWorkspaceId = useCallback(() => {
    dispatch(
      setWorkspaceIdForImport({ editorId: "", workspaceId: workspace.id }),
    );
  }, [dispatch, workspace.id]);

  const fetchApplications = useCallback(() => {
    dispatch(fetchAllApplicationsOfWorkspace());
  }, [dispatch]);

  return (
    <GitContextProvider
      artifact={application ?? null}
      artifactType={artifactType}
      artifacts={applications ?? null}
      baseArtifactId={application?.baseId ?? ""}
      fetchArtifacts={fetchApplications}
      importWorkspaceId={importWorkspaceId}
      isCreateArtifactPermitted={isCreateNewApplicationPermitted}
      setImportWorkspaceId={setImportWorkspaceId}
      statusTransformer={applicationStatusTransformer}
      workspace={workspace ?? null}
    >
      {children}
    </GitContextProvider>
  );
}
