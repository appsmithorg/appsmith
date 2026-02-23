import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GitContextProvider } from "git";
import { getWorkspaceIdForImport } from "ee/selectors/applicationSelectors";
import { setWorkspaceIdForImport } from "ee/actions/applicationActions";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import noop from "lodash/noop";
import useSSHKeyManager from "ee/hooks/useSSHKeyManager";

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

  const {
    fetchSSHKeys,
    isSSHKeyManagerEnabled,
    isSSHKeysLoading,
    onCreateSSHKey,
    sshKeys,
  } = useSSHKeyManager();

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
