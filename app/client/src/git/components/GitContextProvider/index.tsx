import React, { createContext, useContext, useMemo } from "react";
import type { GitArtifactType } from "git/constants/enums";
import type { ApplicationPayload } from "entities/Application";
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import type { GitArtifactDef } from "git/store/types";
import type { StatusTreeStruct } from "../StatusChanges/types";
import type { Workspace } from "ee/constants/workspaceConstants";
import { noop } from "lodash";

export interface GitContextValue {
  artifactDef: GitArtifactDef | null;
  artifact: ApplicationPayload | null;
  artifacts: ApplicationPayload[] | null;
  fetchArtifacts: () => void;
  workspace: Workspace | null;
  setImportWorkspaceId: () => void;
  importWorkspaceId: string | null;
  isCreateArtifactPermitted: boolean;
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
  artifactType: keyof typeof GitArtifactType | null;
  baseArtifactId: string | null;
  artifact: ApplicationPayload | null;
  artifacts: ApplicationPayload[] | null;
  fetchArtifacts: () => void;

  // workspace
  workspace: Workspace | null;

  // import
  setImportWorkspaceId: () => void;
  importWorkspaceId: string | null;

  // permissions
  isCreateArtifactPermitted: boolean;

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
  isCreateArtifactPermitted = false,
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
      isCreateArtifactPermitted,
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
      isCreateArtifactPermitted,
      statusTransformer,
    ],
  );

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
