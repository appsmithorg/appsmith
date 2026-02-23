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
import applicationStatusTransformer from "../applicationStatusTransformer";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { fetchSSHKeysInit } from "ee/actions/sshKeysActions";
import {
  selectSSHKeysList,
  selectSSHKeysLoading,
} from "ee/selectors/sshKeysSelectors";
import { adminSettingsCategoryUrl } from "ee/RouteBuilder";
import { SettingCategories } from "ee/pages/AdminSettings/config/types";
import history from "utils/history";

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

  // SSH key manager
  const isSSHKeyManagerEnabled = useFeatureFlag(
    FEATURE_FLAG.release_ssh_key_manager_enabled,
  );
  const sshKeys = useSelector(selectSSHKeysList);
  const isSSHKeysLoading = useSelector(selectSSHKeysLoading);

  const fetchSSHKeys = useCallback(() => {
    dispatch(fetchSSHKeysInit());
  }, [dispatch]);

  const onCreateSSHKey = useCallback(() => {
    history.push(
      adminSettingsCategoryUrl({ category: SettingCategories.SSH_KEYS }),
    );
  }, []);

  return (
    <GitContextProvider
      artifact={artifact ?? null}
      artifactType={artifactType}
      artifacts={artifacts ?? null}
      baseArtifactId={artifact?.baseId ?? ""}
      fetchArtifacts={fetchApplications}
      fetchSSHKeys={fetchSSHKeys}
      importWorkspaceId={importWorkspaceId}
      isConnectPermitted={isConnectPermitted}
      isManageAutocommitPermitted={isManageAutocommitPermitted}
      isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
      isManageProtectedBranchesPermitted={isManageProtectedBranchesPermitted}
      isSSHKeyManagerEnabled={isSSHKeyManagerEnabled}
      isSSHKeysLoading={isSSHKeysLoading}
      onCreateSSHKey={onCreateSSHKey}
      setImportWorkspaceId={setImportWorkspaceId}
      sshKeys={sshKeys}
      statusTransformer={applicationStatusTransformer}
      workspace={workspace ?? null}
    >
      {children}
    </GitContextProvider>
  );
}
