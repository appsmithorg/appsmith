import React, { createContext, useCallback, useContext, useMemo } from "react";
import type { GitArtifactType } from "git/constants/enums";
import type { ApplicationPayload } from "entities/Application";
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import type { StatusTreeStruct } from "../StatusChanges/StatusTree";
import { useDispatch } from "react-redux";
import type { GitArtifactDef } from "git/store/types";

export interface GitContextValue {
  artifactDef: GitArtifactDef | null;
  artifact: ApplicationPayload | null;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
  setImportWorkspaceId: () => void;
  isCreateArtifactPermitted: boolean;
}

const gitContextInitialValue = {} as GitContextValue;

export const GitContext = createContext(gitContextInitialValue);

export const useGitContext = () => {
  return useContext(GitContext);
};

interface GitContextProviderProps {
  artifactType: keyof typeof GitArtifactType | null;
  baseArtifactId: string | null;
  artifact: ApplicationPayload | null;
  isCreateArtifactPermitted: boolean;
  setWorkspaceIdForImport: (params: {
    workspaceId: string;
    editorId: string;
  }) => void;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
  children: React.ReactNode;
}

export default function GitContextProvider({
  artifact = null,
  artifactType,
  baseArtifactId,
  children,
  isCreateArtifactPermitted,
  setWorkspaceIdForImport,
  statusTransformer,
}: GitContextProviderProps) {
  const artifactDef = useMemo(() => {
    if (artifactType && baseArtifactId) {
      return { artifactType, baseArtifactId };
    }

    return null;
  }, [artifactType, baseArtifactId]);

  const dispatch = useDispatch();

  const { id: artifactId, workspaceId } = artifact ?? {};
  const setImportWorkspaceId = useCallback(() => {
    if (workspaceId) {
      dispatch(
        setWorkspaceIdForImport({
          workspaceId: workspaceId ?? "",
          editorId: artifactId ?? "",
        }),
      );
    }
  }, [artifactId, dispatch, setWorkspaceIdForImport, workspaceId]);

  const contextValue: GitContextValue = useMemo(
    () => ({
      artifactDef,
      artifact,
      statusTransformer,
      isCreateArtifactPermitted,
      setImportWorkspaceId,
    }),
    [
      artifactDef,
      artifact,
      statusTransformer,
      isCreateArtifactPermitted,
      setImportWorkspaceId,
    ],
  );

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
