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

interface GitContextValue
  extends UseGitConnectReturnValue,
    UseGitOpsReturnValue,
    UseGitSettingsReturnValue,
    UseGitBranchesReturnValue {}

const gitContextInitialValue = {} as GitContextValue;

export const GitContext = createContext(gitContextInitialValue);

export const useGitContext = () => {
  return useContext(GitContext);
};

interface GitContextProviderProps {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  children: React.ReactNode;
}

export default function GitContextProvider({
  artifactType,
  baseArtifactId,
  children,
}: GitContextProviderProps) {
  const basePayload = useMemo(
    () => ({ artifactType, baseArtifactId }),
    [artifactType, baseArtifactId],
  );
  const useGitConnectReturnValue = useGitConnect(basePayload);
  const useGitOpsReturnValue = useGitOps(basePayload);
  const useGitBranchesReturnValue = useGitBranches(basePayload);
  const useGitSettingsReturnValue = useGitSettings(basePayload);

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const contextValue = {
    ...useGitOpsReturnValue,
    ...useGitBranchesReturnValue,
    ...useGitConnectReturnValue,
    ...useGitSettingsReturnValue,
  } as GitContextValue;

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
