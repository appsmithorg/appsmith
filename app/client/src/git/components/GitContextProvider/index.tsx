import React, { createContext, useContext, useMemo } from "react";
import type { GitArtifactType } from "git/constants/enums";
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import type { GitArtifact, GitArtifactDef } from "git/types";
import type { StatusTreeStruct } from "git/components/StatusChanges/types";
import type { Workspace } from "ee/constants/workspaceConstants";
import { noop } from "lodash";

export interface GitContextValue {
  artifactDef: GitArtifactDef | null;
  artifact: GitArtifact | null;
  artifacts: GitArtifact[] | null;
  fetchArtifacts: () => void;
  workspace: Workspace | null;
  setImportWorkspaceId: () => void;
  importWorkspaceId: string | null;
  isConnectPermitted: boolean;
  isManageAutocommitPermitted: boolean;
  isManageDefaultBranchPermitted: boolean;
  isManageProtectedBranchesPermitted: boolean;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
}

const gitContextInitialValue = {} as GitContextValue;

export const GitContext = createContext(gitContextInitialValue);

export const useGitContext = () => {
  return useContext(GitContext);
};

interface GitContextProviderProps {
  // artifact
  artifactType: GitArtifactType | null;
  baseArtifactId: string | null;
  artifact: GitArtifact | null;
  artifacts: GitArtifact[] | null;
  fetchArtifacts: () => void;

  // workspace
  workspace: Workspace | null;

  // import
  setImportWorkspaceId: () => void;
  importWorkspaceId: string | null;

  // permissions
  isConnectPermitted: boolean;
  isManageAutocommitPermitted: boolean;
  isManageDefaultBranchPermitted: boolean;
  isManageProtectedBranchesPermitted: boolean;

  // artifactspecific functions
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;

  // children
  children: React.ReactNode;
}

const NULL_NOOP = () => null;

export default function GitContextProvider({
  artifact = null,
  artifacts = null,
  artifactType = null,
  baseArtifactId = null,
  children,
  fetchArtifacts = noop,
  importWorkspaceId = null,
  isConnectPermitted = false,
  isManageAutocommitPermitted = false,
  isManageDefaultBranchPermitted = false,
  isManageProtectedBranchesPermitted = false,
  setImportWorkspaceId = noop,
  statusTransformer = NULL_NOOP,
  workspace = null,
}: GitContextProviderProps) {
  const artifactDef = useMemo(() => {
    if (artifactType && baseArtifactId) {
      return { artifactType, baseArtifactId };
    }

    return null;
  }, [artifactType, baseArtifactId]);

  const contextValue: GitContextValue = useMemo(
    () => ({
      artifactDef,
      artifact,
      artifacts,
      fetchArtifacts,
      workspace,
      setImportWorkspaceId,
      importWorkspaceId,
      isConnectPermitted,
      isManageAutocommitPermitted,
      isManageDefaultBranchPermitted,
      isManageProtectedBranchesPermitted,
      statusTransformer,
    }),
    [
      artifactDef,
      artifact,
      artifacts,
      fetchArtifacts,
      workspace,
      setImportWorkspaceId,
      importWorkspaceId,
      isConnectPermitted,
      isManageAutocommitPermitted,
      isManageDefaultBranchPermitted,
      isManageProtectedBranchesPermitted,
      statusTransformer,
    ],
  );

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
