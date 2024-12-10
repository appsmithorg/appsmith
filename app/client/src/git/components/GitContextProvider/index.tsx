import React, { createContext, useContext, useMemo } from "react";
import type { GitArtifactType } from "git/constants/enums";
import type { UseGitOpsReturnValue } from "./hooks/useGitOps";
import type { UseGitSettingsReturnValue } from "./hooks/useGitSettings";
import type { UseGitBranchesReturnValue } from "./hooks/useGitBranches";
import type { UseGitConnectReturnValue } from "./hooks/useGitConnect";
import useGitOps from "./hooks/useGitOps";
import useGitConnect from "./hooks/useGitConnect";
import useGitSettings from "./hooks/useGitSettings";
import useGitBranches from "./hooks/useGitBranches";
import type { UseGitMetadataReturnValue } from "./hooks/useGitMetadata";
import useGitMetadata from "./hooks/useGitMetadata";

interface GitContextValue
  extends UseGitConnectReturnValue,
    UseGitMetadataReturnValue,
    UseGitOpsReturnValue,
    UseGitSettingsReturnValue,
    UseGitBranchesReturnValue {
  connectPermitted: boolean;
}

const gitContextInitialValue = {} as GitContextValue;

export const GitContext = createContext(gitContextInitialValue);

export const useGitContext = () => {
  return useContext(GitContext);
};

interface GitContextProviderProps {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  children: React.ReactNode;
  // extra
  connectPermitted?: boolean;
}

export default function GitContextProvider({
  artifactType,
  baseArtifactId,
  children,
  connectPermitted = true,
}: GitContextProviderProps) {
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );
  const useGitMetadataReturnValue = useGitMetadata(basePayload);
  const useGitConnectReturnValue = useGitConnect(basePayload);
  const useGitOpsReturnValue = useGitOps(basePayload);
  const useGitBranchesReturnValue = useGitBranches(basePayload);
  const useGitSettingsReturnValue = useGitSettings(basePayload);

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const contextValue = {
    ...useGitMetadataReturnValue,
    ...useGitOpsReturnValue,
    ...useGitBranchesReturnValue,
    ...useGitConnectReturnValue,
    ...useGitSettingsReturnValue,
    connectPermitted,
  } as GitContextValue;

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
