import React, { createContext, useContext, useEffect } from "react";
import type { GitArtifactType } from "git/constants/enums";
import type { GitContextValue } from "./hooks/useGitContextValue";
import useGitContextValue from "./hooks/useGitContextValue";

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
  const contextValue = useGitContextValue({ artifactType, baseArtifactId });

  const { fetchBranches } = contextValue;

  useEffect(
    function gitInitEffect() {
      fetchBranches();
    },
    [fetchBranches],
  );

  return (
    <GitContext.Provider value={contextValue}>{children}</GitContext.Provider>
  );
}
