import React, { createContext, useEffect } from "react";
import useGitBranches from "./hooks/useGitBranches";
import type { UseGitBranchesReturns } from "./hooks/useGitBranches";
import type { GitArtifactType } from "git/constants/enums";

interface GitContextValue extends UseGitBranchesReturns {}

const gitContextInitialValue = {} as GitContextValue;

export const GitContext = createContext(gitContextInitialValue);

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
  const useGitBranchesReturns = useGitBranches({
    artifactType,
    baseArtifactId,
  });

  useEffect(function gitInitEffect() {
    useGitBranchesReturns.fetchBranches();
  }, []);

  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const contextValue = {
    ...useGitBranchesReturns,
  } as GitContextValue;

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
