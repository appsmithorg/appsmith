import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GitArtifactType, GitContextProvider } from "git";
import {
  getCurrentApplication,
  getWorkspaceIdForImport,
} from "ee/selectors/applicationSelectors";
import {
  hasGitAppConnectPermission,
  hasGitAppManageAutoCommitPermission,
  hasGitAppManageDefaultBranchPermission,
  hasGitAppManageProtectedBranchesPermission,
} from "ee/utils/permissionHelpers";
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
  const artifact = useSelector(getCurrentApplication);
  const artifacts = useSelector(getApplicationsOfWorkspace);
  const workspace = useSelector(getCurrentAppWorkspace);
  const importWorkspaceId = useSelector(getWorkspaceIdForImport);

  const isConnectPermitted = hasGitAppConnectPermission(
    artifact?.userPermissions ?? [],
  );

  const isManageAutocommitPermitted = useMemo(() => {
    return hasGitAppManageAutoCommitPermission(artifact?.userPermissions ?? []);
  }, [artifact]);

  const isManageDefaultBranchPermitted = useMemo(() => {
    return hasGitAppManageDefaultBranchPermission(
      artifact?.userPermissions ?? [],
    );
  }, [artifact]);

  const isManageProtectedBranchesPermitted = useMemo(() => {
    return hasGitAppManageProtectedBranchesPermission(
      artifact?.userPermissions ?? [],
    );
  }, [artifact]);

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
      artifact={artifact ?? null}
      artifactType={artifactType}
      artifacts={artifacts ?? null}
      baseArtifactId={artifact?.baseId ?? ""}
      fetchArtifacts={fetchApplications}
      importWorkspaceId={importWorkspaceId}
      isConnectPermitted={isConnectPermitted}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
      isManageProtectedBranchesPermitted={isManageProtectedBranchesPermitted}
      setImportWorkspaceId={setImportWorkspaceId}
      statusTransformer={applicationStatusTransformer}
      workspace={workspace ?? null}
    >
      {children}
    </GitContextProvider>
  );
}
