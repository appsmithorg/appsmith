import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GitContextProvider } from "git";
import { getWorkspaceIdForImport } from "ee/selectors/applicationSelectors";
import { setWorkspaceIdForImport } from "ee/actions/applicationActions";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
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
import noop from "lodash/noop";

interface GitImportContextProviderProps {
  children: React.ReactNode;
}

const NULL_NOOP = () => null;

/**
 * Lightweight GitContextProvider for the Applications page where ImportModal
 * is rendered without a current artifact. Provides only SSH key manager data
 * and workspace-level fields; artifact-specific fields default to null/noop.
 */
export default function GitImportContextProvider({
  children,
}: GitImportContextProviderProps) {
  const dispatch = useDispatch();

  const workspace = useSelector(getCurrentAppWorkspace);
  const importWorkspaceId = useSelector(getWorkspaceIdForImport);

  const setImportWorkspaceIdCb = useCallback(() => {
    if (workspace?.id) {
      dispatch(
        setWorkspaceIdForImport({ editorId: "", workspaceId: workspace.id }),
      );
    }
  }, [dispatch, workspace?.id]);

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
      artifact={null}
      artifactType={null}
      artifacts={null}
      baseArtifactId={null}
      fetchArtifacts={noop}
      fetchSSHKeys={fetchSSHKeys}
      importWorkspaceId={importWorkspaceId}
      isConnectPermitted={false}
      isManageAutocommitPermitted={false}
      isManageDefaultBranchPermitted={false}
      isManageProtectedBranchesPermitted={false}
      isSSHKeyManagerEnabled={isSSHKeyManagerEnabled}
      isSSHKeysLoading={isSSHKeysLoading}
      onCreateSSHKey={onCreateSSHKey}
      setImportWorkspaceId={setImportWorkspaceIdCb}
      sshKeys={sshKeys}
      statusTransformer={NULL_NOOP}
      workspace={workspace ?? null}
    >
      {children}
    </GitContextProvider>
  );
}
